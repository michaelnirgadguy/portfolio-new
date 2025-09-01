// app/api/route/route.ts
import { NextRequest } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { client } from "@/lib/openai";
import { TOOLS } from "@/lib/llm/tools";
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
    const systemPrompt = await loadSystemPrompt();
    const catalogBlock = `
    # Full video catalog (use ONLY these ids)
    ${JSON.stringify(catalog)}
    `;

    // Ask the model with ONE tool; let it choose to chat or call the tool
    const resp = await client.responses.create({
      model: "gpt-4.1-mini",
      tools: TOOLS,               // must include the single UI tool (e.g., ui_show_videos)
      tool_choice: "auto",
      parallel_tool_calls: false,
      instructions: systemPrompt + catalogBlock,
      input: userText || "Show me a cool video.",
    });

    // --- Extract assistant text (if any) ---
    const assistantText = (resp as any)?.output_text
      ? String((resp as any).output_text).trim()
      : "";

    // --- Extract tool call (first matching ui_show_videos) ---
    let chosen: string[] = [];
    let toolCall:
      | null
      | {
          name: string;
          args: { videoIds: string[] };
        } = null;

    for (const item of ((resp as any).output ?? []) as any[]) {
      if (item.type === "function_call" && item.name === "ui_show_videos") {
        try {
          const parsed = JSON.parse(item.arguments || "{}");
          const ids: unknown = parsed?.videoIds;
          if (Array.isArray(ids)) {
            chosen = ids
              .map((x) => String(x))
              .filter((id) => VALID_IDS.includes(id))
              .slice(0, 12); // cap if you like
          }
        } catch {
          // ignore parse errors
        }
        break; // only handle the first call
      }
    }

    if (chosen.length > 0) {
      toolCall = {
        name: "ui_show_videos", // keep the exact tool name used in TOOLS
        args: { videoIds: chosen },
      };
    }

    // --- Return NEW shape: { text, tool_call } ---
    return new Response(
      JSON.stringify({
        text: assistantText || null,       // chat message to render (if any)
        tool_call: toolCall,               // client should execute this (if present)
        _debug: {
          receivedBody: body,
          rawOutput: (resp as any).output?.map((it: any) => ({
            type: it.type,
            name: it.name,
            arguments: it.arguments,
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
