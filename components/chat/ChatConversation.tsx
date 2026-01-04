"use client";

import { FormEvent, RefObject } from "react";
import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import SystemLogBubble from "@/components/bubbles/SystemLogBubble";
import HeroPlayerBubble from "@/components/bubbles/HeroPlayerBubble";
import GalleryBubble from "@/components/bubbles/GalleryBubble";
import ProfileBubble from "@/components/bubbles/ProfileBubble";
import Act1FailWidget from "@/components/bubbles/Act1FailWidget";
import ContactCard from "@/components/ContactCard";
import type { Message } from "@/types/message";
import type { VideoItem } from "@/types/video";

type ChatConversationProps = {
  messages: Message[];
  input: string;
  isTyping: boolean;
  isRunningAct1: boolean;
  hasRunLanding: boolean;
  activeChips: string[];
  animateAct1Chips: boolean;
  dots: number;
  scrollRef: RefObject<HTMLDivElement>;
  videosById: Map<string, VideoItem>;
  onInputChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
  onChipClick: (chip: string) => void;
  onOpenVideo: (video: VideoItem) => void;
  onPlayingChange: (videoId: string, isPlaying: boolean) => void;
  onMutedChange: (muted: boolean) => void;
  onReachedMidpoint: () => void;
  onReachedNearEnd: () => void;
  onPlayed10s: () => void;
  onScrubForward: () => void;
  onScrubBackward: () => void;
  onStoppedEarly: () => void;
};

export default function ChatConversation({
  messages,
  input,
  isTyping,
  isRunningAct1,
  hasRunLanding,
  activeChips,
  animateAct1Chips,
  dots,
  scrollRef,
  videosById,
  onInputChange,
  onSubmit,
  onChipClick,
  onOpenVideo,
  onPlayingChange,
  onMutedChange,
  onReachedMidpoint,
  onReachedNearEnd,
  onPlayed10s,
  onScrubForward,
  onScrubBackward,
  onStoppedEarly,
}: ChatConversationProps) {
  function renderMessage(msg: Message) {
    if (msg.role === "system_log") {
      return <SystemLogBubble text={msg.text} />;
    }

    if (msg.role === "widget") {
      if (msg.type === "hero") {
        return (
          <HeroPlayerBubble
            video={videosById.get(msg.videoId)}
            onPlayingChange={onPlayingChange}
            onMutedChange={onMutedChange}
            onReachedMidpoint={onReachedMidpoint}
            onReachedNearEnd={onReachedNearEnd}
            onPlayed10s={onPlayed10s}
            onScrubForward={onScrubForward}
            onScrubBackward={onScrubBackward}
            onStoppedEarly={onStoppedEarly}
          />
        );
      }
      if (msg.type === "gallery")
        return (
          <GalleryBubble
            videoIds={msg.videoIds}
            videosById={videosById}
            onOpenVideo={(video) => onOpenVideo(video)}
          />
        );
      if (msg.type === "contact-card") return <ContactCard />;
      if (msg.type === "profile") return <ProfileBubble />;
      if (msg.type === "act1-fail") return <Act1FailWidget script={msg.script} lineDelayMs={msg.lineDelayMs} />;
    }

    const isUser = msg.role === "user";

    if (isUser) {
      return (
        <div className="flex w-full justify-end">
          <div className="max-w-[75%]">
            <div className="px-4 py-2 rounded-[var(--radius)] whitespace-pre-wrap leading-relaxed border shadow-[var(--bubble-shadow-strong)] bg-[linear-gradient(145deg,hsl(var(--bubble-user-from)),hsl(var(--bubble-user-to)))] border-[hsl(var(--bubble-user-border))] text-[hsl(var(--bubble-user-foreground))]">
              {msg.text}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex w-full justify-start">
        <div className="flex items-start gap-3 max-w-[92%] sm:max-w-[80%]">
          <img src="/bigger-avatar.png" alt="Mimsy" className="mt-1 h-10 w-10 rounded-full shrink-0" />
          <div className="flex-1 px-4 py-2 rounded-[var(--radius)] whitespace-pre-wrap leading-relaxed border shadow-[var(--bubble-shadow-soft)] bg-[linear-gradient(145deg,hsl(var(--bubble-assistant-from)),hsl(var(--bubble-assistant-to)))] text-[hsl(var(--bubble-assistant-foreground))] border-[hsl(var(--bubble-assistant-border))]">
            {msg.text}
          </div>
        </div>
      </div>
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
                onClick={() => onChipClick(chip)}
                className={`pointer-events-auto shrink-0 glass-surface rounded-full px-3 py-2 text-sm font-medium text-foreground/90 transition-colors hover:text-foreground ${animateAct1Chips ? "fade-in" : ""}`}
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
