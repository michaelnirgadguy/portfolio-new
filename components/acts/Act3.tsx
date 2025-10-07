"use client";
import { useEffect, useRef, useState } from "react";

type Props = { idea: string };

export default function Act3({ idea }: Props) {
  // LLM email (full text)
  const [subjectFull, setSubjectFull] = useState("HELP - Generating…");
  const [bodyFull, setBodyFull] = useState("Michael HELP ME! (writing email…)");

  // Typewriter
  const [subjectTyped, setSubjectTyped] = useState("");
  const [bodyTyped, setBodyTyped] = useState("");

  // Video
  const vref = useRef<HTMLVideoElement | null>(null);
  const [videoOk, setVideoOk] = useState(true);

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
          setSubjectFull(typeof json.subject === "string" ? json.subject : "HELP - Mimsy Meltdown!");
          setBodyFull(
            typeof json.body === "string"
              ? json.body
              : "Michael HELP ME! Could you pweeease back me up on this one?"
          );
        }
      } catch {
        if (!cancelled) {
          setSubjectFull("HELP - Mimsy Meltdown!");
          setBodyFull("Michael HELP ME! The email broke. Could you pweeease back me up on this one?");
        }
      }
    })();
    return () => { cancelled = true; };
  }, [idea]);

  // Typewriter: subject, then body
  useEffect(() => {
    let sI: number | null = null;
    let bI: number | null = null;
    setSubjectTyped("");
    setBodyTyped("");

    let i = 0;
    const sTick = () => {
      i++;
      setSubjectTyped(subjectFull.slice(0, i));
      if (i < subjectFull.length) sI = window.setTimeout(sTick, 18) as unknown as number;
      else {
        let j = 0;
        const bTick = () => {
          j++;
          setBodyTyped(bodyFull.slice(0, j));
          if (j < bodyFull.length) bI = window.setTimeout(bTick, 10) as unknown as number;
        };
        bI = window.setTimeout(bTick, 120) as unknown as number;
      }
    };
    sI = window.setTimeout(sTick, 100) as unknown as number;

    return () => {
      if (sI) window.clearTimeout(sI);
      if (bI) window.clearTimeout(bI);
    };
  }, [subjectFull, bodyFull]);

  // Encourage autoplay
  useEffect(() => {
    const el = vref.current;
    if (!el) return;
    const tryPlay = () => el.play().catch(() => {});
    el.addEventListener("canplay", tryPlay, { once: true });
    tryPlay();
    return () => el.removeEventListener("canplay", tryPlay);
  }, []);

  return (
    <section className="relative w-full">
      {/* Clean email card (centered, no gray box/overlay) */}
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="rounded-xl border border-border bg-white shadow-md p-5 font-mono text-[15px] leading-6">
          <p className="mb-2">
            <strong>Subject:</strong>{" "}
            <span className="align-middle">{subjectTyped || "\u00A0"}</span>
          </p>
          <hr className="my-3 border-border/70" />
          <div className="whitespace-pre-wrap" aria-live="polite">{bodyTyped}</div>
        </div>
      </div>

      {/* Picture-in-picture video (bottom-left), non-interactive so it never overlaps clicks */}
      <div className="pointer-events-none fixed left-5 bottom-5 z-10">
        <div className="relative w-[300px] aspect-video rounded-xl overflow-hidden shadow-md bg-black">
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
            <div className="absolute inset-0 grid place-items-center bg-black/70 text-white text-xs px-2 text-center">
              Missing video at <code className="mx-1">public/vid/hamster-typing.mp4</code>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
