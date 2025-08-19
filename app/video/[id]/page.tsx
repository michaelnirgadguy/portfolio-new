import { notFound } from "next/navigation";
import { getVideoById } from "@/lib/videos";

export default function VideoPage({ params }: any) {
  const video = getVideoById(params.id);
  if (!video) return notFound();

  const url = new URL(video.url);
  let videoId = "";
  if (url.hostname.includes("youtu.be")) {
    videoId = url.pathname.slice(1);
  } else {
    videoId = url.searchParams.get("v") ?? "";
  }

  return (
    <main className="mx-auto max-w-3xl p-6 space-y-4">
      <h1 className="text-2xl font-semibold">{video.title}</h1>
      <div className="text-gray-500">{video.client}</div>

      <div className="w-full aspect-video overflow-hidden rounded-xl shadow">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}`}
          title={video.title}
          className="w-full h-full"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>

      <p className="text-gray-700 leading-relaxed">{video.description}</p>
    </main>
  );
}
