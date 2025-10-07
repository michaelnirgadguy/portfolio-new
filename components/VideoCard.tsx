// /components/VideoCard.tsx
import Link from "next/link";
import type { VideoItem } from "@/types/video";

// NEW: base props including optional fillHeight
type BaseProps = { video: VideoItem; fillHeight?: boolean };

// Exactly one of these must be provided:
type Selectable = { onSelect: (video: VideoItem) => void; href?: never };
type Linkable  = { href: string; onSelect?: never };
type Props = BaseProps & (Selectable | Linkable);

function CardInner({ video, fillHeight }: { video: VideoItem; fillHeight?: boolean }) {
  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-border transition-shadow group">
      {/* Thumbnail */}
      <div className={fillHeight ? "relative h-full min-h-[220px] overflow-hidden" : "relative aspect-video overflow-hidden"}>
        <img
          src={video.thumbnail}
          alt={video.title}
          className="h-full w-full object-cover transition-transform duration-300 will-change-transform group-hover:scale-[1.02]"
        />

        {/* Veil */}
        <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100 bg-[hsl(var(--foreground)/0.06)]" />

        {/* Bottom stripe with title + client */}
        <div
          className={[
            "pointer-events-none absolute inset-x-0 bottom-0",
            "translate-y-2 opacity-0 transition duration-200",
            "group-hover:translate-y-0 group-hover:opacity-100",
            "group-focus-visible:translate-y-0 group-focus-visible:opacity-100",
            "bg-[hsl(var(--foreground)/0.72)]",
          ].join(" ")}
        >
          <div className="p-3">
            <div className="text-sm font-medium leading-tight line-clamp-1 text-[hsl(var(--background))]">
              {video.title}
            </div>
            {video.client && (
              <div className="text-xs/5 line-clamp-1 text-[hsl(var(--accent))]">
                {video.client}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VideoCard({ video, fillHeight, ...rest }: Props) {
  // Callback mode
  if ("onSelect" in rest) {
    return (
      <button
        type="button"
        onClick={() => rest.onSelect(video)}
        className="group block w-full text-left transition focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] focus:ring-offset-2 focus:ring-offset-[hsl(var(--background))]"
      >
        <CardInner video={video} fillHeight={fillHeight} />
      </button>
    );
  }

  // Link mode
  return (
    <Link
      href={rest.href}
      className="group block w-full transition focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] focus:ring-offset-2 focus:ring-offset-[hsl(var(--background))]"
    >
      <CardInner video={video} fillHeight={fillHeight} />
    </Link>
  );
}
