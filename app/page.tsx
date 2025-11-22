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
import Act1 from "@/components/acts/Act1";
import { Acts } from "@/lib/acts";
import HamsterSection from "@/components/HamsterSection";
import Act3 from "@/components/acts/Act3"; // 👈 Act 3
import Header from "@/components/Header";

export default function Home() {
  return (
    <Suspense fallback={null}>
      <ActGate />
    </Suspense>
  );
}

function ActGate() {
  const [act, setAct] = useState<"none" | "1" | "2" | "all">(() => {
    if (typeof window !== "undefined") {
      Acts.applyDevOverridesFromLocation();
      return Acts.get();
    }
    return "none";
  });

  if (act === "none") {
    return <Act1 onDone={() => setAct("1")} />;
  }

 return (
  <>
    <Header />
    <div className="h-[calc(100vh-64px)] overflow-hidden">
      <HomeInner />
    </div>
  </>
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
  const [visibleGrid, setVisibleGrid] = useState<VideoItem[]>(() => allVideos);

  const topRef = useRef<HTMLDivElement | null>(null);

  // one-shot suppress flag for LLM-triggered opens
  const suppressOpenForIdRef = useRef<string | null>(null);

  // Hamster (Act 2) pane state
  const [hamster, setHamster] = useState<{
    srcBase: string;
    title: string;
    client: string;
    text: string;
  } | null>(null);

  // Act 3 state
  const [act3, setAct3] = useState<{ idea: string } | null>(null);

  // Remount Chat to pick up sessionStorage handoff
  const [chatKey, setChatKey] = useState(0);

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
    setHamster(null);    // if we’re showing a grid, hide hamster gag
    setAct3(null);       // hide act3 if any
    setSelectedId(null); // clear selection → grid
    setVisibleGrid(ordered); // LLM decides the count
  }

  function playFirst(ids: string[]) {
    const first = ids.find((id) => byId.has(id));
    if (!first) return;
    setHamster(null);
    setAct3(null);    // hide act3 if opening player
    setSelectedId(first);
  }

  // === Unified tool handler ===
  function onShowVideo(ids: string[]) {
    if (!ids?.length) return;
    suppressOpenForIdRef.current = ids.length === 1 ? ids[0] : null;
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
   //  full catalogue
      show_all_videos: () => {
        try {
          setHamster(null);
          setAct3(null);
          setSelectedId(null);
          setVisibleGrid(allVideos);
        } catch (e) {
          console.error("uiTool.show_all_videos error:", e);
        }
      },
  
      //  dark mode
      set_dark_mode: (enabled: boolean) => {
        try {
          document.documentElement.classList.toggle("dark", enabled);
        } catch (e) {
          console.error("uiTool.set_dark_mode error:", e);
        }
      } 
      
    };
    return () => {
      if ((globalThis as any).uiTool) (globalThis as any).uiTool = undefined;
    };
  }, [byId, sp]);

  // Notify Chat/LLM whenever a single video is opened (via click or ?v=)
  useEffect(() => {
    if (!selected) return;

    const suppressId = suppressOpenForIdRef.current;
    suppressOpenForIdRef.current = null;
    if (suppressId && suppressId === selected.id) return;

    try {
      (globalThis as any).dispatchLLMEvent?.({
        type: "video_opened",
        id: selected.id,
        url: selected.url,
      });
    } catch {}
  }, [selected]);

  // Listen to Mimsy custom events from Chat (Act 2 + Act 3)
  useEffect(() => {
    function onShowHamster(e: Event) {
      const detail = (e as CustomEvent)?.detail as {
        srcBase: string;
        title: string;
        client: string;
        text: string;
      };
      if (!detail) return;
      setAct3(null);     // hide act3 if showing act2
      setHamster(detail);
      setSelectedId(null);

      try {
        Acts.set("2");
      } catch {}
    }

    function onStartAct3(e: Event) {
      const detail = (e as CustomEvent)?.detail as { idea: string };
      setHamster(null);
      setSelectedId(null);
      setAct3(detail?.idea ? { idea: detail.idea } : null);
      try {
        Acts.set("all"); // journey completed
      } catch {}
    }

    window.addEventListener("mimsy-show-hamster" as any, onShowHamster as any);
    window.addEventListener("mimsy-start-act3" as any, onStartAct3 as any);
    return () => {
      window.removeEventListener("mimsy-show-hamster" as any, onShowHamster as any);
      window.removeEventListener("mimsy-start-act3" as any, onStartAct3 as any);
    };
  }, []);

  // 🔔 Act 3 exit → show full catalogue, remount Chat, scroll to top
  useEffect(() => {
    const onExit = () => {
      setAct3(null);                 // hide Act 3
      setHamster(null);              // ensure hamster gag is off
      setSelectedId(null);           // clear player selection
      setVisibleGrid(allVideos);     // full catalogue
      setChatKey((k) => k + 1);      // remount Chat → reads sessionStorage handoff
      topRef.current?.scrollIntoView({ behavior: "smooth" });
    };
    window.addEventListener("mimsy-exit-act3", onExit as any);
    return () => window.removeEventListener("mimsy-exit-act3", onExit as any);
  }, [allVideos]);

  // --- Top pane: act3 > hamster > selected player > grid ---
  const TopPane = (
    <div ref={topRef} className="space-y-6">
      {act3 ? (
        <Act3 idea={act3.idea} />
      ) : hamster ? (
        <HamsterSection
          srcBase={hamster.srcBase}
          title={hamster.title}
          client={hamster.client}
          text={hamster.text}
        />
      ) : selected ? (
        <VideoSection video={selected} />
      ) : (
        <VideoGrid videos={visibleGrid} onSelectId={(id) => setSelectedId(id)} />
      )}
    </div>
  );

  // Hide chat when Act 3 is active; give Chat a key so it remounts on handoff
  const ChatPane = act3 ? null : <Chat key={chatKey} onShowVideo={onShowVideo} />;

  return <CenterDock top={TopPane} chat={ChatPane} />;
}
