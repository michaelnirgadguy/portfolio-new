// /components/Chat.tsx
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { SuggestedPrompts } from "@/lib/suggestedPrompts";
import { ArrowUp } from "lucide-react";
import { sendTurn } from "@/lib/llm/sendTurn";
import { sendScreenEvent } from "@/lib/llm/sendScreenEvent";
import { extractMimsyIdea, routeMimsy } from "@/lib/chat/mimsy";
import { recordAction } from "@/lib/nudges";
import { getNudgeText } from "@/lib/nudge-templates";



type Role = "user" | "assistant";
type Message = { id: string; role: Role; text: string; isNudge?: boolean };
type SurfaceStatus = "idle" | "pending" | "answer";

export default function Chat({
  onShowVideo,
}: {
  onShowVideo?: (videoIds: string[]) => void;
}) {
  
  // check if Act1 set an intro override
  let intro =
    "Hi! I’m Mimsy. a hamster, a genius, and your guide to Michael’s video portfolio. Tell me what would you like to watch?";
  try {
    const override = sessionStorage.getItem("mimsy_intro_override");
    if (override) {
      intro = override;
      sessionStorage.removeItem("mimsy_intro_override"); // clear after using
    }
  } catch {}
  
  // Visible messages (simple surface)
  const [messages, setMessages] = useState<Message[]>([
    { id: "m0", role: "assistant", text: intro },
  ]);


  // Running log we send to the API (best practice for tools)
  const [log, setLog] = useState<any[]>([]);

  const [input, setInput] = useState("");

  const [status, setStatus] = useState<SurfaceStatus>("idle");
  const [userLine, setUserLine] = useState<string>("");
  const [assistantFull, setAssistantFull] = useState<string>("");
  const [typed, setTyped] = useState<string>("");

  // Dots animation
  const [dots, setDots] = useState<number>(0);
  useEffect(() => {
    if (status !== "pending") return;
    setDots(0);
    const t = setInterval(() => setDots((d) => (d + 1) % 4), 400);
    return () => clearInterval(t);
  }, [status]);

  // Typewriter
  useEffect(() => {
    if (status !== "answer" || !assistantFull) return;
    setTyped("");
    let i = 0;
    let timer: number | undefined;
    const tick = () => {
      i++;
      setTyped(assistantFull.slice(0, i));
    
      // 🔔 Force a re-measure once per animation frame
      requestAnimationFrame(() => {
        window.dispatchEvent(new Event("resize"));
      });
    
      if (i < assistantFull.length) {
        timer = window.setTimeout(tick, 16) as unknown as number;
      }
    };

    timer = window.setTimeout(tick, 0) as unknown as number;
    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, [status, assistantFull]);

  // Show greeting as the first visible surface
  useEffect(() => {
    const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
    if (status === "idle" && lastAssistant) {
      setAssistantFull(lastAssistant.text);
      setStatus("answer");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

function push(role: Role, text: string, isNudge = false) {
  setMessages((prev) => [...prev, { id: crypto.randomUUID(), role, text, isNudge }]);
}
}


function toolPending() {
  setUserLine("");      // hide the user's line
  setAssistantFull(""); // clear previous answer
  setTyped("");         // reset typewriter
  setStatus("pending"); // show dots
}

async function onSubmit(e: React.FormEvent) {
  e.preventDefault();
  const trimmed = input.trim();
  if (!trimmed) return;

  // ✅ Mimsy command path (user typed "mimsy:")
  const maybeIdea = extractMimsyIdea(trimmed);
  if (maybeIdea !== null) {
    // show user line then clear input
    push("user", trimmed);
    setInput("");

    // empty idea → quick hint
    if (maybeIdea === "") {
      const msg = "Type “Mimsy:” followed by your video idea.";
      push("assistant", msg);
      setAssistantFull(msg);
      setStatus("answer");
      return;
    }

    // route to act 2/3
    setUserLine("");
    setAssistantFull("");
    setTyped("");
    setStatus("pending");

    try {
      const action = await routeMimsy(maybeIdea);

      if (action.kind === "act2") {
        try { window.dispatchEvent(new CustomEvent(action.event.name, { detail: action.event.detail })); } catch {}
        push("assistant", action.followup);
        setAssistantFull(action.followup);
      } else if (action.kind === "act3") {
        try { window.dispatchEvent(new CustomEvent(action.event.name, { detail: action.event.detail })); } catch {}
        push("assistant", action.line);
        setAssistantFull(action.line);
      } else if (action.kind === "handoff") {
        push("assistant", action.text);
        setAssistantFull(action.text);
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
  push("user", trimmed); // show user's line immediately
  setInput("");
  setUserLine(trimmed);
  setAssistantFull("");
  setTyped("");
  setStatus("pending");

  // ✅ Nudge decision for a *chat* action, injected AFTER the user's message
  const nudge = recordAction("message");
  const syntheticAfterUser = nudge ? getNudgeText(nudge.templateKey) : undefined;

  try {
    const { text, nextLog } = await sendTurn({
      log,
      userText: trimmed,
      // NEW: let sendTurn append a second user message after the real one
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


  // ✨ Prompt generator
  function handleSparkle() {
    if (!SuggestedPrompts.length) return;
    const idx = Math.floor(Math.random() * SuggestedPrompts.length);
    setInput(SuggestedPrompts[idx]);
  }

//  Register global `dispatchLLMEvent` (called from page.tsx) to handle `video_opened`
//  → send chat-only screen event (no tools) and display the assistant reply.
useEffect(() => {
  (globalThis as any).dispatchLLMEvent = async (evt: { type: string; id?: string; url?: string }) => {
    if (evt?.type === "video_opened") {
      // ✅ NEW: decide if this click triggers a nudge
      const nudge = recordAction("video");

      // If nudge → replace message entirely with the template; else keep original default
      const msg = nudge
        ? getNudgeText(nudge.templateKey)
        : `Visitor clicked on video "${evt.id}". UI is already showing it. Do NOT call any tool. Just chat about this video.`;

      // Show loading dots while waiting for LLM reply
      setUserLine("");        // hide the user's last line
      setAssistantFull("");   // clear any previous answer
      setTyped("");           // reset typewriter
      setStatus("pending");   // show dot indicator

      try {
        const { text, nextLog } = await sendScreenEvent({ log, message: msg });

        if (text) {
          push("assistant", text, true);
          setAssistantFull(text);
          setStatus("answer");
        } else {
          const err = "Got it — opening the video. Want thoughts on it?";
          push("assistant", err);
          setAssistantFull(err);
          setStatus("answer");
        }

        setLog(nextLog);
      } catch (e) {
        console.error("sendScreenEvent error:", e);
        const err = "Hmm, something went wrong. Try again?";
        push("assistant", err);
        setAssistantFull(err);
        setStatus("answer");
      }
    }
  };

  return () => {
    delete (globalThis as any).dispatchLLMEvent;
  };
}, [log]);


  
    return (
  <section className="w-full space-y-6">
    {/* Curator surface */}
    <div className="leading-8 text-[17px] md:text-[18px] tracking-tight">
      {status === "pending" ? (
        /* Pending: spinner left-aligned, no user prompt echo */
        <div className="flex items-baseline gap-3 py-1 leading-8 text-[17px] md:text-[18px]">
          <span
            className="relative inline-block shrink-0 align-text-bottom mr-3"
            style={{ height: "2.2em", width: "2.2em", overflow: "visible" }}
          >
            <span
              className="hamster-wheel absolute inset-0"
              style={{ transform: "scale(0.6)", transformOrigin: "top left" }}
            />
          </span>
          {/* Optional placeholder for future loading text (e.g., "Generating…") */}
          <span className="text-muted-foreground/70"></span>
        </div>


      ) : (
         <div className="whitespace-pre-wrap">
    {(() => {
      const last = messages[messages.length - 1];
      if (last?.isNudge) {
        const { findNudgeSpan } = require("@/lib/text/highlightNudge");
        const span = findNudgeSpan(typed);
        if (span) {
          return (
            <>
              {typed.slice(0, span.start)}
              <span className="text-accent font-medium">
                {span.rendered}
              </span>
              {typed.slice(span.end)}
            </>
          );
        }
      }
      return typed;
    })()}
  </div>
      )}
    </div>

    {/* Composer */}
    <form onSubmit={onSubmit} className="flex items-center">
      <div className="w-full flex items-center gap-2 rounded-full border bg-white/70 px-3 py-2 shadow-sm backdrop-blur">
        <Button
          type="button"
          variant="outlineAccent"
          size="pill"
          onClick={handleSparkle}
          title="Generate a prompt"
          aria-label="Generate a prompt"
          className="shrink-0 border-transparent hover:border-[hsl(var(--accent))]"
        >
          <span className="text-xl leading-none">✨</span>
        </Button>

        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder='Type a request… e.g., "bold, funny tech ad"'
          className="flex-1 bg-transparent px-2 py-1 outline-none placeholder:text-muted-foreground focus:ring-0"
        />

        <Button
          type="submit"
          variant="outlineAccent"
          size="icon"
          title="Send"
          aria-label="Send"
          className="shrink-0 border-transparent hover:border-[hsl(var(--accent))]"
        >
          <ArrowUp className="w-6 h-6" strokeWidth={2.5} />
        </Button>
      </div>
    </form>
  </section>
);
}
