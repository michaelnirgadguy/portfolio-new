"use client";

type Props = {
  srcBase: string; // e.g., "/vid/disco-hamster" (without extension)
  title?: string;  // LLM-generated (fallback provided)
  client?: string; // we’ll ignore and show “you!” per spec
  text?: string;   // LLM-generated description
};

export default function HamsterSection({
  srcBase,
  title,
  client,
  text,
}: Props) {
  const safeTitle = title?.trim() || "Untitled Masterpiece (Temp)";
  const safeDesc =
    text?.trim() ||
    "No description yet. Mimsy is still polishing this shiny gem.";

  return (
    <section className="w-full">
      {/* Full-width, aligns with bottom chat container */}
      <div
        className="
          grid gap-6
          grid-cols-1
          md:grid-cols-[1.25fr,1fr]
        "
      >
      {/* Left: slightly-larger video pane */}
      <div className="w-full">
        {/* Stable 16:9 box so poster/first frame never looks “half-hidden” */}
        <div className="relative w-full aspect-video overflow-hidden rounded-2xl shadow-sm">
          <video
            className="absolute inset-0 h-full w-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            controls
            preload="metadata"
            poster={`${srcBase}.jpg`}
          >
            <source src={`${srcBase}.mp4`} type="video/mp4" />
            <source src={`${srcBase}.webm`} type="video/webm" />
            Your browser does not support the video tag.
          </video>
        </div>
      </div>


      {/* Right: metadata + description */}
      <aside className="w-full">
        <div className="space-y-5">
          {/* Title — keep strong but not oversized */}
          <h2 className="text-2xl md:text-3xl font-semibold leading-tight">
            {safeTitle}
          </h2>
      
          {/* Meta rows — consistent size/weight; accent on labels only */}
          <dl className="space-y-1 text-sm md:text-base">
            <div className="flex gap-2">
              <dt className="uppercase tracking-wide font-medium" style={{ color: "hsl(var(--accent))" }}>
                client:
              </dt>
              <dd className="text-foreground">you!</dd>
            </div>
            <div className="flex gap-2">
              <dt className="uppercase tracking-wide font-medium" style={{ color: "hsl(var(--accent))" }}>
                director, producer, genius:
              </dt>
              <dd className="text-foreground">Mimsy the hamster</dd>
            </div>
          </dl>
      
          {/* Description — regular body text */}
          <p className="text-base leading-7 whitespace-pre-wrap text-foreground/90">
            {safeDesc}
          </p>
        </div>
      </aside>

      </div>
    </section>
  );
}
