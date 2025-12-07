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

function buildBunnyEmbedSrc(
  url: string,
  autoplay?: boolean,
  muted?: boolean,
): string | null {
  const shouldMute = muted ?? Boolean(autoplay);

  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes("iframe.mediadelivery.net")) return null;

    const segments = parsed.pathname.split("/").filter(Boolean);
    const embedIndex = segments.indexOf("embed");
    const libraryId = embedIndex >= 0 ? segments[embedIndex + 1] : segments[0];
    const videoId = embedIndex >= 0 ? segments[embedIndex + 2] : segments[1];
    if (!libraryId || !videoId) return null;

    const embedUrl = new URL(
      `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}`,
    );

    parsed.searchParams.forEach((value, key) => {
      embedUrl.searchParams.set(key, value);
    });

    if (autoplay) embedUrl.searchParams.set("autoplay", "1");
    if (shouldMute) embedUrl.searchParams.set("muted", "1");
    embedUrl.searchParams.set("controls", "1");

    return embedUrl.toString();
  } catch {
    return null;
  }
}

function buildYouTubeEmbedSrc(
  url: string,
  autoplay?: boolean,
  muted?: boolean,
): string | null {
  const shouldMute = muted ?? Boolean(autoplay);
  const youtubeId = extractYouTubeId(url);
  if (!youtubeId) return null;

  const params = new URLSearchParams();
  if (autoplay) params.set("autoplay", "1");
  if (shouldMute) params.set("mute", "1");

  const qs = params.toString();
  const baseUrl = `https://www.youtube.com/embed/${youtubeId}`;
  return qs ? `${baseUrl}?${qs}` : baseUrl;
}

function buildEmbedSrc(url: string, autoplay?: boolean, muted?: boolean): string | null {
  return (
    buildBunnyEmbedSrc(url, autoplay, muted) ??
    buildYouTubeEmbedSrc(url, autoplay, muted)
  );
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
