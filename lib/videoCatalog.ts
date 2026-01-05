import "server-only";

import { cache } from "react";
import fs from "node:fs/promises";
import path from "node:path";
import type { VideoItem } from "@/types/video";

const CATALOG_PATH = path.join(process.cwd(), "data", "videos.json");

async function loadCatalogFromDisk(): Promise<VideoItem[]> {
  const raw = await fs.readFile(CATALOG_PATH, "utf8");
  const parsed = JSON.parse(raw);

  if (!Array.isArray(parsed)) {
    throw new Error("Video catalog JSON must be an array.");
  }

  return parsed as VideoItem[];
}

export const getVideoCatalog = cache(async (): Promise<VideoItem[]> => {
  return loadCatalogFromDisk();
});
