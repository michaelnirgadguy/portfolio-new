// /components/VideoPlayer.tsx
type Props = {
  url: string;           // full YouTube URL (youtu.be or youtube.com/watch?v=...)
  title?: string;        // optional: for accessibility
  className?: string;    // optional: let parent control spacing/layout
  autoplay?: boolean;    // optional: start playing automatically
};

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

export default function VideoPlayer({ url, title, className, autoplay }: Props) {
  const id = extractYouTubeId(url);
  if (!id) return null;

  const src = `https://www.youtube.com/embed/${id}${autoplay ? "?autoplay=1&mute=1" : ""}`;

  return (
    <div className={`w-full aspect-video overflow-hidden rounded-xl shadow ${className ?? ""}`}>
      <iframe
        src={src}
        title={title ?? "Video player"}
        className="w-full h-full"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
  );
}
