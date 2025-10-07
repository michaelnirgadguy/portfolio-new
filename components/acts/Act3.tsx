"use client";
import { useEffect, useRef, useState } from "react";

type Props = { idea: string };

export default function Act3({ idea }: Props) {
  // LLM email state
  const [subject, setSubject] = useState<string>("HELP - Generating…");
  const [body, setBody] = useState<string>("Michael HELP ME! (writing email…)");

  // Video state
  const vref = useRef<HTMLVideoElement | null>(null);
  const [videoOk, setVideoOk] = useState<boolean>(true);

  // Fetch email from LLM
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/act3", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idea }),
        });
        if (!res.ok) throw new Error("bad status");
        const json = await res.json();
        if (!cancelled) {
          setSubject(typeof json.subject === "string" ? json.subject : "HELP - Mimsy Meltdown!");
          setBody(typeof json.body === "string" ? json.body : "Michael HELP ME! Could you pweeease back me up on this one?");
        }
      } catch {
        if (!cancelled) {
          setSubject("HELP - Mimsy Meltdown!");
          setBody("Michael HELP ME! The email broke. Could you pweeease back me up on this one?");
        }
      }
    })();
    return () => { cancelled = true; };
  }, [idea]);

  // Encourage autoplay + handle errors
  useEffect(() => {
    const el = vref.current;
    if (!el) return;
    const tryPlay = () => {
      el.play().catch(() => { /* some browsers need a tick; ignore */ });
    };
    el.addEventListener("canplay", tryPlay, { once: true });
    tryPlay();
    return () => el.removeEventListener("canplay", tryPlay);
  }, []);

  return (
    <section className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-md bg-black">
      {/* Video */}
      <video
        ref={vref}
        src="/vid/hamster-typing.mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        onError={() => setVideoOk(false)}
        className="absolute inset-0 w-full h-full object-cover"
      />
      {!videoOk && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-white text-sm">
          Missing video at <code className="mx-1">public/vid/hamster-typing.mp4</code>
        </div>
      )}

      {/* Email overlay */}
      <div className="absolute inset-0 bg-black/35 flex items-center justify-center p-4">
        <div className="bg-white/95 rounded-xl p-5 w-[92%] max-w-2xl font-mono text-sm shadow-lg border border-black/5">
          <div className="mb-2">
            <p><strong>Subject:</strong> {subject}</p>
          </div>
          <hr className="my-3 border-muted" />
          <div className="whitespace-pre-wrap leading-6">{body}</div>
        </div>
      </div>
    </section>
  );
}
