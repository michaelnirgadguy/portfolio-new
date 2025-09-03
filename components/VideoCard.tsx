// /components/VideoCard.tsx
import Link from "next/link";
import type { VideoItem } from "@/types/video";

// Exactly one of these must be provided:
type Selectable = { onSelect: (video: VideoItem) => void; href?: never };
type Linkable  = { href: string; onSelect?: never };
type Props = { video: VideoItem } & (Selectable | Linkable);

function CardInner({ video }: { video: VideoItem }) {
  return (
    <div className="relative w-full overflow-hidden rounded-xl border transition-shadow group">
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden">
        <img
          src={video.thumbnail}
          alt={video.title}
          className="h-full w-full object-cover transition-transform duration-300 will-change-transform group-hover:scale-[1.02]"
        />

        {/* Veil (very light) */}
        <div className="pointer-events-none absolute inset-0 bg-black/5 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100" />

        {/* Bottom stripe with title + client */}
        <div
          className={[
            "pointer-events-none absolute inset-x-0 bottom-0",
            "translate-y-2 opacity-0 transition duration-200",
            "group-hover:translate-y-0 group-hover:opacity-100",
            "group-focus-visible:translate-y-0 group-focus-visible:opacity-100",
            "bg-black/60 text-white"
          ].join(" ")}
        >
          <div className="p-3">
            <div className="text-sm font-medium leading-tight line-clamp-1">
              {video.title}
            </div>
            {video.client && (
              <div className="text-xs/5 text-white/80 line-clamp-1">
                {video.client}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VideoCard({ video, ...rest }: Props) {
  // Callback mode (one-pager inline player)
  if ("onSelect" in rest) {
    return (
      <button
        type="button"
        onClick={() => rest.onSelect(video)}
        className="group block w-full text-left transition focus:outline-none focus:ring-2 focus:ring-offset-2"
      >
        <CardInner video={video} />
      </button>
    );
  }

  // Link mode (navigates to a route)
  return (
    <Link
      href={rest.href}
      className="group block w-full transition focus:outline-none focus:ring-2 focus:ring-offset-2"
    >
      <CardInner video={video} />
    </Link>
  );
}
