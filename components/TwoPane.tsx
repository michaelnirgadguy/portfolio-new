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
  // Side gutters (16px each) + safe areas. We use them to clamp widths explicitly.
  const sideClamp =
    "calc(env(safe-area-inset-left, 0px) + env(safe-area-inset-right, 0px) + 32px)";

  return (
    <div
      className={cn(
        "min-h-[100svh] grid grid-rows-[1fr_auto] bg-white overflow-x-hidden",
        className
      )}
    >
      {/* Scrollable top area */}
      <div className="overflow-y-auto overflow-x-hidden">
        {/* Use margins (not padding) around a width-clamped inner container */}
        <div
          style={{
            marginLeft: "calc(env(safe-area-inset-left, 0px) + 16px)",
            marginRight: "calc(env(safe-area-inset-right, 0px) + 16px)",
          }}
        >
          <div
            // Anything sized as 100vw/w-screen inside here gets clamped to viewport minus gutters
            className="w-full"
            style={{
              maxWidth: `calc(100svw - ${sideClamp})`,
              // If a child forces wider, keep it centered and clipped
              overflowX: "hidden",
            }}
          >
            {top}
          </div>
        </div>
      </div>

      {/* Pinned chat dock */}
      <div
        className="border-t bg-white sticky bottom-0"
        style={{
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        <div
          style={{
            marginLeft: "calc(env(safe-area-inset-left, 0px) + 16px)",
            marginRight: "calc(env(safe-area-inset-right, 0px) + 16px)",
          }}
        >
          <div
            className="max-h-[45svh] overflow-y-auto overflow-x-hidden w-full"
            style={{
              maxWidth: `calc(100svw - ${sideClamp})`,
            }}
          >
            {bottom}
          </div>
        </div>
      </div>
    </div>
  );
}
