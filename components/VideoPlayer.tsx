// /components/VideoPlayer.tsx
"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  url: string; // Bunny iframe URL or YouTube URL
  title?: string;
  className?: string;
  autoplay?: boolean;
};

type Flags = {
  isPlaying: boolean;
  playedAtLeast10s: boolean;
  reachedMidpoint: boolean;
  isMuted: boolean;
  stopped: boolean;
  ended: boolean;
};

function extractYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return u.pathname.slice(1) || null;
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return v;
      const parts = u.pathname.split("/");
      const i = parts.indexOf("embed");
      if (i >= 0 && parts[i + 1]) return parts[i + 1];
    }
    return null;
  } catch {
    return null;
  }
}

const initialFlags: Flags = {
  isPlaying: false,
  playedAtLeast10s: false,
  reachedMidpoint: false,
  isMuted: false,
  stopped: false,
  ended: false,
};

export default function VideoPlayer({ url, title, className, autoplay }: Props) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [flags, setFlags] = useState<Flags>(initialFlags);

  // Refs to avoid stale closures
  const durationRef = useRef<number | null>(null);
  const lastLoggedSecondRef = useRef<number | null>(null);
  const hasStartedRef = useRef(false);
  const isPlayingRef = useRef(false);
  const endedRef = useRef(false);
  const played10Ref = useRef(false);
  const midpointRef = useRef(false);

  // Reset when URL changes
  useEffect(() => {
    setFlags(initialFlags);
    setLog([]);
    durationRef.current = null;
    lastLoggedSecondRef.current = null;
    hasStartedRef.current = false;
    isPlayingRef.current = false;
    endedRef.current = false;
    played10Ref.current = false;
    midpointRef.current = false;
  }, [url]);

  // Build src
  let src: string | null = null;

  if (url.includes("iframe.mediadelivery.net")) {
    src = url;
    // if (autoplay) src += (url.includes("?") ? "&" : "?") + "autoplay=1&muted=1";
  } else {
    const id = extractYouTubeId(url);
    if (!id) return null;
    src = `https://www.youtube.com/embed/${id}${
      autoplay ? "?autoplay=1&mute=1" : ""
    }`;
  }

  const appendLog = (msg: string) => {
    const t = new Date().toISOString().split("T")[1].slice(0, 8);
    setLog((prev) => [...prev.slice(-30), `${t}  ${msg}`]);
  };

  const updateFlags = (partial: Partial<Flags>) => {
    setFlags((prev) => ({ ...prev, ...partial }));
  };

  // Load Bunny player.js script
  useEffect(() => {
    if (typeof window === "undefined") return;

    if ((window as any).playerjs) {
      setScriptLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "//assets.mediadel
