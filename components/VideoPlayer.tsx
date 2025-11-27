// /components/VideoPlayer.tsx
"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  url: string; // Bunny iframe URL or YouTube URL
  title?: string;
  className?: string;
  autoplay?: boolean;
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

export default function VideoPlayer({ url, title, className, autoplay }: Props) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // Build the src
  let src: string | null = null;

  if (url.includes("iframe.mediadelivery.net")) {
    src = url;
    // You can add autoplay params here if you want
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

      player.on("play", () => appendLog("play"));
      player.on("pause", () => appendLog("pause"));
      player.on("ended", () => appendLog("ended"));

      player.on("volumechange", (data: any) => {
        if (data && typeof data.muted === "boolean") {
          appendLog(data.muted ? "muted" : "unmuted");
        } else {
          appendLog("volumechange");
        }
      });

      // Simple debug progress hook — just to see time flowing
      player.on("timeupdate", (data: any) => {
        if (!data || typeof data.seconds !== "number") return;
        // Only log every ~5 seconds to avoid spam
        if (Math.round(data.seconds) % 5 === 0) {
          appendLog(`time: ${Math.round(data.seconds)}s`);
        }
      });
    });

    return () => {
      // Player.js doesn't require explicit destroy, but safe to try
      try {
        if (player.destroy) player.destroy();
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
    </div>
  );
}
