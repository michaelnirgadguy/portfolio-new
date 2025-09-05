// components/VideoSection.tsx
// Selected video: left column (meta + player), right rail (3 suggestions)

import type { VideoItem } from "@/types/video";
import VideoPlayer from "@/components/VideoPlayer";
import VideoCard from "@/components/VideoCard";
import { getAllVideos } from "@/lib/videos";

type Props = { video: VideoItem };

export default function VideoSection({ video }: Props) {
  // Pick 3 other videos as suggestions
  const suggestions = getAllVideos().filter((v) => v.id !== video.id).slice(0, 3);

  return (
    <section className="space-y-4">
      {/* 2-col: player column + right rail. On mobile it stacks. */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,720px)_260px]">
        {/* LEFT: meta + player */}
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
          <VideoPlayer url={video.url} title={video.title} className="w-full" />
        </div>

        {/* RIGHT: 3 small suggestions */}
        <aside className="hidden lg:block">
          <div className="space-y-3">
            {suggestions.map((s) => (
              <VideoCard key={s.id} video={s} href={`?v=${s.id}`} />
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}
