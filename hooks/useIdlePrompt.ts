"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const IDLE_TIMEOUT_MS = 10000;
const ACTIVITY_EVENTS: Array<keyof WindowEventMap> = [
  "mousemove",
  "mousedown",
  "keydown",
  "touchstart",
  "scroll",
];

type UseIdlePromptOptions = {
  enabled: boolean;
  isTyping: boolean;
  isRunningAct1: boolean;
  onIdle: () => void | Promise<void>;
};

export function useIdlePrompt({
  enabled,
  isTyping,
  isRunningAct1,
  onIdle,
}: UseIdlePromptOptions) {
  const [isAnyVideoPlaying, setIsAnyVideoPlaying] = useState(false);
  const idleTimerRef = useRef<number | null>(null);
  const scheduleIdleTimerRef = useRef<() => void>(() => {});
  const enabledRef = useRef(enabled);
  const isTypingRef = useRef(isTyping);
  const isRunningAct1Ref = useRef(isRunningAct1);
  const isAnyVideoPlayingRef = useRef(isAnyVideoPlaying);
  const onIdleRef = useRef(onIdle);
  const videoPlayingMapRef = useRef<Map<string, boolean>>(new Map());

  const clearIdleTimer = useCallback(() => {
    if (idleTimerRef.current) {
      window.clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
  }, []);

  const handleIdleTimeout = useCallback(() => {
    if (
      !enabledRef.current ||
      isAnyVideoPlayingRef.current ||
      isTypingRef.current ||
      isRunningAct1Ref.current
    ) {
      scheduleIdleTimerRef.current();
      return;
    }

    Promise.resolve(onIdleRef.current?.()).finally(() => {
      scheduleIdleTimerRef.current();
    });
  }, []);

  const scheduleIdleTimer = useCallback(() => {
    clearIdleTimer();
    if (!enabledRef.current) return;
    idleTimerRef.current = window.setTimeout(() => {
      handleIdleTimeout();
    }, IDLE_TIMEOUT_MS);
  }, [clearIdleTimer, handleIdleTimeout]);

  const handleVideoPlayingChange = useCallback((videoId: string, isPlaying: boolean) => {
    const playingMap = videoPlayingMapRef.current;
    if (isPlaying) {
      playingMap.set(videoId, true);
    } else {
      playingMap.delete(videoId);
    }
    setIsAnyVideoPlaying(playingMap.size > 0);
  }, []);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  useEffect(() => {
    isTypingRef.current = isTyping;
  }, [isTyping]);

  useEffect(() => {
    isRunningAct1Ref.current = isRunningAct1;
  }, [isRunningAct1]);

  useEffect(() => {
    isAnyVideoPlayingRef.current = isAnyVideoPlaying;
  }, [isAnyVideoPlaying]);

  useEffect(() => {
    onIdleRef.current = onIdle;
  }, [onIdle]);

  useEffect(() => {
    scheduleIdleTimerRef.current = scheduleIdleTimer;
  }, [scheduleIdleTimer]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleActivity = () => {
      if (!isAnyVideoPlayingRef.current) {
        scheduleIdleTimerRef.current();
      }
    };

    ACTIVITY_EVENTS.forEach((eventName) => {
      window.addEventListener(eventName, handleActivity, { passive: true });
    });

    return () => {
      ACTIVITY_EVENTS.forEach((eventName) => {
        window.removeEventListener(eventName, handleActivity);
      });
    };
  }, []);

  useEffect(() => {
    if (isAnyVideoPlaying) {
      clearIdleTimer();
      return;
    }
    scheduleIdleTimerRef.current();
  }, [clearIdleTimer, isAnyVideoPlaying]);

  useEffect(() => {
    if (enabled) {
      scheduleIdleTimerRef.current();
      return;
    }
    clearIdleTimer();
  }, [clearIdleTimer, enabled]);

  useEffect(() => {
    return () => clearIdleTimer();
  }, [clearIdleTimer]);

  return { handleVideoPlayingChange, isAnyVideoPlaying };
}
