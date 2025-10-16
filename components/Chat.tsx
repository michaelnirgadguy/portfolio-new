// /components/Chat.tsx
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { SuggestedPrompts } from "@/lib/suggestedPrompts";
import { ArrowUp } from "lucide-react";
import { recordAction } from "@/lib/nudges";
import { getNudgeText } from "@/lib/nudge-templates";
import { findNudgeSpan } from "@/lib/text/highlightNudge";
import { useTypewriter, useIntroMessage, useChatFlow, useLLMEventBridge } from "@/hooks/useChatHooks";


type Role = "user" | "assistant";
type Message = { id: string; role: Role; text: string };
type SurfaceStatus = "idle" | "pending" | "answer";

export default function Chat({
  onShowVideo,
}: {
  onShowVideo?: (videoIds: string[]) => void;
}) {
  // Get Mimsy's opening line (uses sessionStorage override if Act1 set one)
 const intro = useIntroMessage();

  // Visible messages (simple surface)
  const [messages, setMessages] = useState<Message[]>([
    { id: "m0", role: "assistant", text: intro },
  ]);

  // Running log we send to the API (best practice for tools)
  const [log, setLog] = useState<any[]>([]);

  const [input, setInput] = useState("");

  const [status, setStatus] = useState<SurfaceStatus>("idle");
  const [assistantFull, setAssistantFull] = useState<string>("");
  function push(role: Role, text: string) {
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role, text }]);
  }
  const { submitUserText, handleScreenEvent } = useChatFlow({
  log,
  setLog,
  push,
  setAssistantFull,
  setStatus,
  onShowVideo,
});

  useLLMEventBridge({
  handleScreenEvent,
  push,
  setAssistantFull,
  setStatus,
});



  // ⬇️ Typewriter now handled by hook (no manual resize or timers here)
  const typed = useTypewriter(assistantFull, 16);


  // Show greeting as the first visible surface
  useEffect(() => {
    const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
    if (status === "idle" && lastAssistant) {
      setAssistantFull(lastAssistant.text);
      setStatus("answer");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);



async function onSubmit(e: React.FormEvent) {
  e.preventDefault();
  const trimmed = input.trim();
  if (!trimmed) return;
  setInput("");           // clear input immediately
  await submitUserText(trimmed);
}


  // ✨ Prompt generator
  function handleSparkle() {
    if (!SuggestedPrompts.length) return;
    const idx = Math.floor(Math.random() * SuggestedPrompts.length);
    setInput(SuggestedPrompts[idx]);
  }

  //  Regis
 

// Accents the nudge sentence and bolds/paints **mimsy:**
function renderTypedWithNudge(text: string) {
  const span = findNudgeSpan(text);
  if (!span) return <>{text}</>;

  const before = text.slice(0, span.start);
  const after = text.slice(span.end);
  const parts = span.rendered.split(/\*\*mimsy:\*\*/i);

  return (
    <>
      {before}
      <span className="font-semibold">
        {parts[0]}
        <span className="text-[hsl(var(--accent))]">mimsy:</span>
        {parts[1] ?? ""}
      </span>
      {after}
    </>
  );
}


  
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
        
          </div>
        ) : (
          <div className="whitespace-pre-wrap">
            {renderTypedWithNudge(typed)}
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
