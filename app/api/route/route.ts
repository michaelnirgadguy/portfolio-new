// app/api/route/route.ts
import { NextRequest } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { client } from "@/lib/openai";
import { TOOLS } from "@/lib/llm/tools";
import videos from "@/data/videos.json";

export const runtime = "nodejs";

// Load system prompt
async function loadSystemPrompt(): Promise<string> {
  const p = path.join(process.cwd(), "lib", "llm", "prompts", "system.txt");
  return fs.readFile(p, "utf8");
}

// Load examples prompt
async function loadExamplesPrompt(): Promise<string> {
  const p = path.join(process.cwd(), "lib", "llm", "prompts", "examples.txt");
  return fs.readFile(p, "utf8");
}

/**
 * POST body shapes supported:
 *  A) { text: string }                                   // first turn from user
 *  B) { input: Array<any> }                              // full running log (includes function_call_output)
 * 
 * Response:
 *  { text: string | null, output: any[] }                // output_text & raw output array (contains function_call items with call_id)
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      text?: string;
      input?: any[];
    };

    const system = await loadSystemPrompt();
    const examples = await loadExamplesPrompt();

    const catalogBlock = `
# Full video catalog (use ONLY these ids)
${JSON.stringify(videos)}
`;

    // Build final instructions:
    // 1. system role + rules
    // 2. catalog of valid videos
    // 3. examples of how to behave
    const fullInstructions = `
${system}

${catalogBlock}

# Examples / style guidance
${examples}
`.trim();

    // Build the input list the model expects
    let input_list: any[] | null = null;

    if (Array.isArray(body.input) && body.input.length > 0) {
      // Client supplied the full running log (best practice)
      input_list = body.input;
    } else {
      // First user turn (simple case)
      const userText = (body?.text ?? "").toString().trim();
      input_list = [
        { role: "user", content: userText || "Show me a cool video." },
      ];
    }

    // Call the model using the running log + tools
    const resp = await client.responses.create({
      model: "gpt-4.1-mini",
      tools: TOOLS,
      tool_choice: "auto",
      parallel_tool_calls: false,
      instructions: fullInstructions,
      input: input_list,
    });

    // Expose both human text and raw tool calls
    const text = (resp as any)?.output_text?.trim() || null;
    const output = (resp as any)?.output ?? [];

    // Helpful server logs while you iterate
    console.log(
      ">>> INPUT (preview):",
      JSON.stringify(input_list).slice(0, 4000)
    );
    console.log(">>> OUTPUT_TEXT:", text);
    console.log(">>> OUTPUT_ARRAY:", JSON.stringify(output, null, 2));

    return new Response(JSON.stringify({ text, output }), {
      headers: { "content-type": "application/json" },
    });
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
