// lib/llm/buildRouterRequest.ts
import { promises as fs } from "fs";
import path from "path";
import { INTENTS } from "./intents";
import { RouterPayloadJsonSchema } from "./routerSchema";
// Pull directly from the dataset so we have language/tags/priority as well.
import rawVideos from "@/data/videos.json";

type ChatTurn = { role: "user" | "assistant"; content: string };

// Helper: safe file read from /lib/llm/prompts
async function readPromptFile(rel: string): Promise<string> {
  try {
    const p = path.join(process.cwd(), "lib", "llm", "prompts", rel);
    return await fs.readFile(p, "utf8");
  } catch {
    return "";
  }
}

// Inject placeholders used inside router-system.txt
function injectPlaceholders(template: string, ids: string[]): string {
  return template
    .replace("{{INTENTS}}", JSON.stringify(INTENTS))
    .replace("{{VALID_IDS}}", JSON.stringify(ids));
}

export async function buildRouterRequest(opts: {
  userText: string;
  recent?: ChatTurn[]; // pass the last 2–3 turns if you have them (optional)
}) {
  const { userText, recent = [] } = opts;

  // --- Grounding data -------------------------------------------------------
  const videos = Array.isArray(rawVideos) ? rawVideos : [];
  const VALID_IDS: string[] = videos
    .map((v: any) => String(v.id))
    .filter(Boolean);

  // Lean catalog sent to the LLM (whitelist + matching hints)
  const LEAN_DATA = videos.map((v: any) => ({
    id: v.id,
    title: v.title,
    client: v.client,
    language: v.language ?? null,
    tags: Array.isArray(v.tags) ? v.tags : [],
    priority: v.priority ?? "standard",
    description: v.description ?? "",
  }));

  // --- Prompts --------------------------------------------------------------
  const systemRaw = await readPromptFile("router-system.txt");    // rules + SHORT BIO
  const examplesRaw = await readPromptFile("router-examples.txt"); // few-shot pairs
  const system = injectPlaceholders(systemRaw, VALID_IDS);

  // --- Messages (order matters) --------------------------------------------
  // 1) System rules (with INTENTS/VALID_IDS injected)
  const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
    { role: "system", content: system },
  ];

  // 2) Dataset BEFORE examples → the model learns the legal IDs & context first
  messages.push({
    role: "system",
    content: `CATALOG (lean JSON — use ONLY these ids):\n${JSON.stringify(LEAN_DATA)}`,
  });

  // 3) Few-shot examples (optional)
  if (examplesRaw.trim()) {
    messages.push({
      role: "system",
      content: `FEW-SHOT EXAMPLES:\n${examplesRaw}`,
    });
  }

  // 4) Light recent context (last 2–3 turns max)
  for (const turn of recent.slice(-3)) {
    messages.push({ role: turn.role, content: turn.content });
  }

  // 5) Current user input
  messages.push({ role: "user", content: userText });

  // --- OpenAI request payload ----------------------------------------------
  return {
    model: "gpt-4o-mini",
    temperature: 0.2,
    response_format: {
      type: "json_schema" as const,
      json_schema: RouterPayloadJsonSchema,
    },
    messages,
    // Export VALID_IDS for caller-side post-validation if needed
    VALID_IDS,
  };
}
