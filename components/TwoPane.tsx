// components/TwoPane.tsx
"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export default function TwoPane({
  top,
  bottom,
  className,
}: {
  top: ReactNode;
  bottom: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        // Full viewport, vertical split, clip horizontal overflow
        "min-h-[100svh] grid grid-rows-[1fr_auto] bg-white overflow-x-hidden",
        className
      )}
    >
      {/* Scrollable top area */}
      <div className="overflow-y-auto overflow-x-hidden">
        <div className="max-w-full px-4">{top}</div>
      </div>

      {/* Pinned chat dock */}
      <div
        className="border-t bg-white sticky bottom-0"
        style={{
          paddingBottom: "env(safe-area-inset-bottom)", // safe area for iOS
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
