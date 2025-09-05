// components/CenterDock.tsx
"use client";

import { ReactNode, useEffect, useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

// Buffer in px to avoid rapid flipping near the viewport boundary
const HYSTERESIS = 24;

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

  const [mode, setMode] = useState<"center" | "pinned">("center");
  const [chatBoxHeight, setChatBoxHeight] = useState<number | null>(null);

  const measure = () => {
    const topEl = topRef.current;
    const chatEl = chatRef.current;
    const wrapEl = wrapRef.current;
    if (!topEl || !chatEl) return;

    const viewportH = Math.round(wrapEl?.getBoundingClientRect().height || window.innerHeight);
    const maxChatPx = Math.round((chatMaxVh / 100) * viewportH);

    // Clear styles only if previously constrained
    if (chatEl.style.maxHeight || chatEl.style.height || chatEl.style.overflowY) {
      chatEl.style.maxHeight = "";
      chatEl.style.height = "";
      chatEl.style.overflowY = "visible";
    }

    const topH = topEl.offsetHeight;
    const chatNatural = Math.max(chatMinPx, chatEl.scrollHeight || chatEl.offsetHeight || 0);
    const nextChatTarget = Math.min(chatNatural, maxChatPx);

    // Avoid state churn
    setChatBoxHeight((prev) => (prev === nextChatTarget ? prev : nextChatTarget));

    const total = topH + gap + nextChatTarget + containerPad * 2;

    // Hysteresis: flip modes only when clearly past the boundary
    setMode((prev) => {
      const centerBoundary = viewportH;
      const tooSmall = total <= centerBoundary - HYSTERESIS;
      const tooLarge = total >= centerBoundary + HYSTERESIS;
      if (prev === "center") return tooLarge ? "pinned" : "center";
      return tooSmall ? "center" : "pinned";
    });
  };

  useLayoutEffect(() => {
    measure();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onResize = () => measure();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    (document as any).fonts?.ready?.then(() => measure());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={wrapRef} className={cn("h-full w-full min-h-0", className)}>
      {mode === "center" ? (
        // CENTERED
        <div className="mx-auto max-w-7xl flex min-h-full items-center justify-center px-6">
          <div className="w-full">
            <div ref={topRef}>{top}</div>
            <div style={{ height: gap }} />
            <div
              ref={chatRef}
              className="rounded-t-xl bg-white"
              style={{
                height: chatBoxHeight ?? undefined,
                maxHeight: `${chatMaxVh}vh`,
                overflowY: "auto",
              }}
            >
              <div className="p-4">{chat}</div>
            </div>
          </div>
        </div>
      ) : (
        // PINNED — ONLY TOP SCROLLS
        <div className="grid h-full min-h-0 grid-rows-[minmax(0,1fr)_auto]">
          <div className="h-full min-h-0 overflow-y-auto">
            <div className="mx-auto max-w-7xl px-6 py-6">
              <div ref={topRef}>{top}</div>
              <div style={{ height: gap }} />
            </div>
          </div>
          <div className="bg-white">
            <div className="mx-auto max-w-7xl px-6 py-4">
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
      )}
    </div>
  );
}
