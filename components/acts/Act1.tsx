"use client";

import { useEffect, useMemo, useState } from "react";
import { Acts } from "@/lib/acts";
import { Button } from "@/components/ui/button";

export default function Act1({ onDone }: { onDone?: () => void }) {
  const [idea, setIdea] = useState("");
  const [status, setStatus] = useState<"idle" | "pending" | "revealing">("idle");
  const [llmText, setLlmText] = useState("");
  const lines = useMemo(
    () => llmText.split(/\r?\n/).map((s) => s.trim()).filter(Boolean),
    [llmText]
  );
  const [shown, setShown] = useState(0);
  const [dots, setDots] = useState(0);

  // dots animation while pending / revealing
  useEffect(() => {
    const active = status === "pending" || (status === "revealing" && shown < lines.length);
    if (!active) return;
    const t = setInterval(() => setDots((d) => (d + 1) % 4), 400);
    return () => clearInterval(t);
  }, [status, shown, lines.length]);

  // reveal lines with a small delay
  useEffect(() => {
    if (status !== "revealing") return;
    if (shown >= lines.length) {
      // All lines revealed → wait 2s → auto handoff
      const t = setTimeout(() => finish(), 2000);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setShown((n) => n + 1), 650);
    return () => clearTimeout(t);
  }, [status, shown, lines.length]);

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
    // handoff for Chat.tsx to read and show instead of the default greeting
    const handoff =
      "Okay… my movie-making magic isn’t working. Meanwhile I can show you real videos this weird human Michael actually made.";
    try { sessionStorage.setItem("mimsy_intro_override", handoff); } catch {}
    Acts.set("1");
    onDone?.();
  }

  return (
    <div className="h-full w-full bg-white">
      {/* Centered content area, like the main page's top pane */}
      <div className="mx-auto max-w-7xl px-6 pt-10 pb-24 flex flex-col gap-8">
        {/* “Chat bubble” surface */}
        <section className="max-w-3xl">
          <div className="rounded-2xl border border-border bg-muted/40 p-5 shadow-sm">
            {status === "idle" && (
              <div className="text-[17px] leading-7">
                Hi, I’m Mimsy 🐹. Tell me any video idea and I’ll “generate” it…
              </div>
            )}

            {(status === "pending" || status === "revealing") && (
              <div className="space-y-2 text-[16px] leading-7 whitespace-pre-wrap">
                {/* revealed lines */}
                {lines.slice(0, shown).map((l, i) => (
                  <div key={i}>{l}</div>
                ))}
                {/* typing dots while more lines are coming */}
                {status === "revealing" && shown < lines.length && (
                  <div className="h-5 text-sm text-muted-foreground/80">
                    {"•".repeat(Math.max(dots, 1))}
                  </div>
                )}
                {status === "pending" && (
                  <div className="h-5 text-sm text-muted-foreground/80">
                    {"•".repeat(Math.max(dots, 1))}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Composer (mirrors main site’s input look) */}
        <section className="max-w-3xl">
          <form
            onSubmit={(e) => { e.preventDefault(); run(); }}
            className="flex items-center"
          >
            <div className="w-full flex items-center gap-2 rounded-full border bg-white/70 px-3 py-2 shadow-sm backdrop-blur">
              <Button
                type="button"
                variant="outlineAccent"
                size="pill"
                onClick={() => {
                  // tiny helper to prefill a playful idea
                  if (!idea) setIdea("dogs on the moon");
                  else run();
                }}
                className="shrink-0 border-transparent hover:border-[hsl(var(--accent))]"
              >
                ✨
              </Button>

              <input
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                placeholder='e.g., "dogs on the moon"'
                disabled={status === "pending"}
                className="flex-1 bg-transparent px-2 py-1 outline-none placeholder:text-muted-foreground"
              />

              <Button
                type="submit"
                variant="outlineAccent"
                size="pill"
                disabled={status !== "idle"}
                className="shrink-0 border-transparent hover:border-[hsl(var(--accent))]"
              >
                Generate
              </Button>
            </div>
          </form>

          {/* Fallback manual continue button, only shown after reveal finishes (just in case) */}
          {status === "revealing" && shown >= lines.length && (
            <div className="mt-4 text-center">
              <Button onClick={finish}>Show Michael’s real work</Button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
