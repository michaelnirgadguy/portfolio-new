"use client";

type Props = { idea: string };

export default function Act3({ idea }: Props) {
  return (
    <section className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-md">
      <video
        src="/vid/hamster-typing.mp4"
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Fake email overlay */}
      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
        <div className="bg-white/95 rounded-xl p-6 w-[90%] max-w-2xl font-mono text-sm shadow-lg">
          <p><strong>To:</strong> Michael</p>
          <p><strong>Subject:</strong> HELP! The client wants a video about "{idea}"</p>
          <hr className="my-3 border-muted" />
          <p>
            Michael, the client wants a video about "{idea}". You were right —
            I’m just a hamster! Maybe you can talk to them? Pweety please??
          </p>
        </div>
      </div>
    </section>
  );
}
