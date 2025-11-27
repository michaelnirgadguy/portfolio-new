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
  idle3s: boolean;
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
  idle3s: false,
};

export default function VideoPlayer({ url, title, className, autoplay }: Props) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [flags, setFlags] = useState<Flags>(initialFlags);

  // Refs to avoid stale closures
  const durationRef = useRef<number | null>(null);
  const lastLoggedSecondRef = useRef<number | null>(null);
  const isPlayingRef = useRef(false);
  const endedRef = useRef(false);
  const played10Ref = useRef(false);
  const midpointRef = useRef(false);
  const idleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset when URL changes
  useEffect(() => {
    setFlags(initialFlags);
    setLog([]);
    durationRef.current = null;
    lastLoggedSecondRef.current = null;
    isPlayingRef.current = false;
    endedRef.current = false;
    played10Ref.current = false;
    midpointRef.current = false;
    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current);
      idleTimeoutRef.current = null;
    }
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

  const clearIdleTimer = () => {
    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current);
      idleTimeoutRef.current = null;
    }
  };

  const scheduleIdle = () => {
    clearIdleTimer();
    idleTimeoutRef.current = setTimeout(() => {
      if (!isPlayingRef.current) {
        updateFlags({ idle3s: true });
        appendLog("idle ≥3s (no video playing)");
      }
    }, 3000);
  };

  // Load Bunny player.js script
  useEffect(() => {
    if (typeof window === "undefined") return;

    if ((window as any).playerjs) {
      setScriptLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "//assets.mediadelivery.net/playerjs/playerjs-latest.min.js";
    script.async = true;
    script.onload = () => setScriptLoaded(true);
    document.body.appendChild(script);
  }, []);

  // Wire up Player.js for Bunny iframes
  useEffect(() => {
    if (!scriptLoaded) return;
    if (!iframeRef.current) return;
    if (!url.includes("iframe.mediadelivery.net")) return; // only Bunny

    const w = window as any;
    if (!w.playerjs || !w.playerjs.Player) return;

    const player = new w.playerjs.Player(iframeRef.current);

    player.on("ready", () => {
      appendLog("ready");

      player.on("play", () => {
        appendLog("play");
        isPlayingRef.current = true;
        endedRef.current = false;
        updateFlags({
          isPlaying: true,
          stopped: false,
          idle3s: false,
        });
        clearIdleTimer();
      });

      player.on("pause", (data: any) => {
        const seconds =
          data && typeof data.seconds === "number" ? data.seconds : undefined;
        appendLog("pause");
        isPlayingRef.current = false;
        updateFlags({ isPlaying: false });

        // "stopped" = paused after starting, but not ended
        if (!endedRef.current && seconds && seconds > 0) {
          updateFlags({ stopped: true });
          appendLog("stopped (paused mid-video)");
        }

        scheduleIdle();
      });

      player.on("ended", () => {
        appendLog("ended");
        isPlayingRef.current = false;
        endedRef.current = true;
        updateFlags({
          isPlaying: false,
          stopped: false,
          ended: true,
        });
        scheduleIdle();
      });

      player.on("volumechange", (data: any) => {
        if (data && typeof data.muted === "boolean") {
          appendLog(data.muted ? "muted" : "unmuted");
          updateFlags({ isMuted: data.muted });
        } else {
          appendLog("volumechange");
        }
      });

      // Progress + derived flags
      player.on("timeupdate", (data: any) => {
        if (!data || typeof data.seconds !== "number") return;
        const seconds = data.seconds as number;

        // duration if provided
        if (typeof data.duration === "number" && data.duration > 0) {
          durationRef.current = data.duration;
        }

        // Log every 5 seconds, de-duped
        const secInt = Math.floor(seconds);
        if (
          secInt % 5 === 0 &&
          lastLoggedSecondRef.current !== secInt
        ) {
          appendLog(`time: ${secInt}s`);
          lastLoggedSecondRef.current = secInt;
        }

        // ≥ 10s flag
        if (!played10Ref.current && seconds >= 10) {
          played10Ref.current = true;
          updateFlags({ playedAtLeast10s: true });
          appendLog("played ≥10s");
        }

        // Midpoint flag
        const duration = durationRef.current;
        if (
          duration &&
          duration > 0 &&
          !midpointRef.current &&
          seconds >= duration / 2
        ) {
          midpointRef.current = true;
          updateFlags({ reachedMidpoint: true });
          appendLog("reached midpoint");
        }
      });
    });

    return () => {
      clearIdleTimer();
      try {
        if ((player as any).destroy) (player as any).destroy();
      } catch {
        // ignore
      }
    };
  }, [scriptLoaded, url]);

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

      {/* TEMPORARY DEBUG LOG */}
      <div className="mt-2 rounded-lg bg-muted/40 p-2 text-xs font-mono max-h-32 overflow-auto">
        {log.length === 0 ? (
          <div className="text-muted-foreground">[video event log]</div>
        ) : (
          log.map((line, i) => <div key={i}>{line}</div>)
        )}
      </div>

      {/* TEMPORARY FLAGS VIEW */}
      <div className="mt-1 rounded-md bg-muted/20 p-2 text-[10px] font-mono text-muted-foreground space-y-1">
        <div>
          playing: <span>{flags.isPlaying ? "yes" : "no"}</span> ·{" "}
          ≥10s: <span>{flags.playedAtLeast10s ? "yes" : "no"}</span> ·{" "}
          midpoint: <span>{flags.reachedMidpoint ? "yes" : "no"}</span> ·{" "}
          ended: <span>{flags.ended ? "yes" : "no"}</span>
        </div>
        <div>
          muted: <span>{flags.isMuted ? "yes" : "no"}</span> ·{" "}
          stopped: <span>{flags.stopped ? "yes" : "no"}</span> ·{" "}
          idle≥3s (no video): <span>{flags.idle3s ? "yes" : "no"}</span>
        </div>
      </div>
    </div>
  );
}
