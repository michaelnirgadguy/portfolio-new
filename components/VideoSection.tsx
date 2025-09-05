// components/VideoSection.tsx
// Player left (bigger), meta right (slim panel)

import type { VideoItem } from "@/types/video";
import VideoPlayer from "@/components/VideoPlayer";

type Props = { video: VideoItem };

export default function VideoSection({ video }: Props) {
  return (
    <section className="space-y-4">
      {/* Desktop: [820px player | 300px meta]. Mobile: stacked. */}
      <div className="grid gap-8 lg:grid-cols-[minmax(0,820px)_300px]">
        {/* LEFT — Player (bigger, left-aligned) */}
        <div>
          <VideoPlayer url={video.url} title={video.title} className="w-full" />
        </div>

        {/* RIGHT — Meta panel (desktop only) */}
        <aside className="hidden lg:block">
          <div className="rounded-xl bg-muted/60 p-4">
            <h2 className="heading-secondary">{video.title}</h2>
            <div className="mt-2 text-sm text-muted-foreground">
              <div>{video.client}</div>
              {video.display_credits && <div className="mt-1">{video.display_credits}</div>}
            </div>
          </div>
        </aside>

        {/* MOBILE — Meta under player */}
        <div className="lg:hidden">
          <h2 className="heading-secondary">{video.title}</h2>
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="meta-secondary">{video.client}</span>
            {video.display_credits && (
              <span className="meta-tertiary ml-auto text-right">{video.display_credits}</span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
