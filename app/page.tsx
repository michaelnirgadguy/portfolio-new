// /app/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getAllVideos } from "@/lib/videos";
import type { VideoItem } from "@/types/video";
import VideoCard from "@/components/VideoCard";
import VideoPlayer from "@/components/VideoPlayer";
import Chat from "@/components/Chat";

// Extend as we add more actions
type Intent = "show_videos" | "show_portfolio" | "information" | "contact" | "navigate_video" | "share_link";
type RouterPayload = {
  intent: Intent;
  args?: { videoIds?: string[] };
  message: string;
};

function DeepLink({
  allVideos,
  onPick,
}: {
  allVideos: VideoItem[];
  onPick: (v: VideoItem) => void;
}) {
  const sp = useSearchParams();
  useEffect(() => {
    const id = sp.get("v");
    if (!id) return;
    const vid = allVideos.find((x) => x.id === id);
    if (vid) onPick(vid);
  }, [sp, allVideos, onPick]);
  return null;
}

export default function Home() {
  const allVideos = useMemo(() => getAllVideos(), []);
  const byId = useMemo(() => new Map(allVideos.map((v) => [v.id, v])), [allVideos]);

  const [visibleThree, setVisibleThree] = useState<VideoItem[]>(() =>
    allVideos.slice(0, 3)
  );
  const [selected, setSelected] = useState<VideoItem | null>(null);
  const [systemMessage, setSystemMessage] = useState<string>("");
  const [showContact, setShowContact] = useState<boolean>(false);

  const topRef = useRef<HTMLDivElement | null>(null);

  // helper: set grid to exactly these IDs, preserving given order
  function showThreeByIds(ids: string[]) {
    if (!Array.isArray(ids) || ids.length === 0) return;
    const ordered = ids.map((id) => byId.get(id)).filter(Boolean) as VideoItem[];
    if (ordered.length === 0) return;
    setSelected(null);
    setVisibleThree(ordered.slice(0, 3));
    topRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  // helper: pick first matching ID and play inline
  function playFirst(ids: string[]) {
    const first = ids.find((id) => byId.has(id));
    if (!first) return;
    const vid = byId.get(first)!;
    setSelected(vid);
    topRef.current?.scrollIntoView({ behavior: "smooth" });
    // update URL for deep-linking
    const url = new URL(window.location.href);
    url.searchParams.set("v", vid.id);
    history.replaceState(null, "", url.toString());
  }

  function copyShareLink(id?: string) {
    const currentId = id ?? selected?.id;
    if (!currentId) return false;
    const url = new URL(window.location.href);
    url.searchParams.set("v", currentId);
    const link = url.toString();
    try {
      navigator.clipboard.writeText(link);
      setSystemMessage("Link copied to clipboard.");
      return true;
    } catch {
      setSystemMessage(link); // fallback: at least show it
      return false;
    }
  }

  // main dispatcher for router intents
  function dispatchFromRouter(payload: RouterPayload) {
    if (payload?.message) setSystemMessage(payload.message);
    setShowContact(false); // reset unless asked again

    switch (payload?.intent) {
      case "show_videos": {
        const ids = payload.args?.videoIds ?? [];
        if (ids.length === 1) {
          // single strong pick → play it
          playFirst(ids);
        } else if (ids.length > 1) {
          showThreeByIds(ids);
        }
        return;
      }
      case "show_portfolio": {
        setSelected(null);
        // Show more than 3 so the change is visible
        setVisibleThree(allVideos.slice(0, 6));
        return;
      }
      case "navigate_video": {
        const ids = payload.args?.videoIds ?? [];
        if (ids.length) playFirst(ids);
        return;
      }
      case "share_link": {
        const ids = payload.args?.videoIds ?? [];
        // Prefer explicit ID; else share currently selected
        copyShareLink(ids[0]);
        return;
      }
      case "contact": {
        setShowContact(true);
        return;
      }
      case "information": {
        // message already shown by chat UI; no layout change needed
        return;
      }
      default:
        return;
    }
  }

  // Global sink for router payloads (Chat will call window.routerSink.deliver)
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
  }, [allVideos, byId]);

  return (
    <main ref={topRef} className="mx-auto max-w-5xl p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Inline Player + 3 Thumbnails (Test)</h1>

      {/* Optional system message surface (if Chat doesn't already render it) */}
      {systemMessage ? (
        <div className="rounded-lg border p-3 text-sm text-gray-800 bg-gray-50">
          {systemMessage}
        </div>
      ) : null}

      {/* Contact panel (revealed by `contact` intent) */}
      {showContact && (
        <div className="rounded-xl border p-4 bg-white shadow-sm">
          <div className="font-medium mb-1">Contact</div>
          <div className="text-sm text-gray-700">
            Email:{" "}
            <a className="underline" href="mailto:hello@michael.ng">
              hello@michael.ng
            </a>
          </div>
          <button
            className="mt-3 inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
            onClick={() => copyShareLink()}
          >
            Copy link to this view
          </button>
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

      {/* Thumbnails grid */}
      <section>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visibleThree.map((v) => (
            <VideoCard key={v.id} video={v} onSelect={setSelected} />
          ))}
        </div>
      </section>

      {/* Chat owns the conversation UI; it posts to /api/route and calls routerSink.deliver */}
      <Chat />

      {/* Deep-link reader (wrapped in Suspense to satisfy Next.js) */}
      <Suspense fallback={null}>
        <DeepLink allVideos={allVideos} onPick={(v) => setSelected(v)} />
      </Suspense>
    </main>
  );
}
