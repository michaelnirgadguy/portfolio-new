// act1.tsx

"use client";

import { useState } from "react";
import { Acts } from "@/lib/acts";
import CenterDock from "@/components/CenterDock";
import Chat from "@/components/Chat";
import FakeVideoCard from "@/components/FakeVideoCard";

export default function Act1({ onDone }: { onDone?: () => void }) {
  const [idea, setIdea] = useState("");
  const [phase, setPhase] = useState<"landing" | "fakeRun">("landing");
  const [title, setTitle] = useState("");


  // Oopsie blackout state
  const [oopsie, setOopsie] = useState(false);

  function run() {
    if (!idea.trim()) return;
    setPhase("fakeRun");
  }

  function finish() {
    const handoff =
      "Okay… so these are Michael’s videos. They are not as good as mine but... whatever. Just click on them, or ask me anything you want!";
    try {
      sessionStorage.setItem("mimsy_intro_override", handoff);
    } catch {}
    Acts.set("1");
    onDone?.();
  }

  // Phase B — Fake-run screen
  if (phase === "fakeRun") {
    return (
      <CenterDock
        chat={
          <Chat
            mode="act1"
            initialUserText={idea}
            onAct1Complete={finish}
            onAct1Oopsie={() => setOopsie(true)}
            onAct1Title={(t) => setTitle(t)}
          />
        }
       top={
        <FakeVideoCard
          title={title}
          oopsie={oopsie}
          onShowHumanVideos={finish}
        />

        }
      />
    );
  }

  // Phase A — Landing screen
  return (
    <div className="min-h-[100svh] w-full bg-white grid place-items-center px-6">
      <div className="w-full max-w-2xl grid gap-6">
        <section className="rounded-2xl border border-border bg-muted/40 p-5 shadow-sm">
          <div className="text-[17px] leading-7 text-center">
            <img
              src="/tiny-Mimsy.png"
              alt="Mimsy"
              className="mx-auto mb-3 h-20 w-20"
            />
            Hi, I’m Mimsy, a hamster, a film creator, a genius! Tell me any
            video idea and I’ll generate it for you…
          </div>
        </section>

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
      </div>
    </div>
  );
}
