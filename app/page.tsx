// /app/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { getAllVideos } from "@/lib/videos";
import type { VideoItem } from "@/types/video";
import VideoCard from "@/components/VideoCard";
import VideoPlayer from "@/components/VideoPlayer";
import Chat from "@/components/Chat";

// Match the stub router payload
type Intent = "show_videos" | "show_portfolio" | "information" | "contact";
type RouterPayload = {
  intent: Intent;
  args?: { videoIds?: string[] };
  message: string;
};

export default function Home() {
  const allVideos = useMemo(() => getAllVideos(), []);
  const [visibleThree, setVisibleThree] = useState<VideoItem[]>(
    () => allVideos.slice(0, 3)
  );
  const [selected, setSelected] = useState<VideoItem | null>(null);
  const [systemMessage, setSystemMessage] = useState<string>("");

  // --- helper: set grid to exactly these IDs, preserving order ---
  function showThreeByIds(ids: string[]) {
    if (!Array.isArray(ids) || ids.length === 0) return;
    const byId = new Map(allVideos.map((v) => [v.id, v]));
    const ordered = ids
      .map((id) => byId.get(id))
      .filter(Boolean) as VideoItem[];
    if (ordered.length === 0) return;
    setSelected(null);
    setVisibleThree(ordered.slice(0, 3));
  }

  // --- main dispatcher the Router payload goes through ---
  function dispatchFromRouter(payload: RouterPayload) {
    // always show router message in the UI (top notice)
    if (payload.message) setSystemMessage(payload.message);

    switch (payload.intent) {
      case "show_videos": {
        const ids = payload.args?.videoIds ?? [];
        if (ids.length) showThreeByIds(ids);
        return;
      }
      case "show_portfolio": {
        // TODO: implement full grid view; for now show first 4 as a stub
        setSelected(null);
        setVisibleThree(allVideos.slice(0, 4));
        return;
      }
      case "information":
      case "contact": {
        // Message already shown via systemMessage; no UI change yet
        return;
      }
      default:
        return;
    }
  }

  // Expose a single entry point for other components to call:
  // window.pageController.dispatch(payload)
  useEffect(() => {
    (window as any).pageController ??= {};
    (window as any).pageController.dispatch = dispatchFromRouter;
    return () => {
      if ((window as any).pageController) {
        (window as any).pageController.dispatch = undefined;
      }
    };
  }, [allVideos]);

  return (
    <main className="mx-auto max-w-5xl p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Inline Player + 3 Thumbnails (Test)</h1>

      {/* Router/system message (optional) */}
      {systemMessage && (
        <div className="rounded-lg border p-3 text-sm text-gray-700 bg-gray-50">
          {systemMessage}
        </div>
      )}

      {/* Big inline player appears after a thumbnail is clicked */}
      {selected && (
        <section className="space-y-3">
          <h2 className="text-xl font-medium">{selected.title}</h2>
          <div className="text-gray-500">{selected.client}</div>
          <VideoPlayer url={selected.url} title={selected.title} />
          {selected.description && (
            <p className="text-gray-700 leading-relaxed">{selected.description}</p>
          )}
        </section>
      )}

      {/* Three clickable thumbnails; clicking one sets selected */}
      <section>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visibleThree.map((v) => (
            <VideoCard key={v.id} video={v} onSelect={setSelected} />
          ))}
        </div>
      </section>

      {/* Chat (still dumb UI). After Chat posts to /api/route and gets a payload,
          it should call: window.pageController?.dispatch(payload); */}
      <Chat />
    </main>
  );
}
