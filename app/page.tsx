// /app/page.tsx
"use client";

import { useMemo, useState } from "react";
import { getAllVideos } from "@/lib/videos";
import type { VideoItem } from "@/types/video";
import VideoCard from "@/components/VideoCard";

function extractYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return u.pathname.slice(1) || null;
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return v;
      const parts = u.pathname.split("/");
      const i = parts.indexOf("embed");
      if (i >= 0 && parts[i + 1]) return parts[i + 1];
    }
    return null;
  } catch {
    return null;
  }
}

export default function Home() {
  const initialThree = useMemo(() => getAllVideos().slice(0, 3), []);
  const [selected, setSelected] = useState<VideoItem | null>(null);
  const videoId = selected ? extractYouTubeId(selected.url) : null;

  return (
    <main className="mx-auto max-w-5xl p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Inline Player + 3 Thumbnails (Test)</h1>

      {/* Big inline player appears after a thumbnail is clicked */}
      {selected && videoId && (
        <section className="space-y-2">
          <h2 className="text-xl font-medium">{selected.title}</h2>
          <div className="text-gray-500">{selected.client}</div>

          <div className="w-full aspect-video overflow-hidden rounded-xl shadow">
            <iframe
              src={`https://www.youtube.com/embed/${videoId}`}
              title={selected.title}
              className="w-full h-full"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>

          <p className="text-gray-700 leading-relaxed">{selected.description}</p>
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
    </main>
  );
}
