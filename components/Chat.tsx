"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { SuggestedPrompts } from "@/lib/suggestedPrompts";
import { ArrowUp } from "lucide-react";
import { useTypewriter, useIntroMessage, useChatFlow, useLLMEventBridge } from "@/hooks/useChatHooks";

type Role = "user" | "assistant";
type Message = { id: string; role: Role; text: string };
type SurfaceStatus = "idle" | "pending" | "answer";

export default function Chat({
  onShowVideo,
}: {
  onShowVideo?: (videoIds: string[]) => void;
}) {
  // Intro line (session-aware)
  const intro = useIntroMessage();

  // Visible messages
  const [messages, setMessages] = useState<Message[]>([
    { id: "m0", role: "assistant", text: intro },
  ]);

  // API log
  const [log, setLog] = useState<any[]>([]);

  // Input state
  const [input, setInput] = useState("");

  // Assistant typing pipeline
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

  const typed = useTypewriter(assistantFull, 16);

  // Initialize first answer bubble
  useEffect(() => {
    const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
    if (status === "idle" && lastAssistant) {
      setAssistantFull(lastAssistant.text);
      setStatus("answer");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Submit handler
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    setInput("");
    await submitUserText(trimmed);
  }

  // Prompt suggestion button
  function handleSparkle() {
    if (!SuggestedPrompts.length) return;
    const idx = Math.floor(Math.random() * SuggestedPrompts.length);
    setInput(SuggestedPrompts[idx]);
  }

  // Scroll-to-bottom ref
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typed, status]);

  // Render a bubble
  function Bubble({ role, children }: { role: Role; children: React.ReactNode }) {
    const isUser = role === "user";
    return (
      <div
        className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}
      >
        <div
          className={`
            max-w-[75%] px-4 py-2 rounded-[var(--radius)] whitespace-pre-wrap leading-relaxed
            ${isUser
              ? "bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]"
              : "bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]"
            }
          `}
        >
          {children}
        </div>
      </div>
    );
  }

return (
  <section className="w-full h-full flex flex-col overflow-hidden">
    
    {/* Small instruction text */}
    <div className="px-4 pt-3 pb-1 text-sm text-muted-foreground">
      Chat with Mimsy to explore Michael’s portfolio.
    </div>

    {/* Scrollable messages area */}
    <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4 min-h-0">
      {messages.map((m) => {
        if (m.role === "assistant") return null; // assistant text is rendered via typed bubble
        return (
          <Bubble key={m.id} role={m.role}>
            {m.text}
          </Bubble>
        );
      })}

      {/* Assistant pending indicator */}
      {status === "pending" && (
        <Bubble role="assistant">
          <span className="opacity-70">…</span>
        </Bubble>
      )}

      {/* Assistant typewriter bubble */}
      {status === "answer" && typed && (
        <Bubble role="assistant">{typed}</Bubble>
      )}

      <div ref={scrollRef} />
    </div>

    {/* Composer */}
    <form
      onSubmit={onSubmit}
      className="px-2 pb-3 pt-2 border-t border-[hsl(var(--border))] bg-[hsl(var(--background))]"
    >
      <div className="w-full flex items-center gap-2 rounded-full border bg-[hsl(var(--card))] px-3 py-2 shadow-sm">
        <Button
          type="button"
          variant="outlineAccent"
          size="pill"
          onClick={handleSparkle}
          aria-label="Generate a prompt"
          className="shrink-0 border-transparent hover:border-[hsl(var(--accent))]"
        >
          <span className="text-xl leading-none">✨</span>
        </Button>

        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder='Type a request… e.g. "bold, funny tech ad"'
          className="flex-1 bg-transparent px-2 py-1 outline-none placeholder:text-muted-foreground"
        />

        <Button
          type="submit"
          variant="outlineAccent"
          size="icon"
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
