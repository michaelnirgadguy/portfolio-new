// /app/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getAllVideos } from "@/lib/videos";
import type { VideoItem } from "@/types/video";
import VideoCard from "@/components/VideoCard";
import VideoPlayer from "@/components/VideoPlayer";
import Chat from "@/components/Chat";
import VideoSection from "@/components/VideoSection"

// Allowed intents from the router
type Intent =
  | "show_videos"
  | "show_portfolio"
  | "information"
  | "contact"
  | "navigate_video"
  | "share_link";

type RouterPayload = {
  intent: Intent;
  args?: { videoIds?: string[] };
  message?: string;
};

// --- Suspense wrapper to satisfy useSearchParams rule ---
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

  const allVideos = useMemo(() => getAllVideos(), []);
  const byId = useMemo(() => new Map(allVideos.map((v) => [v.id, v])), [allVideos]);

  // URL is the single source of truth for selection
  const selectedId = sp.get("v");
  const selected: VideoItem | null = selectedId ? byId.get(selectedId) ?? null : null;

  // Grid state only (not selection)
  const [visibleThree, setVisibleThree] = useState<VideoItem[]>(() =>
    allVideos.slice(0, 3)
  );
  const [showContact, setShowContact] = useState<boolean>(false);

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

  function copyShareLink(id?: string) {
    const currentId = id ?? selectedId ?? undefined;
    if (!currentId) return false;
    const url = new URL(window.location.href);
    url.searchParams.set("v", currentId);
    const link = url.toString();
    try {
      navigator.clipboard.writeText(link);
      return true;
    } catch {
      return false;
    }
  }

  // === Main dispatcher for router intents ===
  function dispatchFromRouter(payload: RouterPayload) {
    if (!payload || !payload.intent) return;
    console.log("dispatchFromRouter →", payload);
    setShowContact(false); // reset unless asked again

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
      case "share_link": {
        const ids = payload.args?.videoIds ?? [];
        copyShareLink(ids[0]);
        return;
      }
      case "contact": {
        setShowContact(true);
        return;
      }
      case "information": {
        // Chat displays the assistant message; no extra surface here.
        return;
      }
      default:
        return;
    }
  }

  // Global sink for router payloads (Chat may call window.routerSink.deliver)
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

  function handleChatIntent(intent: Intent, args?: { videoIds?: string[] }) {
    dispatchFromRouter({ intent, args });
  }

  return (
    <main ref={topRef} className="mx-auto max-w-5xl p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Inline Player + 3 Thumbnails (Test)</h1>

      {/* Contact panel */}
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

      {/* Inline player shows only when ?v=<id> is present */}
      {selected && <VideoSection video={selected} />}

      {/* Thumbnails grid */}
      <section>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visibleThree.map((v) => (
            <VideoCard key={v.id} video={v} onSelect={() => setSelectedId(v.id)} />
          ))}
        </div>
      </section>

      {/* Chat is the single assistant message surface */}
      <Chat onIntent={handleChatIntent} />
    </main>
  );
}
