// /hooks/useChatHooks.ts
import { useEffect, useRef, useState } from "react";

/** Typewriter for assistant text */
export function useTypewriter(fullText: string, speedMs = 16) {
  const [typed, setTyped] = useState("");
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    setTyped("");
    if (!fullText) return;

    let i = 0;
    const tick = () => {
      i += 1;
      setTyped(fullText.slice(0, i));
      if (i < fullText.length) {
        timerRef.current = window.setTimeout(tick, speedMs) as unknown as number;
      }
    };

    timerRef.current = window.setTimeout(tick, 0) as unknown as number;
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = null;
    };
  }, [fullText, speedMs]);

  return typed;
}



/** One-time intro message with optional sessionStorage override */
export function useIntroMessage() {
  const [intro] = useState(() => {
    // Default line lives here now
    let val =
      "Hi! I’m Mimsy. a hamster, a genius, and your guide to Michael’s video portfolio. Tell me what would you like to watch?";

    try {
      const key = "mimsy_intro_override";
      const override = sessionStorage.getItem(key);
      if (override) {
        val = override;
        sessionStorage.removeItem(key); // clear after using
      }
    } catch {}

    return val;
  });
  return intro;
}


/** Simple 0–3 dot cycling for "pending" animation */
export function usePendingDots(active: boolean, intervalMs = 400) {
  const [dots, setDots] = useState(0);

  useEffect(() => {
    if (!active) return;
    setDots(0);
    const timer = setInterval(() => setDots((d) => (d + 1) % 4), intervalMs);
    return () => clearInterval(timer);
  }, [active, intervalMs]);

  return dots;
}

/**
 * Light refactor: core chat logic (LLM, nudges, Mimsy routing) lives here.
 * UI state (input/messages/layout) stays in Chat.tsx.
 */

import { sendTurn } from "@/lib/llm/sendTurn";
import { sendScreenEvent } from "@/lib/llm/sendScreenEvent";
import { extractMimsyIdea, routeMimsy } from "@/lib/chat/mimsy";
import { recordAction } from "@/lib/nudges";
import { getNudgeText } from "@/lib/nudge-templates";

type Role = "user" | "assistant";
type Message = { id: string; role: Role; text: string };


export function useChatFlow(params: {
  log: any[];
  setLog: (next: any[]) => void;
  push: (role: Role, text: string) => void;
  setAssistantFull: (t: string) => void;
  setStatus: (s: "idle" | "pending" | "answer") => void;
  onShowVideo?: (ids: string[]) => void;
}) {
  const { log, setLog, push, setAssistantFull, setStatus, onShowVideo } = params;

  function toolPending() {
    setAssistantFull("");
    setStatus("pending");
  }

  async function submitUserText(trimmed: string) {
    if (!trimmed) return;

    // ✅ Special "Mimsy:" path
    const maybeIdea = extractMimsyIdea(trimmed);
    if (maybeIdea !== null) {
      push("user", trimmed);

      if (maybeIdea === "") {
        const msg = "Type “Mimsy:” followed by your video idea.";
        push("assistant", msg);
        setAssistantFull(msg);
        setStatus("answer");
        return;
      }

      toolPending();

      try {
        const action = await routeMimsy(maybeIdea);

        if (action.kind === "act2" || action.kind === "act3") {
          try {
            window.dispatchEvent(
              new CustomEvent(action.event.name, { detail: action.event.detail })
            );
          } catch {}
          const line = action.kind === "act2" ? action.followup : action.line;
          push("assistant", line);
          setAssistantFull(line);
        } else {
          push("assistant", action.text);
          setAssistantFull(action.text);
        }

        setStatus("answer");
      } catch {
        const err = "hmm… hamster wheels jammed. try again?";
        push("assistant", err);
        setAssistantFull(err);
        setStatus("answer");
      }
      return;
    }

    // 🔁 Normal chat path
    push("user", trimmed);
    toolPending();

    // Nudge decision (optional synthetic after-user message)
    const nudge = recordAction("message");
    const syntheticAfterUser = nudge ? getNudgeText(nudge.templateKey) : undefined;

    try {
      const { text, nextLog } = await sendTurn({
        log,
        userText: trimmed,
        syntheticAfterUser,
        onShowVideo: (ids: string[]) => {
          toolPending();
          onShowVideo?.(ids);
        },
      });

      const reply = text || "Done.";
      push("assistant", reply);
      setAssistantFull(reply);
      setStatus("answer");
      setLog(nextLog);
    } catch {
      const errMsg = "Hmm, something went wrong. Try again?";
      push("assistant", errMsg);
      setAssistantFull(errMsg);
      setStatus("answer");
    }
  }

  // Also expose a helper for screen events (used by dispatchLLMEvent in Chat.tsx)
  async function handleScreenEvent(message: string) {
    toolPending();
    try {
      const { text, nextLog } = await sendScreenEvent({ log, message });
      const reply = text || "Got it — opening the video. Want thoughts on it?";
      push("assistant", reply);
      setAssistantFull(reply);
      setStatus("answer");
      setLog(nextLog);
    } catch {
      const err = "Hmm, something went wrong. Try again?";
      push("assistant", err);
      setAssistantFull(err);
      setStatus("answer");
    }
  }

  return { submitUserText, handleScreenEvent };
}

// Bridge global UI events (e.g., video clicks) to the LLM, with nudge handling.
export function useLLMEventBridge(params: {
  handleScreenEvent: (message: string) => Promise<void>;
  push: (role: "user" | "assistant", text: string) => void;
  setAssistantFull: (t: string) => void;
  setStatus: (s: "idle" | "pending" | "answer") => void;
}) {
  const { handleScreenEvent, push, setAssistantFull, setStatus } = params;

  useEffect(() => {
    (globalThis as any).dispatchLLMEvent = async (evt: {
      type: string;
      id?: string;
      url?: string;
    }) => {
      if (evt?.type !== "video_opened") return;

      // Decide if this click triggers a nudge
      const nudge = recordAction("video");

      // If nudge → replace message entirely with the template; else keep original default
      const msg = nudge
        ? getNudgeText(nudge.templateKey)
        : `Visitor clicked on video "${evt.id}". UI is already showing it. Do NOT call any tool. Do not mention the title of the video or name of the client, as they already appear on screen. Just chat about this video. Do Not ask the visitor questions about the video`;

      try {
        await handleScreenEvent(msg);
      } catch (e) {
        console.error("sendScreenEvent error:", e);
        const err = "Hmm, something went wrong. Try again?";
        push("assistant", err);
        setAssistantFull(err);
        setStatus("answer");
      }
    };

    return () => {
      delete (globalThis as any).dispatchLLMEvent;
    };
  }, [handleScreenEvent, push, setAssistantFull, setStatus]);
}
