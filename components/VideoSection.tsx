// components/VideoSection.tsx
// Selected video: left column (meta + player), right rail (suggestions placeholder)

import type { VideoItem } from "@/types/video";
import VideoPlayer from "@/components/VideoPlayer";

type Props = { video: VideoItem };

export default function VideoSection({ video }: Props) {
  return (
    <section className="space-y-4">
      {/* 2-col: player column + right rail. On mobile it stacks. */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,820px)_260px]">
        {/* LEFT: meta + player (aligned and width-constrained) */}
        <div className="space-y-3">
          <h2 className="heading-secondary">{video.title}</h2>
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="meta-secondary">{video.client}</span>
            {video.display_credits && (
              <span className="meta-tertiary ml-auto text-right">
                {video.display_credits}
              </span>
            )}
          </div>

          {/* Player fills its column; column max width keeps it smaller */}
          <VideoPlayer url={video.url} title={video.title} className="w-full" />
        </div>

        {/* RIGHT: suggestions (to be filled next step) */}
        <aside className="hidden lg:block">
          <div className="text-sm text-muted-foreground">
            Up next: three suggested videos
          </div>
        </aside>
      </div>
    </section>
  );
}
