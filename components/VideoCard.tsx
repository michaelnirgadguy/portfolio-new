// /components/VideoCard.tsx
import type { VideoItem } from "@/types/video";

export default function VideoCard({
  video,
  onSelect,
}: {
  video: VideoItem;
  onSelect: (video: VideoItem) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(video)}
      className="group block w-full text-left rounded-xl overflow-hidden border hover:shadow-md transition"
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
    </button>
  );
}
