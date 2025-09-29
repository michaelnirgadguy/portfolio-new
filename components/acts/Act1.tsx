"use client";

import { useState } from "react";
import { Acts } from "@/lib/acts";
import { Button } from "@/components/ui/button";

export default function Act1({ onDone }: { onDone?: () => void }) {
  const [idea, setIdea] = useState("");

  function finish() {
    Acts.set("1");      // mark Act 1 complete
    onDone?.();         // let parent swap to main UI
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
            className="flex-1 bg-transparent px-2 py-1 outline-none placeholder:text-muted-foreground"
          />
          <Button variant="outlineAccent" size="pill" onClick={finish}>
            Generate
          </Button>
        </div>

        <p className="text-sm text-muted-foreground text-center">
          (MVP: clicks “Generate” → we reveal the real portfolio)
        </p>
      </div>
    </div>
  );
}
