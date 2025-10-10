"use client";
import { useEffect, useRef, useState } from "react";

type Props = { idea: string };

export default function Act3({ idea }: Props) {
  // ----- LLM targets -----
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

  // ----- Send animation state -----
  const [bodyDone, setBodyDone] = useState(false);
  const [sent, setSent] = useState(false);

  // Refs for precise cursor animation
  const cardRef = useRef<HTMLDivElement | null>(null);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const sendBtnRef = useRef<HTMLButtonElement | null>(null);
  const cursorRef = useRef<HTMLSpanElement | null>(null);

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
        if (!cancelled) setLlmReady(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [idea]);

  // From/To typewriter on first mount
  useEffect(() => {
    setFromTyped("");
    setToTyped("");

    let i = 0, j = 0;
    let t1: number | null = null;
    let t2: number | null = null;

    const typeFrom = () => {
      i++;
      setFromTyped(fromFull.slice(0, i));
      if (i < fromFull.length) {
        t1 = window.setTimeout(typeFrom, 40) as unknown as number;
      } else {
        const typeTo = () => {
          j++;
          setToTyped(toFull.slice(0, j));
          if (j < toFull.length) {
            t2 = window.setTimeout(typeTo, 40) as unknown as number;
          }
        };
        t2 = window.setTimeout(typeTo, 120) as unknown as number;
      }
    };
    t1 = window.setTimeout(typeFrom, 60) as unknown as number;

    return () => {
      if (t1) window.clearTimeout(t1);
      if (t2) window.clearTimeout(t2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Subject then body: body paced to reading time (~200 wpm ≈ 300ms/word)
  useEffect(() => {
    if (!llmReady || (!subjectFull && !bodyFull)) return;

    setSubjectTyped("");
    setBodyTyped("");
    setBodyDone(false);

    let sI: number | null = null;
    let bI: number | null = null;

    let i = 0;
    const sTick = () => {
      i++;
      setSubjectTyped(subjectFull.slice(0, i));
      if (i < subjectFull.length) {
        sI = window.setTimeout(sTick, 18) as unknown as number;
      } else {
        // compute per-char delay to match reading time
        const words = bodyFull.trim().split(/\s+/).filter(Boolean).length || 1;
        const totalMs = words * 300; // 0.3s per word
        const chars = Math.max(bodyFull.length, 1);
        const perChar = Math.min(45, Math.max(8, Math.round(totalMs / chars)));

        let j = 0;
        const bTick = () => {
          j++;
          setBodyTyped(bodyFull.slice(0, j));
          if (j < bodyFull.length) {
            bI = window.setTimeout(bTick, perChar) as unknown as number;
          } else {
            setBodyDone(true); // ✅ body finished
          }
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

  // Cursor fly-to-button animation (viewport-fixed so it can’t be misaligned)
  function runSendAnimation() {
    const body = bodyRef.current;
    const btn = sendBtnRef.current;
    const cursor = cursorRef.current;
    if (!body || !btn || !cursor) return;

    const bodyBox = body.getBoundingClientRect();
    const btnBox = btn.getBoundingClientRect();

    // Start: a readable point inside the body area (left padding + first line)
    const startX = Math.round(bodyBox.left + 24);
    const startY = Math.round(bodyBox.top + Math.min(40, bodyBox.height / 3));

    // End: button center
    const endX = Math.round(btnBox.left + btnBox.width / 2);
    const endY = Math.round(btnBox.top + btnBox.height / 2);

    // Prepare cursor (fixed to viewport)
    cursor.style.opacity = "1";
    cursor.style.left = "0px";
    cursor.style.top = "0px";

    const anim = cursor.animate(
      [
        { transform: `translate(${startX}px, ${startY}px)`, offset: 0 },
        { transform: `translate(${endX}px, ${endY}px)`, offset: 1 },
      ],
      { duration: 1800, easing: "ease-in-out", fill: "forwards" }
    );

    anim.addEventListener("finish", () => {
      // Visual "press" on the button
      try {
        btn.animate(
          [
            { transform: "scale(1)", boxShadow: "0 1px 0 rgba(0,0,0,0.06)" },
            { transform: "scale(0.96)", boxShadow: "0 0 0 rgba(0,0,0,0.00)" },
            { transform: "scale(1)", boxShadow: "0 1px 0 rgba(0,0,0,0.06)" },
          ],
          { duration: 220, easing: "ease-out" }
        );
      } catch {}

      setSent(true);
      // (no toast anymore)
    });
  }

  // Kick off send animation when body is done
  useEffect(() => {
    if (!bodyDone || sent) return;
    const t = setTimeout(() => runSendAnimation(), 400); // small beat
    return () => clearTimeout(t);
  }, [bodyDone, sent]);

  // Encourage autoplay
  useEffect(() => {
    const el = vref.current;
    if (!el) return;
    const tryPlay = () => el.play().catch(() => {});
    el?.addEventListener("canplay", tryPlay, { once: true });
    tryPlay();
    return () => el?.removeEventListener("canplay", tryPlay);
  }, []);

  // Blink cursor when waiting (no body yet)
  const showCursorBlink = !llmReady || (!bodyTyped && !bodyFull);

  return (
    <section className="relative w-full pb-[220px]">
      {/* Fake email window */}
      <div className="relative left-20 w-full max-w-2xl mx-auto px-4 py-8">
        <div
          ref={cardRef}
          className="relative rounded-xl border border-border bg-white shadow-md overflow-visible"
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
              <span>{fromTyped || "\u00A0"}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-muted-foreground w-16">To:</span>
              <span>{toTyped || "\u00A0"}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-muted-foreground w-16">Subject:</span>
              <span className="align-middle">{subjectTyped || "\u00A0"}</span>
            </div>
          </div>

          {/* Body — fixed area (~8 lines) */}
          <div
            ref={bodyRef}
            className="px-5 py-4 font-mono text-[15px] leading-6 whitespace-pre-wrap break-words"
            style={{ height: 192, overflow: "hidden" }}
            aria-live="polite"
          >
            {bodyTyped}
            {showCursorBlink && (
              <span className="inline-block ml-1 w-[8px] h-[1.1em] align-[-0.15em] bg-muted-foreground/80 animate-pulse" />
            )}
          </div>

          {/* Footer with fake Send */}
          <div className="flex items-center justify-end gap-2 px-5 py-2 border-t border-border/60 bg-white/80">
            <button
              ref={sendBtnRef}
              type="button"
              className="select-none rounded-full border border-input px-4 py-1.5 text-sm shadow-sm transition-transform"
              aria-label="Send email"
            >
              Send
            </button>
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

      {/* 🖱️ Viewport-fixed fake cursor (arrow pointer SVG) */}
      <span
        ref={cursorRef}
        className="pointer-events-none fixed z-[120]"
        style={{ opacity: 0, left: 0, top: 0 }}
        aria-hidden="true"
      >
        {/* Arrow pointer (like a system cursor), small drop shadow for visibility */}
        <svg width="16" height="24" viewBox="0 0 16 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M2 2 L2 20 L6 16 L10 22 L12 21 L8 15 L14 14 Z" fill="white" stroke="black" strokeWidth="1"/>
          <filter id="ds" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="1" stdDeviation="0.6" floodColor="rgba(0,0,0,0.35)"/>
          </filter>
        </svg>
      </span>
    </section>
  );
}
