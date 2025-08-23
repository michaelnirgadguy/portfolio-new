// /app/api/route/route.ts
import { client } from "@/lib/openai";
import { getAllVideos } from "@/lib/videos";

// Allowed intents (must match site logic)
const ALLOWED = [
  "show_videos",
  "information",
  "contact",
  "navigate_video",
  "share_link",
  "show_portfolio",
  "easter_egg",
] as const;
type AllowedIntent = typeof ALLOWED[number];

// Soft mapping for common synonyms the model might try
const INTENT_ALIASES: Record<string, AllowedIntent> = {
  suggest_videos: "show_videos",
  suggest_video: "show_videos",
  recommend_videos: "show_videos",
  recommendations: "show_videos",
};

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({} as any));
  const text: string = typeof body?.text === "string" ? body.text : "";

  // Grounding dataset (just what the model needs)
  const videos = getAllVideos().map(({ id, title, client, description }) => ({
    id,
    title,
    client,
    description,
  }));
  const validIds = new Set(videos.map((v) => v.id));

  // Short, strict system rule
  const system = [
    "You are the router for Michael's portfolio.",
    'Reply with exactly ONE JSON object: {"intent": string, "message": string, "args"?: {"videoIds"?: string[]}}.',
    "When suggesting videos, choose 2–3 IDs ONLY from the dataset provided.",
    "Keep replies brief and helpful.",
  ].join(" ");

  // Use Chat Completions + Structured Outputs (JSON Schema) to hard‑enforce shape
  // Docs: Chat Completions + response_format / Structured Outputs. 
  // (OpenAI platform refs) 
  // This reduces invalid-intent/shape errors significantly.
  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "router_payload",
        strict: true,
        schema: {
          type: "object",
          required: ["intent", "message"],
          additionalProperties: false,
          properties: {
            intent: { type: "string", enum: [...ALLOWED] },
            message: { type: "string" },
            args: {
              type: "object",
              additionalProperties: false,
              properties: {
                videoIds: {
                  type: "array",
                  items: { type: "string" },
                  minItems: 0,
                  maxItems: 3,
                },
              },
            },
          },
        },
      },
    },
    messages: [
      {
        role: "system",
        content: `${system}\n\nDATASET (read-only):\n${JSON.stringify(
          { videos },
          null,
          2
        )}`,
      },
      { role: "user", content: text || "Use the latest user input." },
    ],
    temperature: 0.2,
  });

  // Model output (Structured Outputs returns valid JSON string here)
  const raw = completion.choices?.[0]?.message?.content ?? "";
  if (!raw) {
    return new Response(JSON.stringify({ error: "Empty completion" }), {
      status: 502,
      headers: { "content-type": "application/json" },
    });
  }

  // Parse JSON
  let out: any;
  try {
    out = JSON.parse(raw);
  } catch (e) {
    console.error("JSON parse failed:", raw, e);
    return new Response(
      JSON.stringify({ error: "Model returned non‑JSON", raw }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }

  // Defensive intent coercion (in case model slips an alias in future)
  if (!ALLOWED.includes(out.intent)) {
    const mapped = INTENT_ALIASES[String(out.intent).toLowerCase()];
    out.intent = mapped ?? "information";
  }

  // Sanitize videoIds against our dataset; cap at 3
  const incomingIds: string[] = out?.args?.videoIds ?? [];
  const filtered = incomingIds.filter((id) => validIds.has(id)).slice(0, 3);
  if (filtered.length > 0) {
    out.args = { ...(out.args ?? {}), videoIds: filtered };
  } else if (out.intent === "show_videos") {
    // Fallback trio
    out.args = { ...(out.args ?? {}), videoIds: Array.from(validIds).slice(0, 3) };
    if (!out.message) {
      out.message = "Here are a few to start with.";
    }
  }

  return new Response(JSON.stringify(out), {
    headers: { "content-type": "application/json" },
  });
}
