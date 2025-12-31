import "server-only";

import type { VideoItem } from "@/types/video";
import { getVideoCatalog } from "@/lib/videoCatalog";

export async function getAllVideos(): Promise<VideoItem[]> {
  return getVideoCatalog();
}

export async function getVideoById(id: string): Promise<VideoItem | undefined> {
  const videos = await getVideoCatalog();
  return videos.find((v) => v.id === id);
}
