// act1.tsx

"use client";

import { useEffect, useState } from "react";
import { Acts } from "@/lib/acts";
import CenterDock from "@/components/CenterDock";
import FakeVideoCard from "@/components/FakeVideoCard";
import Act1Chat from "@/components/Act1Chat";
import ChatGlowBorder from "@/components/ChatGlowBorder";

export default function Act1({ onDone }: { onDone?: () => void }) {
  const [idea, setIdea] = useState("");
  const [phase, setPhase] = useState<"landing" | "fakeRun">("landing");
  const [title, setTitle] = useState("");

  // Oopsie blackout state
  const [oopsie, setOopsie] = useState(false);

  // Glow for input after inactivity
  const [inputGlow, setInputGlow] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    if (hasInteracted) return;

    const timer = setTimeout(() => {
      setInputGlow(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, [hasInteracted]);

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
              Tell me you idea for a video - and  I’ll generate it for you!
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setHasInteracted(true);
                setInputGlow(false);
                run();
              }}
              className="flex items-center"
            >
              <div className="w-full">
                <div
                  className={
                    "relative w-full flex items-center gap-2 rounded-full border bg-white/70 px-3 py-2 shadow-sm backdrop-blur" +
                    (inputGlow
                      ? " ring-2 ring-[hsl(var(--accent))] ring-offset-2 ring-offset-background"
                      : "")
                  }
                >
                  <ChatGlowBorder active={inputGlow} />

                  <input
                    value={idea}
                    autoFocus
                    onChange={(e) => {
                      setIdea(e.target.value);
                      if (!hasInteracted) setHasInteracted(true);
                      setInputGlow(false);
                    }}
                    onFocus={() => {
                      if (!hasInteracted) setHasInteracted(true);
                      setInputGlow(false);
                    }}
                    placeholder='try "dogs dancing on the moon"'
                    className="flex-1 bg-transparent px-2 py-1 outline-none placeholder:text-muted-foreground"
                  />

                  <button
                    type="submit"
                    className="shrink-0 rounded-full h-10 px-4 border border-input hover:border-[hsl(var(--accent))] transition"
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
