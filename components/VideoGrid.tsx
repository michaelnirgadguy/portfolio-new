// components/VideoGrid.tsx
// Displays a grid of thumbnail cards. Keeps layout + click handling isolated.
// Parent passes in the videos to show and a handler to set the selected ID via URL.

import type { VideoItem } from "@/types/video";
import VideoCard from "@/components/VideoCard";

type Props = {
  videos: VideoItem[];                // the 3–6 items to display
  onSelectId: (id: string) => void;   // parent handles URL update
  className?: string;                 // optional layout control
};

export default function VideoGrid({ videos, onSelectId, className }: Props) {
  return (
    <div className={className}>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {videos.map((v) => (
          <VideoCard key={v.id} video={v} onSelect={() => onSelectId(v.id)} />
        ))}
      </div>
    </div>
  );
}
