"use client";

import VideoPlayer from "@/components/VideoPlayer";
import { getVideoById } from "@/lib/videos";

export default function HeroPlayerBubble({ videoId }: { videoId: string }) {
  const video = getVideoById(videoId);

  if (!video) {
    return (
      <div className="w-full rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
        Missing video.
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <VideoPlayer url={video.url} title={video.title} className="bg-black" autoplay />

      <div className="p-4 space-y-1">
        <div className="text-lg font-semibold leading-tight">{video.title}</div>
        <div className="text-sm text-muted-foreground">{video.client}</div>
        {video.display_credits ? (
          <p className="text-sm text-muted-foreground whitespace-pre-line mt-2">
            {video.display_credits}
          </p>
        ) : null}
      </div>
    </div>
  );
}
