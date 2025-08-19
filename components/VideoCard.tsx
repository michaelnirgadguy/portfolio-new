// /components/VideoCard.tsx
import Link from "next/link";
import type { VideoItem } from "@/types/video";

// Exactly one of these must be provided:
type Selectable = { onSelect: (video: VideoItem) => void; href?: never };
type Linkable  = { href: string; onSelect?: never };
type Props = { video: VideoItem } & (Selectable | Linkable);

export default function VideoCard({ video, ...rest }: Props) {
  const CardInner = (
    <>
      <img
        src={video.thumbnail}
        alt={video.title}
        className="w-full aspect-video object-cover"
      />
      <div className="p-3">
        <div className="font-medium group-hover:underline">{video.title}</div>
        <div className="text-sm text-gray-500">{video.client}</div>
      </div>
    </>
  );

  // Callback mode (one-pager inline player)
  if ("onSelect" in rest) {
    return (
      <button
        type="button"
        onClick={() => rest.onSelect(video)}
        className="group block w-full text-left rounded-xl overflow-hidden border hover:shadow-md transition focus:outline-none focus:ring-2 focus:ring-offset-2"
      >
        {CardInner}
      </button>
    );
  }

  // Link mode (navigates to a route)
  return (
    <Link
      href={rest.href}
      className="group block rounded-xl overflow-hidden border hover:shadow-md transition"
    >
      {CardInner}
    </Link>
  );
}
