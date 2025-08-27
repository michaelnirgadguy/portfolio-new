// /app/page.tsx
"use client";

/**
 * Page coordinator:
 * - URL ?v=<id> is the ONLY source of truth for selected video
 * - Chat dispatches intents → we update URL or grid accordingly
 * - Visual sections are split into components (VideoSection, VideoGrid)
 */

import { useEffect, useMemo, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getAllVideos } from "@/lib/videos";
import type { VideoItem } from "@/types/video";
import VideoSection from "@/components/VideoSection";
import VideoGrid from "@/components/VideoGrid";
import Chat from "@/components/Chat";

// Allowed intents from the router (centralized here for now)
type Intent =
  | "show_videos"
  | "show_portfolio"
  | "information"
  | "contact"
  | "navigate_video"

type RouterPayload = {
  intent: Intent;
  args?: { videoIds?: string[] };
  message?: string;
};

// Suspense wrapper is required when using useSearchParams in Client Components.
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

  // Dataset (static JSON) → map for fast lookup
  const allVideos = useMemo(() => getAllVideos(), []);
  const byId = useMemo(() => new Map(allVideos.map((v) => [v.id, v])), [allVideos]);

  // URL is the single source of truth for the selection
  const selectedId = sp.get("v");
  const selected: VideoItem | null = selectedId ? byId.get(selectedId) ?? null : null;

  // Grid state only (not selection)
  const [visibleThree, setVisibleThree] = useState<VideoItem[]>(
    () => allVideos.slice(0, 3)
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
  function showThreeByIds(ids: string[]) {
    if (!Array.isArray(ids) || !ids.length) return;
    const ordered = ids.map((id) => byId.get(id)).filter(Boolean) as VideoItem[];
    if (!ordered.length) return;
    setSelectedId(null); // clear selection via URL
    setVisibleThree(ordered.slice(0, 3));
  }

  function playFirst(ids: string[]) {
    const first = ids.find((id) => byId.has(id));
    if (!first) return;
    setSelectedId(first);
  }


  // === Intent dispatcher (single place that mutates URL/grid) ===
  function dispatchFromRouter(payload: RouterPayload) {
    if (!payload || !payload.intent) return;
    console.log("dispatchFromRouter →", payload);

    switch (payload.intent) {
      case "show_videos": {
        const ids = payload.args?.videoIds ?? [];
        if (ids.length === 1) playFirst(ids);
        else if (ids.length > 1) showThreeByIds(ids);
        return;
      }
      case "show_portfolio": {
        setSelectedId(null);
        setVisibleThree(allVideos.slice(0, 6));
        return;
      }
      case "navigate_video": {
        const ids = payload.args?.videoIds ?? [];
        if (ids.length) playFirst(ids);
        return;
      }
      case "information":
      case "contact": {
        // Chat renders the assistant text; no extra surface here.
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

  return (
    <main ref={topRef} className="mx-auto max-w-5xl p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Inline Player + 3 Thumbnails (Test)</h1>

      {/* Selected video section shows ONLY when ?v=<id> is present */}
      {selected && <VideoSection video={selected} />}

      {/* Thumbnails grid */}
      <section>
        <VideoGrid videos={visibleThree} onSelectId={(id) => setSelectedId(id)} />
      </section>

      {/* Chat is the single assistant message surface */}
      <Chat onIntent={handleChatIntent} />
    </main>
  );
}
