"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { SuggestedPrompts } from "@/lib/suggestedPrompts";
import { ArrowUp } from "lucide-react";
import { useAct1Driver } from "@/hooks/useAct1Driver";
import ChatGlowBorder from "@/components/ChatGlowBorder";

type Role = "user" | "assistant";
type SurfaceStatus = "idle" | "pending" | "answer";

type Message = {
  id: string;
  role: Role;
  text: string;
  kind?: "normal" | "system";
};

export default function Act1Chat({
  onShowVideo,
  onAct1Complete,
  initialUserText,
  onAct1Oopsie,
  onAct1Title,
}: {
  onShowVideo?: (videoIds: string[]) => void;
  onAct1Complete?: () => void;
  initialUserText?: string;
  onAct1Oopsie?: () => void;
  onAct1Title?: (title: string) => void;
}) {
  // Visible messages
  const [messages, setMessages] = useState<Message[]>([]);

  // API log (kept for compatibility with the driver)
  const [log, setLog] = useState<any[]>([]);

  // Input state
  const [input, setInput] = useState("");

  // Typing / status state
  const [status, setStatus] = useState<SurfaceStatus>("idle");
  const [assistantFull, setAssistantFull] = useState<string>("");

  const [initialSubmitted, setInitialSubmitted] = useState(false);

  // Input glow after idle
  const [inputGlow, setInputGlow] = useState(false);
  const idleTimerRef = useRef<number | null>(null);

  // Helper: any user interaction with the composer
  function markInteracted() {
    if (idleTimerRef.current !== null) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
    setInputGlow(false);
  }

  // Helper: push message into the list
  function push(
    role: Role,
    text: string,
    kind: "normal" | "system" = "normal"
  ) {
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role, text, kind },
    ]);
  }

  // Last "system" message (for inline spinner)
  const lastSystemId =
    [...messages].reverse().find((m) => m.kind === "system")?.id ?? null;

  // Act 1 driver (LLM script)
  const { submitUserText } = useAct1Driver({
    log,
    setLog,
    push,
    setAssistantFull,
    setStatus,
    onShowVideo,
    onAct1Complete,
    onAct1Oopsie,
    onAct1Title,
  });

  // Auto-submit the initial idea once
  useEffect(() => {
    if (!initialUserText || initialSubmitted) return;

    setInitialSubmitted(true);
    submitUserText(initialUserText);
  }, [initialUserText, initialSubmitted, submitUserText]);

  // Start idle timer when composer appears; clear it otherwise
  useEffect(() => {
    // Composer visible
    if (status === "answer") {
      // Only start if not already running
      if (idleTimerRef.current === null) {
        idleTimerRef.current = window.setTimeout(() => {
          setInputGlow(true);
        }, 5000);
      }
    } else {
      // Composer hidden — ensure glow & timer are reset
      if (idleTimerRef.current !== null) {
        clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
      setInputGlow(false);
    }

    // Cleanup on unmount
    return () => {
      if (idleTimerRef.current !== null) {
        clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
    };
  }, [status]);

  // Submit handler
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    markInteracted();
    setInput("");
    await submitUserText(trimmed);
  }

  // Prompt suggestion button
  function handleSparkle() {
    if (!SuggestedPrompts.length) return;
    markInteracted();
    const idx = Math.floor(Math.random() * SuggestedPrompts.length);
    setInput(SuggestedPrompts[idx]);
  }

  // Refs for scrolling & focusing
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Auto-scroll when messages or status change
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status, assistantFull]);

  // When Mimsy replies, focus the input (once composer is visible)
  useEffect(() => {
    const last = messages[messages.length - 1];
    if (!last) return;
    if (last.role === "assistant" && status === "answer") {
      inputRef.current?.focus();
    }
  }, [messages, status]);

  function Bubble({
    role,
    kind,
    isSystemActive,
    children,
  }: {
    role: Role;
    kind?: "normal" | "system";
    isSystemActive?: boolean;
    children: React.ReactNode;
  }) {
    const isUser = role === "user";
    const isSystem = kind === "system";

    // User bubble
    if (isUser) {
      return (
        <div className="flex w-full justify-end">
          <div
            className={`
              max-w-[75%] px-4 py-2 rounded-[var(--radius)] whitespace-pre-wrap leading-relaxed
              bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]
            `}
          >
            {children}
          </div>
        </div>
      );
    }

      // System bubble (scripted generator lines)
    if (isSystem) {
      return (
        <div className="flex w-full justify-start">
          <div className="flex items-start gap-3 max-w-[80%]">
            {/* Big hamster-wheel while this system line is active */}
            {isSystemActive && (
              <div className="mt-1 h-20 w-24 flex items-center justify-center shrink-0">
                <span
                  className="hamster-wheel origin-center block scale-[0.65]"
                  aria-label="Mimsy is thinking"
                />
              </div>
            )}

            <div
              className={`
                px-4 py-2 rounded-[var(--radius)] whitespace-pre-wrap leading-relaxed
                bg-muted text-[hsl(var(--foreground))]
                border border-dashed border-[hsl(var(--border))]
                text-[0.95rem] font-medium
                ${isSystemActive ? "animate-pulse" : ""}
              `}
            >
              {children}
            </div>
          </div>
        </div>
      );

    // Assistant (Mimsy) – normal messages
    const showInlineSpinner = isSystemActive;

    return (
      <div className="flex w-full justify-start">
        <div className="flex items-start gap-2 max-w-[80%]">
          {/* Mimsy avatar OR inline spinner */}
          {showInlineSpinner ? (
            <div className="mt-1 h-16 w-16 flex items-center justify-center shrink-0">
              <span
                className="hamster-wheel origin-center block scale-[0.5]"
                aria-label="Mimsy is thinking"
              />
            </div>
          ) : (
            <img
              src="/bigger-avatar.png"
              alt="Mimsy"
              className="mt-1 h-10 w-10 rounded-full shrink-0"
            />
          )}

          <div
            className={`
              flex-1 px-4 py-2 rounded-[var(--radius)] whitespace-pre-wrap leading-relaxed
              bg-[hsl(var(--card))] text-[hsl(var(--foreground))] border border-[hsl(var(--border))]
            `}
          >
            {children}
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="w-full h-full flex flex-col overflow-hidden">
      {/* Messages surface */}
      <div className="flex-1 overflow-y-auto px-3 pt-4 pb-1 space-y-4 min-h-0">
        {messages.map((m) => {
          const isSystemActive =
            m.kind === "system" &&
            m.id === lastSystemId &&
            status === "pending";

          const textToShow = m.text;

          return (
            <Bubble
              key={m.id}
              role={m.role}
              kind={m.kind}
              isSystemActive={isSystemActive}
            >
              {textToShow}
            </Bubble>
          );
        })}

        <div ref={scrollRef} />
      </div>

      {/* Composer – only appears once Mimsy is ready for the final answer */}
      {status === "answer" && (
        <form onSubmit={onSubmit} className="px-3 pb-6 pt-2">
          <div className="relative">
            {/* This div IS the pill; SVG will hug this box exactly */}
            <div className="relative w-full flex items-center gap-2 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2">
              <ChatGlowBorder active={inputGlow} />


              <input
                ref={inputRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  markInteracted();
                }}
                placeholder="yes please!"
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
          </div>
        </form>
      )}
    </section>
  );
}
