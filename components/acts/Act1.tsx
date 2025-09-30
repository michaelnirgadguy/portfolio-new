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

  // animate “thinking” dots while pending/revealing
  useEffect(() => {
    const active = status === "pending" || (status === "revealing" && shown < lines.length);
    if (!active) return;
    const t = setInterval(() => setDots((d) => (d + 1) % 4), 450);
    return () => clearInterval(t);
  }, [status, shown, lines.length]);

  // reveal lines with slower cadence
  useEffect(() => {
    if (status !== "revealing") return;

    if (shown >= lines.length) {
      // all lines done → start countdown
      setStatus("countdown");
      setCount(3);
      return;
    }

    // slower fixed delay; can tune later
    const t = setTimeout(() => setShown((n) => n + 1), 1100);
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
    setStatus("pending");
    try {
      const res = await fetch("/api/act1", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea }),
      });
      const data = await res.json();
      const text = (data?.text || "").toString().trim();
      setLlmText(text || "Generating…\nStill generating…\nFAIL: video didn’t generate (mysterious reasons).");
      setShown(0);
      setStatus("revealing");
    } catch {
      setLlmText("Spinning up…\nTrying again…\nFAIL: wheel slipped; render canceled.");
      setShown(0);
      setStatus("revealing");
    }
  }

  function finish() {
    // handoff line for Chat to show instead of its generic greeting
    const handoff =
      "Okay… my movie-making magic isn’t working. Meanwhile I can show you real videos this weird human Michael actually made.";
    try { sessionStorage.setItem("mimsy_intro_override", handoff); } catch {}
    Acts.set("1");
    onDone?.();
  }

  return (
    <div className="h-full w-full bg-white">
      <div className="mx-auto max-w-7xl px-6 pt-10 pb-24 flex flex-col gap-8">
        {/* Bubble surface */}
        <section className="max-w-3xl">
          <div className="rounded-2xl border border-border bg-muted/40 p-5 shadow-sm">
            {status === "idle" && (
              <div className="text-[17px] leading-7">
                Hi, I’m Mimsy 🐹. Tell me any video idea and I’ll “generate” it…
              </div>
            )}

            {(status === "pending" || status === "revealing" || status === "countdown") && (
              <div className="space-y-3 text-[16px] leading-7">
                {/* revealed lines with a small pulsing dot prefix */}
                {lines.slice(0, shown).map((l, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="mt-[7px] inline-block h-[6px] w-[6px] rounded-full bg-current animate-pulse" />
                    <span className="whitespace-pre-wrap">{l}</span>
                  </div>
                ))}

                {/* while still revealing, show thinking dots row */}
                {status === "revealing" && shown < lines.length && (
                  <div className="h-5 text-sm text-muted-foreground/80">
                    {"•".repeat(Math.max(dots, 1))}
                  </div>
                )}

                {/* countdown after last line */}
                {status === "countdown" && (
                  <div className="text-sm text-muted-foreground/90">
                    Redirecting in {count}…
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Composer — hidden once generation starts */}
        {status === "idle" && (
          <section className="max-w-3xl">
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
