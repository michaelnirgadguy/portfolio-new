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

  // NEW — oopsie state
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

  // Fake-run mode
  if (phase === "fakeRun") {
    return (
      <CenterDock
        chat={
          <Chat
            mode="act1"
            initialUserText={idea}
            onAct1Complete={finish}
            // NEW — tell Chat how to trigger the blackout
            onAct1Oopsie={() => setOopsie(true)}
          />
        }
        top={
          // NEW — pass the oopsie flag into the card
          <FakeVideoCard oopsie={oopsie} />
        }
      />
    );
  }

  // Landing...
  return (
    <div className="min-h-[100svh] w-full bg-white grid place-items-center px-6">
      ...
    </div>
  );
}
