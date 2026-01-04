"use client";

import ChatLanding from "@/components/chat/ChatLanding";
import ChatThread from "@/components/chat/ChatThread";
import { useChatController } from "@/hooks/useChatController";
import type { VideoItem } from "@/types/video";

type ChatProps = {
  initialVideos: VideoItem[];
};

export default function Chat({ initialVideos }: ChatProps) {
  const {
    phase,
    input,
    setInput,
    messages,
    isTyping,
    isRunningAct1,
    hasRunLanding,
    activeChips,
    animateAct1Chips,
    dots,
    scrollRef,
    videosById,
    handleLandingSubmit,
    handleSubmit,
    handleChipClick,
    handleOpenVideo,
    videoHandlers,
  } = useChatController(initialVideos);

  if (phase === "landing") {
    return (
      <ChatLanding
        input={input}
        isTyping={isTyping}
        isRunningAct1={isRunningAct1}
        onInputChange={setInput}
        onSubmit={handleLandingSubmit}
      />
    );
  }

  return (
    <ChatThread
      messages={messages}
      input={input}
      onInputChange={setInput}
      onSubmit={handleSubmit}
      onChipClick={handleChipClick}
      onOpenVideo={handleOpenVideo}
      isTyping={isTyping}
      isRunningAct1={isRunningAct1}
      hasRunLanding={hasRunLanding}
      dots={dots}
      activeChips={activeChips}
      animateAct1Chips={animateAct1Chips}
      scrollRef={scrollRef}
      videosById={videosById}
      videoHandlers={videoHandlers}
    />
  );
}
