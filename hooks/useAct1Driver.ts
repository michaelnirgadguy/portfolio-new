// /hooks/useAct1Driver.ts

import { useCallback, useState } from "react";

type Role = "user" | "assistant";
type SurfaceStatus = "idle" | "pending" | "answer";

type Act1DriverParams = {
  log: any[]; // kept for API compatibility with useChatFlow
  setLog: (next: any[]) => void;
  push: (role: Role, text: string, kind?: "normal" | "system") => void;
  setAssistantFull: (t: string) => void;
  setStatus: (s: SurfaceStatus) => void;
  onShowVideo?: (ids: string[]) => void;
  onAct1Complete?: () => void;
  /** Called exactly when the 5th scripted line appears */
  onAct1Oopsie?: () => void;
  /** Called once when we receive a title from the LLM */
  onAct1Title?: (title: string) => void;
};

/**
 * Act 1 driver:
 * - Same API shape as useChatFlow ({ submitUserText, handleScreenEvent }).
 * - Uses /api/act1 which should return JSON: { title, script: string[] }.
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
  onAct1Title,
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

        let lines: string[] = [];
        let titleFromApi = "";

        try {
          const res = await fetch("/api/act1", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idea: trimmed }),
          });

          const data = await res.json();

          // Preferred path: structured JSON { title, script }
          if (data) {
            if (typeof data.title === "string" && data.title.trim()) {
              titleFromApi = data.title.trim();
            }

            if (Array.isArray(data.script)) {
              lines = data.script
                .map((s: any) => String(s).trim())
                .filter(Boolean);
            }

            // Legacy fallback if the model ever returns { text }
            if (!lines.length && typeof data.text === "string") {
              lines = data.text
                .split(/\r?\n/)
                .map((s: string) => s.trim())
                .filter(Boolean);
            }
          }
        } catch {
          // ignore; we'll fall back to hardcoded lines below
        }

        if (!lines.length) {
          // Fallback: same style as your original Act 1
          lines = [
            "Initializing shrinking process...",
            "Calculating size reduction ratios...",
            "FAIL: video didn’t generate (mysterious reasons).",
          ];
        }

        // Notify parent about the title (if we got one)
        if (titleFromApi) {
          onAct1Title?.(titleFromApi);
        }

          setHasRun(true);

        let lineIndex = 0;

        // Play lines one by one as "system" messages
        for (const line of lines) {
          const clean = line.trim();
          if (!clean) continue;

          lineIndex += 1;

          // 1) Show this line immediately as a system message
          push("assistant", clean, "system");
          setAssistantFull(clean);

          // 2) While this line is "active", show the inline spinner (Act 1 logic)
          setStatus("pending");

          // Trigger Oopsie exactly when the 5th line shows up
          if (lineIndex === 5) {
            onAct1Oopsie?.();
          }

          // Keep this line in its "active" spinning state for 2.5s
          // eslint-disable-next-line no-await-in-loop
          await new Promise((resolve) => setTimeout(resolve, 2500));

          // 3) Mark it as "settled" – spinner off, avatar on
          setStatus("answer");
        }

        // Extra 2.5s delay AFTER the last system line, before the invite
        setAssistantFull("");
        setStatus("pending");
        // eslint-disable-next-line no-await-in-loop
        await new Promise((resolve) => setTimeout(resolve, 2500));

        // Final invitation line – regular assistant message (not system)
        const invite =
          "Oh My! this never happened to me before.\n\nMmm...Maybe instead I can show you videos made by my human, Michael?";
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
    [
      hasRun,
      stage,
      onAct1Complete,
      onAct1Oopsie,
      onAct1Title,
      push,
      setAssistantFull,
      setStatus,
    ]
  );

  // Act 1 doesn't really care about screen events;
  // we'll just ignore them for now.
  const handleScreenEvent = useCallback(async (_message: string) => {
    // no-op for Act 1 in this skeleton
    return;
  }, []);

  return { submitUserText, handleScreenEvent };
}
