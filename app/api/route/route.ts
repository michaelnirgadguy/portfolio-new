// app/api/route/route.ts
import { NextRequest } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { client } from "@/lib/openai";
import { TOOLS } from "@/lib/llm/tools";
import { buildRouterRequest } from "@/lib/llm/buildRouterRequest";
import catalog from "@/data/videos.json";

export const runtime = "nodejs";

// Whitelist of valid IDs
const VALID_IDS: string[] = Array.isArray(catalog)
  ? (catalog as any[]).map((v) => String(v.id)).filter(Boolean)
  : [];

// Helper to load system prompt text
async function loadSystemPrompt(): Promise<string> {
  const p = path.join(process.cwd(), "lib", "llm", "prompts", "system.txt");
  return fs.readFile(p, "utf8");
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as { text?: string };
    const userText = (body?.text ?? "").toString().trim();

    // 1) Ask the model with our single tool
  // Build a short whitelist string (limit to 24 to keep tokens low)
const idWhitelist = VALID_IDS.slice(0, 24).join(", ");

    // Load Mimsy’s instructions
    const systemPrompt = await loadSystemPrompt();
    const messages = [{ role: "user", content: userText || "Show me a cool video." }];


    // 2) Ask model with tools
    const resp = await client.responses.create({
      model: "gpt-4.1-mini",
      tools: TOOLS,
      // let Mimsy decide: chat or call tool
      tool_choice: "auto",
      parallel_tool_calls: false,
      instructions: systemPrompt,
      input: messages,
    });
console.log(">>> SYSTEM PROMPT:", systemPrompt.slice(0, 400));
console.log(">>> INPUT MESSAGES:", JSON.stringify(messages, null, 2));
console.log(">>> RAW OUTPUT:", JSON.stringify(resp.output, null, 2));



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
    // ⬇️ TEMP DEBUG (remove later)
    _debug: {
      receivedBody: body,                                   // what the client sent
      modelInput: [{ role: "user", content: userText || "Show me a cool video." }],
      rawOutput: resp.output?.map((it) => ({
        type: it.type,
        name: (it as any).name,
        call_id: (it as any).call_id,
        // arguments can be large; include for now
        arguments: (it as any).arguments,
      })),
      validIdsCount: VALID_IDS.length,
      chosen,
    },
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
