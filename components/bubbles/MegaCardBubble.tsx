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

function MegaVideoTile({
  video,
  onSelect,
}: {
  video: VideoItem;
  onSelect?: (video: VideoItem) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect?.(video)}
      className="group relative h-full w-full overflow-hidden rounded-xl border border-border bg-card text-left transition focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] focus:ring-offset-2 focus:ring-offset-[hsl(var(--background))]"
    >
      <img
        src={video.thumbnail}
        alt={video.title}
        loading="lazy"
        decoding="async"
        className="h-full w-full object-cover transition-transform duration-300 will-change-transform group-hover:scale-[1.02]"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[hsl(var(--foreground)/0.7)] via-transparent to-transparent opacity-70" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 p-3 text-sm font-medium leading-tight text-[hsl(var(--background))]">
        {video.title}
      </div>
    </button>
  );
}

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
                <div className="grid h-[24rem] grid-cols-2 grid-rows-6 gap-3 sm:h-[26rem] lg:h-[30rem]">
                  {block.items.slice(0, 2).map((video) => (
                    <div key={video.id} className="row-span-2">
                      <MegaVideoTile video={video} onSelect={handleClick} />
                    </div>
                  ))}
                  <div className="col-span-2 row-span-4">
                    <MegaVideoTile video={block.items[2]} onSelect={handleClick} />
                  </div>
                </div>
              )}
              {block.type === "two" && (
                <div className="grid h-[24rem] grid-rows-6 gap-3 sm:h-[26rem] lg:h-[30rem]">
                  {block.items.map((video) => (
                    <div key={video.id} className="row-span-3">
                      <MegaVideoTile video={video} onSelect={handleClick} />
                    </div>
                  ))}
                </div>
              )}
              {block.type === "single" && (
                <div className="h-[24rem] sm:h-[26rem] lg:h-[30rem]">
                  <MegaVideoTile video={block.items[0]} onSelect={handleClick} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
