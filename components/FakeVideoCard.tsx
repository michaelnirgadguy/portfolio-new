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
        <p className="text-sm text-muted-foreground">
          (This is a fake generator. Real human-made videos are coming next.)
        </p>
      </div>

      {/* Fake “video” frame */}
      <div className="relative aspect-video w-full rounded-xl border bg-muted/60 overflow-hidden">
        {/* Placeholder for diffusion-style animation */}
        <div className="absolute inset-0 grid place-items-center text-sm text-muted-foreground">
          Fake diffusion animation goes here
        </div>
      </div>
    </section>
  );
}
