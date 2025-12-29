"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import SystemLogBubble from "@/components/bubbles/SystemLogBubble";
import HeroPlayerBubble from "@/components/bubbles/HeroPlayerBubble";
import GalleryBubble from "@/components/bubbles/GalleryBubble";
import ProfileBubble from "@/components/bubbles/ProfileBubble";
import Act1FailWidget from "@/components/bubbles/Act1FailWidget";
import ContactCard from "@/components/ContactCard";
import { usePendingDots } from "@/hooks/useChatHooks";
import { sendTurn } from "@/lib/llm/sendTurn";
import { getAllVideos } from "@/lib/videos";
import type { Message } from "@/types/message";
import type { VideoItem } from "@/types/video";
import { useSearchParams } from "next/navigation";

const LANDING_COMPLETE_KEY = "mimsyLandingCompleted";
const DIRECT_GREETING =
  "Hello! I see you're back. I assume you want to see Michael's videos, or are you just here for my charm?";
const ACT1_FAIL_REACTION = "Oh My! This never happened to me before.";
const ACT1_OFFER = "Mmm... Maybe instead I can show you videos made by my human, Michael?";
const ACT1_CHIPS = ["Yes please!", "Whatever, show me a cool vid", "Michael? Whos' that?"];
const FALLBACK_CHIPS = ["Show me a cool video", "Tell me more about michael", "What is this site?"];

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
  const [suggestionChips, setSuggestionChips] = useState<string[]>([]);
  const [animateAct1Chips, setAnimateAct1Chips] = useState(false);
  const [hasShownAct1Chips, setHasShownAct1Chips] = useState(false);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const searchParams = useSearchParams();
  const hasSentGreetingRef = useRef(false);

  const appendMessage = useCallback((msg: Message) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    const forceIntro = searchParams?.get("forceIntro")?.toLowerCase() === "true";
    if (forceIntro) {
      hasSentGreetingRef.current = false;
      setPhase("landing");
      setHasRunLanding(false);
      return;
    }

    const skipIntroParam = searchParams?.get("skipIntro")?.toLowerCase() === "true";
    const chatModeParam = searchParams?.get("mode")?.toLowerCase() === "chat";
    const landingCompleted = typeof window !== "undefined" && localStorage.getItem(LANDING_COMPLETE_KEY) === "true";

    if (skipIntroParam || chatModeParam || landingCompleted) {
      setHasRunLanding(true);
      setPhase("chat");

      if (!hasSentGreetingRef.current) {
        appendMessage({ id: crypto.randomUUID(), role: "assistant", text: DIRECT_GREETING });
        hasSentGreetingRef.current = true;
      }
    }
  }, [searchParams, appendMessage]);

  useEffect(() => {
    if (hasRunLanding && !suggestionChips.length) {
      setSuggestionChips(FALLBACK_CHIPS);
    }
  }, [hasRunLanding, suggestionChips.length]);

  useEffect(() => {
    if (!animateAct1Chips) return;
    const timeout = setTimeout(() => {
      setAnimateAct1Chips(false);
    }, 1200);

    return () => clearTimeout(timeout);
  }, [animateAct1Chips]);

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

  const handleShowContactCard = () => {
    appendMessage({ id: crypto.randomUUID(), role: "widget", type: "contact-card" });
  };

  const handleOpenVideo = async (video: VideoItem) => {
    if (isTyping || isRunningAct1) return;

    const syntheticMessage = `User opened video "${video.title}" (id: ${video.id}). The video is already displaying with its title; do not call any tools to show it again and do not repeat the title. Provide one short, enthusiastic line reacting to their choice and keep the conversation moving.`;

    setIsTyping(true);

    try {
      const {
        text,
        chips,
        nextLog,
        pendingVideoQueues,
        showAllVideos,
        darkModeEnabled,
        showContactCard,
      } = await sendTurn({
        log,
        userText: "User opened a video from the gallery.",
        syntheticAfterUser: syntheticMessage,
      });

      if (text) {
        appendMessage({ id: crypto.randomUUID(), role: "assistant", text, chips });
      }

      setSuggestionChips(chips?.length ? chips : FALLBACK_CHIPS);

      if (showAllVideos) {
        handleShowAllVideos();
      }

      if (typeof darkModeEnabled === "boolean") {
        setIsDarkMode(darkModeEnabled);
      }

      if (showContactCard) {
        handleShowContactCard();
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

    const lineDelayMs = 2200;
    const widgetId = crypto.randomUUID();

    appendMessage({
      id: widgetId,
      role: "widget",
      type: "act1-fail",
      script: [],
      lineDelayMs,
    });

    let script: string[] = [];

    try {
      const res = await fetch("/api/act1", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea }),
      });

      const data = await res.json();
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

    if (script.length) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === widgetId && msg.role === "widget" && msg.type === "act1-fail"
            ? { ...msg, script, lineDelayMs }
            : msg,
        ),
      );
    }

    await new Promise((resolve) => setTimeout(resolve, lineDelayMs * script.length));

    await new Promise((resolve) => setTimeout(resolve, 1000));
    appendMessage({ id: crypto.randomUUID(), role: "assistant", text: ACT1_FAIL_REACTION });

    await new Promise((resolve) => setTimeout(resolve, 1000));
    appendMessage({ id: crypto.randomUUID(), role: "assistant", text: ACT1_OFFER });

    setLog((prev) => [
      ...prev,
      { role: "user", content: idea },
      { role: "assistant", content: ACT1_FAIL_REACTION },
      { role: "assistant", content: ACT1_OFFER },
    ]);

    setSuggestionChips(ACT1_CHIPS);
    if (!hasShownAct1Chips) {
      setAnimateAct1Chips(true);
      setHasShownAct1Chips(true);
    }

    if (typeof window !== "undefined") {
      localStorage.setItem(LANDING_COMPLETE_KEY, "true");
    }

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
      const {
        text,
        chips,
        nextLog,
        pendingVideoQueues,
        showAllVideos,
        darkModeEnabled,
        showContactCard,
      } = await sendTurn({
        log,
        userText: trimmed,
      });

      if (text) {
        appendMessage({ id: crypto.randomUUID(), role: "assistant", text, chips });
      }

      if (chips?.length) {
        setSuggestionChips(chips);
      } else {
        setSuggestionChips(FALLBACK_CHIPS);
      }

      if (showAllVideos) {
        handleShowAllVideos();
      }

      if (typeof darkModeEnabled === "boolean") {
        setIsDarkMode(darkModeEnabled);
      }

      if (showContactCard) {
        handleShowContactCard();
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

  const dots = usePendingDots(isTyping && !isRunningAct1);

  const activeChips = hasRunLanding ? (suggestionChips.length ? suggestionChips : FALLBACK_CHIPS) : [];

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
      if (msg.type === "contact-card") return <ContactCard />;
      if (msg.type === "profile") return <ProfileBubble />;
      if (msg.type === "act1-fail") return <Act1FailWidget script={msg.script} lineDelayMs={msg.lineDelayMs} />;
    }

    const isUser = msg.role === "user";

    if (isUser) {
      return (
        <div className="flex w-full justify-end">
          <div className="max-w-[75%]">
            <div
              className="px-4 py-2 rounded-[var(--radius)] whitespace-pre-wrap leading-relaxed border shadow-[var(--bubble-shadow-strong)] bg-[linear-gradient(145deg,hsl(var(--bubble-user-from)),hsl(var(--bubble-user-to)))] border-[hsl(var(--bubble-user-border))] text-[hsl(var(--bubble-user-foreground))]"
            >
              {msg.text}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex w-full justify-start">
        <div className="flex items-start gap-3 max-w-[92%] sm:max-w-[80%]">
          <img
            src="/bigger-avatar.png"
            alt="Mimsy"
            className="mt-1 h-10 w-10 rounded-full shrink-0"
          />
          <div className="flex-1 px-4 py-2 rounded-[var(--radius)] whitespace-pre-wrap leading-relaxed border shadow-[var(--bubble-shadow-soft)] bg-[linear-gradient(145deg,hsl(var(--bubble-assistant-from)),hsl(var(--bubble-assistant-to)))] text-[hsl(var(--bubble-assistant-foreground))] border-[hsl(var(--bubble-assistant-border))]">
            {msg.text}
          </div>
        </div>
      </div>
    );
  }

  if (phase === "landing") {
    return (
      <section className="min-h-[100svh] w-full grid place-items-center px-6">
        <div className="w-full max-w-[min(42rem,calc(100vw-3rem))]">
          <div className="glass-surface relative overflow-hidden rounded-2xl border border-border/70 px-6 py-8 shadow-lg">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,hsl(var(--accent)/0.12),transparent_60%)]" />
            <div className="relative z-10 space-y-8 text-center">
              <img
                src="/tiny-Mimsy.png"
                alt="Mimsy"
                className="mx-auto h-24 w-24"
              />

              <p className="text-lg sm:text-xl md:text-2xl font-semibold text-foreground leading-snug">
                Hi, I’m Mimsy,
                <br />
                a hamster, a film creator, a genius!
              </p>

              <div className="space-y-4">
                <p className="text-base md:text-lg font-medium text-foreground/80 md:whitespace-nowrap">
                  Tell me your idea for a video - and I’ll generate it for you
                </p>

                <form
                  onSubmit={handleLandingSubmit}
                  className="flex items-center justify-center"
                >
                  <div className="w-full">
                    <div className="glass-surface flex w-full items-center gap-2 rounded-full px-3 py-2">
                      <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder='try "dogs dancing on the moon"'
                        disabled={isTyping || isRunningAct1}
                        className="flex-1 bg-transparent px-2 py-1 outline-none placeholder:text-muted-foreground/70 disabled:opacity-50"
                      />

                      <Button
                        type="submit"
                        disabled={isTyping || isRunningAct1}
                        size="icon"
                        aria-label="Generate"
                        className="relative z-10 h-10 w-10 shrink-0 border border-[hsl(var(--accent))] bg-[hsl(var(--accent))] text-white shadow-[0_10px_20px_hsl(var(--accent)/0.35)] transition hover:bg-[hsl(var(--accent))]/95 hover:shadow-[0_16px_30px_hsl(var(--accent)/0.4)] sm:h-10 sm:w-auto sm:px-4"
                      >
                        <span className="hidden sm:inline">Generate</span>
                        <ArrowUp className="h-5 w-5 sm:hidden" strokeWidth={2.5} />
                      </Button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative flex flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto flex h-full w-full max-w-[50rem] flex-col px-4 pb-28 pt-6 sm:pb-24 md:px-6 md:pb-20 space-y-4">
          {messages.map((msg) => (
            <div key={msg.id}>{renderMessage(msg)}</div>
          ))}

          {isTyping && !isRunningAct1 && (
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

      <div className="pointer-events-none fixed inset-x-0 bottom-3 z-30">
        <div className="relative mx-auto flex w-full max-w-[50rem] flex-col gap-3 px-4 md:block md:px-6">
          <div className="chip-scroll-hint pointer-events-auto flex flex-nowrap items-center gap-2 overflow-x-auto pb-1 md:absolute md:bottom-1 md:left-0 md:flex-col md:items-start md:overflow-visible md:pb-0 md:-translate-x-full md:-ml-3">
            {activeChips.map((chip, index) => (
              <button
                key={chip}
                type="button"
                onClick={() => handleChipClick(chip)}
                className={`pointer-events-auto shrink-0 glass-surface rounded-full px-3 py-2 text-sm font-medium text-foreground/90 transition-colors hover:text-foreground ${animateAct1Chips ? "fade-in" : ""}`}
                style={animateAct1Chips ? { animationDelay: `${index * 80}ms` } : undefined}
              >
                {chip}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="pointer-events-auto w-full max-w-3xl ml-auto mr-auto">
            <div className="glass-surface mx-auto flex items-center gap-2 rounded-full px-3 py-2">
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
