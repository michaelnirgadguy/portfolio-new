// components/FakeVideoCard.tsx
"use client";

type Props = {
  /** Title based on the user's prompt (we'll wire it later) */
  title?: string;
  /** When true, show the blackout "Oopsie." frame instead of the diffusion video */
  oopsie?: boolean;
};

export default function FakeVideoCard({ title, oopsie }: Props) {
  return (
    <section className="w-full h-full flex flex-col gap-3">
      {/* Title */}
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">
          {title || "Generating your hamster masterpiece..."}
        </h2>
      </div>

      {/* Fake “video” frame */}
      <div className="relative aspect-video w-full rounded-xl border bg-muted/60 overflow-hidden">
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
      </div>
    </section>
  );
}
