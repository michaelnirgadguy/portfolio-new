import type { VideoItem } from "@/types/video";
import VideoPlayer from "@/components/VideoPlayer";

type Props = { video: VideoItem };

export default function VideoSection({ video }: Props) {
  return (
    <section className="space-y-6">
      {/* VIDEO PLAYER */}
      <div className="w-full">
        <VideoPlayer
          url={video.url}
          title={video.title}
          className="w-full rounded-lg"
        />
      </div>

      {/* META: title, client, credits */}
      <div className="space-y-3">
        <h2 className="heading-secondary">{video.title}</h2>

        {video.client && (
          <div className="text-sm font-medium text-accent">
            {video.client}
          </div>
        )}

        {video.display_credits && (
          <div className="pt-3 border-t border-[hsl(var(--border))] meta-tertiary whitespace-pre-line">
            {video.display_credits}
          </div>
        )}
      </div>
    </section>
  );
}
