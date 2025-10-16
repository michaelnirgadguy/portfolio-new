// components/TwoPane.tsx
"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export default function TwoPane({
  top,
  bottom,
  className,
}: {
  top: ReactNode;     // video OR grid
  bottom: ReactNode;  // pinned chat dock
  className?: string;
}) {
  return (
    <div
      className={cn(
        // 2-row page: content scrolls, chat stays visible
        "min-h-[100svh] grid grid-rows-[1fr_auto] bg-white",
        className
      )}
    >
      {/* Scrollable content area */}
      <div className="overflow-y-auto">
        <div className="max-w-full px-4 overflow-x-hidden">{top}</div>
      </div>

      {/* Pinned bottom dock with safe-area + height cap */}
      <div
        className="border-t bg-white sticky bottom-0"
        style={{
          // Respect iOS home indicator
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <div className="max-w-full px-4">
          <div className="max-h-[45svh] overflow-y-auto overflow-x-hidden">
            {bottom}
          </div>
        </div>
      </div>
    </div>
  );
}
