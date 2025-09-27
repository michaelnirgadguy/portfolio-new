// components/VideoSection.tsx
// Player left (bigger), meta right (slim panel)

import type { VideoItem } from "@/types/video";
import VideoPlayer from "@/components/VideoPlayer";

type Props = { video: VideoItem };

export default function VideoSection({ video }: Props) {
  return (
    <section className="space-y-4">
    
       <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* LEFT — Player (bigger, left-aligned) */}
       <div className="max-w-[960px]">
          <VideoPlayer url={video.url} title={video.title} className="w-full" />
        </div>

        {/* RIGHT — Meta panel (desktop only) */}
        <aside className="hidden lg:block">
          <div className="rounded-xl bg-muted/60 p-4">
            {/* Title + client (tight pair) */}
            <h2 className="heading-secondary">{video.title}</h2>
            {video.client && (
              <div className="mt-1 text-sm font-medium text-accent">
                {video.client}
              </div>
            )}
        
            {/* Credits (smaller, visually separated) */}
            {video.display_credits && (
              <div className="mt-4 pt-3 border-t border-border meta-tertiary whitespace-pre-line">
                {video.display_credits}
              </div>
            )}
          </div>
        </aside>


        {/* MOBILE — Meta under player */}
       
        <div className="lg:hidden mt-4">
          <h2 className="heading-secondary">{video.title}</h2>
          {video.client && (
            <div className="mt-1 text-sm font-medium text-accent">
              {video.client}
            </div>
          )}
          {video.display_credits && (
            <div className="mt-4 pt-3 border-t border-border meta-tertiary whitespace-pre-line">
              {video.display_credits}
            </div>
  )}
</div>
      </div>
    </section>
  );
}
