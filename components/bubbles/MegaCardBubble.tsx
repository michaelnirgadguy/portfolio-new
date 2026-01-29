"use client";

import { useRef } from "react";
import type { PointerEvent } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const scrollStartRef = useRef(0);

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

  const handleScroll = (direction: "left" | "right") => {
    const node = scrollRef.current;
    if (!node) return;
    const offset = Math.round(node.clientWidth * 0.7);
    node.scrollBy({ left: direction === "left" ? -offset : offset, behavior: "smooth" });
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    const node = scrollRef.current;
    if (!node) return;
    isDraggingRef.current = true;
    dragStartXRef.current = event.clientX;
    scrollStartRef.current = node.scrollLeft;
    node.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    const node = scrollRef.current;
    if (!node) return;
    const delta = event.clientX - dragStartXRef.current;
    node.scrollLeft = scrollStartRef.current - delta;
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const node = scrollRef.current;
    if (!node) return;
    isDraggingRef.current = false;
    node.releasePointerCapture(event.pointerId);
  };

  return (
    <div className="w-full md:w-[min(90vw,72rem)] md:relative md:left-1/2 md:-translate-x-1/2">
      <div className="relative rounded-2xl border border-border bg-card shadow-[0_24px_60px_rgba(15,23,42,0.18)]">
        <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[hsl(var(--card))] via-[hsl(var(--card)/0.9)] to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[hsl(var(--card))] via-[hsl(var(--card)/0.9)] to-transparent" />
        <button
          type="button"
          onClick={() => handleScroll("left")}
          className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 z-10 h-9 w-9 items-center justify-center rounded-full border border-border bg-card/90 text-foreground shadow-sm transition hover:scale-105"
          aria-label="Scroll mega card left"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => handleScroll("right")}
          className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 z-10 h-9 w-9 items-center justify-center rounded-full border border-border bg-card/90 text-foreground shadow-sm transition hover:scale-105"
          aria-label="Scroll mega card right"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        <div
          ref={scrollRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          className="no-scrollbar flex gap-4 overflow-x-auto px-6 pb-5 pt-5 scroll-smooth snap-x snap-mandatory cursor-grab active:cursor-grabbing"
        >
          {blocks.map((block, blockIndex) => (
            <div
              key={`${block.type}-${blockIndex}`}
              className={`shrink-0 ${
                block.type === "three"
                  ? "w-[24rem] sm:w-[30rem] lg:w-[36rem]"
                  : "w-[18rem] sm:w-[22rem] lg:w-[26rem]"
              } snap-start`}
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
