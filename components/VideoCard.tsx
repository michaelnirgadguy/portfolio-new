
import Link from "next/link";
import type { VideoItem } from "@/types/video";

export default function VideoCard({ video }: { video: VideoItem }) {
  return (
    <Link
      href={`/video/${video.id}`}
      className="group block rounded-xl overflow-hidden border hover:shadow-md transition"
    >
      <img
        src={video.thumbnail}
        alt={video.title}
        className="w-full aspect-video object-cover"
      />
      <div className="p-3">
        <div className="font-medium group-hover:underline">{video.title}</div>
        <div className="text-sm text-gray-500">{video.client}</div>
      </div>
    </Link>
  );
}
