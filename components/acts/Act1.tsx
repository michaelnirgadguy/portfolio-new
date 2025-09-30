"use client";

import { useEffect, useMemo, useState } from "react";
import { Acts } from "@/lib/acts";

export default function Act1({ onDone }: { onDone?: () => void }) {
  const [idea, setIdea] = useState("");
  const [status, setStatus] = useState<"idle" | "pending" | "revealing" | "countdown">("idle");
  const [llmText, setLlmText] = useState("");
  const lines = useMemo(
    () => llmText.split(/\r?\n/).map((s) => s.trim()).filter(Boolean),
    [llmText]
  );
  const [shown, setShown] = useState(0);
  const [dots, setDots] = useState(0);
  const [count, setCount] = useState(3);

  // animate thinking dots while pending/revealing
  useEffect(() => {
    const active = status === "pending" || (status === "revealing" && shown < lines.length);
    if (!active) return;
    const t = setInterval(() => setDots((d) => (d + 1) % 4), 450);
    return () => clearInterval(t);
  }, [status, shown, lines.length]);

  // reveal lines with controllable cadence
useEffect(() => {
  if (status !== "revealing") return;

  // nothing shown yet → show first line instantly
  if (shown === 0 && lines.length > 0) {
    setShown(1);
    return;
  }

  // all lines revealed → start countdown
  if (shown >= lines.length) {
    setStatus("countdown");
    setCount(5); // 5 seconds total
    return;
  }

  // delay between lines (adjust here!)
  const delay = 3500; // 3.5 seconds per line
  const t = setTimeout(() => setShown((n) => n + 1), delay);
  return () => clearTimeout(t);
}, [status, shown, lines.length]);


  // countdown then finish
  useEffect(() => {
    if (status !== "countdown") return;
    if (count <= 0) {
      finish();
      return;
    }
    const t = setTimeout(() => setCount((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [status, count]);

  async function run() {
    if (!idea.trim() || status !== "idle") return;
    setStatus("pending"); // immediately show a log row (no blank)
    try {
      const res = await fetch("/api/act1", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea }),
      });
      const data = await res.json();
      const text = (data?.text || "").toString().trim();
      setLlmText(text || "Initializing shrinking process...\nCalculating size reduction ratios...\nFAIL: video didn’t generate (mysterious reasons).");
      setShown(0);
      setStatus("revealing");
    } catch {
      setLlmText("Spinning up…\nTrying again…\nFAIL: wheel slipped; render canceled.");
      setShown(0);
      setStatus("revealing");
    }
  }

  function finish() {
    const handoff =
      "Okay… my movie-making magic isn’t working. Meanwhile I can show you real videos this weird human Michael actually made.";
    try { sessionStorage.setItem("mimsy_intro_override", handoff); } catch {}
    Acts.set("1");
    onDone?.();
  }

  return (
    <div className="min-h-[100svh] w-full bg-white grid place-items-center px-6">
      <div className="w-full max-w-2xl grid gap-6">
        {/* Log surface */}
        <section className="rounded-2xl border border-border bg-muted/40 p-5 shadow-sm">
          {status === "idle" && (
            <div className="text-[17px] leading-7">
              Hi, I’m Mimsy, a hamster, a film creator a genius! Tell me any video idea and I’ll generate it for you…
            </div>
          )}

          {(status === "pending" || status === "revealing" || status === "countdown") && (
            <div className="space-y-3 font-mono text-[15px] leading-7">
              {/* revealed lines */}
              {lines.slice(0, shown).map((l, i) => {
                const isLastVisible =
                  i === shown - 1 &&
                  (status === "pending" || status === "revealing" || status === "countdown");
              
                return (
                  <div key={i} className="grid grid-cols-[16px,1fr] gap-3 items-start">
                    {isLastVisible && status !== "countdown" ? (
                      <span className="mt-0.5 inline-block h-[14px] w-[14px] rounded-full border-2 border-muted-foreground/70 border-t-transparent animate-spin" />
                    ) : (
                      <span className="mt-1 inline-block h-[6px] w-[6px] rounded-full bg-muted-foreground/70" />
                    )}
                    <span className="whitespace-pre-wrap">
                      {(() => {
                        if (isLastVisible && status === "countdown") {
                          return `${l}  Redirecting in ${count}…`;
                        }
                        if (isLastVisible) {
                          return l + " " + ".".repeat(Math.max(dots, 1));
                        }
                        return l;
                      })()}
                    </span>
                  </div>
                );
              })}

              
              {/* if still pending and no first line yet, show placeholder */}
              {status === "pending" && shown === 0 && (
                <div className="grid grid-cols-[16px,1fr] gap-3 items-start text-muted-foreground/90">
                  <span className="mt-0.5 inline-block h-[14px] w-[14px] rounded-full border-2 border-muted-foreground/70 border-t-transparent animate-spin" />
                  <span>{".".repeat(Math.max(dots, 1))}</span>
                </div>
              )}
              
          
            </div>
          )}
        </section>

        {/* Composer — hidden once generation starts */}
        {status === "idle" && (
          <section>
            <form
              onSubmit={(e) => { e.preventDefault(); run(); }}
              className="flex items-center"
            >
              <div className="w-full flex items-center gap-2 rounded-full border bg-white/70 px-3 py-2 shadow-sm backdrop-blur">
                <button
                  type="button"
                  onClick={() => { if (!idea) setIdea("dogs on the moon"); else run(); }}
                  title="Generate a prompt"
                  aria-label="Generate a prompt"
                  className="shrink-0 rounded-full h-10 px-3 border border-transparent hover:border-[hsl(var(--accent))] transition"
                >
                  ✨
                </button>

                <input
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  placeholder='e.g., "dogs on the moon"'
                  className="flex-1 bg-transparent px-2 py-1 outline-none placeholder:text-muted-foreground"
                />

                <button
                  type="submit"
                  className="shrink-0 rounded-full h-10 px-4 border border-input hover:border-[hsl(var(--accent))] transition"
                >
                  Generate
                </button>
              </div>
            </form>
          </section>
        )}
      </div>
    </div>
  );
}
