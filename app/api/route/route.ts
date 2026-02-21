// app/api/route/route.ts
import { NextRequest } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { client } from "@/lib/openai";
import { TOOLS } from "@/lib/llm/tools";
import { getVideoCatalog } from "@/lib/videoCatalog";
import { assistantReplySchema } from "@/lib/llm/assistantSchema";

export const runtime = "nodejs";
const OPENAI_TIMEOUT_MS = 20000;

function isTimeoutError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const err = error as { name?: string; code?: string; message?: string };
  return (
    err.name === "AbortError" ||
    err.code === "ETIMEDOUT" ||
    Boolean(err.message && err.message.toLowerCase().includes("timeout"))
  );
}

function extractFirstJsonObject(raw: string): string | null {
  let depth = 0;
  let inString = false;
  let escape = false;
  let start: number | null = null;

  for (let i = 0; i < raw.length; i += 1) {
    const char = raw[i];

    if (inString) {
      if (escape) {
        escape = false;
        continue;
      }
      if (char === "\\") {
        escape = true;
        continue;
      }
      if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === "{") {
      if (depth === 0) {
        start = i;
      }
      depth += 1;
      continue;
    }

    if (char === "}") {
      depth -= 1;
      if (depth === 0 && start !== null) {
        return raw.slice(start, i + 1);
      }
    }
  }

  return null;
}

function extractFirstAssistantMessage(output: any[]): {
  parsed: any | null;
  rawText: string | null;
} {
  if (!Array.isArray(output)) {
    return { parsed: null, rawText: null };
  }

  const firstAssistant = output.find(
    (item: any) => item?.type === "message" && item?.role === "assistant"
  );

  if (!firstAssistant) {
    return { parsed: null, rawText: null };
  }

  if (firstAssistant?.parsed) {
    return { parsed: firstAssistant.parsed, rawText: null };
  }

  const content = firstAssistant?.content;
  if (typeof content === "string") {
    return { parsed: null, rawText: content };
  }

  if (Array.isArray(content)) {
    const firstTextPart = content.find(
      (part: any) => part?.type === "output_text" && typeof part?.text === "string"
    );
    if (firstTextPart?.text) {
      return { parsed: null, rawText: firstTextPart.text };
    }
  }

  return { parsed: null, rawText: null };
}

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
      seenVideoIds?: unknown;
    };

    const seenVideoIds = Array.isArray(body.seenVideoIds)
      ? body.seenVideoIds.filter((id): id is string => typeof id === "string" && id.trim().length > 0)
      : [];

    const watchedVideosBlock = `
# Seen videos guidance
Prefer presenting the user with videos they haven't seen yet.
The user has already watched: ${seenVideoIds.length ? seenVideoIds.join(", ") : "none"}
`;

    const system = await loadSystemPrompt();
    const examples = await loadExamplesPrompt();

    const videos = await getVideoCatalog();
    const thinCatalog = videos.map(
      ({ url, thumbnail, long_description, related_ids, ...rest }) => rest
    );

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

${watchedVideosBlock}
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
    let resp: Awaited<ReturnType<typeof client.responses.create>>;
    const openAiController = new AbortController();
    const openAiTimeout = setTimeout(
      () => openAiController.abort(),
      OPENAI_TIMEOUT_MS
    );

    try {
      resp = await client.responses.create(
        {
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
        },
        {
          timeout: OPENAI_TIMEOUT_MS,
          signal: openAiController.signal,
        }
      );
    } catch (err: any) {
      if (isTimeoutError(err)) {
        console.warn(
          `⏱️ Timeout while calling OpenAI responses.create after ${OPENAI_TIMEOUT_MS}ms`
        );
        return new Response(
          JSON.stringify({
            error: "Upstream Timeout",
            dependency: "openai",
            timeoutMs: OPENAI_TIMEOUT_MS,
          }),
          { status: 504, headers: { "content-type": "application/json" } }
        );
      }
      throw err;
    } finally {
      clearTimeout(openAiTimeout);
    }

    // Expose both human text and raw tool calls
    const output = (resp as any)?.output ?? [];
    let parsed = (resp as any)?.output_parsed ?? null;
    const firstAssistantMessage = extractFirstAssistantMessage(output);

    if (!parsed && firstAssistantMessage.parsed) {
      parsed = firstAssistantMessage.parsed ?? null;
    }

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
      const raw =
        typeof firstAssistantMessage.rawText === "string"
          ? firstAssistantMessage.rawText
          : (resp as any)?.output_text;
      if (typeof raw === "string") {
        const trimmed = raw.trim();
        const firstJson = extractFirstJsonObject(trimmed);

        try {
          const fallback = JSON.parse(firstJson ?? trimmed);
          if (typeof fallback?.text === "string") {
            text = fallback.text.trim();
          } else {
            text = (firstJson ?? trimmed).trim();
          }

          if (!chips.length && Array.isArray(fallback?.chips)) {
            chips = fallback.chips
              .map((chip: unknown) =>
                typeof chip === "string" ? chip.trim() : ""
              )
              .filter(Boolean);
          }
        } catch {
          text = (firstJson ?? trimmed).trim();
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
