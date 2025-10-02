// components/HamsterSection.tsx
// Player left (bigger), meta right (slim panel), text underneath—matching VideoSection vibe.

import HamsterClip from "@/components/acts/HamsterClip";

type Props = {
  /** Base path for the local clip, e.g. "/vid/disco-hamster" (no extension) */
  srcBase: string;
  /** UI meta so it feels like a “real” portfolio entry */
  title: string;        // e.g., "Disco Hamster"
  client?: string;      // e.g., "Mimsy Stock"
  /** The Mimsy justification/excuse text returned by Act 2 API */
  text: string;
  className?: string;
};

export default function HamsterSection({ srcBase, title, client, text, className }: Props) {
  return (
    <section className={`w-full ${className ?? ""}`}>
      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_320px]">
        {/* Left: local video */}
        <div>
          <HamsterClip srcBase={srcBase} />
        </div>

        {/* Right: meta panel (title, client) */}
        <aside className="space-y-2">
          <h2 className="heading-primary">{title}</h2>
          {client && <div className="meta-secondary">{client}</div>}
        </aside>
      </div>

      {/* Bottom: justification text */}
      <div className="mt-4 whitespace-pre-wrap text-[15px] leading-7">
        {text}
      </div>
    </section>
  );
}
