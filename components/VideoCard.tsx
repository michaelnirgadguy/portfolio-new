// /components/VideoCard.tsx
import Link from "next/link";
import type { VideoItem } from "@/types/video";

// Exactly one of these must be provided:
type Selectable = { onSelect: (video: VideoItem) => void; href?: never };
type Linkable  = { href: string; onSelect?: never };
type Props = { video: VideoItem } & (Selectable | Linkable);

// helpers: build src/srcSet for YouTube thumbs
function buildThumbSources(url: string) {
  // only handle standard img.youtube.com pattern
  if (!/img\.youtube\.com\/vi\/[^/]+\/hqdefault\.jpg$/.test(url)) {
    return { src: url, srcSet: undefined as string | undefined, sizes: undefined as string | undefined };
  }
  const hi = url.replace("hqdefault.jpg", "maxresdefault.jpg"); // 1280×720 (not always available)
  const sd = url.replace("hqdefault.jpg", "sddefault.jpg");     // 640×480
  const hq = url;                                               // 320×180
  const srcSet = [
    `${hi} 1280w`,
    `${sd} 640w`,
    `${hq} 320w`,
  ].join(", ");
  const sizes = "(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw";
  return { src: sd, srcSet, sizes }; // default to sd; browser upgrades if maxres exists
}

function CardInner({ video }: { video: VideoItem }) {
  const { src, srcSet, sizes } = buildThumbSources(video.thumbnail);

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-border transition-shadow group">
      {/* Thumbnail - with debug color */}
      <div className="relative aspect-video overflow-hidden bg-emerald-200/30">
        <img
          src={src}
          srcSet={srcSet}
          sizes={sizes}
          alt={video.title}
          className="h-full w-full object-cover transition-transform duration-300 will-change-transform group-hover:scale-[1.02]"
          loading="lazy"
          decoding="async"
        />
{/* DEBUG overlay — shows the 16:9 box and its bottom edge */}
<div className="pointer-events-none absolute inset-0 bg-emerald-200/25" />
<div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-red-500/70" />
        
        {/* Veil + stripe unchanged */}
        <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100 bg-[hsl(var(--foreground)/0.06)]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-2 opacity-0 transition duration-200 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100 bg-[hsl(var(--foreground)/0.72)]">
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

export default function VideoCard({ video, ...rest }: Props) {
  // Callback mode (one-pager inline player)
  if ("onSelect" in rest) {
    return (
      <button
        type="button"
        onClick={() => rest.onSelect(video)}
        className="group block w-full text-left transition focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] focus:ring-offset-2 focus:ring-offset-[hsl(var(--background))]"
      >
        <CardInner video={video} />
      </button>
    );
  }

  // Link mode (navigates to a route)
  return (
    <Link
      href={rest.href}
      className="group block w-full transition focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] focus:ring-offset-2 focus:ring-offset-[hsl(var(--background))]"
    >
      <CardInner video={video} />
    </Link>
  );
}
