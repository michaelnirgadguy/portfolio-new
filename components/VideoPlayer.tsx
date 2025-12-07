// /components/VideoPlayer.tsx
"use client";

type Props = {
  url: string; // Bunny iframe URL or YouTube URL
  title?: string;
  className?: string;
  autoplay?: boolean;
  muted?: boolean;
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

function buildEmbedSrc(url: string, autoplay?: boolean, muted?: boolean): string | null {
  const shouldMute = muted ?? Boolean(autoplay);

  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.hostname.includes("iframe.mediadelivery.net")) {
      if (autoplay) parsedUrl.searchParams.set("autoplay", "1");
      if (shouldMute) parsedUrl.searchParams.set("muted", "1");
      parsedUrl.searchParams.set("controls", "1");
      return parsedUrl.toString();
    }
  } catch {
    // ignore URL parsing failures for Bunny URLs
  }

  const youtubeId = extractYouTubeId(url);
  if (!youtubeId) return null;

  const params = new URLSearchParams();
  if (autoplay) params.set("autoplay", "1");
  if (shouldMute) params.set("mute", "1");
  const qs = params.toString();

  const baseUrl = `https://www.youtube.com/embed/${youtubeId}`;
  return qs ? `${baseUrl}?${qs}` : baseUrl;
}

export default function VideoPlayer({
  url,
  title,
  className,
  autoplay,
  muted,
}: Props) {
  const src = buildEmbedSrc(url, autoplay, muted);

  if (!src) {
    return (
      <div className={`w-full ${className ?? ""}`}>
        <div className="aspect-video overflow-hidden rounded-xl shadow bg-muted flex items-center justify-center text-sm text-muted-foreground">
          Unable to load video. Please verify the video URL.
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full ${className ?? ""}`}>
      <div className="aspect-video overflow-hidden rounded-xl shadow">
        <iframe
          src={src}
          title={title ?? "Video player"}
          className="w-full h-full"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
          allowFullScreen
        />
      </div>
    </div>
  );
}
