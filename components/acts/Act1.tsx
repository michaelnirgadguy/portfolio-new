"use client";

import { useState } from "react";
import { Acts } from "@/lib/acts";
import { Button } from "@/components/ui/button";

export default function Act1({ onDone }: { onDone?: () => void }) {
  const [idea, setIdea] = useState("");
  const [status, setStatus] = useState<"idle" | "pending" | "ready">("idle");
  const [llmText, setLlmText] = useState("");

  async function run() {
    if (!idea.trim()) return;
    setStatus("pending");
    try {
      const res = await fetch("/api/act1", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea }),
      });
      const data = await res.json();
      setLlmText(data.text || "Generation failed mysteriously.");
      setStatus("ready");
    } catch (e) {
      console.error(e);
      setLlmText("Wheel slipped off. Generation failed.");
      setStatus("ready");
    }
  }

  function finish() {
    const handoff =
      "Okay… my movie-making magic isn’t working. Meanwhile I can show you real videos this weird human Michael actually made.";
    try {
      sessionStorage.setItem("mimsy_intro_override", handoff);
    } catch {}
    Acts.set("1");
    onDone?.();
  }

  return (
    <div className="h-full w-full grid place-items-center bg-white">
      <div className="w-full max-w-xl rounded-2xl border border-border shadow-sm p-6 space-y-4">
        <div className="text-center space-y-2">
          <div className="text-2xl font-semibold">Mimsy’s Video Generator</div>
          <p className="text-muted-foreground">
            Hi, I’m Mimsy 🐹. Tell me any video idea!
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-full border bg-white/70 px-3 py-2 shadow-sm">
          <input
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder='e.g., "funny fintech ad"'
            disabled={status === "pending"}
            className="flex-1 bg-transparent px-2 py-1 outline-none placeholder:text-muted-foreground"
          />
          {status === "idle" && (
            <Button variant="outlineAccent" size="pill" onClick={run}>
              Generate
            </Button>
          )}
          {status === "pending" && (
            <Button variant="outlineAccent" size="pill" disabled>
              Thinking…
            </Button>
          )}
        </div>

        {status === "ready" && (
          <div className="space-y-3">
            <pre className="whitespace-pre-wrap text-sm">{llmText}</pre>
            <div className="text-center">
              <Button onClick={finish}>Show Michael’s real work</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
