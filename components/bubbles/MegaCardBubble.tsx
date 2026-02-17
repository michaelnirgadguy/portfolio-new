"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  layout?: "bigTop" | "bigBottom";
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
          className="h-full w-full object-cover opacity-95 transition duration-300 will-change-transform group-hover:scale-[1.015] group-hover:opacity-100 group-hover:contrast-105 group-focus-visible:scale-[1.015] group-focus-visible:opacity-100 group-focus-visible:contrast-105"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[hsl(var(--foreground)/0.6)] via-[hsl(var(--foreground)/0.2)] to-transparent opacity-60 transition-opacity duration-200 group-hover:opacity-80 group-focus-visible:opacity-80" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-1 opacity-90 transition duration-200 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
          <div className="bg-[hsl(var(--foreground)/0.62)] p-3 text-sm font-medium leading-tight text-[hsl(var(--background))]">
            <p className="line-clamp-2">
            {video.title}
            </p>
          </div>
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
  const [scrollState, setScrollState] = useState({
    canScrollLeft: false,
    canScrollRight: false,
    hasOverflow: false,
  });

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

  const blocks = useMemo(() => {
    const builtBlocks: MegaBlock[] = [];
    let index = 0;
    let useThreeBlock = true;
    let bigOnTop = true;

    if (videos.length === 6 || videos.length === 9) {
      for (let i = 0; i < videos.length; i += 3) {
        builtBlocks.push({
          type: "three",
          items: videos.slice(i, i + 3),
          layout: bigOnTop ? "bigTop" : "bigBottom",
        });
        bigOnTop = !bigOnTop;
      }
      return builtBlocks;
    }

    while (index < videos.length) {
      const remaining = videos.length - index;
      if (useThreeBlock) {
        if (remaining >= 3) {
          builtBlocks.push({
            type: "three",
            items: videos.slice(index, index + 3),
            layout: bigOnTop ? "bigTop" : "bigBottom",
          });
          index += 3;
          bigOnTop = !bigOnTop;
        } else if (remaining >= 2) {
          builtBlocks.push({ type: "two", items: videos.slice(index, index + 2) });
          index += 2;
        } else {
          builtBlocks.push({ type: "single", items: videos.slice(index, index + 1) });
          index += 1;
        }
      } else if (remaining >= 2) {
        builtBlocks.push({ type: "two", items: videos.slice(index, index + 2) });
        index += 2;
      } else {
        builtBlocks.push({ type: "single", items: videos.slice(index, index + 1) });
        index += 1;
      }
      useThreeBlock = !useThreeBlock;
    }

    return builtBlocks;
  }, [videos]);

  const layoutMode = videos.length === 3 ? "threeScroll" : videos.length <= 4 ? "compact" : "mosaic";
  const isCompactLayout = layoutMode === "compact";
  const compactColumns =
    videos.length === 2 ? "sm:grid-cols-2" : videos.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2";
  const isScrollableLayout = layoutMode === "threeScroll" || layoutMode === "mosaic";

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
    const target = event.target as HTMLElement | null;
    if (target?.closest("button")) {
      return;
    }
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

  useEffect(() => {
    const node = scrollRef.current;
    if (!node || !isScrollableLayout) {
      setScrollState({ canScrollLeft: false, canScrollRight: false, hasOverflow: false });
      return;
    }

    const updateScrollState = () => {
      const maxScroll = node.scrollWidth - node.clientWidth;
      const hasOverflow = maxScroll > 1;
      setScrollState({
        canScrollLeft: node.scrollLeft > 1,
        canScrollRight: node.scrollLeft < maxScroll - 1,
        hasOverflow,
      });
    };

    updateScrollState();
    node.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);

    const resizeObserver = new ResizeObserver(updateScrollState);
    resizeObserver.observe(node);

    return () => {
      node.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
      resizeObserver.disconnect();
    };
  }, [isScrollableLayout, videos.length]);

  const wrapperClassName =
    videos.length <= 4
      ? "w-full"
      : "w-full md:w-[min(90vw,72rem)] md:relative md:left-1/2 md:-translate-x-1/2";

  return (
    <div className={wrapperClassName}>
      <div className="relative rounded-2xl border border-border bg-card shadow-[0_24px_60px_rgba(15,23,42,0.18)]">
        {scrollState.canScrollLeft && (
          <div className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-[hsl(var(--card))] via-[hsl(var(--card)/0.75)] to-transparent" />
        )}
        {scrollState.canScrollRight && (
          <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-[hsl(var(--card))] via-[hsl(var(--card)/0.75)] to-transparent" />
        )}
        {scrollState.canScrollLeft && (
          <button
            type="button"
            onClick={() => handleScroll("left")}
            className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 z-10 h-9 w-9 items-center justify-center rounded-full border border-border bg-card/90 text-foreground shadow-sm transition hover:scale-105"
            aria-label="Scroll mega card left"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
        {scrollState.canScrollRight && (
          <button
            type="button"
            onClick={() => handleScroll("right")}
            className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 z-10 h-9 w-9 items-center justify-center rounded-full border border-border bg-card/90 text-foreground shadow-sm transition hover:scale-105"
            aria-label="Scroll mega card right"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
        {layoutMode === "compact" ? (
          <div className="px-6 pb-5 pt-5">
            <div className={`grid gap-4 ${compactColumns} grid-cols-1`}>
              {videos.map((video) => (
                <MegaVideoTile key={video.id} video={video} onSelect={handleClick} />
              ))}
            </div>
          </div>
        ) : layoutMode === "threeScroll" ? (
          <div
            ref={scrollRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            className="no-scrollbar flex gap-4 overflow-x-auto px-6 pb-5 pt-5 scroll-smooth cursor-grab active:cursor-grabbing"
          >
            {videos.map((video) => (
              <div key={video.id} className="shrink-0 w-[18rem] sm:w-[22rem] lg:w-[26rem]">
                <MegaVideoTile video={video} onSelect={handleClick} />
              </div>
            ))}
          </div>
        ) : (
          <div
            ref={scrollRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            className={`no-scrollbar flex gap-4 overflow-x-auto px-6 pb-5 pt-5 scroll-smooth cursor-grab active:cursor-grabbing ${
              videos.length === 5 ? "justify-center" : ""
            }`}
          >
            {blocks.map((block, blockIndex) => (
              <div
                key={`${block.type}-${blockIndex}`}
                className={`shrink-0 ${
                  block.type === "three"
                    ? "w-[24rem] sm:w-[30rem] lg:w-[36rem]"
                    : "w-[18rem] sm:w-[22rem] lg:w-[26rem]"
                }`}
              >
                {block.type === "three" && (
                  <div className="grid gap-3">
                    {block.layout === "bigTop" ? (
                      <>
                        <MegaVideoTile video={block.items[2]} onSelect={handleClick} />
                        <div className="grid grid-cols-2 gap-3">
                          {block.items.slice(0, 2).map((video) => (
                            <MegaVideoTile key={video.id} video={video} onSelect={handleClick} />
                          ))}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          {block.items.slice(0, 2).map((video) => (
                            <MegaVideoTile key={video.id} video={video} onSelect={handleClick} />
                          ))}
                        </div>
                        <MegaVideoTile video={block.items[2]} onSelect={handleClick} />
                      </>
                    )}
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
        )}
      </div>
    </div>
  );
}
