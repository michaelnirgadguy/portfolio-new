"use client";

import ChatConversation from "@/components/chat/ChatConversation";
import ChatLanding from "@/components/chat/ChatLanding";
import { useChatController } from "@/hooks/useChatController";
import type { VideoItem } from "@/types/video";

export default function Chat({ initialVideos }: { initialVideos: VideoItem[] }) {
  const {
    phase,
    input,
    setInput,
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
    handleLandingChipClick,
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
  } = useChatController(initialVideos);

  if (phase === "landing") {
    return (
      <ChatLanding
        input={input}
        isTyping={isTyping}
        isRunningAct1={isRunningAct1}
        isActionLimitReached={hasReachedActionLimit}
        onInputChange={setInput}
        onSubmit={handleLandingSubmit}
        onChipClick={handleLandingChipClick}
      />
    );
  }

  return (
    <ChatConversation
      messages={messages}
      input={input}
      isTyping={isTyping}
      isRunningAct1={isRunningAct1}
      hasRunLanding={hasRunLanding}
      isActionLimitReached={hasReachedActionLimit}
      activeChips={activeChips}
      animateAct1Chips={animateAct1Chips}
      dots={dots}
      scrollRef={scrollRef}
      videosById={videosById}
      onInputChange={setInput}
      onSubmit={handleSubmit}
      onChipClick={handleChipClick}
      onOpenVideo={handleOpenVideo}
      onPlayingChange={handleVideoPlayingChange}
      onMutedChange={handleMutedChange}
      onReachedMidpoint={handleReachedMidpoint}
      onReachedNearEnd={handleReachedNearEnd}
      onPlayed10s={handlePlayed10s}
      onScrubForward={handleScrubForward}
      onScrubBackward={handleScrubBackward}
      onStoppedEarly={handleStoppedEarly}
    />
  );
}
