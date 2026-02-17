"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { DragEvent, MouseEvent, PointerEvent } from "react";
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
  onPreventNativeDrag,
}: {
  video: VideoItem;
  onSelect?: (video: VideoItem, event: MouseEvent<HTMLButtonElement>) => void;
  onPreventNativeDrag?: (event: DragEvent<HTMLElement>) => void;
}) {
  return (
    <button
      type="button"
      onClick={(event) => onSelect?.(video, event)}
      onDragStart={onPreventNativeDrag}
      className="group w-full select-none text-left transition outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--background))]"
    >
      <div className="relative w-full overflow-hidden rounded-xl border border-border bg-card aspect-video">
        <img
          src={video.thumbnail}
          alt={video.title}
          loading="lazy"
          decoding="async"
          draggable={false}
          onDragStart={onPreventNativeDrag}
          className="h-full w-full select-none object-cover opacity-95 transition duration-[2500ms] ease-in-out will-change-transform group-hover:scale-[1.08] group-hover:opacity-100 group-hover:contrast-105 group-hover:animate-[megaTileBreath_2.8s_ease-in-out_infinite_alternate] group-focus-visible:scale-[1.08] group-focus-visible:opacity-100 group-focus-visible:contrast-105 group-focus-visible:animate-[megaTileBreath_2.8s_ease-in-out_infinite_alternate] [user-select:none] [-webkit-user-drag:none]"
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
  const activePointerIdRef = useRef<number | null>(null);
  const pendingDragRef = useRef(false);
  const pointerStartXRef = useRef(0);
  const lastPointerXRef = useRef(0);
  const lastMoveTimeRef = useRef(0);
  const velocityRef = useRef(0);
  const autoScrollFrameRef = useRef<number | null>(null);
  const autoScrollDirectionRef = useRef<1 | -1>(1);
  const userInteractedRef = useRef(false);
  const dragDistanceRef = useRef(0);
  const momentumFrameRef = useRef<number | null>(null);
  const suppressClickRef = useRef(false);
  const releaseSuppressTimeoutRef = useRef<number | null>(null);
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

  const clearMomentum = () => {
    if (momentumFrameRef.current !== null) {
      cancelAnimationFrame(momentumFrameRef.current);
      momentumFrameRef.current = null;
    }
  };

  const releaseClickSuppression = () => {
    if (releaseSuppressTimeoutRef.current !== null) {
      window.clearTimeout(releaseSuppressTimeoutRef.current);
      releaseSuppressTimeoutRef.current = null;
    }
    releaseSuppressTimeoutRef.current = window.setTimeout(() => {
      suppressClickRef.current = false;
      releaseSuppressTimeoutRef.current = null;
    }, 40);
  };

  const preventNativeDrag = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
  };

  const handleClick = (video: VideoItem, event: MouseEvent<HTMLButtonElement>) => {
    if (suppressClickRef.current) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    onOpenVideo?.(video);
  };

  const stopAutoScroll = () => {
    userInteractedRef.current = true;
    if (autoScrollFrameRef.current !== null) {
      cancelAnimationFrame(autoScrollFrameRef.current);
      autoScrollFrameRef.current = null;
    }
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    const node = scrollRef.current;
    if (!node) return;

    stopAutoScroll();
    clearMomentum();
    activePointerIdRef.current = event.pointerId;
    pendingDragRef.current = true;
    isDraggingRef.current = false;
    suppressClickRef.current = false;
    dragDistanceRef.current = 0;
    velocityRef.current = 0;
    pointerStartXRef.current = event.clientX;
    lastPointerXRef.current = event.clientX;
    lastMoveTimeRef.current = performance.now();
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (activePointerIdRef.current !== event.pointerId) return;

    const node = scrollRef.current;
    if (!node) return;

    const now = performance.now();
    const deltaX = event.clientX - lastPointerXRef.current;
    const movedFromStart = Math.abs(event.clientX - pointerStartXRef.current);

    if (!isDraggingRef.current) {
      if (!pendingDragRef.current || movedFromStart < 7) {
        lastPointerXRef.current = event.clientX;
        lastMoveTimeRef.current = now;
        return;
      }

      isDraggingRef.current = true;
      pendingDragRef.current = false;
      suppressClickRef.current = true;
      node.setPointerCapture(event.pointerId);
    }

    node.scrollLeft -= deltaX;
    dragDistanceRef.current += Math.abs(deltaX);

    const dt = Math.max(now - lastMoveTimeRef.current, 1);
    const instantaneousVelocity = deltaX / dt;
    velocityRef.current = velocityRef.current * 0.7 + instantaneousVelocity * 0.3;

    lastPointerXRef.current = event.clientX;
    lastMoveTimeRef.current = now;
  };

  const handlePointerEnd = (event: PointerEvent<HTMLDivElement>) => {
    const node = scrollRef.current;
    if (!node) return;
    if (activePointerIdRef.current !== event.pointerId) return;

    const wasDragging = isDraggingRef.current;
    isDraggingRef.current = false;
    pendingDragRef.current = false;
    activePointerIdRef.current = null;

    if (node.hasPointerCapture(event.pointerId)) {
      node.releasePointerCapture(event.pointerId);
    }

    if (!wasDragging) {
      suppressClickRef.current = false;
      velocityRef.current = 0;
      return;
    }

    const minVelocity = 0.02;
    let momentumVelocity = velocityRef.current;

    if (Math.abs(momentumVelocity) > minVelocity) {
      const decay = 0.94;
      const stepMomentum = () => {
        momentumVelocity *= decay;
        if (Math.abs(momentumVelocity) < minVelocity) {
          momentumFrameRef.current = null;
          releaseClickSuppression();
          return;
        }
        node.scrollLeft -= momentumVelocity * 16;
        momentumFrameRef.current = requestAnimationFrame(stepMomentum);
      };
      momentumFrameRef.current = requestAnimationFrame(stepMomentum);
      return;
    }

    releaseClickSuppression();
  };

  useEffect(() => {
    return () => {
      clearMomentum();
      if (autoScrollFrameRef.current !== null) {
        cancelAnimationFrame(autoScrollFrameRef.current);
      }
      if (releaseSuppressTimeoutRef.current !== null) {
        window.clearTimeout(releaseSuppressTimeoutRef.current);
      }
    };
  }, []);

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

  useEffect(() => {
    const node = scrollRef.current;
    if (!node || !isScrollableLayout) return;

    userInteractedRef.current = false;
    autoScrollDirectionRef.current = 1;

    const maxScroll = node.scrollWidth - node.clientWidth;
    if (maxScroll <= 1) return;

    let lastTime = performance.now();
    const speedPxPerSecond = 8;

    const step = (now: number) => {
      if (userInteractedRef.current) {
        autoScrollFrameRef.current = null;
        return;
      }

      const elapsed = now - lastTime;
      lastTime = now;

      node.scrollLeft += autoScrollDirectionRef.current * ((speedPxPerSecond * elapsed) / 1000);

      const currentMaxScroll = node.scrollWidth - node.clientWidth;
      if (node.scrollLeft >= currentMaxScroll - 0.5) {
        autoScrollDirectionRef.current = -1;
      } else if (node.scrollLeft <= 0.5) {
        autoScrollDirectionRef.current = 1;
      }

      autoScrollFrameRef.current = requestAnimationFrame(step);
    };

    const timer = window.setTimeout(() => {
      autoScrollFrameRef.current = requestAnimationFrame(step);
    }, 700);

    return () => {
      window.clearTimeout(timer);
      if (autoScrollFrameRef.current !== null) {
        cancelAnimationFrame(autoScrollFrameRef.current);
        autoScrollFrameRef.current = null;
      }
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
        {layoutMode === "compact" ? (
          <div className="px-6 pb-5 pt-5">
            <div className={`grid gap-4 ${compactColumns} grid-cols-1`}>
              {videos.map((video) => (
                <MegaVideoTile key={video.id} video={video} onSelect={handleClick} onPreventNativeDrag={preventNativeDrag} />
              ))}
            </div>
          </div>
        ) : layoutMode === "threeScroll" ? (
          <div
            ref={scrollRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerEnd}
            onPointerCancel={handlePointerEnd}
            onWheel={stopAutoScroll}
            onDragStartCapture={preventNativeDrag}
            className="no-scrollbar flex gap-4 overflow-x-auto px-6 pb-5 pt-5 cursor-grab active:cursor-grabbing [touch-action:pan-y]"
          >
            {videos.map((video) => (
              <div key={video.id} className="shrink-0 w-[18rem] sm:w-[22rem] lg:w-[26rem]">
                <MegaVideoTile video={video} onSelect={handleClick} onPreventNativeDrag={preventNativeDrag} />
              </div>
            ))}
          </div>
        ) : (
          <div
            ref={scrollRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerEnd}
            onPointerCancel={handlePointerEnd}
            onWheel={stopAutoScroll}
            onDragStartCapture={preventNativeDrag}
            className={`no-scrollbar flex gap-4 overflow-x-auto px-6 pb-5 pt-5 cursor-grab active:cursor-grabbing [touch-action:pan-y] ${
              videos.length === 5 ? "justify-center" : ""
            }`}
          >
            {blocks.map((block, blockIndex) => (
              <div
                key={`${block.type}-${blockIndex}`}
                className={`shrink-0 ${
                  block.type === "three"
                    ? "w-[24rem] sm:w-[30rem] lg:w-[36rem]"
                    : "w-[18rem] sm:w-[22.25rem] lg:w-[26.75rem]"
                }`}
              >
                {block.type === "three" && (
                  <div className="grid gap-3">
                    {block.layout === "bigTop" ? (
                      <>
                        <MegaVideoTile video={block.items[2]} onSelect={handleClick} onPreventNativeDrag={preventNativeDrag} />
                        <div className="grid grid-cols-2 gap-3">
                          {block.items.slice(0, 2).map((video) => (
                            <MegaVideoTile key={video.id} video={video} onSelect={handleClick} onPreventNativeDrag={preventNativeDrag} />
                          ))}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          {block.items.slice(0, 2).map((video) => (
                            <MegaVideoTile key={video.id} video={video} onSelect={handleClick} onPreventNativeDrag={preventNativeDrag} />
                          ))}
                        </div>
                        <MegaVideoTile video={block.items[2]} onSelect={handleClick} onPreventNativeDrag={preventNativeDrag} />
                      </>
                    )}
                  </div>
                )}
                {block.type === "two" && (
                  <div className="grid gap-3">
                    {block.items.map((video) => (
                      <div key={video.id}>
                        <MegaVideoTile video={video} onSelect={handleClick} onPreventNativeDrag={preventNativeDrag} />
                      </div>
                    ))}
                  </div>
                )}
                {block.type === "single" && (
                  <MegaVideoTile video={block.items[0]} onSelect={handleClick} onPreventNativeDrag={preventNativeDrag} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
