// /app/api/route/route.ts
import { client } from "@/lib/openai";
import { getAllVideos } from "@/lib/videos";
import { readFileSync } from "fs";
import { join } from "path";

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

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({} as any));
  const text: string = typeof body?.text === "string" ? String(body.text) : "";

  // Optional extras you can start sending from the client next step:
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

  // Grounding data
  const videos = getAllVideos();
  const videoContext = videos.map(({ id, title, client, description }) => ({
    id,
    title,
    client,
    description,
  }));

  // System prompt file (optional but preferred)
  let systemPrompt = "";
  try {
    systemPrompt = readFileSync(
      join(process.cwd(), "lib", "systemPrompt.txt"),
      "utf8",
    );
  } catch {
    // keep empty; we'll still proceed
  }

  // Build Responses API input
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
          "Context JSON follows. Use it to ground replies and select videoIds:\n" +
          JSON.stringify({ videos: videoContext, state }, null, 2),
      },
    ],
  });

  for (const m of history) {
    input.push({ role: m.role, content: [{ type: "text", text: m.text }] });
  }

  input.push({ role: "user", content: [{ type: "text", text: text || "" }] });

  const jsonSchema = {
    name: "RouterResponse",
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        intent: {
          type: "string",
          enum: [
            "show_videos",
            "show_portfolio",
            "information",
            "contact",
            "navigate_video",
            "share_link",
            "easter_egg",
          ],
        },
        message: { type: "string" },
        args: {
          type: "object",
          additionalProperties: true,
          properties: {
            videoIds: { type: "array", items: { type: "string" }, maxItems: 3 },
            id: { type: "string" },
          },
        },
      },
      required: ["intent", "message"],
    },
    strict: true,
  } as const;

  try {
    const resp = await client.responses.create({
      model: "gpt-4o-mini",
      instructions:
        "You are the router/curator for Michael's portfolio. " +
        "Always return ONE JSON object matching the provided schema. " +
        "If unsure, prefer intent 'show_videos' with 2–3 fitting videoIds.",
      input,
    
    });

    const raw = resp.output_text ?? "";
    let parsed: any = null;
    try {
      parsed = JSON.parse(raw);
    } catch {
      // fall through to fallback below
    }

    let payload: Payload;
    if (parsed && typeof parsed.intent === "string" && typeof parsed.message === "string") {
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
      payload = {
        intent: "show_videos",
        args: { videoIds: safeTrio() },
        message: `Some videos for: “${text || "…"}”`,
      };
    }

    return Response.json(payload);
  } catch (err) {
    console.error("OpenAI error:", err);
    return Response.json(
      {
        intent: "show_videos",
        args: { videoIds: safeTrio() },
        message: "Some videos you might like:",
      } satisfies Payload,
      { status: 200 },
    );
  }
}
