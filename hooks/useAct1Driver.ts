// /hooks/useAct1Driver.ts

import { useCallback, useState } from "react";


type Role = "user" | "assistant";
type SurfaceStatus = "idle" | "pending" | "answer";

type Act1DriverParams = {
  log: any[]; // kept for API compatibility with useChatFlow
  setLog: (next: any[]) => void;
  push: (role: Role, text: string) => void;
  setAssistantFull: (t: string) => void;
  setStatus: (s: SurfaceStatus) => void;
  onShowVideo?: (ids: string[]) => void;
  onAct1Complete?: () => void;
};

/**
 * Act 1 driver:
 * - Same API shape as useChatFlow ({ submitUserText, handleScreenEvent }).
 * - For now it's a simple placeholder; we'll plug in the real fake-generator
 *   + completion logic in later steps.
 */
export function useAct1Driver({
  log,
  setLog,
  push,
  setAssistantFull,
  setStatus,
  onShowVideo,
  onAct1Complete,
}: Act1DriverParams) {
  const [hasRun, setHasRun] = useState(false);
  const submitUserText = useCallback(
    async (trimmed: string) => {
      if (!trimmed) return;

      // First message is the "idea" for Act 1.
      // After that, for now, we just acknowledge and will later trigger onAct1Complete.
      push("user", trimmed);

      // If we've already run the LLM once, don't call it again yet.
      if (hasRun) {
        const followup =
          "Got it. Soon this will switch over to Michael’s real portfolio. (Act 1 followup placeholder.)";
        setStatus("pending");
        await new Promise((resolve) => setTimeout(resolve, 200));
        push("assistant", followup);
        setAssistantFull(followup);
        setStatus("answer");
        return;
      }

      setStatus("pending");

      try {
        const res = await fetch("/api/act1", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idea: trimmed }),
        });

        const data = await res.json();
        const text = (data?.text || "").toString().trim();

        const reply =
          text ||
          "Initializing shrinking process...\nCalculating size reduction ratios...\nFAIL: video didn’t generate (mysterious reasons).";

        setHasRun(true);

        // For now: show the full LLM text in a single bubble.
        // Later we’ll split into lines + timing to mimic the original act.
        push("assistant", reply);
        setAssistantFull(reply);
        setStatus("answer");
      } catch (e) {
        const err =
          "Spinning up…\nTrying again…\nFAIL: wheel slipped; render canceled.";
        push("assistant", err);
        setAssistantFull(err);
        setStatus("answer");
      }
    },
    [hasRun, push, setAssistantFull, setStatus]
  );



  // Act 1 doesn't really care about screen events;
  // we'll just ignore them for now.
  const handleScreenEvent = useCallback(
    async (_message: string) => {
      // no-op for Act 1 in this skeleton
      return;
    },
    []
  );

  return { submitUserText, handleScreenEvent };
}
