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
        // 2 rows: top grows & scrolls, bottom stays visible
        "min-h-[100svh] grid grid-rows-[minmax(0,1fr)_auto] bg-white overflow-x-hidden",
        className
      )}
    >
      {/* Top: the ONLY scrolling area */}
      <div className="overflow-y-auto overflow-x-hidden">
        <div
          // Margins create gutters; inner width is clamped (prevents right-edge shave)
          style={{
            marginLeft: "calc(env(safe-area-inset-left, 0px) + 16px)",
            marginRight: "calc(env(safe-area-inset-right, 0px) + 16px)",
          }}
        >
          <div
            className="w-full"
            style={{
              maxWidth: `calc(100svw - ${sideClamp})`,
              overflowX: "hidden",
            }}
          >
            {top}
          </div>
        </div>
      </div>

      {/* Bottom: pinned chat; no internal scroll so it never “fights” the page */}
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
            className="w-full"
            style={{
              // clamp width like the top, but allow overflow visible so icons aren’t clipped
              maxWidth: `calc(100svw - ${sideClamp})`,
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
