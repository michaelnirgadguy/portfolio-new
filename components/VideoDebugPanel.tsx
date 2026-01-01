"use client";

import { useEffect, useMemo, useState } from "react";

const MAX_LOGS = 120;

type DebugDetail = {
  type: string;
  playerId?: string;
  title?: string;
  url?: string;
  muted?: boolean;
  reason?: string;
  seconds?: number;
  delta?: number;
};

type LogEntry = {
  id: string;
  time: string;
  text: string;
};

export default function VideoDebugPanel() {
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);
  const [titlesByPlayer, setTitlesByPlayer] = useState<Record<string, string>>({});
  const [mutedByPlayer, setMutedByPlayer] = useState<Record<string, boolean>>({});
  const [playedVideos, setPlayedVideos] = useState<string[]>([]);

  const currentVideoLabel = useMemo(() => {
    if (!currentPlayerId) return "None";
    return titlesByPlayer[currentPlayerId] ?? currentPlayerId;
  }, [currentPlayerId, titlesByPlayer]);

  const currentMutedLabel = useMemo(() => {
    if (!currentPlayerId) return "n/a";
    const muted = mutedByPlayer[currentPlayerId];
    if (typeof muted !== "boolean") return "unknown";
    return muted ? "muted" : "unmuted";
  }, [currentPlayerId, mutedByPlayer]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const addLog = (text: string) => {
      const entry: LogEntry = {
        id: crypto.randomUUID(),
        time: new Date().toLocaleTimeString(),
        text,
      };
      setLogEntries((prev) => [...prev, entry].slice(-MAX_LOGS));
    };

    const handleDebugEvent = (event: Event) => {
      const customEvent = event as CustomEvent<DebugDetail>;
      const detail = customEvent.detail;
      if (!detail) return;

      const playerId = detail.playerId ?? "unknown";
      const label = detail.title || detail.url || playerId;

      setTitlesByPlayer((prev) => ({ ...prev, [playerId]: label }));

      switch (detail.type) {
        case "play": {
          setCurrentPlayerId(playerId);
          addLog(`▶️ Playing "${label}" (player ${playerId})`);
          break;
        }
        case "pause": {
          if (currentPlayerId === playerId) {
            setCurrentPlayerId(null);
          }
          if (detail.reason === "manual") {
            addLog(`⏸️ Manual stop: "${label}" (player ${playerId})`);
          }
          break;
        }
        case "ended": {
          if (currentPlayerId === playerId) {
            setCurrentPlayerId(null);
          }
          break;
        }
        case "muted-change": {
          if (typeof detail.muted === "boolean") {
            setMutedByPlayer((prev) => ({ ...prev, [playerId]: detail.muted! }));
            addLog(
              `${detail.muted ? "🔇 Muted" : "🔊 Unmuted"}: "${label}" (player ${playerId})`
            );
          }
          break;
        }
        case "played-10s": {
          addLog(`⏱️ 10s reached: "${label}" (player ${playerId})`);
          setPlayedVideos((prev) =>
            prev.includes(label) ? prev : [...prev, label]
          );
          break;
        }
        case "midpoint": {
          addLog(`🟣 Midpoint reached: "${label}" (player ${playerId})`);
          break;
        }
        case "near-end": {
          addLog(`🏁 Near end (2s left): "${label}" (player ${playerId})`);
          break;
        }
        case "scrub-forward": {
          const delta = detail.delta ? Math.round(detail.delta) : 0;
          addLog(`⏩ Scrubbed ahead +${delta}s: "${label}" (player ${playerId})`);
          break;
        }
        case "scrub-backward": {
          const delta = detail.delta ? Math.round(Math.abs(detail.delta)) : 0;
          addLog(`⏪ Scrubbed back -${delta}s: "${label}" (player ${playerId})`);
          break;
        }
        default:
          break;
      }
    };

    window.addEventListener("mimsy:video:debug", handleDebugEvent);
    return () => {
      window.removeEventListener("mimsy:video:debug", handleDebugEvent);
    };
  }, [currentPlayerId]);

  return (
    <aside className="pointer-events-auto fixed bottom-4 right-4 z-40 w-[18rem] overflow-hidden rounded-xl border border-border bg-background/95 text-xs shadow-xl backdrop-blur">
      <div className="border-b border-border px-3 py-2 font-semibold text-[11px] uppercase tracking-wide text-muted-foreground">
        Bunny Video Debug
      </div>
      <div className="max-h-52 overflow-y-auto px-3 py-2 space-y-1">
        {logEntries.length === 0 ? (
          <div className="text-muted-foreground">Waiting for Bunny events...</div>
        ) : (
          logEntries.map((entry) => (
            <div key={entry.id} className="text-[11px] leading-relaxed">
              <span className="text-muted-foreground">[{entry.time}]</span> {entry.text}
            </div>
          ))
        )}
      </div>
      <div className="border-t border-border px-3 py-2 space-y-2">
        <div className="text-[11px] text-muted-foreground">
          Now playing: <span className="font-semibold text-foreground">{currentVideoLabel}</span>
          {currentPlayerId && (
            <span className="ml-2 text-[10px] uppercase tracking-wide text-muted-foreground">
              {currentMutedLabel}
            </span>
          )}
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Played 10s+
          </div>
          {playedVideos.length ? (
            <ul className="mt-1 space-y-1 text-[11px]">
              {playedVideos.map((video) => (
                <li key={video}>• {video}</li>
              ))}
            </ul>
          ) : (
            <div className="text-[11px] text-muted-foreground">None yet</div>
          )}
        </div>
      </div>
    </aside>
  );
}
