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
      {/* Title and client credit */}
      <h2 className="text-xl font-medium">{video.title}</h2>
      <div className="text-gray-500">{video.client}</div>

      {/* Player uses existing YouTube URL extractor */}
      <VideoPlayer url={video.url} title={video.title} />

      {/* Optional long description */}
      {video.description && (
        <p className="text-gray-700 leading-relaxed">{video.description}</p>
      )}
    </section>
  );
}
