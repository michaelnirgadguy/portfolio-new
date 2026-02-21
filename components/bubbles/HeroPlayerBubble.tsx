import { useCallback, useEffect } from "react";
import VideoPlayer from "@/components/VideoPlayer";
import type { VideoItem } from "@/types/video";

export default function HeroPlayerBubble({
  video,
  sourceMessageId,
  onPlayingChange,
  onMutedChange,
  onReachedMidpoint,
  onReachedNearEnd,
  onPlayed5s,
  onPlayed10s,
  onScrubForward,
  onScrubBackward,
  onStoppedEarly,
}: {
  video?: VideoItem;
  sourceMessageId: string;
  onPlayingChange?: (videoId: string, sourceMessageId: string, isPlaying: boolean) => void;
  onMutedChange?: (videoId: string, sourceMessageId: string, muted: boolean) => void;
  onReachedMidpoint?: (videoId: string, sourceMessageId: string) => void;
  onReachedNearEnd?: (videoId: string, sourceMessageId: string) => void;
  onPlayed5s?: (videoId: string, sourceMessageId: string) => void;
  onPlayed10s?: (videoId: string, sourceMessageId: string) => void;
  onScrubForward?: (videoId: string, sourceMessageId: string, deltaSeconds: number) => void;
  onScrubBackward?: (videoId: string, sourceMessageId: string, deltaSeconds: number) => void;
  onStoppedEarly?: (videoId: string, sourceMessageId: string, seconds: number) => void;
}) {
  const videoId = video?.id ?? "";
  const handlePlayingChange = useCallback(
    (isPlaying: boolean) => {
      if (!videoId) return;
      onPlayingChange?.(videoId, sourceMessageId, isPlaying);
    },
    [onPlayingChange, sourceMessageId, videoId]
  );
  const handleMutedChange = useCallback(
    (muted: boolean) => {
      if (!videoId) return;
      onMutedChange?.(videoId, sourceMessageId, muted);
    },
    [onMutedChange, sourceMessageId, videoId]
  );
  const handleReachedMidpoint = useCallback(() => {
    if (!videoId) return;
    onReachedMidpoint?.(videoId, sourceMessageId);
  }, [onReachedMidpoint, sourceMessageId, videoId]);
  const handleReachedNearEnd = useCallback(() => {
    if (!videoId) return;
    onReachedNearEnd?.(videoId, sourceMessageId);
  }, [onReachedNearEnd, sourceMessageId, videoId]);
  const handlePlayed10s = useCallback(() => {
    if (!videoId) return;
    onPlayed10s?.(videoId, sourceMessageId);
  }, [onPlayed10s, sourceMessageId, videoId]);
  const handlePlayed5s = useCallback(() => {
    if (!videoId) return;
    onPlayed5s?.(videoId, sourceMessageId);
  }, [onPlayed5s, sourceMessageId, videoId]);
  const handleScrubForward = useCallback(
    (deltaSeconds: number) => {
      if (!videoId) return;
      onScrubForward?.(videoId, sourceMessageId, deltaSeconds);
    },
    [onScrubForward, sourceMessageId, videoId]
  );
  const handleScrubBackward = useCallback(
    (deltaSeconds: number) => {
      if (!videoId) return;
      onScrubBackward?.(videoId, sourceMessageId, deltaSeconds);
    },
    [onScrubBackward, sourceMessageId, videoId]
  );
  const handleStoppedEarly = useCallback(
    (seconds: number) => {
      if (!videoId) return;
      onStoppedEarly?.(videoId, sourceMessageId, seconds);
    },
    [onStoppedEarly, sourceMessageId, videoId]
  );

  useEffect(() => {
    if (!videoId) return;
    return () => onPlayingChange?.(videoId, sourceMessageId, false);
  }, [onPlayingChange, sourceMessageId, videoId]);

  if (!video) {
    return (
      <div className="w-full rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
        Missing video.
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <VideoPlayer
        url={video.url}
        title={video.title}
        className="bg-black"
        autoplay
        onPlayingChange={handlePlayingChange}
        onMutedChange={handleMutedChange}
        onReachedMidpoint={handleReachedMidpoint}
        onReachedNearEnd={handleReachedNearEnd}
        onPlayed5s={handlePlayed5s}
        onPlayed10s={handlePlayed10s}
        onScrubForward={handleScrubForward}
        onScrubBackward={handleScrubBackward}
        onStoppedEarly={handleStoppedEarly}
      />

      <div className="p-4 sm:p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
          <div className="flex-1 space-y-1">
            <div className="text-lg font-semibold leading-tight">{video.title}</div>
            <div className="text-sm text-muted-foreground">{video.client}</div>
          </div>

          {video.display_credits ? (
            <div className="sm:flex sm:min-w-[14rem] sm:justify-end">
              <div className="whitespace-pre-line text-sm text-muted-foreground sm:text-left">
                {video.display_credits}
              </div>
            </div>
          ) : (
            <div className="hidden sm:invisible sm:block sm:min-w-[14rem]" aria-hidden />
          )}
        </div>
      </div>
    </div>
  );
}
