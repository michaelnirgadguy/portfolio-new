"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { usePendingDots } from "@/hooks/useChatHooks";
import { useIdlePrompt } from "@/hooks/useIdlePrompt";
import { useVideoNudges } from "@/hooks/useVideoNudges";
import { sendTurn } from "@/lib/llm/sendTurn";
import type { Message } from "@/types/message";
import type { VideoItem } from "@/types/video";

const LANDING_COMPLETE_KEY = "mimsyLandingCompleted";
const DIRECT_GREETING =
  "Hello! I see you're back. I assume you want to see Michael's videos, or are you just here for my charm?";
const ACT1_FAIL_REACTION = "Oh My! This never happened to me before.";
const ACT1_OFFER = "Mmm... Maybe instead I can show you videos made by my human, Michael?";
const ACT1_CHIPS = ["Yes please!", "Whatever, show me a cool vid", "Michael? Whos' that?"];
const FALLBACK_CHIPS = ["Show me a cool video", "Tell me more about michael", "What is this site?"];
const MAX_INPUT_CHARS = 280;
const MAX_USER_ACTIONS = 25;
const ACTION_LIMIT_MESSAGE =
  "You've hit the 25-action limit for this session. Refresh the page to start a new chat.";
const MAX_LOG_ENTRIES = 10;

type Phase = "landing" | "chat";

type ApplyTurnResponseInput = {
  text?: string | null;
  chips?: string[] | null;
  nextLog: any[];
  pendingVideoQueues: string[][];
  showAllVideos?: boolean;
  darkModeEnabled?: boolean;
  showContactCard?: boolean;
};

