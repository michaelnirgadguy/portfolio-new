// /app/api/route/route.ts
import { getAllVideos } from "@/lib/videos";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const text: string = typeof body?.text === "string" ? body.text.trim().toLowerCase() : "";

  const all = getAllVideos();

  // contact
  if (text === "contact") {
    return Response.json({
      intent: "information",
      message: "Contact: michael [at] yourdomain.com (stub).",
      videoIds: [],
    });
  }

  // catalog
  if (text === "catalog") {
    return Response.json({
      intent: "information",
      message: "Full catalog (stub).",
      videoIds: [],
    });
  }

  // surprise
  if (text === "surprise") {
    return Response.json({
      intent: "show_videos",
      message: "Here are three random picks:",
      videoIds: all.slice(0, 3).map((v) => v.id),
    });
  }

  // default
  return Response.json({
    intent: "show_videos",
    message: `Some videos for: “${text}”`,
    videoIds: all.slice(0, 3).map((v) => v.id),
  });
}
