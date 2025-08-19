
import videos from "@/data/videos.json";
import type { VideoItem } from "@/types/video";

export function getAllVideos(): VideoItem[] {
  return videos as VideoItem[];
}

export function getVideoById(id: string): VideoItem | undefined {
  return (videos as VideoItem[]).find((v) => v.id === id);
}
