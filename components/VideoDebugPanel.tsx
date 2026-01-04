"use client";

import { useEffect, useMemo, useState } from "react";

type DebugEvent = {
  type: string;
  playerId: string;
  title?: string;
  url?: string;
  delta?: number;
  seconds?: number;
};

type LogEntry = {
  id: string;
  timestamp: string;
  message: string;
};

const LOG_LIMIT = 14;

export default function VideoDebugPanel() {
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [currentPlaying, setCurrentPlaying] = useState<{
    playerId: string;
    title: string;
  } | null>(null);
  const [mutedByPlayer, setMutedByPlayer] = useState<Record<string, boolean>>({});
  const [playedVideos, setPlayedVideos] = useState<Record<string, string>>({});

  useEffect(() => {
    const handleDebugEvent = (event: Event) => {
      const detail = (event as CustomEvent<DebugEvent>).detail;
      if (!detail?.playerId) return;

      const title = detail.title ?? detail.url ?? "Untitled Bunny Video";
      const playerLabel = `(${detail.playerId})`;
      const timestamp = new Date().toLocaleTimeString();

      const addLog = (message: string) => {
        setLogEntries((prev) => [
          { id: crypto.randomUUID(), timestamp, message },
          ...prev,
        ].slice(0, LOG_LIMIT));
      };

      switch (detail.type) {
        case "play":
          setCurrentPlaying({ playerId: detail.playerId, title });
          addLog(`Play ${playerLabel}: ${title}`);
          break;
        case "manual-stop":
          setCurrentPlaying((prev) =>
            prev?.playerId === detail.playerId ? null : prev
          );
          addLog(`Manual stop ${playerLabel}: ${title}`);
          break;
        case "muted":
          setMutedByPlayer((prev) => ({ ...prev, [detail.playerId]: true }));
          addLog(`Muted ${playerLabel}: ${title}`);
          break;
        case "unmuted":
          setMutedByPlayer((prev) => ({ ...prev, [detail.playerId]: false }));
          addLog(`Unmuted ${playerLabel}: ${title}`);
          break;
        case "played-10s":
          setPlayedVideos((prev) => ({ ...prev, [detail.playerId]: title }));
          addLog(`Played 10s ${playerLabel}: ${title}`);
          break;
        case "midpoint":
          addLog(`Midpoint ${playerLabel}: ${title}`);
          break;
        case "near-end":
          addLog(`Finished (2s early) ${playerLabel}: ${title}`);
          break;
        case "scrub-forward":
          addLog(
            `Scrubbed ahead ${playerLabel}: ${title} (+${Math.round(detail.delta ?? 0)}s)`
          );
          break;
        case "scrub-backward":
          addLog(
            `Scrubbed back ${playerLabel}: ${title} (${Math.round(detail.delta ?? 0)}s)`
          );
          break;
        case "ended":
          setCurrentPlaying((prev) =>
            prev?.playerId === detail.playerId ? null : prev
          );
          break;
        default:
          break;
      }
    };

    window.addEventListener("mimsy:bunny:debug", handleDebugEvent);
    return () => window.removeEventListener("mimsy:bunny:debug", handleDebugEvent);
  }, []);

  const playingStatus = useMemo(() => {
    if (!currentPlaying) return "None";
    const muted = mutedByPlayer[currentPlaying.playerId];
    const muteLabel = muted === undefined ? "mute: unknown" : muted ? "muted" : "unmuted";
    return `${currentPlaying.title} (${currentPlaying.playerId}) — ${muteLabel}`;
  }, [currentPlaying, mutedByPlayer]);

  const playedList = useMemo(() => Object.values(playedVideos), [playedVideos]);

  return (
    <div className="pointer-events-auto fixed right-4 top-4 z-50 w-[20rem] max-w-[90vw] rounded-xl border border-border bg-card/95 p-3 text-xs shadow-xl backdrop-blur">
      <div className="mb-2 text-[0.7rem] font-semibold uppercase tracking-wide text-muted-foreground">
        Bunny video debug
      </div>
      <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
        {logEntries.length === 0 ? (
          <div className="text-muted-foreground">No bunny events yet.</div>
        ) : (
          logEntries.map((entry) => (
            <div key={entry.id} className="border-b border-border/60 pb-1 last:border-b-0">
              <div className="text-muted-foreground">{entry.timestamp}</div>
              <div className="text-foreground">{entry.message}</div>
            </div>
          ))
        )}
      </div>

      <div className="mt-3 border-t border-border/70 pt-2 text-muted-foreground">
        <div className="font-medium text-foreground">Current</div>
        <div>{playingStatus}</div>
      </div>

      <div className="mt-3 border-t border-border/70 pt-2 text-muted-foreground">
        <div className="font-medium text-foreground">Played 10s+</div>
        {playedList.length ? (
          <ul className="list-disc pl-4">
            {playedList.map((title) => (
              <li key={title}>{title}</li>
            ))}
          </ul>
        ) : (
          <div>None yet.</div>
        )}
      </div>
    </div>
  );
}
