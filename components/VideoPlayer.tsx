// /components/VideoPlayer.tsx
"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

type Props = {
  url: string; // Bunny iframe URL or YouTube URL
  title?: string;
  thumbnail?: string | null;
  className?: string;
  autoplay?: boolean;
  playerId?: string;

  // STATE (live)
  onPlayingChange?: (isPlaying: boolean) => void;

  // EVENTS (one-off / edge transitions)
  onPlayed5s?: () => void;
  onPlayed10s?: () => void;
  onReachedMidpoint?: () => void;
  onReachedNearEnd?: () => void;
  onEnded?: () => void;
  onMutedChange?: (muted: boolean) => void;
  onScrubForward?: (deltaSeconds: number) => void;
  onScrubBackward?: (deltaSeconds: number) => void;
  onStoppedEarly?: (seconds: number) => void;
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
  thumbnail,
  className,
  autoplay,
  playerId,
  onPlayingChange,
  onPlayed5s,
  onPlayed10s,
  onReachedMidpoint,
  onReachedNearEnd,
  onStoppedEarly,
  onEnded,
  onMutedChange,
  onScrubForward,
  onScrubBackward,
}: Props) {
  const generatedId = useId();
  const resolvedPlayerId = playerId ?? generatedId;
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const bunnyPlayerRef = useRef<any | null>(null);
  const [isActivated, setIsActivated] = useState(Boolean(autoplay));
  const [isNearViewport, setIsNearViewport] = useState(Boolean(autoplay));

  // Internal refs for Bunny player state
  const durationRef = useRef<number | null>(null);
  const hasStartedRef = useRef(false);
  const isPlayingRef = useRef(false);
  const endedRef = useRef(false);
  const played10Ref = useRef(false);
  const played5Ref = useRef(false);
  const midpointRef = useRef(false);
  const lastMutedRef = useRef<boolean | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const lastTimeUpdateAtRef = useRef<number | null>(null);
  const nearEndRef = useRef(false);
  const autoPausedRef = useRef(false);
  const scrubbedAtRef = useRef<number | null>(null);

  const SCRUB_SUPPRESS_MS = 800;

  const isBunny = url.includes("iframe.mediadelivery.net");
  const youTubeId = isBunny ? null : extractYouTubeId(url);

  let src: string | null = null;
  if (isBunny) {
    src = url;
  } else if (youTubeId) {
    const params = new URLSearchParams();
    if (autoplay) {
      params.set("autoplay", "1");
      params.set("mute", "1");
    }
    params.set("enablejsapi", "1");
    params.set("playsinline", "1");
    params.set("rel", "0");
    const query = params.toString();
    src = `https://www.youtube.com/embed/${youTubeId}${query ? `?${query}` : ""}`;
  }

  const posterSrc = thumbnail ?? (youTubeId ? `https://img.youtube.com/vi/${youTubeId}/hqdefault.jpg` : null);
  const shouldRenderIframe = Boolean(src && isActivated && isNearViewport);

  const emitGlobalPlay = useCallback(() => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(
      new CustomEvent("mimsy:video:play", {
        detail: { playerId: resolvedPlayerId },
      }),
    );
  }, [resolvedPlayerId]);

  const emitGlobalPlayingChange = useCallback(
    (isPlaying: boolean) => {
      if (typeof window === "undefined") return;
      window.dispatchEvent(
        new CustomEvent("mimsy:video:playing-change", {
          detail: { playerId: resolvedPlayerId, isPlaying },
        }),
      );
    },
    [resolvedPlayerId],
  );

  const setPlayingState = useCallback(
    (isPlaying: boolean) => {
      isPlayingRef.current = isPlaying;
      onPlayingChange?.(isPlaying);
      emitGlobalPlayingChange(isPlaying);
    },
    [emitGlobalPlayingChange, onPlayingChange],
  );

  const emitDebugEvent = useCallback(
    (type: string, data?: Record<string, unknown>) => {
      if (!isBunny) return;
      if (typeof window === "undefined") return;
      window.dispatchEvent(
        new CustomEvent("mimsy:bunny:debug", {
          detail: {
            type,
            playerId: resolvedPlayerId,
            title: title ?? "Untitled Bunny Video",
            url,
            ...data,
          },
        }),
      );
    },
    [isBunny, resolvedPlayerId, title, url],
  );

  // Reset internal refs when URL changes
  useEffect(() => {
    durationRef.current = null;
    hasStartedRef.current = false;
    isPlayingRef.current = false;
    endedRef.current = false;
    played10Ref.current = false;
    played5Ref.current = false;
    midpointRef.current = false;
    lastMutedRef.current = null;
    lastTimeRef.current = null;
    lastTimeUpdateAtRef.current = null;
    nearEndRef.current = false;
    autoPausedRef.current = false;
    scrubbedAtRef.current = null;
    setIsActivated(Boolean(autoplay));
    setPlayingState(false);
  }, [autoplay, setPlayingState, url]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const target = containerRef.current;
    if (!target) return;
    if (!("IntersectionObserver" in window)) {
      setIsNearViewport(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setIsNearViewport(Boolean(entry?.isIntersecting));
      },
      { rootMargin: "900px 0px", threshold: 0 },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  // Load Bunny player.js and wire events only while the iframe is actually mounted.
  useEffect(() => {
    if (!shouldRenderIframe) return;
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
          'script[src="https://assets.mediadelivery.net/playerjs/playerjs-latest.min.js"], script[src="//assets.mediadelivery.net/playerjs/playerjs-latest.min.js"]',
        );
        if (existing) {
          existing.addEventListener("load", () => resolve(), { once: true });
          return;
        }
        const script = document.createElement("script");
        script.src = "https://assets.mediadelivery.net/playerjs/playerjs-latest.min.js";
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
      bunnyPlayerRef.current = player;

      const handlePlayOrPlaying = () => {
        const wasPlaying = isPlayingRef.current;
        hasStartedRef.current = true;
        endedRef.current = false;
        autoPausedRef.current = false;
        emitGlobalPlay();
        setPlayingState(true);
        const scrubbedAt = scrubbedAtRef.current;
        const suppressPlay =
          typeof scrubbedAt === "number" && Date.now() - scrubbedAt < SCRUB_SUPPRESS_MS;
        if (!wasPlaying && !suppressPlay) {
          emitDebugEvent("play");
        }
      };

      const handlePause = () => {
        setPlayingState(false);

        // "stopped early" = paused after playing started, before end
        if (autoPausedRef.current) {
          return;
        }
        const scrubbedAt = scrubbedAtRef.current;
        const suppressPause =
          typeof scrubbedAt === "number" && Date.now() - scrubbedAt < SCRUB_SUPPRESS_MS;
        if (suppressPause) {
          return;
        }
        if (hasStartedRef.current && !endedRef.current) {
          const seconds = lastTimeRef.current ?? 0;
          onStoppedEarly?.(seconds);
          emitDebugEvent("manual-stop");
        }
      };

      const handleEnded = () => {
        endedRef.current = true;
        setPlayingState(false);
        onEnded?.();
        emitDebugEvent("ended");
      };

      const handleTimeUpdate = (data: any) => {
        if (!data || typeof data.seconds !== "number") return;
        const seconds = data.seconds as number;

        if (typeof data.duration === "number" && data.duration > 0) {
          durationRef.current = data.duration;
        }

        const now = Date.now();
        const duration = durationRef.current;
        let scrubbedNow = false;
        if (lastTimeRef.current !== null) {
          const delta = seconds - lastTimeRef.current;
          const lastUpdateAt = lastTimeUpdateAtRef.current;
          const elapsed =
            typeof lastUpdateAt === "number" ? (now - lastUpdateAt) / 1000 : null;
          const isScrub =
            typeof elapsed === "number" &&
            (delta < -0.35 || delta > elapsed + 0.35);
          if (isScrub && delta > 0) {
            scrubbedNow = true;
            scrubbedAtRef.current = now;
            emitDebugEvent("scrub-forward", { delta, seconds });
            onScrubForward?.(delta);
          } else if (isScrub && delta < 0) {
            scrubbedNow = true;
            scrubbedAtRef.current = now;
            emitDebugEvent("scrub-backward", { delta, seconds });
            onScrubBackward?.(delta);
          }
        }
        lastTimeRef.current = seconds;
        lastTimeUpdateAtRef.current = now;

        if (!played5Ref.current && seconds >= 5) {
          played5Ref.current = true;
          onPlayed5s?.();
        }

        if (!played10Ref.current && seconds >= 10) {
          played10Ref.current = true;
          onPlayed10s?.();
          emitDebugEvent("played-10s");
        }

        if (
          duration &&
          duration > 0 &&
          !scrubbedNow &&
          !midpointRef.current &&
          seconds >= duration / 2
        ) {
          midpointRef.current = true;
          onReachedMidpoint?.();
          emitDebugEvent("midpoint");
        }

        if (duration && duration > 2 && !nearEndRef.current && seconds >= duration - 2) {
          nearEndRef.current = true;
          emitDebugEvent("near-end");
          onReachedNearEnd?.();
        }

        if (typeof player.getMuted === "function") {
          try {
            player.getMuted((muted: boolean) => {
              if (lastMutedRef.current === null) {
                lastMutedRef.current = muted;
                onMutedChange?.(muted);
              } else if (lastMutedRef.current !== muted) {
                lastMutedRef.current = muted;
                onMutedChange?.(muted);
                emitDebugEvent(muted ? "muted" : "unmuted");
              }
            });
          } catch {
            // ignore
          }
        }
      };

      player.on("play", handlePlayOrPlaying);
      player.on("playing", handlePlayOrPlaying);
      player.on("pause", handlePause);
      player.on("ended", handleEnded);
      player.on("timeupdate", handleTimeUpdate);

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
      setPlayingState(false);
      try {
        bunnyPlayerRef.current = null;
        if (player && typeof player.destroy === "function") {
          player.destroy();
        }
      } catch {
        // ignore
      }
    };
  }, [
    shouldRenderIframe,
    isBunny,
    url,
    onPlayed5s,
    onPlayed10s,
    onReachedMidpoint,
    onReachedNearEnd,
    onStoppedEarly,
    onEnded,
    onMutedChange,
    onScrubForward,
    onScrubBackward,
    emitGlobalPlay,
    emitDebugEvent,
    setPlayingState,
  ]);

  useEffect(() => {
    if (!shouldRenderIframe) return;
    if (typeof window === "undefined") return;

    const handleGlobalPlay = (event: Event) => {
      const customEvent = event as CustomEvent<{ playerId?: string }>;
      if (customEvent.detail?.playerId === resolvedPlayerId) return;

      if (isBunny && bunnyPlayerRef.current?.pause) {
        if (!isPlayingRef.current) return;
        autoPausedRef.current = true;
        bunnyPlayerRef.current.pause();
        return;
      }

      if (!isBunny && iframeRef.current?.contentWindow) {
        if (!isPlayingRef.current) return;
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({
            event: "command",
            func: "pauseVideo",
            args: "",
          }),
          "*",
        );
      }
    };

    window.addEventListener("mimsy:video:play", handleGlobalPlay);
    return () => {
      window.removeEventListener("mimsy:video:play", handleGlobalPlay);
    };
  }, [isBunny, resolvedPlayerId, shouldRenderIframe]);

  useEffect(() => {
    if (!shouldRenderIframe) return;
    if (isBunny) return;
    if (typeof window === "undefined") return;

    const iframeWindow = iframeRef.current?.contentWindow;
    if (!iframeWindow) return;

    const postMessage = (payload: Record<string, unknown>) => {
      iframeWindow.postMessage(JSON.stringify(payload), "*");
    };

    postMessage({ event: "listening", id: resolvedPlayerId });
    postMessage({
      event: "command",
      func: "addEventListener",
      args: ["onStateChange"],
    });

    const handleMessage = (event: MessageEvent) => {
      if (event.source !== iframeWindow) return;
      if (typeof event.data !== "string") return;

      try {
        const data = JSON.parse(event.data);
        if (data?.event === "onStateChange" && data?.info === 1) {
          hasStartedRef.current = true;
          endedRef.current = false;
          emitGlobalPlay();
          setPlayingState(true);
        }
        if (data?.event === "onStateChange" && data?.info === 2) {
          setPlayingState(false);
        }
        if (data?.event === "onStateChange" && data?.info === 0) {
          endedRef.current = true;
          setPlayingState(false);
          onEnded?.();
        }
      } catch {
        // ignore
      }
    };

    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
      setPlayingState(false);
    };
  }, [emitGlobalPlay, isBunny, onEnded, resolvedPlayerId, setPlayingState, shouldRenderIframe]);

  useEffect(() => {
    if (!shouldRenderIframe) return;
    if (typeof window === "undefined") return;
    const target = containerRef.current;
    if (!target) return;
    if (!("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        if (entry.intersectionRatio >= 0.2) return;
        if (!isPlayingRef.current) return;

        if (isBunny && bunnyPlayerRef.current?.pause) {
          autoPausedRef.current = true;
          bunnyPlayerRef.current.pause();
          return;
        }

        if (!isBunny && iframeRef.current?.contentWindow) {
          iframeRef.current.contentWindow.postMessage(
            JSON.stringify({
              event: "command",
              func: "pauseVideo",
              args: "",
            }),
            "*",
          );
        }
      },
      { threshold: [0, 0.2, 1] },
    );

    observer.observe(target);
    return () => {
      observer.disconnect();
    };
  }, [isBunny, shouldRenderIframe]);

  if (!src) return null;

  return (
    <div ref={containerRef} className={`w-full ${className ?? ""}`}>
      <div className="aspect-video overflow-hidden rounded-xl bg-black shadow">
        {shouldRenderIframe ? (
          <iframe
            ref={iframeRef}
            src={src}
            title={title ?? "Video player"}
            className="h-full w-full"
            frameBorder="0"
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            onClick={() => {
              setIsActivated(true);
              setIsNearViewport(true);
            }}
            className="group relative flex h-full w-full items-center justify-center overflow-hidden bg-black text-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] focus:ring-offset-2 focus:ring-offset-[hsl(var(--background))]"
            aria-label={`Load video${title ? `: ${title}` : ""}`}
          >
            {posterSrc ? (
              <img
                src={posterSrc}
                alt=""
                loading="lazy"
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover opacity-85 transition duration-200 group-hover:scale-[1.01] group-hover:opacity-95"
              />
            ) : null}
            <span className="absolute inset-0 bg-black/25" aria-hidden="true" />
            <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-black shadow-lg transition duration-200 group-hover:scale-105">
              <span
                className="ml-1 h-0 w-0 border-y-[10px] border-l-[16px] border-y-transparent border-l-black"
                aria-hidden="true"
              />
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
