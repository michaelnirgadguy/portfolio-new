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
  <section className="relative w-full pb-[220px]"> {/* room for 300×(3:2)=200px PiP + padding */}
    {/* Fake email window (fixed size, no growth) */}
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <div
        className="rounded-xl border border-border bg-white shadow-md overflow-hidden"
        style={{ width: "100%", height: 380 }}
        role="group"
        aria-label="Email window"
      >
        {/* Window chrome */}
        <div className="flex items-center justify-between px-4 h-10 border-b border-border/70 bg-muted/30">
          <div className="flex gap-2">
            <span className="h-3 w-3 rounded-full bg-red-400 inline-block" />
            <span className="h-3 w-3 rounded-full bg-yellow-400 inline-block" />
            <span className="h-3 w-3 rounded-full bg-green-400 inline-block" />
          </div>
          <div className="text-xs text-muted-foreground">Mimsy Mail</div>
        </div>

        {/* Headers */}
        <div className="px-5 py-3 text-[13px] font-mono border-b border-border/60">
          <div className="flex gap-2"><span className="text-muted-foreground w-16">From:</span><span>mimsy@hamster.studio</span></div>
          <div className="flex gap-2"><span className="text-muted-foreground w-16">To:</span><span>Michael &lt;you@portfolio&gt;</span></div>
          <div className="flex gap-2">
            <span className="text-muted-foreground w-16">Subject:</span>
            <span className="align-middle">{subjectTyped || "\u00A0"}</span>
          </div>
        </div>

        {/* Body (fixed area, clipped to ~8 lines) */}
        <div
          className="px-5 py-4 font-mono text-[15px] leading-6 whitespace-pre-wrap break-words"
          style={{ height: 240, overflow: "hidden" }}
          aria-live="polite"
        >
          {bodyTyped}
        </div>
      </div>
    </div>

    {/* PiP video INSIDE the section, 3:2 aspect, no overlap with email */}
    <div className="pointer-events-none absolute left-5 bottom-5 z-10">
      <div className="relative w-[300px] aspect-[3/2] rounded-xl overflow-hidden shadow-md bg-black">
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
