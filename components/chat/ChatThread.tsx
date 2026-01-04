"use client";

import type { FormEvent, RefObject } from "react";
import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import ChatMessage from "@/components/chat/ChatMessage";
import type { Message } from "@/types/message";
import type { VideoItem } from "@/types/video";

type VideoHandlers = {
  onPlayingChange: (isPlaying: boolean) => void;
  onMutedChange: (isMuted: boolean) => void;
  onReachedMidpoint: () => void;
  onReachedNearEnd: () => void;
  onPlayed10s: () => void;
  onScrubForward: () => void;
  onScrubBackward: () => void;
  onStoppedEarly: () => void;
};

type ChatThreadProps = {
  messages: Message[];
  input: string;
  onInputChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
  onChipClick: (chip: string) => void;
  onOpenVideo: (video: VideoItem) => void;
  isTyping: boolean;
  isRunningAct1: boolean;
  hasRunLanding: boolean;
  dots: number;
  activeChips: string[];
  animateAct1Chips: boolean;
  scrollRef: RefObject<HTMLDivElement | null>;
  videosById: Map<string, VideoItem>;
  videoHandlers: VideoHandlers;
};

export default function ChatThread({
  messages,
  input,
  onInputChange,
  onSubmit,
  onChipClick,
  onOpenVideo,
  isTyping,
  isRunningAct1,
  hasRunLanding,
  dots,
  activeChips,
  animateAct1Chips,
  scrollRef,
  videosById,
  videoHandlers,
}: ChatThreadProps) {
  return (
    <section className="relative flex flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto flex h-full w-full max-w-[50rem] flex-col px-4 pb-28 pt-6 sm:pb-24 md:px-6 md:pb-20 space-y-4">
          {messages.map((msg) => (
            <div key={msg.id}>
              <ChatMessage
                message={msg}
                videosById={videosById}
                onOpenVideo={onOpenVideo}
                videoHandlers={videoHandlers}
              />
            </div>
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
                onClick={() => onChipClick(chip)}
                className={`pointer-events-auto shrink-0 glass-surface rounded-full px-3 py-2 text-sm font-medium text-foreground/90 transition-colors hover:text-foreground ${
                  animateAct1Chips ? "fade-in" : ""
                }`}
                style={animateAct1Chips ? { animationDelay: `${index * 80}ms` } : undefined}
              >
                {chip}
              </button>
            ))}
          </div>

          <form onSubmit={onSubmit} className="pointer-events-auto w-full max-w-3xl ml-auto mr-auto">
            <div className="glass-surface mx-auto flex items-center gap-2 rounded-full px-3 py-2">
              <input
                value={input}
                onChange={(event) => onInputChange(event.target.value)}
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
