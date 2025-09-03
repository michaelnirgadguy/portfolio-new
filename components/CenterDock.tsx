// components/CenterDock.tsx
"use client";

import { ReactNode, useEffect, useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * CenterDock
 * - If (top + chat) fits → center as one block (chat flush under top).
 * - If it doesn't fit → fall back to pinned-bottom chat with scrollable top.
 * Chat height is driven by its natural content height, capped by chatMaxVh.
 */
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
    const wrap = wrapRef.current;
    const topEl = topRef.current;
    const chatEl = chatRef.current;
    if (!wrap || !topEl || !chatEl) return;

    const viewportH = window.innerHeight;
    const maxChatPx = Math.round((chatMaxVh / 100) * viewportH);

    // Clear constraints to measure natural content height
    chatEl.style.maxHeight = "";
    chatEl.style.height = "";
    chatEl.style.overflowY = "visible";

    const topH = topEl.offsetHeight;
    const chatNatural = Math.max(chatMinPx, chatEl.scrollHeight || chatEl.offsetHeight || 0);
    const chatTarget = Math.min(chatNatural, maxChatPx);

    setChatBoxHeight(chatTarget);

    const total = topH + gap + chatTarget + containerPad * 2;
    if (total <= viewportH) setMode("center");
    else setMode("pinned");
  };

  useLayoutEffect(() => {
    measure();
  }, []);

  useEffect(() => {
    const onResize = () => measure();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <div ref={wrapRef} className={cn("min-h-screen w-full", className)}>
      {mode === "center" ? (
        // CENTERED BLOCK
        <div className="mx-auto max-w-7xl flex min-h-screen items-center justify-center px-6">
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
        // PINNED MODE — lock the grid to the viewport so only the top pane scrolls
        <div className="grid h-screen grid-rows-[1fr_auto]">
          <div className="overflow-y-auto">
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
