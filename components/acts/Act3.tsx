"use client";
import { useEffect, useMemo, useRef, useState } from "react";

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

  // ----- Video -----
  const vref = useRef<HTMLVideoElement | null>(null);
  const [videoOk, setVideoOk] = useState(true);

  // ----- Send animation -----
  const [sendPhase, setSendPhase] = useState<"idle" | "animating" | "sent">("idle");
  const [cursorStyle, setCursorStyle] = useState<{ transform: string; opacity: number }>({
    transform: "translate(24px, -6px)",
    opacity: 0,
  });

  // Fake From/To (static targets)
  const fromFull = useMemo(() => `Mimsy Hamster <mimsy@ham.ster>`, []);
  const toFull = useMemo(() => `Michael <portfolio@human.work>`, []);

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
        if (!res.ok) throw new Error("LLM failed");
        const data = (await res.json()) as { subject: string; body: string };
        if (cancelled) return;
        setSubjectFull(data.subject ?? "About your brief");
        setBodyFull(data.body ?? "Thanks! I’ll get to work right away.");
        setLlmReady(true);
      } catch {
        if (cancelled) return;
        // Fallback
        setSubjectFull("About your brilliant brief");
        setBodyFull(
          `I’ll start crafting your video now—with my hamster power, of course.\nMeanwhile, enjoy the full catalogue on the next screen.`
        );
        setLlmReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [idea]);

  // Type From then To at ~0.1s per char
  useEffect(() => {
    let t1: number | undefined;
    let t2: number | undefined;
    let i = 0;
    let j = 0;

    const typeFrom = () => {
      i++;
      setFromTyped(fromFull.slice(0, i));
      if (i < fromFull.length) {
        t1 = window.setTimeout(typeFrom, 100);
      } else {
        const typeTo = () => {
          j++;
          setToTyped(toFull.slice(0, j));
          if (j < toFull.length) {
            t2 = window.setTimeout(typeTo, 100);
          }
        };
        t2 = window.setTimeout(typeTo, 200);
      }
    };

    t1 = window.setTimeout(typeFrom, 60);
    return () => {
      if (t1) window.clearTimeout(t1);
      if (t2) window.clearTimeout(t2);
    };
  }, [fromFull, toFull]);

  // Type Subject once LLM is ready (simple ~0.1s/char)
  useEffect(() => {
    if (!llmReady || !subjectFull) return;
    let k = 0;
    let tk: number | undefined;
    const typeSubject = () => {
      k++;
      setSubjectTyped(subjectFull.slice(0, k));
      if (k < subjectFull.length) {
        tk = window.setTimeout(typeSubject, 100);
      }
    };
    tk = window.setTimeout(typeSubject, 150);
    return () => {
      if (tk) window.clearTimeout(tk);
    };
  }, [llmReady, subjectFull]);

  // Type Body at ~0.3s per word after Subject is done
  useEffect(() => {
    if (!llmReady || !subjectFull || subjectTyped !== subjectFull || !bodyFull) return;

    const words = bodyFull.split(/(\s+)/); // keep spaces to preserve formatting
    let idx = 0;
    let t: number | undefined;

    const tick = () => {
      // append next "token" (word or whitespace)
      setBodyTyped((prev) => prev + (words[idx] ?? ""));
      idx++;
      if (idx < words.length) {
        // ~0.3s per token; spaces feel faster (halve delay)
        const isSpace = /^\s+$/.test(words[idx] ?? "");
        t = window.setTimeout(tick, isSpace ? 120 : 300);
      }
    };

    // slight delay before starting to type body
    t = window.setTimeout(tick, 250);
    return () => {
      if (t) window.clearTimeout(t);
    };
  }, [llmReady, subjectFull, subjectTyped, bodyFull]);

  // When body typing finishes -> run send animation (~2s)
  useEffect(() => {
    const bodyDone = llmReady && bodyFull.length > 0 && bodyTyped.length === bodyFull.length;
    if (!bodyDone || sendPhase !== "idle") return;

    const t0 = window.setTimeout(() => {
      setSendPhase("animating");
      setCursorStyle({ transform: "translate(24px, -6px)", opacity: 1 });

      const t1 = window.setTimeout(() => {
        // Move cursor toward bottom-right where Send sits; tweak if layout changes
        setCursorStyle({ transform: "translate(520px, 176px)", opacity: 1 });

        const t2 = window.setTimeout(() => {
          setSendPhase("sent");
          const t3 = window.setTimeout(() => setCursorStyle((s) => ({ ...s, opacity: 0 })), 250);
          return () => window.clearTimeout(t3);
        }, 1600); // ~1.6s glide then click
        return () => window.clearTimeout(t2);
      }, 100);
      return () => window.clearTimeout(t1);
    }, 250);

    return () => window.clearTimeout(t0);
  }, [llmReady, bodyFull, bodyTyped, sendPhase]);

  return (
    <section className="relative mx-auto max-w-4xl w-full rounded-xl border bg-background shadow-sm overflow-hidden">
      {/* Window header */}
      <div className="flex items-center justify-between border-b px-5 py-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-400" />
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-yellow-400" />
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-400" />
          <span className="ml-3 font-medium text-foreground/80">New Message</span>
        </div>
        <div className="text-xs text-muted-foreground">Act 3</div>
      </div>

      {/* Fields */}
      <div className="relative">
        {/* From */}
        <div className="flex gap-2 px-5 pt-4">
          <span className="text-muted-foreground w-16">From:</span>
          <span className="font-mono">{fromTyped || "\u00A0"}</span>
        </div>

        {/* To */}
        <div className="flex gap-2 px-5 pt-2">
          <span className="text-muted-foreground w-16">To:</span>
          <span className="font-mono">{toTyped || "\u00A0"}</span>
        </div>

        {/* Subject (blinking cursor ONLY while waiting) */}
        <div className="flex gap-2 px-5 pt-2">
          <span className="text-muted-foreground w-16">Subject:</span>
          <span className="font-mono align-middle">
            {subjectTyped || "\u00A0"}
            {(!llmReady || !subjectTyped) && (
              <span className="inline-block ml-1 w-[8px] h-[1.1em] align-[-0.15em] bg-muted-foreground/80 animate-pulse" />
            )}
          </span>
        </div>

        {/* Divider */}
        <div className="mt-3 border-t" />

        {/* Body — fixed area (~8 lines), clipped, NO cursor */}
        <div
          className="px-5 py-4 font-mono text-[15px] leading-6 whitespace-pre-wrap break-words"
          style={{ height: 192, overflow: "hidden" }}
          aria-live="polite"
        >
          {bodyTyped}
        </div>

        {/* Footer with fake Send */}
        <div className="absolute right-4 bottom-3">
          <button
            className="px-3 py-1.5 text-sm rounded-md border border-border bg-white hover:bg-muted/50 transition"
            aria-label="Send email"
            // no onClick; sending is automated by the animation above
          >
            Send
          </button>
        </div>

        {/* Animated cursor */}
        <div
          aria-hidden
          className="pointer-events-none absolute"
          style={{
            transition: "transform 1.6s ease, opacity 0.2s linear",
            transform: cursorStyle.transform,
            opacity: cursorStyle.opacity,
          }}
        >
          {/* simple triangular cursor */}
          <div className="w-0 h-0 border-l-[10px] border-l-transparent border-t-[16px] border-t-black border-r-[6px] border-r-transparent translate-x-[-4px] translate-y-[-4px]" />
        </div>

        {/* ✅ Sent pop-up */}
        {sendPhase === "sent" && (
          <div className="absolute right-3 top-3 rounded-md bg-emerald-600 text-white text-xs px-2 py-1 shadow">
            ✅ Sent
          </div>
        )}
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
