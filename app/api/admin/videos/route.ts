import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { VideoItem } from "@/types/video";

const DATA_PATH = path.join(process.cwd(), "data", "videos.json");

function normalizeText(value: unknown) {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
  }
  return null;
}

function normalizeStringArray(value: unknown) {
  if (!Array.isArray(value)) return null;
  const cleaned = value
    .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
    .filter((entry) => entry.length);
  return cleaned.length ? cleaned : null;
}

function parseVideos(payload: unknown): VideoItem[] {
  if (!Array.isArray(payload)) {
    throw new Error("Payload must be an array.");
  }

  return payload.map((item) => {
    if (typeof item !== "object" || item === null) {
      throw new Error("Video entry must be an object.");
    }

    const record = item as Record<string, unknown>;
    const id = normalizeText(record.id);
    const title = normalizeText(record.title);
    const url = normalizeText(record.url);
    const thumbnail = normalizeText(record.thumbnail);

    if (!id || !title || !url || !thumbnail) {
      throw new Error("Each video requires id, title, url, and thumbnail.");
    }

    return {
      id,
      title,
      url,
      thumbnail,
      client: normalizeText(record.client),
      description: normalizeText(record.description),
      language: normalizeText(record.language),
      duration_seconds:
        typeof record.duration_seconds === "number"
          ? record.duration_seconds
          : null,
      priority: normalizeText(record.priority),
      tags: normalizeStringArray(record.tags),
      my_roles: normalizeStringArray(record.my_roles),
      long_description: normalizeText(record.long_description),
      display_credits: normalizeText(record.display_credits),
      related_ids: normalizeStringArray(record.related_ids),
    } satisfies VideoItem;
  });
}

export async function GET() {
  const file = await fs.readFile(DATA_PATH, "utf-8");
  const videos = JSON.parse(file) as VideoItem[];
  return NextResponse.json({ videos });
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const videos = parseVideos(body?.videos ?? body);

    await fs.writeFile(DATA_PATH, JSON.stringify(videos, null, 2) + "\n");

    return NextResponse.json({ ok: true, count: videos.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid payload.";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
