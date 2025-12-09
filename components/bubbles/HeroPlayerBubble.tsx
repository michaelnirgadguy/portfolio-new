import VideoPlayer from "@/components/VideoPlayer";
import { getVideoById } from "@/lib/videos";

export default function HeroPlayerBubble({ videoId }: { videoId: string }) {
  const video = getVideoById(videoId);

  if (!video) {
    return (
      <div className="w-full rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
        Missing video.
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <VideoPlayer url={video.url} title={video.title} className="bg-black" autoplay />

      <div className="p-4 sm:p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
          <div className="flex-1 space-y-1">
            <div className="text-lg font-semibold leading-tight">{video.title}</div>
            <div className="text-sm text-muted-foreground">{video.client}</div>
          </div>

          {video.display_credits ? (
            <div className="sm:flex sm:min-w-[14rem] sm:justify-end">
              <div className="whitespace-pre-line text-sm text-muted-foreground sm:text-left">
                {video.display_credits}
              </div>
            </div>
          ) : (
            <div className="hidden sm:invisible sm:block sm:min-w-[14rem]" aria-hidden />
          )}
        </div>
      </div>
    </div>
  );
}
