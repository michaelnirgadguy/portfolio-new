import { useCallback, useEffect } from "react";
import VideoPlayer from "@/components/VideoPlayer";
import type { VideoItem } from "@/types/video";

export default function HeroPlayerBubble({
  video,
  onPlayingChange,
  onMutedChange,
  onReachedMidpoint,
  onPlayed10s,
  onScrubForward,
  onScrubBackward,
  onStoppedEarly,
}: {
  video?: VideoItem;
  onPlayingChange?: (videoId: string, isPlaying: boolean) => void;
  onMutedChange?: (videoId: string, muted: boolean) => void;
  onReachedMidpoint?: (videoId: string) => void;
  onPlayed10s?: (videoId: string) => void;
  onScrubForward?: (videoId: string) => void;
  onScrubBackward?: (videoId: string) => void;
  onStoppedEarly?: (videoId: string) => void;
}) {
  const videoId = video?.id ?? "";
  const handlePlayingChange = useCallback(
    (isPlaying: boolean) => {
      if (!videoId) return;
      onPlayingChange?.(videoId, isPlaying);
    },
    [onPlayingChange, videoId]
  );
  const handleMutedChange = useCallback(
    (muted: boolean) => {
      if (!videoId) return;
      onMutedChange?.(videoId, muted);
    },
    [onMutedChange, videoId]
  );
  const handleReachedMidpoint = useCallback(() => {
    if (!videoId) return;
    onReachedMidpoint?.(videoId);
  }, [onReachedMidpoint, videoId]);
  const handlePlayed10s = useCallback(() => {
    if (!videoId) return;
    onPlayed10s?.(videoId);
  }, [onPlayed10s, videoId]);
  const handleScrubForward = useCallback(() => {
    if (!videoId) return;
    onScrubForward?.(videoId);
  }, [onScrubForward, videoId]);
  const handleScrubBackward = useCallback(() => {
    if (!videoId) return;
    onScrubBackward?.(videoId);
  }, [onScrubBackward, videoId]);
  const handleStoppedEarly = useCallback(() => {
    if (!videoId) return;
    onStoppedEarly?.(videoId);
  }, [onStoppedEarly, videoId]);

  useEffect(() => {
    if (!videoId) return;
    return () => onPlayingChange?.(videoId, false);
  }, [onPlayingChange, videoId]);

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
