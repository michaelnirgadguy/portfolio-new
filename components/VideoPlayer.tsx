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

function buildEmbedSrc(url: string, autoplay?: boolean, muted?: boolean): {
  src: string | null;
  isBunny: boolean;
} {
  const shouldMute = muted ?? Boolean(autoplay);
  let isBunny = false;

  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.hostname.includes("iframe.mediadelivery.net")) {
      isBunny = true;
      if (autoplay && !parsedUrl.searchParams.has("autoplay")) {
        parsedUrl.searchParams.set("autoplay", "1");
      }
      if (shouldMute && !parsedUrl.searchParams.has("muted")) {
        parsedUrl.searchParams.set("muted", "1");
      }
      return { src: parsedUrl.toString(), isBunny };
    }
  } catch {
    // If URL parsing fails but we still have a Bunny URL, fall back to string concatenation.
    if (url.includes("iframe.mediadelivery.net")) {
      isBunny = true;
      const params = new URLSearchParams();
      if (autoplay) params.set("autoplay", "1");
      if (shouldMute) params.set("muted", "1");
      const qs = params.toString();
      if (!qs) return { src: url, isBunny };
      const withParams = url.includes("?") ? `${url}&${qs}` : `${url}?${qs}`;
      return { src: withParams, isBunny };
    }
  }

  const youtubeId = extractYouTubeId(url);
  if (!youtubeId) return { src: null, isBunny };

  const params = new URLSearchParams();
  if (autoplay) params.set("autoplay", "1");
  if (shouldMute) params.set("mute", "1");
  const qs = params.toString();

  const baseUrl = `https://www.youtube.com/embed/${youtubeId}`;
  return { src: qs ? `${baseUrl}?${qs}` : baseUrl, isBunny };
}

export default function VideoPlayer({
  url,
  title,
  className,
  autoplay,
  muted,
}: Props) {
  const { src, isBunny } = buildEmbedSrc(url, autoplay, muted);

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
          allow={
            isBunny
              ? "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              : "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen; web-share"
          }
          allowFullScreen
          loading="lazy"
          referrerPolicy={isBunny ? "strict-origin-when-cross-origin" : undefined}
        />
      </div>
    </div>
  );
}
