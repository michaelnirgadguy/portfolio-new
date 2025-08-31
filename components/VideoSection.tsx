// components/VideoSection.tsx
// Renders the selected video area: title, client, player, and description.
// Keeps layout/markup isolated so page.tsx can stay a thin coordinator.

import type { VideoItem } from "@/types/video";
import VideoPlayer from "@/components/VideoPlayer";

type Props = {
  video: VideoItem; // the currently selected video (already validated upstream)
};

export default function VideoSection({ video }: Props) {
  return (
    <section className="space-y-3">
      <h2 className="heading-secondary">{video.title}</h2>
      <div className="meta-secondary">{video.client}</div>
      {video.display_credits && (
        <div className="meta-tertiary">{video.display_credits}</div>
      )}
      <VideoPlayer url={video.url} title={video.title} />
    </section>

  );
}
