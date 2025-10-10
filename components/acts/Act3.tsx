// components/acts/Act3.tsx
"use client";
import { useEffect, useRef, useState } from "react";

type Props = { idea: string };

export default function Act3({ idea }: Props) {
  // ----- LLM targets -----
  const [subjectFull, setSubjectFull] = useState("");
  const [bodyFull, setBodyFull] = useState("");
  const [llmReady, setLlmReady] = useState(false);

  // ----- Typed states -----
  const [fromTyped, setFromTyped] = useState("");
  const [toTyped, setToTyped] = useState("");
  const [subjectTyped, setSubjectTyped] = useState("");
  const [bodyTyped, setBodyTyped] = useState("");

  // ----- Static -----
  const fromFull = "mimsy@hamster.studio";
  const toFull = "michael.nirgadguy@gmail.com";

  // ----- Video -----
  const vref = useRef<HTMLVideoElement | null>(null);
  const [videoOk, setVideoOk] = useState(true);

  // ----- Send animation -----
  const [bodyDone, setBodyDone] = useState(false);
  const [playSend, setPlaySend] = useState(false);
  const [sent, setSent] = useState(false);
  const [showToast, setShowToast] = useState(false);

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

  // From/To
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

  // Subject then body (paced)
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
        const words = bodyFull.trim().split(/\s+/).filter(Boolean).length || 1;
        const totalMs = words * 300;
        const chars = Math.max(bodyFull.length, 1);
        const perChar = Math.min(45, Math.max(8, Math.round(totalMs / chars)));

        let j = 0;
        const bTick = () => {
          j++;
          setBodyTyped(bodyFull.slice(0, j));
          if (j < bodyFull.length) {
            bI = window.setTimeout(bTick, perChar) as unknown as number;
          } else {
            // ✅ body finished
            setBodyDone(true);
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

  // Kick off the send animation once body is done
  useEffect(() => {
    if (!bodyDone || sent) return;
    const t = setTimeout(() => setPlaySend(true), 500); // small beat
    return () => clearTimeout(t);
  }, [bodyDone, sent]);

  // Encourage autoplay
  useEffect(() => {
    const el = vref.current;
    if (!el) return;
    const tryPlay = () => el.play().catch(() => {});
    el.addEventListener("canplay", tryPlay, { once: true });
    tryPlay();
    return () => el.removeEventListener("canplay", tryPlay);
  }, []);

  const showCursor = !llmReady || (!bodyTyped && !bodyFull);

  return (
    <section className="relative w-full pb-[220px]">
      {/* --- Animated overlay + toast are positioned relative to this wrapper --- */}
      <div className="relative left-20 w-full max-w-2xl mx-auto px-4 py-8">
        {/* ✅ Toast */}
        {sent && showToast && (
          <div className="pointer-events-none absolute -top-2 right-2 z-20 translate-y-[-100%] rounded-md border bg-white px-3 py-2 text-sm shadow-md">
            ✅ Sent
          </div>
        )}

        {/* Fake email window */}
        <div
          className="relative rounded-xl border border-border bg-white shadow-md overflow-hidden"
          style={{ width: "100%", height: 344 }} // +40px for footer
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

          {/* Body */}
          <div
            className="px-5 py-4 font-mono text-[15px] leading-6 whitespace-pre-wrap break-words"
            style={{ height: 192, overflow: "hidden" }}
            aria-live="polite"
          >
            {bodyTyped}
            {showCursor && (
              <span className="inline-block ml-1 w-[8px] h-[1.1em] align-[-0.15em] bg-muted-foreground/80 animate-pulse" />
            )}
          </div>

          {/* Footer with fake Send */}
          <div className="flex items-center justify-end gap-2 px-5 py-2 border-t border-border/60 bg-white/80">
            <button
              type="button"
              className="select-none rounded-full border border-input px-4 py-1.5 text-sm hover:border-[hsl(var(--accent))] shadow-sm"
              aria-label="Send email"
            >
              Send
            </button>
          </div>

          {/* 🖱️ Fake cursor + click ring */}
          {playSend && !sent && (
            <span
              className="absolute z-20 inline-block"
              style={{ animation: "cursorMove 1.9s ease-in-out forwards" }}
              onAnimationEnd={() => {
                // Simulate click
                setSent(true);
                setShowToast(true);
                // quick ripple then hide toast
                setTimeout(() => setShowToast(false), 1200);
              }}
            >
              {/* cursor shape */}
              <span className="block h-4 w-2 rounded-[2px] bg-foreground" />
              {/* click ring appears near the end using a delayed animation */}
              <span
                className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                style={{ animation: "ring 0.28s ease-out 1.7s both" }}
              >
                <span className="block h-6 w-6 rounded-full border-2 border-foreground/60" />
              </span>
            </span>
          )}

          {/* local styles for the animation path */}
          <style jsx>{`
            @keyframes cursorMove {
              /* Start somewhere over the body text */
              0% {
                transform: translate(18px, 120px);
                opacity: 0;
              }
              10% {
                opacity: 1;
              }
              /* End over the Send button (bottom-right-ish inside the window) */
              100% {
                transform: translate(calc(100% - 110px), calc(100% - 46px));
                opacity: 1;
              }
            }
            @keyframes ring {
              from {
                transform: translate(-50%, -50%) scale(0.6);
                opacity: 0.0;
              }
              to {
                transform: translate(-50%, -50%) scale(1);
                opacity: 1;
              }
            }
          `}</style>
        </div>
      </div>

      {/* PiP video */}
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
