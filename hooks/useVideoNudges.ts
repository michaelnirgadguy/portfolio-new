import { useCallback, useEffect, useRef } from "react";
import { compactLog } from "@/lib/llm/compactLog";
import { sendTurn } from "@/lib/llm/sendTurn";
import type { Message } from "@/types/message";

type SessionNudgeType = "mute" | "scrub-forward" | "scrub-backward" | "binge" | "stop";
type NudgeState = {
  sentNudgeByVideoId: Set<string>;
  scrubbedByVideoId: Set<string>;
  muteNudgeByVideoId: Set<string>;
  stopNudgeByVideoId: Set<string>;
  finishedNudgeByVideoId: Set<string>;
  muteNudgeSent: boolean;
  scrubForwardNudgeSent: boolean;
  scrubBackwardNudgeSent: boolean;
  bingeNudgeSent: boolean;
  stopNudgeSent: boolean;
  pendingMuteNudge: boolean;
  pendingScrubForwardNudge: boolean;
  pendingScrubBackwardNudge: boolean;
  pendingBingeNudge: boolean;
  pendingStopNudge: boolean;
};
type SessionNudgeConfig = {
  sentKey:
    | "muteNudgeSent"
    | "scrubForwardNudgeSent"
    | "scrubBackwardNudgeSent"
    | "bingeNudgeSent"
    | "stopNudgeSent";
  pendingKey:
    | "pendingMuteNudge"
    | "pendingScrubForwardNudge"
    | "pendingScrubBackwardNudge"
    | "pendingBingeNudge"
    | "pendingStopNudge";
};
type NudgeTurn = {
  userText: string;
  syntheticAfterUser: string;
};
type UseVideoNudgesArgs = {
  isLatestVideoMessage: (videoId: string) => boolean;
  log: any[];
  setLog: (nextLog: any[]) => void;
  appendMessage: (msg: Message) => void;
  setSuggestionChips: (chips: string[]) => void;
  setIsTyping: (next: boolean) => void;
  isTyping: boolean;
  isRunningAct1: boolean;
  handleShowAllVideos: () => void;
  handleShowContactCard: () => void;
  handleShowVideos: (ids: string[]) => void;
  setIsDarkMode: (next: boolean) => void;
  fallbackChips: string[];
  registerUserAction: () => boolean;
};

const SESSION_NUDGE_CONFIG: Record<SessionNudgeType, SessionNudgeConfig> = {
  mute: {
    sentKey: "muteNudgeSent",
    pendingKey: "pendingMuteNudge",
  },
  "scrub-forward": {
    sentKey: "scrubForwardNudgeSent",
    pendingKey: "pendingScrubForwardNudge",
  },
  "scrub-backward": {
    sentKey: "scrubBackwardNudgeSent",
    pendingKey: "pendingScrubBackwardNudge",
  },
  binge: {
    sentKey: "bingeNudgeSent",
    pendingKey: "pendingBingeNudge",
  },
  stop: {
    sentKey: "stopNudgeSent",
    pendingKey: "pendingStopNudge",
  },
};

const buildManualStopTurn = (videoId: string, seconds: number): NudgeTurn => ({
  userText: `<context> user paused\stopped the video ${videoId} </context>`,
  syntheticAfterUser:
    "<instructions> make a witty comment about why one would lose interest in that video, referencing its content </instructions>",
});

const buildMidpointTurn = (videoId: string): NudgeTurn => ({
  userText: `<context> user watched about half of the video ${videoId} </context>`,
  syntheticAfterUser:
    "<instructions> make a short comment on the content of the video to keep the user engaged </instructions>",
});

const buildFinishedTurn = (videoId: string): NudgeTurn => ({
  userText: `<context> user finished watchin the video ${videoId} </context>`,
  syntheticAfterUser:
    "<instructions> roast the user for watching the entire video, implying you, Mimsy, are too important or impatient for that sort of stuff, refrencing the video content. This message can be a bit longer. </instructions>",
});

const buildMuteTurn = (videoId: string): NudgeTurn => ({
  userText: `<context> user muted video ${videoId} </context>`,
  syntheticAfterUser:
    "<instructions> comment playfully about what in this video could be too loud for you too, referencing the video's content. in the *suggestion chips* - DO NOT reference muting/un-muting </instructions>",
});

