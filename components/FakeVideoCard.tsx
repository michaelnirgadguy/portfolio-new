// components/FakeVideoCard.tsx
"use client";

type Props = {
  /** Title based on the user's prompt (we'll wire it later) */
  title?: string;
  /** When true, show the blackout "Oopsie." frame instead of the diffusion video */
  oopsie?: boolean;
  /** Optional: called when the user clicks the bottom stripe */
  onShowHumanVideos?: () => void;
};

export default function FakeVideoCard({
  title,
  oopsie,
  onShowHumanVideos,
}: Props) {
  return (
    <section className="w-full h-full flex flex-col gap-3">
      {/* Title */}
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">
          {title || "Generating your hamster masterpiece..."}
        </h2>
      </div>

      {/* Fake “video” frame */}
      <div className="relative aspect-video w-full rounded-xl border bg-muted/60 overflow-hidden group">
        {oopsie ? (
          <div className="flex h-full w-full items-center justify-center bg-black">
            <span className="text-2xl font-semibold text-white">Oopsie.</span>
          </div>
        ) : (
          <video
            className="h-full w-full object-cover"
            autoPlay
            loop
            muted
            playsInline
          >
            <source src="/vid/diffusion.mp4" type="video/mp4" />
          </video>
        )}

        {/* Bottom stripe – only after Oopsie */}
        {oopsie && (
          <button
            type="button"
            onClick={onShowHumanVideos}
            className={[
              "pointer-events-auto absolute inset-x-0 bottom-0",
              "translate-y-2 opacity-0 transition duration-200",
              "group-hover:translate-y-0 group-hover:opacity-100",
              "focus-visible:translate-y-0 focus-visible:opacity-100",
              "bg-[hsl(var(--foreground)/0.72)] text-left",
            ].join(" ")}
          >
            <div className="p-3">
              <div className="text-sm font-medium leading-tight line-clamp-1 text-[hsl(var(--background))]">
                click for videos made by a Human being
              </div>
              <div className="text-xs/5 line-clamp-1 text-[hsl(var(--accent))]">
                specifically the one called Michael Nirgad Guy
              </div>
            </div>
          </button>
        )}
      </div>
    </section>
  );
}
