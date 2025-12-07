// /components/VideoPlayer.tsx
"use client";

import { useEffect, useRef } from "react";

type Props = {
  url: string; // Bunny iframe URL or YouTube URL
  title?: string;
  className?: string;
  autoplay?: boolean;

  // STATE (live)
  onPlayingChange?: (isPlaying: boolean) => void;

  // EVENTS (one-off / edge transitions)
  onPlayed10s?: () => void;
  onReachedMidpoint?: () => void;
  onStoppedEarly?: () => void;
  onEnded?: () => void;
  onMutedChange?: (muted: boolean) => void;
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

export default function VideoPlayer({
  url,
  title,
  className,
  autoplay,
  onPlayingChange,
  onPlayed10s,
  onReachedMidpoint,
  onStoppedEarly,
  onEnded,
  onMutedChange,
}: Props) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // Internal refs for Bunny player state
  const durationRef = useRef<number | null>(null);
  const hasStartedRef = useRef(false);
  const isPlayingRef = useRef(false);
  const endedRef = useRef(false);
  const played10Ref = useRef(false);
  const midpointRef = useRef(false);
  const lastMutedRef = useRef<boolean | null>(null);

  // Build src
  let src: string | null = null;

  const isBunny = url.includes("iframe.mediadelivery.net");

  if (isBunny) {
    src = url;
    // If you want autoplay for Bunny later, you can add query params here.
    // if (autoplay) src += (url.includes("?") ? "&" : "?") + "autoplay=1&muted=1";
  } else {
    const id = extractYouTubeId(url);
    if (!id) return null;
    src = `https://www.youtube.com/embed/${id}${
      autoplay ? "?autoplay=1&mute=1" : ""
    }`;
  }

  // Reset internal refs when URL changes
  useEffect(() => {
    durationRef.current = null;
    hasStartedRef.current = false;
    isPlayingRef.current = false;
    endedRef.current = false;
    played10Ref.current = false;
    midpointRef.current = false;
    lastMutedRef.current = null;
    onPlayingChange?.(false);
  }, [url, onPlayingChange]);

  // Load Bunny player.js and wire events
  useEffect(() => {
    if (!isBunny) return;
    if (typeof window === "undefined") return;

    const w = window as any;

    const ensureScript = () =>
      new Promise<void>((resolve) => {
        if (w.playerjs && w.playerjs.Player) {
          resolve();
          return;
        }
        const existing = document.querySelector<HTMLScriptElement>(
          'script[src="//assets.mediadelivery.net/playerjs/playerjs-latest.min.js"]'
        );
        if (existing) {
          existing.addEventListener("load", () => resolve(), { once: true });
          return;
        }
        const script = document.createElement("script");
        script.src = "//assets.mediadelivery.net/playerjs/playerjs-latest.min.js";
        script.async = true;
        script.onload = () => resolve();
        document.body.appendChild(script);
      });

    let player: any | null = null;

    let cancelled = false;

    ensureScript().then(() => {
      if (cancelled) return;
      if (!iframeRef.current) return;
      if (!w.playerjs || !w.playerjs.Player) return;

      player = new w.playerjs.Player(iframeRef.current);

      const handlePlayOrPlaying = () => {
        hasStartedRef.current = true;
        isPlayingRef.current = true;
        endedRef.current = false;
        onPlayingChange?.(true);
      };

      const handlePause = () => {
        isPlayingRef.current = false;
        onPlayingChange?.(false);

        // "stopped early" = paused after playing started, before end
        if (hasStartedRef.current && !endedRef.current) {
          onStoppedEarly?.();
        }
      };

      const handleEnded = () => {
        isPlayingRef.current = false;
        endedRef.current = true;
        onPlayingChange?.(false);
        onEnded?.();
      };

      const handleTimeUpdate = (data: any) => {
        if (!data || typeof data.seconds !== "number") return;
        const seconds = data.seconds as number;

        // Track duration if provided
        if (typeof data.duration === "number" && data.duration > 0) {
          durationRef.current = data.duration;
        }

        // Event: played at least 10s (fire once)
        if (!played10Ref.current && seconds >= 10) {
          played10Ref.current = true;
          onPlayed10s?.();
        }

        // Event: reached midpoint (fire once)
        const duration = durationRef.current;
        if (
          duration &&
          duration > 0 &&
          !midpointRef.current &&
          seconds >= duration / 2
        ) {
          midpointRef.current = true;
          onReachedMidpoint?.();
        }

        // Poll mute state (Bunny doesn't emit mute events)
        if (typeof player.getMuted === "function") {
          try {
            player.getMuted((muted: boolean) => {
              if (lastMutedRef.current === null) {
                lastMutedRef.current = muted;
                onMutedChange?.(muted);
              } else if (lastMutedRef.current !== muted) {
                lastMutedRef.current = muted;
                onMutedChange?.(muted);
              }
            });
          } catch {
            // ignore
          }
        }
      };

      // Attach listeners
      player.on("play", handlePlayOrPlaying);
      player.on("playing", handlePlayOrPlaying);
      player.on("pause", handlePause);
      player.on("ended", handleEnded);
      player.on("timeupdate", handleTimeUpdate);

      // On ready, detect autoplay & initial mute
      player.on("ready", () => {
        if (typeof player.getPaused === "function") {
          try {
            player.getPaused((paused: boolean) => {
              if (!paused) {
                handlePlayOrPlaying();
              }
            });
          } catch {
            // ignore
          }
        }

        if (typeof player.getMuted === "function") {
          try {
            player.getMuted((muted: boolean) => {
              lastMutedRef.current = muted;
              onMutedChange?.(muted);
            });
          } catch {
            // ignore
          }
        }
      });
    });

    return () => {
      cancelled = true;
      try {
        if (player && typeof player.destroy === "function") {
          player.destroy();
        }
      } catch {
        // ignore
      }
    };
  }, [
    isBunny,
    url,
    onPlayingChange,
    onPlayed10s,
    onReachedMidpoint,
    onStoppedEarly,
    onEnded,
    onMutedChange,
  ]);

  return (
    <div className={`w-full ${className ?? ""}`}>
      <div className="aspect-video overflow-hidden rounded-xl shadow">
        <iframe
          ref={iframeRef}
          src={src ?? undefined}
          title={title ?? "Video player"}
          className="w-full h-full"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    </div>
  );
}
