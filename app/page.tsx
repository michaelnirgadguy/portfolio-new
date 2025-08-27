// /app/page.tsx
"use client";

/**
 * Coordinator:
 * - URL ?v=<id> is the ONLY source of truth for selected video
 * - Chat dispatches intents → update URL or grid accordingly
 * - Top pane renders either VideoSection (selected) OR VideoGrid (N items)
 * - Layout via CenterDock: center when it fits, else pin chat at bottom
 */

import { useEffect, useMemo, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getAllVideos } from "@/lib/videos";
import type { VideoItem } from "@/types/video";
import VideoSection from "@/components/VideoSection";
import VideoGrid from "@/components/VideoGrid";
import Chat from "@/components/Chat";
import CenterDock from "@/components/CenterDock";

// Router intents
type Intent =
  | "show_videos"
  | "show_portfolio"
  | "information"
  | "contact"
  | "navigate_video";

type RouterPayload = {
  intent: Intent;
  args?: { videoIds?: string[] };
  message?: string;
};

export default function Home() {
  return (
    <Suspense fallback={null}>
      <HomeInner />
    </Suspense>
  );
}

function HomeInner() {
  const router = useRouter();
  const sp = useSearchParams();

  // Dataset → index
  const allVideos = useMemo(() => getAllVideos(), []);
  const byId = useMemo(() => new Map(allVideos.map((v) => [v.id, v])), [allVideos]);

  // URL is the single source of truth
  const selectedId = sp.get("v");
  const selected: VideoItem | null = selectedId ? byId.get(selectedId) ?? null : null;

  // Grid list (can be 3 or many depending on intent)
  const [visibleGrid, setVisibleGrid] = useState<VideoItem[]>(() =>
    allVideos.slice(0, 3)
  );

  const topRef = useRef<HTMLDivElement | null>(null);

  // --- URL helpers ---
  function replaceQuery(next: URLSearchParams) {
    const qs = next.toString();
    router.replace(qs ? `?${qs}` : "?", { scroll: false });
  }

  function setSelectedId(id: string | null) {
    const next = new URLSearchParams(sp.toString());
    if (id) next.set("v", id);
    else next.delete("v");
    replaceQuery(next);
    topRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  // --- UI helpers ---
  function showByIds(ids: string[], cap?: number) {
    if (!Array.isArray(ids) || !ids.length) return;
    const ordered = ids.map((id) => byId.get(id)).filter(Boolean) as VideoItem[];
    if (!ordered.length) return;
    setSelectedId(null); // clear selection
    setVisibleGrid(typeof cap === "number" ? ordered.slice(0, cap) : ordered);
  }

  function playFirst(ids: string[]) {
    const first = ids.find((id) => byId.has(id));
    if (!first) return;
    setSelectedId(first);
  }

  // === Intent dispatcher ===
  function dispatchFromRouter(payload: RouterPayload) {
    if (!payload || !payload.intent) return;

    switch (payload.intent) {
      case "show_videos": {
        const ids = payload.args?.videoIds ?? [];
        if (ids.length === 1) playFirst(ids);
        else if (ids.length > 1) showByIds(ids, 3); // cap curated suggestions to 3
        return;
      }
      case "show_portfolio": {
        // portfolio can be many (e.g., all)
        setSelectedId(null);
        setVisibleGrid(allVideos); // show full list (adjust later if you prefer a subset)
        return;
      }
      case "navigate_video": {
        const ids = payload.args?.videoIds ?? [];
        if (ids.length) playFirst(ids);
        return;
      }
      case "information":
      case "contact": {
        // Chat renders the text; no surface change needed.
        return;
      }
      default:
        return;
    }
  }

  // Global sink so Chat (or any child) can deliver router payloads
  useEffect(() => {
    (globalThis as any).routerSink = {
      deliver: (payload: RouterPayload) => {
        try {
          dispatchFromRouter(payload);
        } catch (e) {
          console.error("routerSink.deliver error:", e);
        }
      },
    };
    return () => {
      if ((globalThis as any).routerSink) (globalThis as any).routerSink = undefined;
    };
  }, [allVideos, byId, sp]);

  // Callback used by <Chat />
  function handleChatIntent(intent: Intent, args?: { videoIds?: string[] }) {
    dispatchFromRouter({ intent, args });
  }

  // --- Top pane: either the selected player OR a grid (3 or many) ---
  const TopPane = (
    <div ref={topRef} className="space-y-6">
      {selected ? (
        <VideoSection video={selected} />
      ) : (
        <VideoGrid
          videos={visibleGrid}
          onSelectId={(id) => setSelectedId(id)}
        />
      )}
    </div>
  );

  // --- Chat (let CenterDock manage size/overflow) ---
  const ChatPane = <Chat onIntent={handleChatIntent} />;

  return <CenterDock top={TopPane} chat={ChatPane} />;
}
