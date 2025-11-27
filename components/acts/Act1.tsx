// act1.tsx

"use client";

import { useState } from "react";
import { Acts } from "@/lib/acts";
import CenterDock from "@/components/CenterDock";
import FakeVideoCard from "@/components/FakeVideoCard";
import Act1Chat from "@/components/Act1Chat";

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
      <div className="h-[100svh] w-full bg-background">
        <CenterDock
          chat={
            <Act1Chat
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
      </div>
    );
  }

  // Phase A — Landing screen
  return (
    <div className="min-h-[100svh] w-full bg-white grid place-items-center px-6">
      <div className="w-full max-w-2xl">
        <section className="text-center space-y-4">
          <img
            src="/tiny-Mimsy.png"
            alt="Mimsy"
            className="mx-auto h-20 w-20"
          />

          {/* Line A – big & bold under the image */}
          <p className="text-[18px] font-semibold leading-7">
            Hi, I’m Mimsy, a hamster, a film creator, a genius!
          </p>

          {/* Line B + input feel like one block */}
          <div className="space-y-2">
            <p className="text-[16px] leading-7">
              Tell me you idea for a video - and I’ll generate it for you
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                run();
              }}
              className="flex items-center"
            >
              <div className="w-full">
                <div className="relative w-full flex items-center gap-2 rounded-full border bg-white/70 px-3 py-2 shadow-sm backdrop-blur">
                  <input
                    value={idea}
                    autoFocus
                    onChange={(e) => {
                      setIdea(e.target.value);
                    }}
                    placeholder='try "dogs dancing on the moon"'
                    className="flex-1 bg-transparent px-2 py-1 outline-none placeholder:text-muted-foreground"
                  />

                  <button
                    type="submit"
                    className="shrink-0 rounded-full h-10 px-5 border border-transparent bg-[hsl(var(--accent))] text-sm font-medium text-white transition hover:bg-[hsl(var(--accent))]/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--accent))] focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    Generate
                  </button>
                </div>
              </div>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
