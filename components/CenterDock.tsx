// components/CenterDock.tsx
"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  top: ReactNode;
  chat: ReactNode;
  className?: string;
};

/**
 * Layout:
 * - Mobile: content on top, chat below (stacked).
 * - Desktop (md+): chat in a left column (~1/3), content in a right column (~2/3).
 *   Each column scrolls independently.
 */
export default function CenterDock({ top, chat, className }: Props) {
  return (
    <div
      className={cn(
        "min-h-[100svh] w-full bg-white text-black pt-12",
        "flex",
        className
      )}
    >

      <div className="flex h-full w-full flex-col md:flex-row">
        {/* CONTENT – right on desktop, top on mobile */}
        <div className="order-1 h-1/2 min-h-0 overflow-y-auto px-4 py-4 md:order-2 md:h-full md:flex-1 md:px-6 md:py-6">
          {top}
        </div>

        {/* CHAT – left column on desktop, bottom on mobile */}
        <aside className="order-2 h-1/2 min-h-0 border-t border-gray-200 bg-white md:order-1 md:h-full md:w-1/3 md:border-t-0 md:border-r">
          <div
            className="flex h-full flex-col overflow-hidden"
            style={{
              paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 8px)",
            }}
          >
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {chat}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
