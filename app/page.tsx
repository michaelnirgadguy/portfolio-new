// /app/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { getAllVideos } from "@/lib/videos";
import type { VideoItem } from "@/types/video";
import VideoCard from "@/components/VideoCard";
import VideoPlayer from "@/components/VideoPlayer";
import Chat from "@/components/Chat";
import { useSearchParams } from "next/navigation";


// Matches your stubbed /api/route payload
type Intent = "show_videos" | "show_portfolio" | "information" | "contact";
type RouterPayload = {
  intent: Intent;
  args?: { videoIds?: string[] };
  message: string;
};

export default function Home() {
  const allVideos = useMemo(() => getAllVideos(), []);
  const searchParams = useSearchParams();

  useEffect(() => {
    const id = searchParams.get("v");
    if (!id) return;
    const vid = allVideos.find((x) => x.id === id);
    if (vid) setSelected(vid);
  }, [searchParams, allVideos]);

  const [visibleThree, setVisibleThree] = useState<VideoItem[]>(() =>
    allVideos.slice(0, 3)
  );
  const [selected, setSelected] = useState<VideoItem | null>(null);
  const [systemMessage, setSystemMessage] = useState<string>("");
  const [showAll, setShowAll] = useState<boolean>(false); // NEW: full-gallery mode

  // helper: set grid to exactly these IDs, preserving given order
  function showThreeByIds(ids: string[]) {
    if (!Array.isArray(ids) || ids.length === 0) return;
    const byId = new Map(allVideos.map((v) => [v.id, v]));
    const ordered = ids.map((id) => byId.get(id)).filter(Boolean) as VideoItem[];
    if (ordered.length === 0) return;
    setSelected(null);
    setShowAll(false); // ensure we’re not in full view
    setVisibleThree(ordered.slice(0, 3));
  }

  // main dispatcher for router intents
  function dispatchFromRouter(payload: RouterPayload) {
    if (payload?.message) setSystemMessage(payload.message);

    switch (payload?.intent) {
      case "show_videos": {
        const ids = payload.args?.videoIds ?? [];
        if (ids.length) showThreeByIds(ids);
        return;
      }
      case "show_portfolio": {
        // Show full gallery (replaces the 3 picks)
        setSelected(null);
        setShowAll(true);
        return;
      }
      case "information":
      case "contact": {
        // message already shown; no layout change here (yet)
        return;
      }
      default:
        return;
    }
  }

  // Expose a SINGLE global sink the router transport can call.
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
  }, [allVideos]);

  const gridVideos = showAll ? allVideos : visibleThree;

  return (
    <main className="mx-auto max-w-5xl p-6 space-y-6">
      <h1 className="text-2xl font-semibold">
        {showAll ? "All Videos" : "Inline Player + Picks"}
      </h1>

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

      {/* Thumbnails grid (either 3 picks or full gallery) */}
      <section>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {gridVideos.map((v) => (
            <VideoCard key={v.id} video={v} onSelect={setSelected} />
          ))}
        </div>
      </section>

      {/* Chat is just UI; it doesn't own intents */}
      <Chat />
    </main>
  );
}
