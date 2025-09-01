// app/api/route/route.ts
import { NextRequest } from "next/server";
import { client } from "@/lib/openai";
import { TOOLS } from "@/lib/llm/tools";
import catalog from "@/data/videos.json";

export const runtime = "nodejs";

// Small helper: collect valid IDs from the catalog
const VALID_IDS: string[] = Array.isArray(catalog)
  ? (catalog as any[]).map((v) => String(v.id))
  : [];

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as { text?: string };
    const userText = (body?.text ?? "").toString().trim();

    // 1) Ask the model with our single tool
    const resp = await client.responses.create({
      model: "gpt-4.1-mini",
      tools: TOOLS,
      input: [{ role: "user", content: userText || "Show me a cool video." }],
      parallel_tool_calls: false,
    });

    // 2) Extract function call and parse arguments
    let chosen: string[] = [];
    for (const item of resp.output ?? []) {
      if (item.type === "function_call" && item.name === "ui_show_videos") {
        try {
          const parsed = JSON.parse(item.arguments || "{}");
          const ids: unknown = parsed?.videoIds;
          if (Array.isArray(ids)) {
            chosen = ids
              .map((x) => String(x))
              .filter((id) => VALID_IDS.includes(id))
              .slice(0, 6);
          }
        } catch {
          // ignore parse errors; we'll fall back below
        }
      }
    }

    // 3) Fallback if model didn’t provide valid IDs
    if (chosen.length === 0) {
      chosen = VALID_IDS.slice(0, 3);
    }

    const message =
      chosen.length === 1
        ? `Opened video ${chosen[0]} on site.`
        : `Showing ${chosen.length} videos on site.`;

    // 4) Return the simple shape the UI can act on
    return new Response(
      JSON.stringify({
        intent: "show_videos",
        args: { videoIds: chosen },
        message,
      }),
      { headers: { "content-type": "application/json" } }
    );
  } catch (err: any) {
    console.error("❌ /api/route error:", err);
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        details: String(err?.message ?? err),
      }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }
}
