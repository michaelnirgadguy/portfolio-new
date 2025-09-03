// components/VideoSection.tsx
import type { VideoItem } from "@/types/video";
import VideoPlayer from "@/components/VideoPlayer";

type Props = { video: VideoItem };

export default function VideoSection({ video }: Props) {
  return (
    <section className="space-y-3">
      <div className="max-w-3xl"> {/* binds width for title/credits/player */}
        {/* Title */}
        <h2 className="heading-secondary">{video.title}</h2>

        {/* Client (left) + Credits (right) constrained to player width */}
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="meta-secondary">{video.client}</span>
          {video.display_credits && (
            <span className="meta-tertiary ml-auto text-right">
              {video.display_credits}
            </span>
          )}
        </div>

        {/* Player (left-aligned, same size) */}
        <VideoPlayer url={video.url} title={video.title} />
      </div>
    </section>
  );
}
