// /components/VideoPlayer.tsx

type Props = {
  url: string;           // can be a Bunny iframe URL or a YouTube URL
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
  let src: string | null = null;

  // 1) If it's a Bunny iframe URL, use it as-is
  if (url.includes("iframe.mediadelivery.net")) {
    src = url;
    // (Optional) If you want autoplay with Bunny and it supports it in your library,
    // you can append query params here, e.g.:
    // if (autoplay) src += (url.includes("?") ? "&" : "?") + "autoplay=1&muted=1";
  } else {
    // 2) Fallback: treat as YouTube URL (for videos you haven't migrated yet)
    const id = extractYouTubeId(url);
    if (!id) return null;
    src = `https://www.youtube.com/embed/${id}${
      autoplay ? "?autoplay=1&mute=1" : ""
    }`;
  }

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
