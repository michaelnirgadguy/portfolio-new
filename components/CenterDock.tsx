// components/CenterDock.tsx
"use client";

import { ReactNode, useEffect, useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * CenterDock
 * - If (top + chat) fits -> center as one block (chat flush under top).
 * - If it doesn't fit -> fall back to pinned-bottom chat with scrollable top.
 */
export default function CenterDock({
  top,
  chat,
  className,
  chatMinVh = 40,     // chat’s minimum height in viewport percentage
  gap = 24,           // vertical gap between top and chat, in px
  containerPad = 24,  // safe padding in px for centering calculations
}: {
  top: ReactNode;
  chat: ReactNode;
  className?: string;
  chatMinVh?: number;
  gap?: number;
  containerPad?: number;
}) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const topRef = useRef<HTMLDivElement | null>(null);
  const chatRef = useRef<HTMLDivElement | null>(null);

  const [mode, setMode] = useState<"center" | "pinned">("center");

  // Recompute on resize and content changes
  const recompute = () => {
    const wrap = wrapRef.current;
    const topEl = topRef.current;
    const chatEl = chatRef.current;
    if (!wrap || !topEl || !chatEl) return;

    const viewportH = window.innerHeight;
    // Chat should have at least chatMinVh of height in center mode
    const minChatPx = Math.round((chatMinVh / 100) * viewportH);

    // Temporarily measure natural heights (remove constraints)
    chatEl.style.maxHeight = "";
    chatEl.style.height = "";
    chatEl.style.overflowY = "visible";

    // Measure combined natural height
    const total = topEl.offsetHeight + gap + Math.max(minChatPx, chatEl.offsetHeight) + containerPad * 2;

    // Decide mode
    if (total <= viewportH) {
      setMode("center");
    } else {
      setMode("pinned");
    }
  };

  useLayoutEffect(() => {
    recompute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onResize = () => recompute();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={wrapRef} className={cn("min-h-screen w-full", className)}>
      {mode === "center" ? (
        // CENTERED BLOCK: the pair is treated as one vertically centered group.
        <div className="mx-auto max-w-5xl flex min-h-screen items-center justify-center px-6">
          <div className="w-full">
            <div ref={topRef}>{top}</div>
            <div style={{ height: gap }} />
            <div
              ref={chatRef}
              className="rounded-t-xl border bg-white"
              style={{
                minHeight: `min(60vh, max(${chatMinVh}vh, 240px))`,
                // chat content scrolls internally if it overflows
                overflowY: "auto",
              }}
            >
              <div className="p-4">{chat}</div>
            </div>
          </div>
        </div>
      ) : (
        // PINNED MODE: top scrolls, chat pinned to viewport bottom.
        <div className="grid min-h-screen grid-rows-[1fr_auto]">
          <div className="overflow-y-auto">
            <div className="mx-auto max-w-5xl px-6 py-6">
              <div ref={topRef}>{top}</div>
              <div style={{ height: gap }} />
            </div>
          </div>
          <div className="border-t bg-white">
            <div className="mx-auto max-w-5xl px-6 py-4">
              <div
                ref={chatRef}
                className="max-h-[55vh] overflow-y-auto"
                style={{ minHeight: `${chatMinVh}vh` }}
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
