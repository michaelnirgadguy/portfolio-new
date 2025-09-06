// components/CenterDock.tsx
"use client";

import { ReactNode, useEffect, useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const HYSTERESIS = 24; // keeps the centered mode from flip-flopping

export default function CenterDock({
  top,
  chat,
  className,
  gap = 24,
  containerPad = 24,
  chatMaxVh = 60,
  chatMinPx = 0,
}: {
  top: ReactNode;
  chat: ReactNode;
  className?: string;
  gap?: number;
  containerPad?: number;
  chatMaxVh?: number;
  chatMinPx?: number;
}) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const topRef = useRef<HTMLDivElement | null>(null);
  const chatRef = useRef<HTMLDivElement | null>(null);

  const [chatBoxHeight, setChatBoxHeight] = useState<number | null>(null);
  const [isCentered, setIsCentered] = useState<boolean>(true);

  const measure = () => {
    const topEl = topRef.current;
    const chatEl = chatRef.current;
    const wrapEl = wrapRef.current;
    if (!topEl || !chatEl) return;

    const viewportH = Math.round(wrapEl?.getBoundingClientRect().height || window.innerHeight);
    const maxChatPx = Math.round((chatMaxVh / 100) * viewportH);

    // remove constraints to read natural height
    chatEl.style.maxHeight = "";
    chatEl.style.height = "";
    chatEl.style.overflowY = "visible";

    const topH = topEl.offsetHeight;
    const chatNatural = Math.max(chatMinPx, chatEl.scrollHeight || chatEl.offsetHeight || 0);
    const nextChatTarget = Math.min(chatNatural, maxChatPx);
    setChatBoxHeight((prev) => (prev === nextChatTarget ? prev : nextChatTarget));

    const total = topH + gap + nextChatTarget + containerPad * 2;

    // vertical centering when it clearly fits
    setIsCentered((prev) => {
      const fits = total <= viewportH - HYSTERESIS;
      const over = total >= viewportH + HYSTERESIS;
      if (prev) return !over;   // stay centered until clearly too tall
      return fits;              // only switch to centered when clearly small
    });
  };

  useLayoutEffect(() => { measure(); }, []);
  useEffect(() => {
    const onResize = () => measure();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  useEffect(() => {
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => measure());
    const els: Element[] = [];
    if (wrapRef.current) els.push(wrapRef.current);
    if (topRef.current) els.push(topRef.current);
    if (chatRef.current) els.push(chatRef.current);
    els.forEach((el) => ro.observe(el));
    window.addEventListener("load", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("load", measure);
    };
  }, []);
  useEffect(() => {
    (document as any).fonts?.ready?.then(() => measure());
  }, []);

  return (
    <div ref={wrapRef} className={cn("h-full w-full min-h-0", className)}>
      {/* Single DOM tree. Center vertically (when it fits), never horizontally. */}
      <div
        className={cn(
          "grid h-full min-h-0",
          isCentered
            ? "grid-rows-[auto_auto] content-center"      // vertical center only
            : "grid-rows-[minmax(0,1fr)_auto]"
        )}
      >
        {/* TOP: scrolls when tall; centered vertically when short */}
        <div className={cn("min-h-0", isCentered ? "overflow-visible" : "h-full overflow-y-auto")}>
          <div
            className={cn(
              // w-full prevents “content-width” centering wiggle
              "mx-auto max-w-7xl w-full px-6 py-6",
              isCentered ? "flex min-h-full items-center" : ""
            )}
          >
            <div className="w-full">
              <div ref={topRef}>{top}</div>
              <div style={{ height: gap }} />
            </div>
          </div>
        </div>

        {/* CHAT: always mounted; a little bottom space even without safe-area */}
        <div className="bg-white">
          <div
            className="mx-auto max-w-7xl w-full px-6 py-4"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 10px)" }}
          >
            <div
              ref={chatRef}
              style={{
                height: chatBoxHeight ?? undefined,
                maxHeight: `${chatMaxVh}vh`,
                overflowY: "auto",
              }}
            >
              {chat}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
