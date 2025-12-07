"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import SystemLogBubble from "@/components/bubbles/SystemLogBubble";
import HeroPlayerBubble from "@/components/bubbles/HeroPlayerBubble";
import GalleryBubble from "@/components/bubbles/GalleryBubble";
import ProfileBubble from "@/components/bubbles/ProfileBubble";
import { usePendingDots } from "@/hooks/useChatHooks";
import { sendTurn } from "@/lib/llm/sendTurn";
import type { Message } from "@/types/message";

const LANDING_GREETING =
  "Hi! I’m Mimsy—a hamster, a genius, and your guide to Michael’s video portfolio. What would you like to watch?";
const LANDING_VIDEO_ID = "aui-apollo";

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [log, setLog] = useState<any[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [hasRunLanding, setHasRunLanding] = useState(false);

  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Warm greeting on first mount
  useEffect(() => {
    setMessages([{ id: crypto.randomUUID(), role: "assistant", text: LANDING_GREETING }]);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const appendMessage = (msg: Message) => {
    setMessages((prev) => [...prev, msg]);
  };

  const handleShowVideos = (ids: string[]) => {
    if (!ids?.length) return;
    if (ids.length === 1) {
      appendMessage({ id: crypto.randomUUID(), role: "widget", type: "hero", videoId: ids[0] });
    } else {
      appendMessage({
        id: crypto.randomUUID(),
        role: "widget",
        type: "gallery",
        videoIds: ids,
      });
    }
  };

  const runLandingSequence = async () => {
    setIsTyping(true);
    appendMessage({ id: crypto.randomUUID(), role: "system_log", text: "INITIALIZING..." });
    await new Promise((resolve) => setTimeout(resolve, 1500));
    appendMessage({ id: crypto.randomUUID(), role: "system_log", text: "RENDERING..." });
    await new Promise((resolve) => setTimeout(resolve, 1500));
    appendMessage({ id: crypto.randomUUID(), role: "system_log", text: "FAILURE..." });
    appendMessage({
      id: crypto.randomUUID(),
      role: "assistant",
      text: "I can’t do that. Watch this instead.",
    });
    handleShowVideos([LANDING_VIDEO_ID]);
    setIsTyping(false);
    setHasRunLanding(true);
  };

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    if (isTyping) return;

    const userMessage: Message = { id: crypto.randomUUID(), role: "user", text: trimmed };
    appendMessage(userMessage);
    setInput("");

    if (!hasRunLanding) {
      await runLandingSequence();
      return;
    }

    setIsTyping(true);
    try {
      const { text, nextLog } = await sendTurn({
        log,
        userText: trimmed,
        onShowVideo: handleShowVideos,
      });

      if (text) {
        appendMessage({ id: crypto.randomUUID(), role: "assistant", text });
      }
      setLog(nextLog);
    } catch (err) {
      console.error(err);
      appendMessage({
        id: crypto.randomUUID(),
        role: "assistant",
        text: "Hmm, the wheel slipped. Try again?",
      });
    } finally {
      setIsTyping(false);
    }
  }

  const dots = usePendingDots(isTyping);

  const suggestionChips = useMemo(() => {
    const last = messages[messages.length - 1];
    if (last?.role === "widget" && (last.type === "hero" || last.type === "gallery")) {
      return ["More like this", "Show me humor"];
    }
    if (!messages.length) return ["Show me tech", "Surprise me"];
    return ["Show me tech", "Surprise me"];
  }, [messages]);

  function renderMessage(msg: Message) {
    if (msg.role === "system_log") {
      return <SystemLogBubble text={msg.text} />;
    }

    if (msg.role === "widget") {
      if (msg.type === "hero") return <HeroPlayerBubble videoId={msg.videoId} />;
      if (msg.type === "gallery")
        return <GalleryBubble videoIds={msg.videoIds} onOpenVideo={(id) => handleShowVideos([id])} />;
      if (msg.type === "profile") return <ProfileBubble />;
    }

    const isUser = msg.role === "user";

    if (isUser) {
      return (
        <div className="flex w-full justify-end">
          <div className="max-w-[75%] px-4 py-2 rounded-[var(--radius)] whitespace-pre-wrap leading-relaxed bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]">
            {msg.text}
          </div>
        </div>
      );
    }

    return (
      <div className="flex w-full justify-start">
        <div className="flex items-start gap-2 max-w-[80%]">
          <img
            src="/bigger-avatar.png"
            alt="Mimsy"
            className="mt-1 h-10 w-10 rounded-full shrink-0"
          />
          <div className="flex-1 px-4 py-2 rounded-[var(--radius)] whitespace-pre-wrap leading-relaxed bg-[hsl(var(--card))] text-[hsl(var(--foreground))] border border-[hsl(var(--border))]">
            {msg.text}
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto px-4 pb-28 pt-6 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id}>{renderMessage(msg)}</div>
        ))}

        {isTyping && (
          <div className="flex w-full justify-start">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <div className="h-3 w-3 rounded-full bg-muted-foreground/50 animate-ping" />
              <span>hamster is thinking{".".repeat(dots)}</span>
            </div>
          </div>
        )}

        <div ref={scrollRef} />
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent" />

      <div className="sticky bottom-0 w-full border-t border-border bg-background/80 backdrop-blur">
        <div className="px-3 pt-2 pb-3 space-y-2">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {suggestionChips.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => setInput(chip)}
                className="pointer-events-auto rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:border-foreground transition-colors"
              >
                {chip}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="pointer-events-auto">
            <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 shadow-sm">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder='Try "Show me a geeky video"'
                className="flex-1 bg-transparent px-2 py-1 outline-none placeholder:text-muted-foreground"
              />
              <Button type="submit" size="icon" variant="outlineAccent" className="shrink-0 border-transparent hover:border-[hsl(var(--accent))]">
                <ArrowUp className="h-5 w-5" strokeWidth={2.5} />
              </Button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
