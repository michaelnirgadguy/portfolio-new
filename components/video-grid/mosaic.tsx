// components/video-grid/mosaic.tsx
import React from "react";
import type { VideoItem } from "@/types/video";
import VideoCard from "@/components/VideoCard";

type MosaicProps = {
  videos: VideoItem[];
  onSelectId: (id: string) => void;
  className?: string;
};

/* ---------- small helpers ---------- */
function PairGrid({
  items,
  onClick,
}: { items: VideoItem[]; onClick: (id: string) => void }) {
  return (
    <div className="grid gap-6 grid-cols-1 sm:grid-cols-2">
      {items.map((v) => (
        <VideoCard key={v.id} video={v} onSelect={() => onClick(v.id)} />
      ))}
    </div>
  );
}

function TrioMosaic({
  items,
  onClick,
}: { items: [VideoItem, VideoItem, VideoItem]; onClick: (id: string) => void }) {
  const [big, topRight, bottomRight] = items;

  // Same math as before:
  // let gap = 1.5rem (gap-6)
  // C = (16/9) * gap  → converts vertical gap to width so heights match.
  const style: React.CSSProperties & Record<string, string> = {
    ["--g"]: "1.5rem",
    ["--C"]: "calc(var(--g) * 16 / 9)",
    gridTemplateColumns:
      "calc((2 * (100% - (var(--C) + var(--g))) / 3) + var(--C)) calc((100% - (var(--C) + var(--g))) / 3)",
  };

  return (
    <div className="grid gap-6 md:auto-rows-auto" style={style}>
      <div className="row-span-2">
        <VideoCard video={big} onSelect={() => onClick(big.id)} />
      </div>
      <div>
        <VideoCard video={topRight} onSelect={() => onClick(topRight.id)} />
      </div>
      <div>
        <VideoCard video={bottomRight} onSelect={() => onClick(bottomRight.id)} />
      </div>
    </div>
  );
}

/* ---------- block planner ---------- */
function planBlocks(videos: VideoItem[]): Array<["pair", VideoItem[]] | ["trio", [VideoItem, VideoItem, VideoItem]]> {
  const n = videos.length;

  // trivial cases handled by caller
  if (n <= 3) return [];

  const blocks: Array<["pair", VideoItem[]] | ["trio", [VideoItem, VideoItem, VideoItem]]> = [];

  if (n % 2 === 0) {
    // even counts: all pairs
    for (let i = 0; i < n; i += 2) {
      blocks.push(["pair", videos.slice(i, i + 2)]);
    }
    return blocks;
  }

  // odd counts (>=5):
  // spec: first two like even mode, then group remaining into 2's + 3's,
  // where 3's use the Trio layout.
  // Strategy: take first 2, then greedily pick 3,2,3,2,... while avoiding a trailing single.
  // Handle edge remainders (like 4 → 2+2).
  blocks.push(["pair", videos.slice(0, 2)]);

  let i = 2;
  let useTrioNext = true;
  while (i < n) {
    const left = n - i;

    if (left === 4) {
      // best as 2 + 2 (avoid 3 + 1)
      blocks.push(["pair", videos.slice(i, i + 2)]);
      blocks.push(["pair", videos.slice(i + 2, i + 4)]);
      i += 4;
      continue;
    }
    if (left === 3) {
      blocks.push(["trio", videos.slice(i, i + 3) as [VideoItem, VideoItem, VideoItem]]);
      i += 3;
      continue;
    }
    if (left === 2) {
      blocks.push(["pair", videos.slice(i, i + 2)]);
      i += 2;
      continue;
    }

    // left >= 5 : alternate 3 and 2
    if (useTrioNext && left >= 3) {
      blocks.push(["trio", videos.slice(i, i + 3) as [VideoItem, VideoItem, VideoItem]]);
      i += 3;
    } else {
      blocks.push(["pair", videos.slice(i, i + 2)]);
      i += 2;
    }
    useTrioNext = !useTrioNext;
  }

  return blocks;
}

/* ---------- entry ---------- */
export function renderMosaic({ videos, onSelectId, className }: MosaicProps) {
  const count = videos.length;
  if (count === 0) return null;

  // 2 items: split 50/50
  if (count === 2) {
    return (
      <div className={className}>
        <PairGrid items={videos} onClick={onSelectId} />
      </div>
    );
  }

  // 3 items: special mosaic
  if (count === 3) {
    const [a, b, c] = videos;
    return (
      <div className={className}>
        <TrioMosaic items={[a, b, c]} onClick={onSelectId} />
      </div>
    );
  }

  // 4+ items: build blocks
  const blocks = planBlocks(videos);

  return (
    <div className={className}>
      <div className="grid gap-6">
        {blocks.map((b, idx) => {
          if (b[0] === "pair") {
            return <PairGrid key={idx} items={b[1]} onClick={onSelectId} />;
          }
          // trio
          return <TrioMosaic key={idx} items={b[1]} onClick={onSelectId} />;
        })}
      </div>
    </div>
  );
}
