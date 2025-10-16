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
  // Side gutters (16px each) + safe areas → used to clamp widths
  const sideClamp =
    "calc(env(safe-area-inset-left, 0px) + env(safe-area-inset-right, 0px) + 32px)";

  return (
    <div
      className={cn(
        // 💡 Match CenterDock container: full height + min-h-0 so child overflow works
        "h-full w-full min-h-0 grid grid-rows-[minmax(0,1fr)_auto] overflow-x-hidden bg-white",
        className
      )}
    >
      {/* TOP = the ONLY scrolling area */}
      <div className="min-h-0 overflow-y-auto overflow-x-hidden">
        {/* use margins (not padding) and clamp inner width to avoid right-edge shave */}
        <div
          style={{
            marginLeft: "calc(env(safe-area-inset-left, 0px) + 16px)",
            marginRight: "calc(env(safe-area-inset-right, 0px) + 16px)",
          }}
        >
          <div
            className="w-full"
            style={{ maxWidth: `calc(100svw - ${sideClamp})`, overflowX: "hidden" }}
          >
            {top}
          </div>
        </div>
      </div>

      {/* BOTTOM = pinned row (no scroll); width clamped & safe-area respected */}
      <div
        className="bg-white border-t"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div
          style={{
            marginLeft: "calc(env(safe-area-inset-left, 0px) + 16px)",
            marginRight: "calc(env(safe-area-inset-right, 0px) + 16px)",
          }}
        >
          <div
            className="w-full"
            style={{
              maxWidth: `calc(100svw - ${sideClamp})`,
              // allow composer icons to render outside without being cut
              overflow: "visible",
            }}
          >
            {bottom}
          </div>
        </div>
      </div>
    </div>
  );
}
