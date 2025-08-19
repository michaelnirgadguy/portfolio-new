// /app/page.tsx
"use client";

import { useMemo, useState } from "react";
import { getAllVideos } from "@/lib/videos";
import type { VideoItem } from "@/types/video";
import VideoCard from "@/components/VideoCard";
import VideoPlayer from "@/components/VideoPlayer";
import Chat from "@/components/Chat";

export default function Home() {
  const initialThree = useMemo(() => getAllVideos().slice(0, 3), []);
  const [selected, setSelected] = useState<VideoItem | null>(null);

  return (
    <main className="mx-auto max-w-5xl p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Inline Player + 3 Thumbnails (Test)</h1>

      {/* Big inline player appears after a thumbnail is clicked */}
      {selected && (
        <section className="space-y-3">
          <h2 className="text-xl font-medium">{selected.title}</h2>
          <div className="text-gray-500">{selected.client}</div>

          <VideoPlayer url={selected.url} title={selected.title} />

          {selected.description && (
            <p className="text-gray-700 leading-relaxed">{selected.description}</p>
          )}
        </section>
      )}

      {/* Three clickable thumbnails; clicking one sets selected */}
      <section>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {initialThree.map((v) => (
            <VideoCard key={v.id} video={v} onSelect={setSelected} />
          ))}
        </div>
      </section>
      {/* Chat (stubbed for now) */}
      <Chat />
    </main>
  );
}
