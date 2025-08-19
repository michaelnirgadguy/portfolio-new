// /app/page.tsx
import { getAllVideos } from "@/lib/videos";
import VideoCard from "@/components/VideoCard";

export default function Home() {
  const videos = getAllVideos().slice(0, 3); // just 3 for test

  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="text-2xl font-semibold mb-4">Test: 3 Thumbnails</h1>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {videos.map((v) => (
          <VideoCard key={v.id} video={v} />
        ))}
      </div>
    </main>
  );
}
