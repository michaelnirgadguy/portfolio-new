"use client";

import { useEffect, useMemo, useRef } from "react";
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
          className="h-full w-full select-none object-cover opacity-95 transition-[transform,opacity,filter] duration-[2400ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform group-hover:scale-[1.08] group-hover:opacity-100 group-hover:contrast-110 group-focus-visible:scale-[1.08] group-focus-visible:opacity-100 group-focus-visible:contrast-110 [user-select:none] [-webkit-user-drag:none]"
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
  const dragDistanceRef = useRef(0);
  const momentumFrameRef = useRef<number | null>(null);
  const autoScrollFrameRef = useRef<number | null>(null);
  const autoScrollStoppedRef = useRef(false);
  const suppressClickRef = useRef(false);
  const releaseSuppressTimeoutRef = useRef<number | null>(null);
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
  const compactColumns =
    videos.length === 2 ? "sm:grid-cols-2" : videos.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2";
  const isScrollableLayout = layoutMode === "threeScroll" || layoutMode === "mosaic";

  const clearMomentum = () => {
    if (momentumFrameRef.current !== null) {
      cancelAnimationFrame(momentumFrameRef.current);
      momentumFrameRef.current = null;
    }
  };

  const clearAutoScroll = () => {
    if (autoScrollFrameRef.current !== null) {
      cancelAnimationFrame(autoScrollFrameRef.current);
      autoScrollFrameRef.current = null;
    }
  };

  const stopAutoScroll = () => {
    autoScrollStoppedRef.current = true;
    clearAutoScroll();
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
      clearAutoScroll();
      clearMomentum();
      if (releaseSuppressTimeoutRef.current !== null) {
        window.clearTimeout(releaseSuppressTimeoutRef.current);
      }
    };
  }, []);


  useEffect(() => {
    const node = scrollRef.current;
    if (!node || !isScrollableLayout) {
      clearAutoScroll();
      return;
    }

    autoScrollStoppedRef.current = false;

    const speedPxPerSecond = 30;
    let lastTimestamp: number | null = null;

    const tick = (timestamp: number) => {
      if (autoScrollStoppedRef.current) {
        autoScrollFrameRef.current = null;
        return;
      }

      const maxScroll = Math.max(node.scrollWidth - node.clientWidth, 0);
      if (maxScroll <= 1 || node.scrollLeft >= maxScroll - 0.5) {
        node.scrollLeft = maxScroll;
        autoScrollFrameRef.current = null;
        return;
      }

      const dt = lastTimestamp === null ? 16 : Math.min(timestamp - lastTimestamp, 32);
      lastTimestamp = timestamp;
      const next = Math.min(maxScroll, node.scrollLeft + speedPxPerSecond * (dt / 1000));
      node.scrollLeft = next;

      autoScrollFrameRef.current = requestAnimationFrame(tick);
    };

    autoScrollFrameRef.current = requestAnimationFrame(tick);

    const stopEvents: Array<keyof HTMLElementEventMap> = ["wheel", "touchstart", "mousedown"];
    stopEvents.forEach((eventName) => {
      node.addEventListener(eventName, stopAutoScroll, { passive: true });
    });

    return () => {
      stopEvents.forEach((eventName) => {
        node.removeEventListener(eventName, stopAutoScroll);
      });
      clearAutoScroll();
    };
  }, [isScrollableLayout, videos.length]);

  const wrapperClassName =
    videos.length <= 4
      ? "w-full"
      : "w-full md:w-[min(90vw,72rem)] md:relative md:left-1/2 md:-translate-x-1/2";

  return (
    <div className={wrapperClassName}>
      <div className="relative rounded-2xl border border-border bg-card shadow-[0_24px_60px_rgba(15,23,42,0.18)]">
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
                    : "w-[17.4375rem] sm:w-[21.9375rem] lg:w-[26.4375rem]"
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
