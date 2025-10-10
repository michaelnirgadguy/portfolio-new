"use client";
import { useEffect, useRef, useState } from "react";

type Props = { idea: string };

export default function Act3({ idea }: Props) {
  // ----- LLM targets (start empty so no "generating" placeholders) -----
  const [subjectFull, setSubjectFull] = useState("");
  const [bodyFull, setBodyFull] = useState("");
  const [llmReady, setLlmReady] = useState(false);

  // ----- Typed states (typewriter outputs) -----
  const [fromTyped, setFromTyped] = useState("");
  const [toTyped, setToTyped] = useState("");
  const [subjectTyped, setSubjectTyped] = useState("");
  const [bodyTyped, setBodyTyped] = useState("");

  // ----- Static "full" strings for headers -----
  const fromFull = "mimsy@hamster.studio";
  const toFull = "michael.nirgadguy@gmail.com";

  // ----- Video -----
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
          setSubjectFull(typeof json.subject === "string" ? json.subject : "");
          setBodyFull(typeof json.body === "string" ? json.body : "");
          setLlmReady(true);
        }
      } catch {
        if (!cancelled) {
          // leave subject/body empty; we’ll just keep the blinking cursor
          setLlmReady(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [idea]);

  // Typewrite headers immediately (From -> To). No placeholders.
  useEffect(() => {
    setFromTyped("");
    setToTyped("");

    let i = 0, j = 0;
    let t1: number | null = null;
    let t2: number | null = null;

    const typeFrom = () => {
      i++;
      setFromTyped(fromFull.slice(0, i));
      if (i < fromFull.length) t1 = window.setTimeout(typeFrom, 14) as unknown as number;
      else {
        const typeTo = () => {
          j++;
          setToTyped(toFull.slice(0, j));
          if (j < toFull.length) t2 = window.setTimeout(typeTo, 12) as unknown as number;
        };
        t2 = window.setTimeout(typeTo, 120) as unknown as number;
      }
    };
    t1 = window.setTimeout(typeFrom, 60) as unknown as number;

    return () => {
      if (t1) window.clearTimeout(t1);
      if (t2) window.clearTimeout(t2);
    };
    // run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Typewrite subject then body ONLY after LLM arrives
  useEffect(() => {
    if (!llmReady || (!subjectFull && !bodyFull)) return;

    setSubjectTyped("");
    setBodyTyped("");
    let sI: number | null = null;
    let bI: number | null = null;

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
    sI = window.setTimeout(sTick, 120) as unknown as number;

    return () => {
      if (sI) window.clearTimeout(sI);
      if (bI) window.clearTimeout(bI);
    };
  }, [llmReady, subjectFull, bodyFull]);

  // Encourage autoplay
  useEffect(() => {
    const el = vref.current;
    if (!el) return;
    const tryPlay = () => el.play().catch(() => {});
    el.addEventListener("canplay", tryPlay, { once: true });
    tryPlay();
    return () => el.removeEventListener("canplay", tryPlay);
  }, []);

  // Blink cursor when waiting (no body yet)
  const showCursor = !llmReady || (!bodyTyped && !bodyFull);

  return (
    <section className="relative w-full pb-[220px]">
      {/* Fake email window (20% shorter & nudged ~80px right) */}
      <div className="relative left-20 w-full max-w-2xl mx-auto px-4 py-8">
        <div
          className="rounded-xl border border-border bg-white shadow-md overflow-hidden"
          style={{ width: "100%", height: 304 }} // was 380
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
            <div className="flex gap-2">
              <span className="text-muted-foreground w-16">From:</span>
              <span>{fromTyped}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-muted-foreground w-16">To:</span>
              <span>{toTyped}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-muted-foreground w-16">Subject:</span>
              <span className="align-middle">{subjectTyped || "\u00A0"}</span>
            </div>
          </div>

          {/* Body — fixed area (~8 lines), clipped, shows blinking cursor while waiting */}
          <div
            className="px-5 py-4 font-mono text-[15px] leading-6 whitespace-pre-wrap break-words"
            style={{ height: 192, overflow: "hidden" }} // was 240
            aria-live="polite"
          >
            {bodyTyped}
            {showCursor && (
              <span className="inline-block ml-1 w-[8px] h-[1.1em] align-[-0.15em] bg-muted-foreground/80 animate-pulse" />
            )}
          </div>
        </div>
      </div>

      {/* PiP video INSIDE the section, 3:2 aspect */}
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
