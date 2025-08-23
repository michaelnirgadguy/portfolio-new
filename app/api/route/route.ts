// /app/api/route/route.ts
import { client } from "@/lib/openai";
import { getAllVideos } from "@/lib/videos";

type AllowedIntent = "show_videos" | "information" | "contact" | "show_portfolio";
const ALLOWED: AllowedIntent[] = ["show_videos", "information", "contact", "show_portfolio"];

// Soft mappings for possible slips (extra safety)
const INTENT_ALIASES: Record<string, AllowedIntent> = {
  suggest_videos: "show_videos",
  suggest_video: "show_videos",
  recommendations: "show_videos",
  recommend_videos: "show_videos",
  show_catalog: "show_portfolio",
  portfolio: "show_portfolio",
};

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any));
    const text: string = typeof body?.text === "string" ? body.text : "";

    // Grounding dataset (only fields the model needs)
    const videos = getAllVideos().map(({ id, title, client: c, description }) => ({
      id,
      title,
      client: c,
      description,
    }));
    const validIds = new Set(videos.map((v) => v.id));

    // Tight system rule
    const system = [
      "You are the router for Michael's portfolio site.",
      'Reply with exactly ONE JSON object: {"intent": string, "message": string, "args"?: {"videoIds"?: string[]}}.',
      "When suggesting videos, pick 2–3 IDs ONLY from the dataset.",
      "Stay concise and helpful.",
    ].join(" ");

    // Chat Completions + Structured Outputs (JSON Schema)
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
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
              intent: { type: "string", enum: ALLOWED },
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
          content: `${system}\n\nDATASET (read-only):\n${JSON.stringify({ videos }, null, 2)}`,
        },
        { role: "user", content: text || "Use the latest user input." },
      ],
    });

    const raw = completion.choices?.[0]?.message?.content ?? "";
    if (!raw) {
      return new Response(JSON.stringify({ error: "Empty completion from model" }), {
        status: 502,
        headers: { "content-type": "application/json" },
      });
    }

    // Parse and coerce
    let out: any;
    try {
      out = JSON.parse(raw);
    } catch {
      return new Response(JSON.stringify({ error: "Model returned non‑JSON", raw }), {
        status: 500,
        headers: { "content-type": "application/json" },
      });
    }

    // Defensive alias mapping (rare with schema, but safe)
    if (!ALLOWED.includes(out.intent)) {
      const mapped = INTENT_ALIASES[String(out.intent || "").toLowerCase()] ?? "information";
      out.intent = mapped;
    }

    // Sanitize videoIds; cap at 3
    const incomingIds: string[] = Array.isArray(out?.args?.videoIds) ? out.args.videoIds : [];
    const filtered = incomingIds.filter((id) => validIds.has(id)).slice(0, 3);

    if (filtered.length > 0) {
      out.args = { ...(out.args ?? {}), videoIds: filtered };
    } else if (out.intent === "show_videos") {
      // Fallback trio — avoid Set spread (tsconfig target es5)
      const trio = Array.from(validIds).slice(0, 3);
      out.args = { ...(out.args ?? {}), videoIds: trio };
      if (!out.message) out.message = "Here are a few to start with.";
    }

    return new Response(JSON.stringify(out), {
      headers: { "content-type": "application/json" },
    });
  } catch (err: any) {
    console.error("❌ /api/route error:", err);
    // Always return JSON so frontend res.json() never throws
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        details: String(err?.message ?? err),
      }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }
}
