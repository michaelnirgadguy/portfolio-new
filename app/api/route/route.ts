// app/api/route/route.ts
import { NextRequest } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { client } from "@/lib/openai";
import { TOOLS } from "@/lib/llm/tools";
import videos from "@/data/videos.json";
import { assistantReplySchema } from "@/lib/llm/assistantSchema";

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

    const thinCatalog = videos.map(({ url, thumbnail, ...rest }) => rest);

    const catalogBlock = `
# Full video catalog (use ONLY these ids)
${JSON.stringify(thinCatalog)}
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
      text: {
        format: {
          type: "json_schema",
          name: "assistant_reply",
          strict: true,
          schema: assistantReplySchema,
        },
      },
    });

    // Expose both human text and raw tool calls
    const output = (resp as any)?.output ?? [];
    let parsed = (resp as any)?.output_parsed ?? null;

    if (!parsed && Array.isArray(output)) {
      const parsedItem = output.find(
        (item: any) => item && typeof item === "object" && item.parsed
      );
      parsed = parsedItem?.parsed ?? null;
    }

    let text: string | null = null;
    let chips: string[] = [];

    if (parsed) {
      if (typeof parsed?.text === "string") {
        text = parsed.text.trim();
      }

      if (Array.isArray(parsed?.chips)) {
        chips = parsed.chips
          .map((chip: unknown) => (typeof chip === "string" ? chip.trim() : ""))
          .filter(Boolean);
      }
    }

    if (!text) {
      const raw = (resp as any)?.output_text;
      if (typeof raw === "string") {
        const trimmed = raw.trim();

        try {
          const fallback = JSON.parse(trimmed);
          if (typeof fallback?.text === "string") {
            text = fallback.text.trim();
          } else {
            text = trimmed;
          }

          if (!chips.length && Array.isArray(fallback?.chips)) {
            chips = fallback.chips
              .map((chip: unknown) =>
                typeof chip === "string" ? chip.trim() : ""
              )
              .filter(Boolean);
          }
        } catch {
          text = trimmed;
        }
      }
    }

    const status = typeof (resp as any)?.status === "string" ? resp.status : null;
    const statusDetails = (resp as any)?.status_details ?? null;

    // Helpful server logs while you iterate
    console.log(
      ">>> INPUT (preview):",
      JSON.stringify(input_list).slice(0, 4000)
    );
    console.log(">>> OUTPUT_TEXT:", text);
    console.log(">>> OUTPUT_ARRAY:", JSON.stringify(output, null, 2));

    return new Response(JSON.stringify({ text, chips, output, status, statusDetails }), {
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
