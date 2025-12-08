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
import { getAllVideos } from "@/lib/videos";
import type { Message } from "@/types/message";
import type { VideoItem } from "@/types/video";

const LANDING_VIDEO_ID = "aui-apollo";
const ACT1_INVITE =
  "WELL... i swear this never happened to me. but listen, maybe i can show you videos made by a human being called michael? would you like that?";

type Phase = "landing" | "chat";

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [log, setLog] = useState<any[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [hasRunLanding, setHasRunLanding] = useState(false);
  const [phase, setPhase] = useState<Phase>("landing");
  const [isRunningAct1, setIsRunningAct1] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", isDarkMode);
  }, [isDarkMode]);

  const appendMessage = (msg: Message) => {
    setMessages((prev) => [...prev, msg]);
  };

  async function handleLandingSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    if (isTyping || isRunningAct1) return;

    await runLandingSequence(trimmed);
  }

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

  const handleShowAllVideos = () => {
    const allIds = getAllVideos().map((video) => video.id);
    if (!allIds.length) return;

    appendMessage({ id: crypto.randomUUID(), role: "widget", type: "gallery", videoIds: allIds });
  };

  const handleOpenVideo = async (video: VideoItem) => {
    if (isTyping || isRunningAct1) return;

    const syntheticMessage = `User opened video "${video.title}" (id: ${video.id}). The video is already displaying with its title; do not call any tools to show it again and do not repeat the title. Provide one short, enthusiastic line reacting to their choice and keep the conversation moving.`;

    setIsTyping(true);

    try {
      const { text, nextLog, pendingVideoQueues, showAllVideos, darkModeEnabled } = await sendTurn({
        log,
        userText: "User opened a video from the gallery.",
        syntheticAfterUser: syntheticMessage,
      });

      if (text) {
        appendMessage({ id: crypto.randomUUID(), role: "assistant", text });
      }

      if (showAllVideos) {
        handleShowAllVideos();
      }

      if (typeof darkModeEnabled === "boolean") {
        setIsDarkMode(darkModeEnabled);
      }

      handleShowVideos([video.id]);

      for (const ids of pendingVideoQueues) {
        handleShowVideos(ids);
      }

      setLog(nextLog);
    } catch (err) {
      console.error(err);
      appendMessage({
        id: crypto.randomUUID(),
        role: "assistant",
        text: "Hmm, the wheel slipped. Try again?",
      });
      handleShowVideos([video.id]);
    } finally {
      setIsTyping(false);
    }
  };

  const runLandingSequence = async (idea: string) => {
    setPhase("chat");
    setIsRunningAct1(true);
    setIsTyping(true);

    const userMessage: Message = { id: crypto.randomUUID(), role: "user", text: idea };
    setMessages([userMessage]);

    let script: string[] = [];
    let title = "";

    try {
      const res = await fetch("/api/act1", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea }),
      });

      const data = await res.json();
      if (typeof data?.title === "string" && data.title.trim()) {
        title = data.title.trim();
      }

      if (Array.isArray(data?.script)) {
        script = data.script
          .map((line: any) => String(line).trim())
          .filter(Boolean);
      }

      if (!script.length && typeof data?.text === "string") {
        script = data.text
          .split(/\r?\n/)
          .map((line: string) => line.trim())
          .filter(Boolean);
      }
    } catch (err) {
      console.error("Act1 landing sequence failed", err);
    }

    if (!script.length) {
      script = [
        `Generating idea: ${idea}`,
        "Spinning hamster wheel...",
        "Calibrating genius settings...",
        "Rendering glorious cinematic sequence...",
        "Error: video didn’t generate (hamster demanded a snack break)",
      ];
    }

    for (const line of script) {
      appendMessage({ id: crypto.randomUUID(), role: "system_log", text: line });
      // eslint-disable-next-line no-await-in-loop
      await new Promise((resolve) => setTimeout(resolve, 2200));
    }

    const pivotLine = title
      ? `I tried to make "${title}" and failed. ${ACT1_INVITE}`
      : ACT1_INVITE;

    appendMessage({ id: crypto.randomUUID(), role: "assistant", text: pivotLine });
    handleShowVideos([LANDING_VIDEO_ID]);

    setHasRunLanding(true);
    setIsTyping(false);
    setIsRunningAct1(false);
    setInput("");
  };

  const submitMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (isTyping || isRunningAct1) return;
    if (!hasRunLanding) return;

    const userMessage: Message = { id: crypto.randomUUID(), role: "user", text: trimmed };
    appendMessage(userMessage);
    setInput("");

    setIsTyping(true);
    try {
      const { text, nextLog, pendingVideoQueues, showAllVideos, darkModeEnabled } = await sendTurn({
        log,
        userText: trimmed,
      });

      if (text) {
        appendMessage({ id: crypto.randomUUID(), role: "assistant", text });
      }

      if (showAllVideos) {
        handleShowAllVideos();
      }

      if (typeof darkModeEnabled === "boolean") {
        setIsDarkMode(darkModeEnabled);
      }

      for (const ids of pendingVideoQueues) {
        handleShowVideos(ids);
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
  };

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await submitMessage(input);
  }

  const dots = usePendingDots(isTyping);

  const suggestionChips = useMemo(() => {
    if (!hasRunLanding) return [];

    const last = messages[messages.length - 1];
    if (last?.role === "widget" && (last.type === "hero" || last.type === "gallery")) {
      return ["More like this", "Show me humor", "Show me tech"];
    }
    if (!messages.length) return ["Show me tech", "Show me humor", "Surprise me"];
    return ["Show me tech", "Show me humor", "Surprise me"];
  }, [hasRunLanding, messages]);

  const handleChipClick = (chip: string) => {
    if (isTyping || isRunningAct1) return;

    setInput(chip);
    setTimeout(() => {
      submitMessage(chip);
    }, 300);
  };

  function renderMessage(msg: Message) {
    if (msg.role === "system_log") {
      return <SystemLogBubble text={msg.text} />;
    }

    if (msg.role === "widget") {
      if (msg.type === "hero") return <HeroPlayerBubble videoId={msg.videoId} />;
      if (msg.type === "gallery")
        return <GalleryBubble videoIds={msg.videoIds} onOpenVideo={(video) => handleOpenVideo(video)} />;
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

  if (phase === "landing") {
    return (
      <section className="min-h-[100svh] w-full bg-background grid place-items-center px-6">
        <div className="w-full max-w-2xl space-y-6 text-center">
          <img
            src="/tiny-Mimsy.png"
            alt="Mimsy"
            className="mx-auto h-20 w-20"
          />

          <p className="text-[18px] font-semibold leading-7">
            Hi, I’m Mimsy, a hamster, a film creator, a genius!
          </p>

          <div className="space-y-3">
            <p className="text-[16px] leading-7">
              Tell me your idea for a video - and I’ll generate it for you
            </p>

            <form
              onSubmit={handleLandingSubmit}
              className="flex items-center justify-center"
            >
              <div className="w-full">
                <div className="relative w-full flex items-center gap-2 rounded-full border bg-card px-3 py-2 shadow-sm backdrop-blur">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder='try "dogs dancing on the moon"'
                    disabled={isTyping || isRunningAct1}
                    className="flex-1 bg-transparent px-2 py-1 outline-none placeholder:text-muted-foreground disabled:opacity-50"
                  />

                  <Button
                    type="submit"
                    disabled={isTyping || isRunningAct1}
                    className="shrink-0 rounded-full h-10 px-5 border border-transparent bg-[hsl(var(--accent))] text-sm font-medium text-white transition hover:bg-[hsl(var(--accent))]/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--accent))] focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    Generate
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative flex flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto flex h-full w-full max-w-4xl flex-col px-4 pb-28 pt-6 md:px-6 space-y-4">
          {messages.map((msg) => (
            <div key={msg.id}>{renderMessage(msg)}</div>
          ))}

          {isTyping && (
            <div className="flex w-full justify-start">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <div className="hamster-wheel hamster-wheel--small" aria-label="hamster is thinking" />
                <span className="sr-only">hamster is thinking{".".repeat(dots)}</span>
              </div>
            </div>
          )}

          <div ref={scrollRef} />
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent" />

      <div className="sticky bottom-0 w-full border-t border-border bg-background/80 backdrop-blur">
        <div className="mx-auto w-full max-w-4xl px-4 md:px-6 pt-2 pb-3 space-y-2">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {suggestionChips.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => handleChipClick(chip)}
                className="pointer-events-auto rounded-full border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:border-foreground hover:text-foreground transition-colors"
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
                disabled={isTyping || isRunningAct1}
                className="flex-1 bg-transparent px-2 py-1 outline-none placeholder:text-muted-foreground disabled:opacity-50"
              />
              <Button
                type="submit"
                size="icon"
                disabled={!hasRunLanding || isTyping || isRunningAct1}
                variant="outlineAccent"
                className="shrink-0 border-transparent hover:border-[hsl(var(--accent))]"
              >
                <ArrowUp className="h-5 w-5" strokeWidth={2.5} />
              </Button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
