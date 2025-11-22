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
  /** Called exactly when the 5th scripted line appears */
  onAct1Oopsie?: () => void;
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
  onAct1Oopsie,
}: Act1DriverParams) {
  const [hasRun, setHasRun] = useState(false);
  const [stage, setStage] = useState<"idle" | "scriptFinished">("idle");

  const submitUserText = useCallback(
    async (trimmed: string) => {
      if (!trimmed) return;

      // Always show the user message in the chat
      push("user", trimmed);

      // If the script already finished, the NEXT user message should jump to the real portfolio.
      if (stage === "scriptFinished") {
        onAct1Complete?.();
        return;
      }

      // First time: run the Act 1 LLM and play its lines.
      if (!hasRun) {
        setStatus("pending");

        let text = "";
        try {
          const res = await fetch("/api/act1", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idea: trimmed }),
          });
          const data = await res.json();
          text = (data?.text || "").toString().trim();
        } catch {
          text = "";
        }

        let lines = text
          ? text
              .split(/\r?\n/)
              .map((s: string) => s.trim())
              .filter(Boolean)
          : [];

        if (!lines.length) {
          // Fallback: same style as your original Act 1
          lines = [
            "Initializing shrinking process...",
            "Calculating size reduction ratios...",
            "FAIL: video didn’t generate (mysterious reasons).",
          ];
        }

        setHasRun(true);

        let lineIndex = 0;

        // Play lines one by one with a short pause in between
        for (const line of lines) {
          const clean = line.trim();
          if (!clean) continue;

          lineIndex += 1;

          // Show this line as Mimsy's current message
          push("assistant", clean);
          setAssistantFull(clean);
          setStatus("answer");

          // When the 5th line appears, trigger the Oopsie state
          if (lineIndex === 5) {
            onAct1Oopsie?.();
          }

          // Wait ~2.5s before the next line
          // (roughly matching your old timing)
          // eslint-disable-next-line no-await-in-loop
          await new Promise((resolve) => setTimeout(resolve, 2500));
        }

        // Final invitation line – sets up Act 1's punchline
        const invite =
          "WELL... i swear this never happened to me. but listen, maybe i can show you videos made by a human being called michael? would you like that?";
        push("assistant", invite);
        setAssistantFull(invite);
        setStatus("answer");
        setStage("scriptFinished");

        return;
      }

      // If we get here, we've run the LLM but stage is not yet "scriptFinished".
      // This is a weird edge case (user types mid-script). Just reassure them.
      const fallback =
        "Hang on a second, tiny hamster brain is still finishing this attempt…";
      push("assistant", fallback);
      setAssistantFull(fallback);
      setStatus("answer");
    },
    [hasRun, stage, onAct1Complete, onAct1Oopsie, push, setAssistantFull, setStatus]
  );

  // Act 1 doesn't really care about screen events;
  // we'll just ignore them for now.
  const handleScreenEvent = useCallback(async (_message: string) => {
    // no-op for Act 1 in this skeleton
    return;
  }, []);

  return { submitUserText, handleScreenEvent };
}
