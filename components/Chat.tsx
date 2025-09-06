// /components/Chat.tsx
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { SuggestedPrompts } from "@/lib/suggestedPrompts";
import { ArrowUp } from "lucide-react";
import { sendTurn } from "@/lib/llm/sendTurn";
import { sendScreenEvent } from "@/lib/llm/sendScreenEvent";

type Role = "user" | "assistant";
type Message = { id: string; role: Role; text: string };
type SurfaceStatus = "idle" | "pending" | "answer";

export default function Chat({
  onShowVideo,
}: {
  onShowVideo?: (videoIds: string[]) => void;
}) {
  // Visible messages (simple surface)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "m0",
      role: "assistant",
      text:
        "Hi! I’m Michael’s portfolio guide. Ask for a vibe (e.g., “clever tech explainer”), and I’ll suggest a few videos.",
    },
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

  function push(role: Role, text: string) {
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role, text }]);
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

  // UI surface (initially show what they typed)
  push("user", trimmed);
  setInput("");
  setUserLine(trimmed);
  setAssistantFull("");
  setTyped("");
  setStatus("pending");

  try {
    const { text, nextLog } = await sendTurn({
      log,
      userText: trimmed,
      // NEW: when the LLM calls the UI tool, switch to dots and hide the user line
      onShowVideo: (ids: string[]) => {
        toolPending();            // <- clears the user message immediately
        onShowVideo?.(ids);       // keep existing UI behavior
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

//  Register global `dispatchLLMEvent` (called from page.tsx) to handle `video_opened` → send chat-only screen event (no tools) and display the assistant reply.
useEffect(() => {
  (globalThis as any).dispatchLLMEvent = async (evt: { type: string; id?: string; url?: string }) => {
    if (evt?.type === "video_opened") {
      const msg = `Visitor clicked on video "${evt.id}". UI is already showing it. Do NOT call any tool. Just chat about this video.`;

      // NEW: show loading dots for this event path
      setUserLine("");        // hide the user's last line
      setAssistantFull("");   // clear any previous answer
      setTyped("");           // reset typewriter
      setStatus("pending");   // show dot indicator

      try {
        const { text, nextLog } = await sendScreenEvent({ log, message: msg });
        if (text) {
          push("assistant", text);
          setAssistantFull(text);
          setStatus("answer"); // back to normal once we have the reply
        } else {
          // fall back gracefully
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
          <div className="space-y-2">
            <div className="text-[16px] md:text-[17px]">{userLine}</div>
            <div className="text-sm text-muted-foreground/70">
              {"•".repeat(dots)}
            </div>
          </div>
        ) : (
          <div className="whitespace-pre-wrap">{typed}</div>
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
