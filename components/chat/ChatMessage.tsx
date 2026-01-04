"use client";

import SystemLogBubble from "@/components/bubbles/SystemLogBubble";
import HeroPlayerBubble from "@/components/bubbles/HeroPlayerBubble";
import GalleryBubble from "@/components/bubbles/GalleryBubble";
import ProfileBubble from "@/components/bubbles/ProfileBubble";
import Act1FailWidget from "@/components/bubbles/Act1FailWidget";
import ContactCard from "@/components/ContactCard";
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

type ChatMessageProps = {
  message: Message;
  videosById: Map<string, VideoItem>;
  onOpenVideo: (video: VideoItem) => void;
  videoHandlers: VideoHandlers;
};

export default function ChatMessage({ message, videosById, onOpenVideo, videoHandlers }: ChatMessageProps) {
  if (message.role === "system_log") {
    return <SystemLogBubble text={message.text} />;
  }

  if (message.role === "widget") {
    if (message.type === "hero") {
      return (
        <HeroPlayerBubble
          video={videosById.get(message.videoId)}
          onPlayingChange={videoHandlers.onPlayingChange}
          onMutedChange={videoHandlers.onMutedChange}
          onReachedMidpoint={videoHandlers.onReachedMidpoint}
          onReachedNearEnd={videoHandlers.onReachedNearEnd}
          onPlayed10s={videoHandlers.onPlayed10s}
          onScrubForward={videoHandlers.onScrubForward}
          onScrubBackward={videoHandlers.onScrubBackward}
          onStoppedEarly={videoHandlers.onStoppedEarly}
        />
      );
    }
    if (message.type === "gallery") {
      return (
        <GalleryBubble
          videoIds={message.videoIds}
          videosById={videosById}
          onOpenVideo={(video) => onOpenVideo(video)}
        />
      );
    }
    if (message.type === "contact-card") return <ContactCard />;
    if (message.type === "profile") return <ProfileBubble />;
    if (message.type === "act1-fail") {
      return <Act1FailWidget script={message.script} lineDelayMs={message.lineDelayMs} />;
    }
  }

  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex w-full justify-end">
        <div className="max-w-[75%]">
          <div className="px-4 py-2 rounded-[var(--radius)] whitespace-pre-wrap leading-relaxed border shadow-[var(--bubble-shadow-strong)] bg-[linear-gradient(145deg,hsl(var(--bubble-user-from)),hsl(var(--bubble-user-to)))] border-[hsl(var(--bubble-user-border))] text-[hsl(var(--bubble-user-foreground))]">
            {message.text}
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
          {message.text}
        </div>
      </div>
    </div>
  );
}
