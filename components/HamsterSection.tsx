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
          <div className="relative w-full overflow-hidden rounded-2xl shadow-sm">
            {/* If you serve MP4/WebM under the same base, use <video> with sources */}
            <video
              className="w-full h-auto"
              controls
              playsInline
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
          <div className="space-y-4">
            <h2 className="text-2xl md:text-3xl font-semibold leading-tight">
              {safeTitle}
            </h2>

            <div className="space-y-1 text-sm">
              <div className="text-muted-foreground">
                <span className="uppercase tracking-wide font-medium" style={{ color: "hsl(var(--accent))" }}>
                  client:
                </span>{" "}
                you!
              </div>
              <div className="text-muted-foreground">
                <span className="uppercase tracking-wide font-medium" style={{ color: "hsl(var(--accent))" }}>
                  director, producer, genius:
                </span>{" "}
                Mimsy the hamster
              </div>
            </div>

            <p className="text-[15px] md:text-base leading-7 whitespace-pre-wrap">
              {safeDesc}
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}
