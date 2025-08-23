// /app/api/route/route.ts
import { z } from "zod";
import { client } from "@/lib/openai";
import { getAllVideos } from "@/lib/videos";

// Keep in sync with lib/systemPrompt.txt allowed intents
const ALLOWED_INTENTS = [
  "show_videos",
  "information",
  "contact",
  "navigate_video",
  "share_link",
  "show_portfolio",
  "easter_egg",
] as const;

const OutputSchema = z.object({
  intent: z.enum(ALLOWED_INTENTS),
  message: z.string(),
  args: z
    .object({
      videoIds: z.array(z.string()).optional(),
    })
    .optional(),
});

type Output = z.infer<typeof OutputSchema>;

function pickFallbackIds(allIds: string[], n = 3) {
  return allIds.slice(0, n);
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any));
    const text: string = typeof body?.text === "string" ? body.text : "";

    // Grounding dataset (only the fields the model needs)
    const videos = getAllVideos().map(({ id, title, client, description }) => ({
      id,
      title,
      client,
      description,
    }));
    const validIds = new Set(videos.map((v) => v.id));

    // System instruction kept short; dataset appended below
    const system = [
      "You are the router for Michael's portfolio.",
      "Always reply with ONE JSON object:",
      '{ "intent": string, "message": string, "args"?: { "videoIds"?: string[] } }',
      "If suggesting videos, choose 2–3 IDs ONLY from the dataset I’ll give you.",
      "Keep replies concise and helpful.",
    ].join(" ");

    // Use Chat Completions + JSON mode for strict JSON output
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" }, // JSON mode
      messages: [
        {
          role: "system",
          content: `${system}\n\nDATASET (read-only):\n${JSON.stringify(
            { videos },
            null,
            2
          )}`,
        },
        { role: "user", content: text || "Act on the latest user input." },
      ],
      temperature: 0.3,
    });

    const raw = completion.choices?.[0]?.message?.content ?? "";
    if (!raw) {
      return new Response(
        JSON.stringify({ error: "Empty completion from model" }),
        { status: 502, headers: { "content-type": "application/json" } }
      );
    }

    // Parse + validate
    let parsed: Output;
    try {
      parsed = OutputSchema.parse(JSON.parse(raw));
    } catch (e) {
      // Dev aid
      console.error("JSON parse/validation failed. Raw:", raw, "Error:", e);
      return new Response(
        JSON.stringify({ error: "Model returned invalid JSON", raw }),
        { status: 500, headers: { "content-type": "application/json" } }
      );
    }

    // Sanitize args.videoIds against our dataset, cap at 3
    const incomingIds = parsed.args?.videoIds ?? [];
    const filteredIds = incomingIds.filter((id) => validIds.has(id)).slice(0, 3);

    let finalOut: Output = {
      ...parsed,
      args:
        filteredIds.length > 0
          ? { ...(parsed.args ?? {}), videoIds: filteredIds }
          : parsed.args,
    };

    // If intent asks for videos but none survived validation → fallback
    if (
      finalOut.intent === "show_videos" &&
      (!finalOut.args?.videoIds || finalOut.args.videoIds.length === 0)
    ) {
      finalOut = {
        ...finalOut,
        args: {
          ...(finalOut.args ?? {}),
          videoIds: pickFallbackIds(Array.from(validIds)),
        },
        message:
          finalOut.message ||
          "Here are a few to start with while I think about that.",
      };
    }

    return new Response(JSON.stringify(finalOut), {
      headers: { "content-type": "application/json" },
    });
  } catch (err: any) {
    console.error("❌ /api/route error:", err);
    return new Response(
      JSON.stringify({ error: String(err?.message ?? err) }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }
}
