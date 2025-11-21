"use client";

import { useEffect, useMemo, useState } from "react";
import { Acts } from "@/lib/acts";
import CenterDock from "@/components/CenterDock";
import Chat from "@/components/Chat";
import FakeVideoCard from "@/components/FakeVideoCard";


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
  const [phase, setPhase] = useState<"landing" | "fakeRun">("landing");

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

    if (shown === 0 && lines.length > 0) {
      setShown(1);
      return;
    }

    if (shown >= lines.length) {
      setStatus("countdown");
      setCount(5); // 5 seconds total
      return;
    }

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
  if (!idea.trim()) return;

  // Just switch Act 1 into the main layout with chat + fake video.
  // All the LLM / multi-line script is now handled by the chat driver.
  setPhase("fakeRun");
}


  function finish() {
    const handoff =
      "Okay… so these are Michaels video. they are not as good as mine but... whatever. just click on them. or ask me anything you want!";
    try {
      sessionStorage.setItem("mimsy_intro_override", handoff);
    } catch {}
    Acts.set("1");
    onDone?.();
  }

  // NEW: once we leave the landing screen, show the real layout:
  // chat on the left (in Act 1 mode) and a fake video card on the right.
if (phase === "fakeRun") {
  return (
    <CenterDock
      chat={
        <Chat
          mode="act1"
          onAct1Complete={finish}
          initialUserText={idea}
        />
      }
      top={<FakeVideoCard />}
    />
  );
}


  // Default: landing screen (old Act 1 UI)

  return (
    <div className="min-h-[100svh] w-full bg-white grid place-items-center px-6">
      <div className="w-full max-w-2xl grid gap-6">
        {/* Log surface */}
        <section className="rounded-2xl border border-border bg-muted/40 p-5 shadow-sm">
        {status === "idle" && (
          <div className="text-[17px] leading-7 text-center">
            <img
              src="/tiny-Mimsy.png"
              alt="Mimsy"
              className="mx-auto mb-3 h-20 w-20"
              /* disappears automatically once status !== "idle" */
            />
            Hi, I’m Mimsy, a hamster, a film creator a genius! Tell me any video idea and I’ll
            generate it for you…
          </div>
        )}


          {(status === "pending" || status === "revealing" || status === "countdown") && (
            <div className="space-y-4 font-mono text-[18px] leading-8">
            {/* revealed lines */}
            {lines.slice(0, shown).map((l, i) => {
              const isLastVisible =
                i === shown - 1 &&
                (status === "pending" || status === "revealing" || status === "countdown");
          
              return (
                <div key={i} className="grid grid-cols-[64px,1fr] gap-3 items-center">
                  {isLastVisible && status !== "countdown" ? (
                    // active line → hamster wheel (two-line height, centered)
                    <span className="relative inline-block shrink-0 h-16 w-16" style={{ overflow: "visible" }}>
                      <span
                        className="hamster-wheel absolute left-1/2 top-1/2"
                        style={{ transform: "translate(-50%, -50%) scale(0.60)", transformOrigin: "center" }}
                      />
                    </span>
                  ) : (
                    // finished lines → small dot centered within the 64px column
                    <span className="inline-flex items-center justify-center h-16 w-16">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/70" />
                    </span>
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
              <div className="grid grid-cols-[64px,1fr] gap-3 items-center text-muted-foreground/90">
                <span className="relative inline-block shrink-0 h-16 w-16" style={{ overflow: "visible" }}>
                  <span
                    className="hamster-wheel absolute left-1/2 top-1/2"
                    style={{ transform: "translate(-50%, -50%) scale(0.60)", transformOrigin: "center" }}
                  />
                </span>
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
              onSubmit={(e) => {
                e.preventDefault();
                run();
              }}
              className="flex items-center"
            >
              <div className="w-full flex items-center gap-2 rounded-full border bg-white/70 px-3 py-2 shadow-sm backdrop-blur">
                <button
                  type="button"
                  onClick={() => {
                    if (!idea) setIdea("dogs on the moon");
                    else run();
                  }}
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
