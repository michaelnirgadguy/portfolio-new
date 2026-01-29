// components/video-grid/mosaic.tsx
import React from "react";
import type { VideoItem } from "@/types/video";
import VideoCard from "@/components/VideoCard";

type MosaicProps = {
  videos: VideoItem[];
  onSelectId: (id: string) => void;
  className?: string;
};

/* ---------- small building blocks ---------- */
function PairGrid({
  items,
  onClick,
}: {
  items: VideoItem[];
  onClick: (id: string) => void;
}) {
  return (
    <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 bg-green-400">
      {items.map((v) => (
        <VideoCard key={v.id} video={v} onSelect={() => onClick(v.id)} />
      ))}
    </div>
  );
}

function TrioMosaic({
  items,
  onClick,
  side, // "L" (big left) or "R" (big right)
}: {
  items: [VideoItem, VideoItem, VideoItem];
  onClick: (id: string) => void;
  side: "L" | "R";
}) {
  const [A, B, C] = items;
  // gap-6 => 1.5rem; C = (16/9) * gap to convert row-gap into width difference
  const style: React.CSSProperties & Record<string, string> = {
    ["--g"]: "1.5rem",
    ["--C"]: "calc(var(--g) * 16 / 9)",
  };

  if (side === "L") {
    // Left big (same math as before)
    return (
      <div
        className="grid gap-6 md:auto-rows-auto"
        style={{
          ...style,
          gridTemplateColumns:
            "calc((2 * (100% - (var(--C) + var(--g))) / 3) + var(--C)) calc((100% - (var(--C) + var(--g))) / 3)",
        }}
      >
        <div className="row-span-2">
          <VideoCard video={A} onSelect={() => onClick(A.id)} />
        </div>
        <div>
          <VideoCard video={B} onSelect={() => onClick(B.id)} />
        </div>
        <div>
          <VideoCard video={C} onSelect={() => onClick(C.id)} />
        </div>
      </div>
    );
  }

  // Right big: mirror the columns and row-span placement
  return (
    <div
      className="grid gap-6 md:auto-rows-auto"
      style={{
        ...style,
        gridTemplateColumns:
          "calc((100% - (var(--C) + var(--g))) / 3) calc((2 * (100% - (var(--C) + var(--g))) / 3) + var(--C))",
      }}
    >
      {/* Left: two stacked small */}
      <div>
        <VideoCard video={A} onSelect={() => onClick(A.id)} />
      </div>
      <div className="row-span-2">
        <VideoCard video={B} onSelect={() => onClick(B.id)} />
      </div>
      <div>
        <VideoCard video={C} onSelect={() => onClick(C.id)} />
      </div>
    </div>
  );
}

type Block =
  | { kind: "pair"; items: [VideoItem, VideoItem] }
  | { kind: "trio"; items: [VideoItem, VideoItem, VideoItem] };

function planBlocks(videos: VideoItem[]): Block[] {
  const n = videos.length;

  if (n === 0) return [];
  if (n === 1) {
    // Fallback: just show it as a single (caller will render inside a PairGrid fine)
    return [{ kind: "pair", items: [videos[0], videos[0]] } as any];
  }
  if (n === 2) return [{ kind: "pair", items: [videos[0], videos[1]] }];
  if (n === 3)
    return [{ kind: "trio", items: [videos[0], videos[1], videos[2]] }];
  if (n === 4)
    return [
      { kind: "pair", items: [videos[0], videos[1]] },
      { kind: "pair", items: [videos[2], videos[3]] },
    ];
  if (n === 5)
    return [
      { kind: "pair", items: [videos[0], videos[1]] },
      { kind: "trio", items: [videos[2], videos[3], videos[4]] },
    ];
  if (n === 6)
    return [
      { kind: "trio", items: [videos[0], videos[1], videos[2]] },
      { kind: "trio", items: [videos[3], videos[4], videos[5]] },
    ];

  // n >= 7
  const blocks: Block[] = [];
  let i = 0;

  // Must have at least one Pair (since n != 3)
  blocks.push({ kind: "pair", items: [videos[i], videos[i + 1]] });
  i += 2;

  let useTrioNext = true; // alternate 3,2,3,2...

  while (i < n) {
    const left = n - i;

    // Avoid single leftovers by converting the previous pair into a trio
    if (left === 1) {
      const last = blocks[blocks.length - 1];
      if (last?.kind === "pair") {
        // Replace the last pair with a trio using the next item
        const [p0, p1] = last.items;
        const newTrio: Block = { kind: "trio", items: [p0, p1, videos[i]] };
        blocks[blocks.length - 1] = newTrio;
        i += 1;
        continue;
      }
      // Shouldn’t normally happen; break to avoid infinite loop
      break;
    }

    // Tail heuristics
    if (left === 4) {
      blocks.push({ kind: "pair", items: [videos[i], videos[i + 1]] });
      blocks.push({ kind: "pair", items: [videos[i + 2], videos[i + 3]] });
      i += 4;
      continue;
    }
    if (left === 3) {
      blocks.push({
        kind: "trio",
        items: [videos[i], videos[i + 1], videos[i + 2]],
      });
      i += 3;
      continue;
    }
    if (left === 2) {
      blocks.push({ kind: "pair", items: [videos[i], videos[i + 1]] });
      i += 2;
      continue;
    }

    // left >= 5: alternate Trio and Pair
    if (useTrioNext) {
      blocks.push({
        kind: "trio",
        items: [videos[i], videos[i + 1], videos[i + 2]],
      });
      i += 3;
    } else {
      blocks.push({ kind: "pair", items: [videos[i], videos[i + 1]] });
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

  // Small, explicit cases
  if (count === 2) {
    return (
      <div className={className}>
        <PairGrid items={videos} onClick={onSelectId} />
      </div>
    );
  }
  if (count === 3) {
    return (
      <div className={className}>
        <TrioMosaic
          items={[videos[0], videos[1], videos[2]]}
          onClick={onSelectId}
          side="L"
        />
      </div>
    );
  }

  // n >= 4 → plan blocks (includes 4,5,6 paths too)
  const blocks = planBlocks(videos);

  // Keep a running orientation toggle across the whole page
  let trioToggle: "L" | "R" = "L";

  return (
    // <div className={className}>
    // <div className="grid gap-6  border flex-1 m-2 p-4">
    <>
      {blocks.map((b, idx) => {
        if (b.kind === "pair") {
          return <PairGrid key={idx} items={b.items} onClick={onSelectId} />;
        }
        const side = trioToggle;
        trioToggle = trioToggle === "L" ? "R" : "L";
        return (
          <TrioMosaic
            key={idx}
            items={b.items}
            onClick={onSelectId}
            side={side}
          />
        );
      })}
    </>

    // </div>
    // </div>

    // return (
    //   <>
    //     {videos.map((v) => (
    //       <VideoCard key={v.id} video={v} onSelect={() => onSelectId(v.id)} />
    //     ))}
    //   </>
  );
}
