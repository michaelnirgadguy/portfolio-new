import { useCallback, useEffect, useRef } from "react";
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
    "<instructions> make a witty comment about why you would also lose interest in that video, referencing its content </instructions>",
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
    "<instructions> comment playfully about what in this video could be too loud for you too, referencing the video's content </instructions>",
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
      if (typingRef.current || runningRef.current) return;
      if (!registerUserAction()) return;
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

        setLog(nextLog);
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
      registerUserAction,
      setIsDarkMode,
      setIsTyping,
      setLog,
      setSuggestionChips,
    ]
  );

  const handleSessionNudge = useCallback(
    (type: SessionNudgeType, videoId: string, turnBuilder: () => NudgeTurn) => {
      if (!videoId) return;
      const state = nudgeStateRef.current;
      const { sentKey, pendingKey } = SESSION_NUDGE_CONFIG[type];

      if (state[sentKey]) return;
      if (state.sentNudgeByVideoId.has(videoId)) {
        state[pendingKey] = true;
        return;
      }

      runNudgeTurn(turnBuilder());
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
    [runNudgeTurn]
  );

  const handleMutedChange = useCallback(
    (videoId: string, muted: boolean) => {
      if (!muted) return;
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
      const state = nudgeStateRef.current;
      if (state.scrubbedByVideoId.has(videoId)) return;
      if (state.sentNudgeByVideoId.has(videoId)) return;
      runNudgeTurn(buildMidpointTurn(videoId));
      state.sentNudgeByVideoId.add(videoId);
    },
    [runNudgeTurn]
  );

  const handleReachedNearEnd = useCallback(
    (videoId: string) => {
      const state = nudgeStateRef.current;
      if (state.scrubbedByVideoId.has(videoId)) return;
      if (state.muteNudgeByVideoId.has(videoId)) return;
      if (state.stopNudgeByVideoId.has(videoId)) return;
      if (state.finishedNudgeByVideoId.has(videoId)) return;
      runNudgeTurn(buildFinishedTurn(videoId));
      state.finishedNudgeByVideoId.add(videoId);
    },
    [runNudgeTurn]
  );

  const handlePlayed10s = useCallback(
    (videoId: string) => {
      bingeVideoIdsRef.current.add(videoId);
      const count = bingeVideoIdsRef.current.size;
      if (count < 3) return;
      handleSessionNudge("binge", videoId, () => buildBingeTurn(videoId, count));
    },
    [handleSessionNudge]
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
    handlePlayed10s,
    handleStoppedEarly,
  };
}
