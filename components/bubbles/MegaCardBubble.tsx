import VideoCard from "@/components/VideoCard";
import type { VideoItem } from "@/types/video";

type MegaCardBubbleProps = {
  videoIds: string[];
  videosById: Map<string, VideoItem>;
  onOpenVideo?: (video: VideoItem) => void;
};

type MegaBlock = {
  type: "three" | "two" | "single";
  items: VideoItem[];
};

export default function MegaCardBubble({ videoIds, videosById, onOpenVideo }: MegaCardBubbleProps) {
  const videos = videoIds
    .map((id) => videosById.get(id))
    .filter(Boolean) as VideoItem[];

  if (!videos.length) {
    return (
      <div className="w-full rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
        No videos to show.
      </div>
    );
  }

  const blocks: MegaBlock[] = [];
  let index = 0;
  let useThreeBlock = true;

  while (index < videos.length) {
    const remaining = videos.length - index;
    if (useThreeBlock) {
      if (remaining >= 3) {
        blocks.push({ type: "three", items: videos.slice(index, index + 3) });
        index += 3;
      } else if (remaining >= 2) {
        blocks.push({ type: "two", items: videos.slice(index, index + 2) });
        index += 2;
      } else {
        blocks.push({ type: "single", items: videos.slice(index, index + 1) });
        index += 1;
      }
    } else if (remaining >= 2) {
      blocks.push({ type: "two", items: videos.slice(index, index + 2) });
      index += 2;
    } else {
      blocks.push({ type: "single", items: videos.slice(index, index + 1) });
      index += 1;
    }
    useThreeBlock = !useThreeBlock;
  }

  const handleClick = (video: VideoItem) => {
    onOpenVideo?.(video);
  };

  return (
    <div className="w-full md:w-[min(90vw,72rem)] md:relative md:left-1/2 md:-translate-x-1/2">
      <div className="rounded-2xl border border-border bg-card shadow-[0_24px_60px_rgba(15,23,42,0.18)]">
        <div className="flex gap-4 overflow-x-auto px-4 pb-4 pt-4">
          {blocks.map((block, blockIndex) => (
            <div key={`${block.type}-${blockIndex}`} className="shrink-0 w-[18rem] sm:w-[22rem] lg:w-[26rem]">
              {block.type === "three" && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    {block.items.slice(0, 2).map((video) => (
                      <VideoCard key={video.id} video={video} onSelect={handleClick} />
                    ))}
                  </div>
                  <VideoCard video={block.items[2]} onSelect={handleClick} />
                </div>
              )}
              {block.type === "two" && (
                <div className="space-y-3">
                  {block.items.map((video) => (
                    <VideoCard key={video.id} video={video} onSelect={handleClick} />
                  ))}
                </div>
              )}
              {block.type === "single" && (
                <VideoCard video={block.items[0]} onSelect={handleClick} />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
