// /app/api/route/route.ts
import { readFileSync } from "fs";
import { join } from "path";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";

import { client } from "@/lib/openai";
import { getAllVideos } from "@/lib/videos";
import type { VideoItem } from "@/types/video";

// ---- Types for our API payloads ----
type Intent =
  | "show_videos"
  | "show_portfolio"
  | "information"
  | "contact"
  | "navigate_video"
  | "share_link"
  | "easter_egg";

type Payload = {
  intent: Intent;
  args?: { videoIds?: string[]; id?: string; [k: string]: any };
  message: string;
};

type HistoryItem = { role: "user" | "assistant"; text: string };

// ---- Helpers ----
function safeTrio(): string[] {
  return getAllVideos().slice(0, 3).map((v) => v.id);
}

function normalizeVideoIds(ids: unknown): string[] {
  const allow = new Set(getAllVideos().map((v) => v.id));
  if (!Array.isArray(ids)) return [];
  return ids
    .filter((x): x is string => typeof x === "string" && allow.has(x))
    .slice(0, 3);
}

// Zod schema for structured outputs
const RouterResponseSchema = z.object({
  intent: z.enum([
    "show_videos",
    "show_portfolio",
    "information",
    "contact",
    "navigate_video",
    "share_link",
    "easter_egg",
  ]),
  message: z.string(),
  args: z
    .object({
      videoIds: z.array(z.string()).max(3).optional(),
      id: z.string().optional(),
    })
    .catchall(z.any())
    .optional(),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({} as any));
  const text: string = typeof body?.text === "string" ? String(body.text) : "";

  // Optional extras you can send from the client later:
  const history: HistoryItem[] = Array.isArray(body?.history)
    ? body.history
        .filter(
          (m: any) =>
            m && (m.role === "user" || m.role === "assistant") && typeof m.text === "string",
        )
        .slice(-3)
    : [];
  const state: Record<string, any> =
    body?.state && typeof body.state === "object" ? body.state : {};

  // Grounding data: reduce videos to the fields the LLM needs
  const videos = getAllVideos();
  const videoContext = videos.map(({ id, title, client, description }) => ({
    id,
    title,
    client,
    description,
  }));

  // System prompt (optional file)
  let systemPrompt = "";
  try {
    systemPrompt = readFileSync(join(process.cwd(), "lib", "systemPrompt.txt"), "utf8");
  } catch {
    // continue without it
  }

  // Build Responses API "input" turns
  const input: any[] = [];
  if (systemPrompt) {
    input.push({ role: "system", content: [{ type: "text", text: systemPrompt }] });
  }

  input.push({
    role: "developer",
    content: [
      {
        type: "text",
        text:
          "Context JSON follows. Use it to ground replies and select videoIds from the dataset. " +
          "Always return one object matching the schema.\n" +
          JSON.stringify({ videos: videoContext, state }, null, 2),
      },
    ],
  });

  for (const m of history) {
    input.push({ role: m.role, content: [{ type: "text", text: m.text }] });
  }

  input.push({ role: "user", content: [{ type: "text", text: text || "" }] });

  try {
    // Structured outputs with Zod
    const resp = await client.responses.parse({
      model: "gpt-4o-mini",
      instructions:
        "You are the router/curator for Michael's portfolio. " +
        "Return exactly ONE JSON object matching the provided schema. " +
        "If unsure, prefer intent 'show_videos' with 2–3 fitting videoIds.",
      input,
      response_format: zodResponseFormat(RouterResponseSchema, "RouterResponse"),
    });
    console.log("🔍 Raw response:", JSON.stringify(resp, null, 2));

    // Extract parsed object safely
    // (SDK attaches `.parsed` on content items when using `responses.parse`)
       const parsed = (resp as any).output_parsed ?? (resp as any).parsed ?? (resp as any).output?.[0]?.content?.[0]?.parsed;


    let payload: Payload;
    if (parsed) {
      const ids = normalizeVideoIds(parsed?.args?.videoIds);
      payload = {
        intent: parsed.intent as Intent,
        message: parsed.message,
        args: ids.length ? { ...(parsed.args ?? {}), videoIds: ids } : parsed.args,
      };
      if (
        payload.intent === "show_videos" &&
        (!payload.args?.videoIds || payload.args.videoIds.length === 0)
      ) {
        payload.args = { ...(payload.args ?? {}), videoIds: safeTrio() };
      }
    } else {
      // Fallback if parsing failed or no content
      payload = {
        intent: "show_videos",
        args: { videoIds: safeTrio() },
        message: `Some videos for: “${text || "…"}”`,
      };
    }

    return Response.json(payload);
  } catch (err) {
    console.error("OpenAI error:", err);
    const fallback: Payload = {
      intent: "show_videos",
      args: { videoIds: safeTrio() },
      message: "Some videos you might like:",
    };
    return Response.json(fallback, { status: 200 });
  }
}