export function useChatController(initialVideos: VideoItem[]) {
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
  const [actionCount, setActionCount] = useState(0);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const searchParams = useSearchParams();
  const hasSentGreetingRef = useRef(false);
  const hasShownMegaCardRef = useRef(false);
  const actionCountRef = useRef(0);
  const limitMessageShownRef = useRef(false);
  const videosById = useMemo(
    () => new Map(initialVideos.map((video) => [video.id, video])),
    [initialVideos],
  );

  const appendMessage = useCallback((msg: Message) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  const setChipsOrFallback = useCallback((chips?: string[] | null) => {
    setSuggestionChips(chips?.length ? chips : FALLBACK_CHIPS);
  }, []);

  const registerUserAction = useCallback(() => {
    if (actionCountRef.current >= MAX_USER_ACTIONS) {
      if (!limitMessageShownRef.current) {
        appendMessage({
          id: crypto.randomUUID(),
          role: "assistant",
          text: ACTION_LIMIT_MESSAGE,
        });
        limitMessageShownRef.current = true;
      }
      return false;
    }

    actionCountRef.current += 1;
    setActionCount(actionCountRef.current);
    return true;
  }, [appendMessage]);

  const handleShowVideos = useCallback(
    (ids: string[]) => {
      if (!ids?.length) return;
      if (ids.length === 1) {
        appendMessage({ id: crypto.randomUUID(), role: "widget", type: "hero", videoId: ids[0] });
      } else {
        appendMessage({ id: crypto.randomUUID(), role: "widget", type: "mega-card", videoIds: ids });
      }
    },
    [appendMessage],
  );

  const handleShowAllVideos = useCallback(() => {
    const allIds = initialVideos.map((video) => video.id);
    if (!allIds.length) return;

    appendMessage({ id: crypto.randomUUID(), role: "widget", type: "mega-card", videoIds: allIds });
  }, [appendMessage, initialVideos]);

  const handleShowContactCard = useCallback(() => {
    appendMessage({ id: crypto.randomUUID(), role: "widget", type: "contact-card" });
  }, [appendMessage]);

  const applyTurnResponse = useCallback(
    ({
      text,
      chips,
      pendingVideoQueues,
      showAllVideos,
      darkModeEnabled,
      showContactCard,
    }: ApplyTurnResponseInput) => {
      if (text) {
        appendMessage({ id: crypto.randomUUID(), role: "assistant", text, chips });
      }

      setChipsOrFallback(chips);

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
    },
    [
      appendMessage,
      handleShowAllVideos,
      handleShowContactCard,
      handleShowVideos,
      setChipsOrFallback,
    ],
  );

  const handleIdleTimeout = useCallback(async () => {
    setIsTyping(true);
    try {
      const response = await sendTurn({
        log,
        userText: "<context> user idle for 20 seconds; no video playing </context>",
        syntheticAfterUser:
          '<instructions> begin with something like "Yoo-hoo, are you there?" then prompt the user to explore a video or ask about Michael </instructions>',
      });

      applyTurnResponse(response);
      setLog(response.nextLog.slice(-MAX_LOG_ENTRIES));
    } catch (err) {
      console.error(err);
    } finally {
      setIsTyping(false);
    }
  }, [applyTurnResponse, log]);

  const { handleVideoPlayingChange } = useIdlePrompt({
    enabled: hasRunLanding && phase === "chat",
    isTyping,
    isRunningAct1,
    onIdle: handleIdleTimeout,
  });

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
      hasShownMegaCardRef.current = false;
      setPhase("landing");
      setHasRunLanding(false);
      return;
    }

    const skipIntroParam = searchParams?.get("skipIntro")?.toLowerCase() === "true";
    const chatModeParam = searchParams?.get("mode")?.toLowerCase() === "chat";
    const landingCompleted =
      typeof window !== "undefined" && localStorage.getItem(LANDING_COMPLETE_KEY) === "true";

    if (skipIntroParam || chatModeParam || landingCompleted) {
      setHasRunLanding(true);
      setPhase("chat");

      if (!hasSentGreetingRef.current) {
        appendMessage({ id: crypto.randomUUID(), role: "assistant", text: DIRECT_GREETING });
        hasSentGreetingRef.current = true;
      }
    }

    const showMegaCardParam = searchParams?.get("showMegaCard")?.toLowerCase() === "true";
    if (showMegaCardParam && !hasShownMegaCardRef.current) {
      const allIds = initialVideos.map((video) => video.id);
      if (allIds.length) {
        appendMessage({ id: crypto.randomUUID(), role: "widget", type: "mega-card", videoIds: allIds });
        hasShownMegaCardRef.current = true;
      }
    }
  }, [searchParams, appendMessage, initialVideos]);

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

  async function handleLandingSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    if (isTyping || isRunningAct1) return;
    if (!registerUserAction()) return;

    await runLandingSequence(trimmed);
  }

  const {
    handleMutedChange,
    handleScrubForward,
    handleScrubBackward,
    handleReachedMidpoint,
    handleReachedNearEnd,
    handlePlayed10s,
    handleStoppedEarly,
  } = useVideoNudges({
    log,
    setLog,
    appendMessage,
    setSuggestionChips,
    setIsTyping,
    isTyping,
    isRunningAct1,
    handleShowAllVideos,
    handleShowContactCard,
    handleShowVideos,
    setIsDarkMode,
    fallbackChips: FALLBACK_CHIPS,
    registerUserAction,
  });

  const handleOpenVideo = async (video: VideoItem) => {
    if (isTyping || isRunningAct1) return;
    if (!registerUserAction()) return;

    const syntheticMessage =
      "<instructions> do not call any tools. do not repeat the title or client as they already appear on screen.. Provide one short, enthusiastic line reacting to their choice and keep the conversation moving. </instructions>";

    setIsTyping(true);

    try {
      const response = await sendTurn({
        log,
        userText: `<context> User opened video \"${video.title}\" (id: ${video.id}) from the mega card. </context>`,
        syntheticAfterUser: syntheticMessage,
      });

      applyTurnResponse(response);
      handleShowVideos([video.id]);
      setLog(response.nextLog.slice(-MAX_LOG_ENTRIES));
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

    setLog(
      [
        { role: "user", content: `generate for me: ${idea}` },
        { role: "assistant", content: JSON.stringify({ text: ACT1_OFFER, chips: ACT1_CHIPS }) },
      ].slice(-MAX_LOG_ENTRIES),
    );

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
    if (!registerUserAction()) return;

    const userMessage: Message = { id: crypto.randomUUID(), role: "user", text: trimmed };
    appendMessage(userMessage);
    setInput("");

    setIsTyping(true);
    try {
      const response = await sendTurn({
        log,
        userText: trimmed,
      });

      applyTurnResponse(response);
      setLog(response.nextLog.slice(-MAX_LOG_ENTRIES));
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

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    await submitMessage(input);
  }

  const dots = usePendingDots(isTyping && !isRunningAct1);

  const activeChips = hasRunLanding
    ? suggestionChips.length
      ? suggestionChips
      : FALLBACK_CHIPS
    : [];

  const handleChipClick = (chip: string) => {
    if (isTyping || isRunningAct1) return;

    setInput(chip);
    setTimeout(() => {
      submitMessage(chip);
    }, 300);
  };

  const handleInputChange = useCallback((value: string) => {
    setInput(value.slice(0, MAX_INPUT_CHARS));
  }, []);

  const hasReachedActionLimit = actionCount >= MAX_USER_ACTIONS;

  return {
    phase,
    input,
    setInput: handleInputChange,
    messages,
    isTyping,
    isRunningAct1,
    hasRunLanding,
    animateAct1Chips,
    activeChips,
    dots,
    scrollRef,
    videosById,
    hasReachedActionLimit,
    handleLandingSubmit,
    handleSubmit,
    handleChipClick,
    handleOpenVideo,
    handleVideoPlayingChange,
    handleMutedChange,
    handleScrubForward,
    handleScrubBackward,
    handleReachedMidpoint,
    handleReachedNearEnd,
    handlePlayed10s,
    handleStoppedEarly,
  };
}
