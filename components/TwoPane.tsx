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
        <div
          // Safe-area aware inline padding and clamps for rogue w-screen children
          className={cn(
            "w-full max-w-full",
            "[&_.w-screen]:w-full [&_.max-w-none]:max-w-full [&_img]:max-w-full [&_video]:max-w-full"
          )}
          style={{
            paddingLeft: "calc(env(safe-area-inset-left, 0px) + 16px)",
            paddingRight: "calc(env(safe-area-inset-right, 0px) + 16px)",
            paddingTop: "16px",
            paddingBottom: "16px",
          }}
        >
          {top}
        </div>
      </div>

      {/* Pinned chat dock */}
      <div
        className="border-t bg-white sticky bottom-0"
        style={{
          // safe areas for iOS home indicator + side insets
          paddingBottom: "calc(env(safe-area-inset-bottom, 0px))",
        }}
      >
        <div
          className={cn(
            "w-full max-w-full",
            "[&_.w-screen]:w-full [&_.max-w-none]:max-w-full [&_img]:max-w-full [&_video]:max-w-full"
          )}
          style={{
            paddingLeft: "calc(env(safe-area-inset-left, 0px) + 16px)",
            paddingRight: "calc(env(safe-area-inset-right, 0px) + 16px)",
            paddingTop: "12px",
            paddingBottom: "12px",
          }}
        >
          <div className="max-h-[45svh] overflow-y-auto overflow-x-hidden">
            {bottom}
          </div>
        </div>
      </div>
    </div>
  );
}
