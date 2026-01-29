// /components/VideoCard.tsx
import Link from "next/link";
import type { VideoItem } from "@/types/video";

// Exactly one of these must be provided:
type Selectable = { onSelect: (video: VideoItem) => void; href?: never };
type Linkable = { href: string; onSelect?: never };
type Props = { video: VideoItem } & (Selectable | Linkable);

// Build better YouTube thumbnails (maxres → sd → hq → mq fallback)
function buildThumbs(thumbnail: string) {
  try {
    const u = new URL(thumbnail);
    if (!u.hostname.includes("img.youtube.com")) {
      // Non-YouTube thumb: just pass through
      return {
        src: thumbnail,
        srcSet: undefined as string | undefined,
        sizes: undefined as string | undefined,
        fallbacks: [] as string[],
      };
    }
    // Expect path like: /vi/<ID>/hqdefault.jpg
    const m = u.pathname.match(/\/vi\/([^/]+)\//);
    if (!m) {
      return {
        src: thumbnail,
        srcSet: undefined,
        sizes: undefined,
        fallbacks: [],
      };
    }
    const id = m[1];
    const base = `https://img.youtube.com/vi/${id}`;
    const maxres = `${base}/maxresdefault.jpg`; // 1280x720 (may 404)
    const sd = `${base}/sddefault.jpg`; // 640x480
    const hq = `${base}/hqdefault.jpg`; // 480x360
    const mq = `${base}/mqdefault.jpg`; // 320x180

    return {
      // Start safe (hq), but advertise larger versions via srcSet
      src: hq,
      srcSet: `${mq} 320w, ${hq} 480w, ${sd} 640w, ${maxres} 1280w`,
      sizes: "(min-width:1024px) 960px, (min-width:640px) 560px, 100vw",
      // Fallback chain for 404s on chosen src/srcset candidate
      fallbacks: [sd, hq, mq],
    };
  } catch {
    return {
      src: thumbnail,
      srcSet: undefined,
      sizes: undefined,
      fallbacks: [],
    };
  }
}

function CardInner({ video }: { video: VideoItem }) {
  const thumbs = buildThumbs(video.thumbnail);

  // Simple 404 downgrade: try sd → hq → mq
  function handleImgError(e: React.SyntheticEvent<HTMLImageElement>) {
    const el = e.currentTarget;
    const list = (el.dataset.fallbacks || "").split("|").filter(Boolean);
    if (list.length === 0) {
      // no more fallbacks; stop
      el.onerror = null;
      return;
    }
    const next = list.shift()!;
    el.src = next;
    el.dataset.fallbacks = list.join("|");
  }

  return (
    <div className="relative   aspect-video overflow-hidden rounded-xl border border-border transition-shadow group">
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden">
        <img
          src={thumbs.src}
          srcSet={thumbs.srcSet}
          sizes={thumbs.sizes}
          loading="lazy"
          decoding="async"
          alt={video.title}
          data-fallbacks={thumbs.fallbacks.join("|")}
          onError={handleImgError}
          className="h-full w-full object-cover transition-transform duration-300 will-change-transform group-hover:scale-[1.02]"
        />

        {/* Veil (very light, theme-aware) */}
        <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100 bg-[hsl(var(--foreground)/0.06)]" />

        {/* Bottom stripe with title + client (theme-aware) */}
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

  return (
    <div className="relative aspect-video w-full overflow-hidden bg-purple-400">
      <img
        src={thumbs.src}
        srcSet={thumbs.srcSet}
        sizes={thumbs.sizes}
        loading="lazy"
        decoding="async"
        alt={video.title}
        data-fallbacks={thumbs.fallbacks.join("|")}
        onError={handleImgError}
        className="absolute inset-0 h-full w-full object-cover"
      />

      {/* Veil (very light, theme-aware) */}
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100 bg-[hsl(var(--foreground)/0.06)]" />

      {/* Bottom stripe with title + client (theme-aware) */}
    </div>
  );
}

export default function VideoCard({ video, ...rest }: Props) {
  // Callback mode (one-pager inline player)
  // return <div className=" bg-pink-300 ">BB</div>;
  if ("onSelect" in rest) {
    return (
      <button
        type="button"
        onClick={() => rest.onSelect(video)}
        className="group inline-block min-w-0 "
        // className="block group h-full w-full bg-pink-400 min-w-0"
      >
        <CardInner video={video} />
      </button>
    );
  }

  // Link mode (navigates to a route)
  // return (
  //   <Link
  //     href={rest.href}
  //     className="group block h-full transition focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] focus:ring-offset-2 focus:ring-offset-[hsl(var(--background))]"
  //   >
  //     <CardInner video={video} />
  //   </Link>
  // );
}
