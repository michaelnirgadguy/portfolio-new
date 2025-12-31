
import videosData from "@/data/videos.json";
import type { VideoItem } from "@/types/video";

export function getAllVideos(): VideoItem[] {
  return videosData.videos as VideoItem[];
}

export function getVideoById(id: string): VideoItem | undefined {
  return (videosData.videos as VideoItem[]).find((v) => v.id === id);
}
