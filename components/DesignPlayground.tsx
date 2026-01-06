"use client";

import { FormEvent, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import ChatConversation from "@/components/chat/ChatConversation";
import type { Message } from "@/types/message";
import type { VideoItem } from "@/types/video";

const DEFAULT_TOKENS = {
  "--background": "0 0% 99%",
  "--foreground": "222.2 47.4% 11.2%",
  "--accent": "267 100% 77%",
  "--accent-foreground": "222 47% 11%",
  "--radius": "14px",
  "--surface-1": "0 0% 100% / 0.78",
  "--surface-2": "218 26% 96% / 0.6",
  "--surface-border-soft": "218 20% 88% / 0.6",
  "--surface-border-strong": "267 100% 77% / 0.45",
  "--bubble-assistant-from": "210 26% 98% / 0.94",
  "--bubble-assistant-to": "210 24% 94% / 0.9",
  "--bubble-assistant-border": "214 26% 86% / 0.95",
  "--bubble-assistant-foreground": "222.2 47.4% 11.2%",
  "--bubble-user-from": "267 96% 81% / 0.96",
  "--bubble-user-to": "267 90% 72% / 0.95",
  "--bubble-user-border": "267 76% 68% / 0.85",
  "--bubble-user-foreground": "222 47% 11%",
  "--bubble-shadow-soft": "0 12px 32px rgba(15, 23, 42, 0.12)",
  "--bubble-shadow-strong": "0 16px 42px rgba(15, 23, 42, 0.16)",
  "--background-veil-strong": "0 0% 99%",
  "--background-veil-strong-alpha": "0.62",
  "--shadow-sm": "0 6px 14px rgba(15, 23, 42, 0.06)",
  "--shadow-md": "0 14px 36px rgba(15, 23, 42, 0.12)",
  "--shadow-lg": "0 24px 68px rgba(15, 23, 42, 0.16)",
};

const TOKEN_GROUPS = [
  {
    title: "Base tokens",
    tokens: ["--background", "--foreground", "--accent", "--accent-foreground", "--radius"],
  },
  {
    title: "Glass surfaces",
    tokens: ["--surface-1", "--surface-2", "--surface-border-soft", "--surface-border-strong"],
  },
  {
    title: "Chat bubbles",
    tokens: [
      "--bubble-assistant-from",
      "--bubble-assistant-to",
      "--bubble-assistant-border",
      "--bubble-assistant-foreground",
      "--bubble-user-from",
      "--bubble-user-to",
      "--bubble-user-border",
      "--bubble-user-foreground",
      "--bubble-shadow-soft",
      "--bubble-shadow-strong",
    ],
  },
  {
    title: "Background & shadows",
    tokens: ["--background-veil-strong", "--background-veil-strong-alpha", "--shadow-sm", "--shadow-md", "--shadow-lg"],
  },
];

type DesignPlaygroundProps = {
  videos: VideoItem[];
  backgroundImages: string[];
};

export default function DesignPlayground({ videos, backgroundImages }: DesignPlaygroundProps) {
  const [input, setInput] = useState("");
  const [tokens, setTokens] = useState(DEFAULT_TOKENS);
  const [selectedBg, setSelectedBg] = useState(() => {
    if (backgroundImages.includes("/BG2.png")) return "/BG2.png";
    return backgroundImages[0] ?? "";
  });
  const scrollRef = useRef<HTMLDivElement>(null);

  const videosById = useMemo(() => new Map(videos.map((video) => [video.id, video])), [videos]);
  const heroVideo = videos[0];
  const galleryVideos = videos.slice(1, 6);
  const galleryIds = galleryVideos.map((video) => video.id);

  const messages = useMemo(() => {
    const sampleMessages: Message[] = [
      {
        id: "assistant-1",
        role: "assistant",
        text: "Greetings, cherished viewer. I have already prepared a tasting menu of cinematic wonders for you.",
      },
      {
        id: "user-1",
        role: "user",
        text: "Let’s see something bold and energetic.",
      },
      {
        id: "assistant-2",
        role: "assistant",
        text: "Ah, an ambitious soul. Here is a signature reel to set the mood.",
      },
    ];

    if (heroVideo) {
      sampleMessages.push({ id: "hero-1", role: "widget", type: "hero", videoId: heroVideo.id });
    }

    sampleMessages.push({
      id: "user-2",
      role: "user",
      text: "Great. Can I browse more?",
    });

    if (galleryIds.length > 0) {
      sampleMessages.push({ id: "gallery-1", role: "widget", type: "gallery", videoIds: galleryIds });
    }

    sampleMessages.push({
      id: "assistant-3",
      role: "assistant",
      text: "If you’d like to chat or book a project, here’s the direct line.",
    });

    sampleMessages.push({ id: "contact-1", role: "widget", type: "contact-card" });

    return sampleMessages;
  }, [galleryIds, heroVideo]);

  const tokenStyles = useMemo(() => {
    return Object.entries(tokens).reduce((acc, [key, value]) => {
      acc[key as keyof CSSProperties] = value;
      return acc;
    }, {} as CSSProperties);
  }, [tokens]);

  const backgroundImageLayers = useMemo(() => {
    const gradient =
      "radial-gradient(ellipse at center, hsl(var(--background-veil-strong) / var(--background-veil-strong-alpha)) 0%, hsl(var(--background-veil-strong) / var(--background-veil-strong-alpha)) 28%, hsl(var(--background-veil-strong) / 0) 68%, hsl(var(--background-veil-strong) / 0) 100%)";

    if (!selectedBg) return gradient;
    return `${gradient}, url('${selectedBg}')`;
  }, [selectedBg]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setInput("");
  }

  return (
    <div
      className="min-h-screen"
      style={{
        ...tokenStyles,
        backgroundColor: "hsl(var(--background))",
        backgroundImage: backgroundImageLayers,
        backgroundSize: selectedBg ? "cover" : "auto",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
      }}
    >
      <main className="relative flex min-h-screen flex-col">
        <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 pb-12 pt-6 lg:flex-row">
          <section className="flex min-h-[70vh] flex-1 flex-col overflow-hidden rounded-[var(--radius)] border border-border/50 bg-[hsl(var(--card))]/70 shadow-[var(--shadow-sm)]">
            <ChatConversation
              messages={messages}
              input={input}
              isTyping={false}
              isRunningAct1={false}
              hasRunLanding={true}
              activeChips={["Show me a bold edit", "More brand work", "Let’s chat"]}
              animateAct1Chips={false}
              dots={0}
              scrollRef={scrollRef}
              videosById={videosById}
              onInputChange={setInput}
              onSubmit={handleSubmit}
              onChipClick={(chip) => setInput(chip)}
              onOpenVideo={() => undefined}
              onPlayingChange={() => undefined}
              onMutedChange={() => undefined}
              onReachedMidpoint={() => undefined}
              onReachedNearEnd={() => undefined}
              onPlayed10s={() => undefined}
              onScrubForward={() => undefined}
              onScrubBackward={() => undefined}
              onStoppedEarly={() => undefined}
            />
          </section>

          <aside className="flex w-full flex-col gap-4 lg:w-[22rem]">
            <div className="glass-surface p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-foreground">Choose BG image</h2>
                <button
                  type="button"
                  onClick={() => setSelectedBg("")}
                  className="text-xs font-medium text-muted-foreground transition hover:text-foreground"
                >
                  Clear
                </button>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Pick any image from /public to preview it behind the chat UI.
              </p>
              {backgroundImages.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">No images found in /public.</p>
              ) : (
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2">
                  {backgroundImages.map((image) => {
                    const isActive = image === selectedBg;
                    return (
                      <button
                        key={image}
                        type="button"
                        onClick={() => setSelectedBg(image)}
                        className={`group relative overflow-hidden rounded-[12px] border text-left transition ${
                          isActive ? "border-[hsl(var(--accent))]" : "border-border/60"
                        }`}
                      >
                        <img
                          src={image}
                          alt={image.replace("/", "")}
                          className="h-20 w-full object-cover transition group-hover:scale-[1.02]"
                          loading="lazy"
                        />
                        <span className="absolute inset-x-0 bottom-0 bg-black/55 px-2 py-1 text-[10px] font-medium text-white backdrop-blur">
                          {image.replace("/", "")}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="glass-surface flex-1 p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-foreground">Design tokens</h2>
                <button
                  type="button"
                  onClick={() => setTokens(DEFAULT_TOKENS)}
                  className="text-xs font-medium text-muted-foreground transition hover:text-foreground"
                >
                  Reset
                </button>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Adjust the exact CSS variable names from globals.css and see the chat UI update live.
              </p>
              <div className="mt-4 space-y-4">
                {TOKEN_GROUPS.map((group) => (
                  <div key={group.title} className="space-y-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {group.title}
                    </h3>
                    <div className="space-y-2">
                      {group.tokens.map((tokenName) => (
                        <label key={tokenName} className="block text-xs text-muted-foreground">
                          <span className="font-semibold text-foreground">{tokenName}</span>
                          <input
                            value={tokens[tokenName as keyof typeof DEFAULT_TOKENS]}
                            onChange={(event) =>
                              setTokens((prev) => ({
                                ...prev,
                                [tokenName]: event.target.value,
                              }))
                            }
                            className="mt-1 w-full rounded-md border border-border/60 bg-transparent px-2 py-1 text-xs text-foreground outline-none focus:border-[hsl(var(--accent))]"
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