const buildScrubForwardTurn = (videoId: string, seconds: number): NudgeTurn => ({
  userText: `<context> user skipped ${seconds} ahead on video ${videoId} </context>`,
  syntheticAfterUser:
    "<instructions> make a funny remark why you would also skip the boring parts, referencing the video's content </instructions>",
});

const buildScrubBackwardTurn = (videoId: string, seconds: number): NudgeTurn => ({
  userText: `<context> user rewinded ${seconds} on video ${videoId} </context>`,
  syntheticAfterUser:
    "<instructions> make a funny remark why you also like to re-watch stuff in this video, referencing the video's content </instructions>",
});

const buildBingeTurn = (videoId: string, nth: number): NudgeTurn => ({
  userText: `<context> user is now watching ${videoId} - his ${nth} video on the site </context>`,
  syntheticAfterUser:
    "<instructions> roast this video referencing its content. imply that you keep telling michael what to do but he never listens to you because you're a tiny hamster. suggest that maybe the user can talk some sense to michael, and ask if they would like to contact him. this can be a somewhat longer message </instructions>",
});

export function useVideoNudges({
  isLatestVideoMessage,
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
  fallbackChips,
  registerUserAction,
}: UseVideoNudgesArgs) {
  const logRef = useRef(log);
  const typingRef = useRef(isTyping);
  const runningRef = useRef(isRunningAct1);
  const nudgeStateRef = useRef<NudgeState>({
    sentNudgeByVideoId: new Set<string>(),
    scrubbedByVideoId: new Set<string>(),
    muteNudgeByVideoId: new Set<string>(),
    stopNudgeByVideoId: new Set<string>(),
    finishedNudgeByVideoId: new Set<string>(),
    muteNudgeSent: false,
    scrubForwardNudgeSent: false,
    scrubBackwardNudgeSent: false,
    bingeNudgeSent: false,
    stopNudgeSent: false,
    pendingMuteNudge: false,
    pendingScrubForwardNudge: false,
    pendingScrubBackwardNudge: false,
    pendingBingeNudge: false,
    pendingStopNudge: false,
  });
  const bingeVideoIdsRef = useRef<Set<string>>(new Set());
  const muteStateByVideoIdRef = useRef<Map<string, boolean>>(new Map());

  useEffect(() => {
    logRef.current = log;
  }, [log]);

  useEffect(() => {
    typingRef.current = isTyping;
  }, [isTyping]);

  useEffect(() => {
    runningRef.current = isRunningAct1;
  }, [isRunningAct1]);

  const runNudgeTurn = useCallback(
    async ({ userText, syntheticAfterUser }: NudgeTurn) => {
      setIsTyping(true);
      try {
        const {
          text,
          chips,
          nextLog,
          pendingVideoQueues = [],
          showAllVideos,
          darkModeEnabled,
          showContactCard,
        } = await sendTurn({
          log: logRef.current,
          userText,
          syntheticAfterUser,
        });

        if (text) {
          appendMessage({ id: crypto.randomUUID(), role: "assistant", text, chips });
        }

        setSuggestionChips(chips?.length ? chips : fallbackChips);

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

        setLog(compactLog(nextLog, 10));
      } catch (err) {
        console.error(err);
      } finally {
        setIsTyping(false);
      }
    },
    [
      appendMessage,
      fallbackChips,
      handleShowAllVideos,
      handleShowContactCard,
      handleShowVideos,
      setIsDarkMode,
      setIsTyping,
      setLog,
      setSuggestionChips,
    ]
  );

  const canRunNudge = useCallback(() => {
    if (typingRef.current || runningRef.current) return false;
    return registerUserAction();
  }, [registerUserAction]);

  const handleSessionNudge = useCallback(
    (type: SessionNudgeType, videoId: string, turnBuilder: () => NudgeTurn) => {
      if (!videoId) return;
      if (!isLatestVideoMessage(videoId)) return;
      const state = nudgeStateRef.current;
      const { sentKey, pendingKey } = SESSION_NUDGE_CONFIG[type];

      if (state[sentKey]) return;
      if (state.sentNudgeByVideoId.has(videoId)) {
        state[pendingKey] = true;
        return;
      }

      if (!canRunNudge()) {
        state[pendingKey] = true;
        return;
      }
      void runNudgeTurn(turnBuilder());
      state.sentNudgeByVideoId.add(videoId);
      if (type === "mute") {
        state.muteNudgeByVideoId.add(videoId);
      }
      if (type === "stop") {
        state.stopNudgeByVideoId.add(videoId);
      }
      state[sentKey] = true;
      state[pendingKey] = false;
    },
    [canRunNudge, isLatestVideoMessage, runNudgeTurn]
  );

  const handleMutedChange = useCallback(
    (videoId: string, muted: boolean) => {
      const muteState = muteStateByVideoIdRef.current;
      const previousMuted = muteState.get(videoId);
      muteState.set(videoId, muted);
      if (previousMuted !== false || !muted) {
        return;
      }
      handleSessionNudge("mute", videoId, () => buildMuteTurn(videoId));
    },
    [handleSessionNudge]
  );

  const handleScrubForward = useCallback(
    (videoId: string, deltaSeconds: number) => {
      const state = nudgeStateRef.current;
      state.scrubbedByVideoId.add(videoId);
      const seconds = Math.round(Math.abs(deltaSeconds));
      handleSessionNudge("scrub-forward", videoId, () => buildScrubForwardTurn(videoId, seconds));
    },
    [handleSessionNudge]
  );

  const handleScrubBackward = useCallback(
    (videoId: string, deltaSeconds: number) => {
      const state = nudgeStateRef.current;
      state.scrubbedByVideoId.add(videoId);
      const seconds = Math.round(Math.abs(deltaSeconds));
      handleSessionNudge("scrub-backward", videoId, () => buildScrubBackwardTurn(videoId, seconds));
    },
    [handleSessionNudge]
  );

  const handleReachedMidpoint = useCallback(
    (videoId: string) => {
      if (!isLatestVideoMessage(videoId)) return;
      const state = nudgeStateRef.current;
      if (state.scrubbedByVideoId.has(videoId)) return;
      if (state.sentNudgeByVideoId.has(videoId)) return;
      if (!canRunNudge()) return;
      void runNudgeTurn(buildMidpointTurn(videoId));
      state.sentNudgeByVideoId.add(videoId);
    },
    [canRunNudge, isLatestVideoMessage, runNudgeTurn]
  );

  const handleReachedNearEnd = useCallback(
    (videoId: string) => {
      if (!isLatestVideoMessage(videoId)) return;
      const state = nudgeStateRef.current;
      if (state.scrubbedByVideoId.has(videoId)) return;
      if (state.muteNudgeByVideoId.has(videoId)) return;
      if (state.stopNudgeByVideoId.has(videoId)) return;
      if (state.finishedNudgeByVideoId.has(videoId)) return;
      if (!canRunNudge()) return;
      void runNudgeTurn(buildFinishedTurn(videoId));
      state.finishedNudgeByVideoId.add(videoId);
    },
    [canRunNudge, isLatestVideoMessage, runNudgeTurn]
  );

  const handlePlayed5s = useCallback(
    (videoId: string) => {
      bingeVideoIdsRef.current.add(videoId);
      const count = bingeVideoIdsRef.current.size;
      if (count < 3) return;

      const state = nudgeStateRef.current;
      if (!isLatestVideoMessage(videoId)) {
        if (!state.bingeNudgeSent) {
          state.pendingBingeNudge = true;
        }
        return;
      }

      handleSessionNudge("binge", videoId, () => buildBingeTurn(videoId, count));
    },
    [handleSessionNudge, isLatestVideoMessage]
  );

  const handlePlayed10s = useCallback(
    (_videoId: string) => {
      // kept for backwards compatibility with existing callback plumbing
    },
    []
  );

  const handleStoppedEarly = useCallback(
    (videoId: string, seconds: number) => {
      const roundedSeconds = Math.round(seconds);
      handleSessionNudge("stop", videoId, () => buildManualStopTurn(videoId, roundedSeconds));
    },
    [handleSessionNudge]
  );

  return {
    handleMutedChange,
    handleScrubForward,
    handleScrubBackward,
    handleReachedMidpoint,
    handleReachedNearEnd,
    handlePlayed5s,
    handlePlayed10s,
    handleStoppedEarly,
  };
}
