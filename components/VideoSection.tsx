// components/VideoSection.tsx


import type { VideoItem } from "@/types/video";
import VideoPlayer from "@/components/VideoPlayer";

type Props = {
  video: VideoItem; // the currently selected video (already validated upstream)
};

export default function VideoSection({ video }: Props) {
  return (
    <section className="space-y-4">
      {/* Title */}
      <h2 className="heading-secondary">{video.title}</h2>

      {/* Client (left) + Credits (right) in one row, wraps on small screens */}
      <div className="flex flex-wrap items-baseline gap-2">
        <span className="meta-secondary">{video.client}</span>
        {video.display_credits && (
          <span className="meta-tertiary ml-auto text-right">
            {video.display_credits}
          </span>
        )}
      </div>

      {/* Main area: Player (left) + Suggestions rail (right) */}
      <div
        className={[
          "grid gap-4",
          // mobile: single column; lg+: 2 columns, narrower right rail
          "lg:grid-cols-[minmax(0,1fr)_280px]",
        ].join(" ")}
      >
        {/* LEFT: Player (smaller by constraining the column width) */}
        <div className="space-y-3">
          <VideoPlayer
            url={video.url}
            title={video.title}
            // keep full width of its column; column is narrower than full page
            className="w-full"
          />
        </div>

        {/* RIGHT: Suggestions rail (placeholder for next step) */}
        <aside className="hidden lg:block">
          {/* Next step: render three small VideoCards here */}
          <div className="text-sm text-muted-foreground">
            {/* Temporary stub so layout is visible */}
            Up next: three suggested videos
          </div>
        </aside>
      </div>
    </section>
  );
}
