// components/FakeVideoCard.tsx
"use client";

type Props = {
  /** Title based on the user's prompt (we'll wire it later) */
  title?: string;
};

export default function FakeVideoCard({ title }: Props) {
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
  <video
    className="h-full w-full object-cover"
    autoPlay
    loop
    muted
    playsInline
  >
    <source src="/vid/diffusion.mp4" type="video/mp4" />
  </video>
</div>


    </section>
  );
}
