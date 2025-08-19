// /app/api/route/route.ts
import { getAllVideos } from "@/lib/videos";

type Intent = "show_videos" | "show_portfolio" | "information" | "contact";

type Payload = {
  intent: Intent;
  args?: { videoIds?: string[] };
  message: string;
};

function pickRandomIds(n: number): string[] {
  const all = getAllVideos();
  const a = [...all];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, n).map((v) => v.id);
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({} as any));
  const text =
    typeof body?.text === "string" ? body.text.trim().toLowerCase() : "";

  const firstThree = getAllVideos().slice(0, 3).map((v) => v.id);

  // ---- exact triggers (no regex) ----
  if (text === "surprise") {
    const payload: Payload = {
      intent: "show_videos",
      args: { videoIds: pickRandomIds(3) },
      message: "Here are three random picks:",
    };
    return Response.json(payload);
  }

  if (text === "contact") {
    const payload: Payload = {
      intent: "contact",
      message: "Contact: michael [at] yourdomain.com (stub).",
    };
    return Response.json(payload);
  }

  if (text === "catalog") {
    const payload: Payload = {
      intent: "show_portfolio",
      message: "Showing full catalog (stub).",
    };
    return Response.json(payload);
  }

  if (text === "show videos") {
    const payload: Payload = {
      intent: "show_videos",
      args: { videoIds: firstThree },
      message: "Some videos you might like:",
    };
    return Response.json(payload);
  }

  // default: echo + safe trio
  const payload: Payload = {
    intent: "show_videos",
    args: { videoIds: firstThree },
    message: `Some videos for: “${text || "…"}”`,
  };
  return Response.json(payload);
}
