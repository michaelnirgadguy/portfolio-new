"use client";

import { useRef } from "react";
import type { VideoItem } from "@/types/video";

type MegaCardBubbleProps = {
  videoIds: string[];
  videosById: Map<string, VideoItem>;
  onOpenVideo?: (video: VideoItem) => void;
};

type MegaBlock = {
  type: "three" | "two" | "single";
  items: VideoItem[];
};

function MegaVideoTile({
  video,
  onSelect,
}: {
  video: VideoItem;
  onSelect?: (video: VideoItem) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect?.(video)}
      className="group w-full text-left transition focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] focus:ring-offset-2 focus:ring-offset-[hsl(var(--background))]"
    >
      <div className="relative w-full overflow-hidden rounded-xl border border-border bg-card aspect-video">
        <img
          src={video.thumbnail}
          alt={video.title}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-contain transition-transform duration-300 will-change-transform group-hover:scale-[1.02]"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[hsl(var(--foreground)/0.7)] via-transparent to-transparent opacity-70" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 p-3 text-sm font-medium leading-tight text-[hsl(var(--background))]">
          {video.title}
        </div>
      </div>
    </button>
  );
}

export default function MegaCardBubble({ videoIds, videosById, onOpenVideo }: MegaCardBubbleProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const videos = videoIds
    .map((id) => videosById.get(id))
    .filter(Boolean) as VideoItem[];

  if (!videos.length) {
    return (
      <div className="w-full rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
        No videos to show.
      </div>
    );
  }

  const blocks: MegaBlock[] = [];
  let index = 0;
  let useThreeBlock = true;

  while (index < videos.length) {
    const remaining = videos.length - index;
    if (useThreeBlock) {
      if (remaining >= 3) {
        blocks.push({ type: "three", items: videos.slice(index, index + 3) });
        index += 3;
      } else if (remaining >= 2) {
        blocks.push({ type: "two", items: videos.slice(index, index + 2) });
        index += 2;
      } else {
        blocks.push({ type: "single", items: videos.slice(index, index + 1) });
        index += 1;
      }
    } else if (remaining >= 2) {
      blocks.push({ type: "two", items: videos.slice(index, index + 2) });
      index += 2;
    } else {
      blocks.push({ type: "single", items: videos.slice(index, index + 1) });
      index += 1;
    }
    useThreeBlock = !useThreeBlock;
  }

  const handleClick = (video: VideoItem) => {
    onOpenVideo?.(video);
  };

  const scrollByOffset = (offset: number) => {
    scrollRef.current?.scrollBy({ left: offset, behavior: "smooth" });
  };

  return (
    <div className="w-full md:w-[min(90vw,72rem)] md:relative md:left-1/2 md:-translate-x-1/2">
      <div className="relative rounded-2xl border border-border bg-card shadow-[0_24px_60px_rgba(15,23,42,0.18)]">
        <div className="pointer-events-none absolute inset-y-0 left-0 w-12 rounded-l-2xl bg-gradient-to-r from-[hsl(var(--background)/0.85)] to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-12 rounded-r-2xl bg-gradient-to-l from-[hsl(var(--background)/0.85)] to-transparent" />
        <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
          <button
            type="button"
            onClick={() => scrollByOffset(-420)}
            className="grid h-8 w-8 place-items-center rounded-full border border-border bg-[hsl(var(--card))]/90 text-sm text-foreground shadow-sm transition hover:shadow-md"
            aria-label="Scroll left"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => scrollByOffset(420)}
            className="grid h-8 w-8 place-items-center rounded-full border border-border bg-[hsl(var(--card))]/90 text-sm text-foreground shadow-sm transition hover:shadow-md"
            aria-label="Scroll right"
          >
            →
          </button>
        </div>
        <div
          ref={scrollRef}
          className="mega-scroll flex gap-4 overflow-x-auto px-4 pb-4 pt-4 scroll-smooth snap-x snap-mandatory"
        >
          {blocks.map((block, blockIndex) => (
            <div
              key={`${block.type}-${blockIndex}`}
              className={`shrink-0 snap-start ${
                block.type === "three"
                  ? "w-[24rem] sm:w-[30rem] lg:w-[36rem]"
                  : "w-[18rem] sm:w-[22rem] lg:w-[26rem]"
              }`}
            >
              {block.type === "three" && (
                <div className="grid gap-3">
                  <div className="grid grid-cols-2 gap-3">
                    {block.items.slice(0, 2).map((video) => (
                      <MegaVideoTile key={video.id} video={video} onSelect={handleClick} />
                    ))}
                  </div>
                  <MegaVideoTile video={block.items[2]} onSelect={handleClick} />
                </div>
              )}
              {block.type === "two" && (
                <div className="grid gap-3">
                  {block.items.map((video) => (
                    <div key={video.id}>
                      <MegaVideoTile video={video} onSelect={handleClick} />
                    </div>
                  ))}
                </div>
              )}
              {block.type === "single" && (
                <MegaVideoTile video={block.items[0]} onSelect={handleClick} />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
