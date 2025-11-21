// /hooks/useAct1Driver.ts

import { useCallback } from "react";

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
  const submitUserText = useCallback(
    async (trimmed: string) => {
      if (!trimmed) return;

      // For now: simple echo-style behavior.
      // We'll replace this with:
      //  - fake generation lines
      //  - failure line + invitation
      //  - triggering onAct1Complete()
      push("user", trimmed);

      const reply =
        "Act 1 placeholder: next steps will show Mimsy trying (and failing) to generate your video, then inviting you to see Michael’s real work.";
      setStatus("pending");

      // Simulate a short delay so the UI behaves like the main chat.
      await new Promise((resolve) => setTimeout(resolve, 300));

      push("assistant", reply);
      setAssistantFull(reply);
      setStatus("answer");
    },
    [push, setAssistantFull, setStatus]
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
