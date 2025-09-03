"use client";

/**
 * Simple coordinator:
 * - URL ?v=<id> is the ONLY source of truth for selected video
 * - onShowVideo(ids): if 1 → player, if many → grid
 * - Global tool: globalThis.uiTool.show_videos(ids)
 */

import { useEffect, useMemo, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getAllVideos } from "@/lib/videos";
import type { VideoItem } from "@/types/video";
import VideoSection from "@/components/VideoSection";
import VideoGrid from "@/components/VideoGrid";
import Chat from "@/components/Chat";
import CenterDock from "@/components/CenterDock";

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

  // Grid list
  const [visibleGrid, setVisibleGrid] = useState<VideoItem[]>(() => allVideos.slice(0, 3));

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
  function showByIds(ids: string[]) {
    if (!Array.isArray(ids) || !ids.length) return;
    const ordered = ids.map((id) => byId.get(id)).filter(Boolean) as VideoItem[];
    if (!ordered.length) return;
    setSelectedId(null); // clear selection → grid
    setVisibleGrid(ordered); // LLM decides the count
  }

  function playFirst(ids: string[]) {
    const first = ids.find((id) => byId.has(id));
    if (!first) return;
    setSelectedId(first);
  }

  // === Unified tool handler ===
  function onShowVideo(ids: string[]) {
    if (!ids?.length) return;
    if (ids.length === 1) playFirst(ids);
    else showByIds(ids);
  }

  // Global UI tool for children (e.g., Chat)
  useEffect(() => {
    (globalThis as any).uiTool = {
      show_videos: (ids: string[]) => {
        try {
          onShowVideo(ids);
        } catch (e) {
          console.error("uiTool.show_videos error:", e);
        }
      },
    };
    return () => {
      if ((globalThis as any).uiTool) (globalThis as any).uiTool = undefined;
    };
  }, [byId, sp]);
  
  // Notify Chat/LLM whenever a single video is opened (via click or ?v=)
  useEffect(() => {
    if (!selected) return;
    try {
      (globalThis as any).dispatchLLMEvent?.({
        type: "video_opened",
        id: selected.id,
        url: selected.url,
      });
    } catch {}
  }, [selected]);

  // --- Top pane: either the selected player OR a grid ---
  const TopPane = (
    <div ref={topRef} className="space-y-6">
      {selected ? (
        <VideoSection video={selected} />
      ) : (
        <VideoGrid videos={visibleGrid} onSelectId={(id) => setSelectedId(id)} />
      )}
    </div>
  );

  // --- Chat (new prop; will be used after Chat.tsx update) ---
  const ChatPane = <Chat onShowVideo={onShowVideo} />;

  return <CenterDock top={TopPane} chat={ChatPane} chatMaxVh={72} />;
}
