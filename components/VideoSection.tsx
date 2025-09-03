// components/VideoSection.tsx
// Renders the selected video area: title, client, player, and credits.
// Keeps layout/markup isolated so page.tsx can stay a thin coordinator.

import type { VideoItem } from "@/types/video";
import VideoPlayer from "@/components/VideoPlayer";

type Props = {
  video: VideoItem; // the currently selected video (already validated upstream)
};

export default function VideoSection({ video }: Props) {
  return (
   <section className="space-y-3">
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

  {/* Player */}
  <VideoPlayer url={video.url} title={video.title} />
</section>


  );
}
