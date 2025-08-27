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
        "min-h-screen grid",
        "grid-rows-[1fr_auto] bg-white",
        className
      )}
    >
      {/* Scrollable content area */}
      <div className="overflow-y-auto">
        <div className="mx-auto max-w-5xl p-6">{top}</div>
      </div>

      {/* Pinned bottom dock */}
      <div className="border-t bg-white sticky bottom-0">
        <div className="mx-auto max-w-5xl p-4">{bottom}</div>
      </div>
    </div>
  );
}
