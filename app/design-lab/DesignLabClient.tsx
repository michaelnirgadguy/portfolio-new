"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import ChatConversation from "@/components/chat/ChatConversation";
import type { Message } from "@/types/message";
import type { VideoItem } from "@/types/video";

const TOKEN_GROUPS = [
  {
    label: "Core surfaces & text",
    description: "Base palette used for the page background, cards, and global text colors.",
    tokens: [
      "--background",
      "--foreground",
      "--muted",
      "--muted-foreground",
      "--card",
      "--card-foreground",
      "--border",
    ],
  },
  {
    label: "Brand accents & radii",
    description: "Accent colors for highlights, focus rings, and general rounding.",
    tokens: [
      "--primary",
      "--primary-foreground",
      "--secondary",
      "--secondary-foreground",
      "--accent",
      "--accent-foreground",
      "--ring",
      "--radius",
    ],
  },
  {
    label: "Glass surfaces",
    description: "Translucent layers used for glass-surface panels and borders.",
    tokens: [
      "--surface-1",
      "--surface-2",
      "--surface-border-soft",
      "--surface-border-strong",
    ],
  },
  {
    label: "Chat bubbles",
    description: "Gradients, borders, and text colors for Mimsy + user chat bubbles.",
    tokens: [
      "--bubble-assistant-from",
      "--bubble-assistant-to",
      "--bubble-assistant-border",
      "--bubble-assistant-foreground",
      "--bubble-user-from",
      "--bubble-user-to",
      "--bubble-user-border",
      "--bubble-user-foreground",
    ],
  },
  {
    label: "Shadows & background veil",
    description: "Shadow depth + the translucent overlay that softens the hero background.",
    tokens: [
      "--bubble-shadow-soft",
      "--bubble-shadow-strong",
      "--background-veil-strong",
      "--background-veil-strong-alpha",
      "--shadow-sm",
      "--shadow-md",
      "--shadow-lg",
    ],
  },
];

const TOKEN_NAMES = TOKEN_GROUPS.flatMap((group) => group.tokens);

const toPublicUrl = (filePath: string) =>
  `/${filePath.split("/").map(encodeURIComponent).join("/")}`;

type DesignLabClientProps = {
  videos: VideoItem[];
  backgroundImages: string[];
  children?: ReactNode;
};

type TokenValues = Record<string, string>;

export default function DesignLabClient({ videos, backgroundImages, children }: DesignLabClientProps) {
  const [tokenValues, setTokenValues] = useState<TokenValues>({});
  const [defaultTokens, setDefaultTokens] = useState<TokenValues>({});
  const [selectedBg, setSelectedBg] = useState(backgroundImages[0] ?? "");
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const computed = getComputedStyle(document.documentElement);
    const initialTokens = TOKEN_NAMES.reduce<TokenValues>((acc, name) => {
      acc[name] = computed.getPropertyValue(name).trim();
      return acc;
    }, {});

    setTokenValues(initialTokens);
    setDefaultTokens(initialTokens);
  }, []);

  const variableStyles = useMemo(() => {
    return Object.entries(tokenValues).reduce<Record<string, string>>((acc, [key, value]) => {
      if (value) acc[key] = value;
      return acc;
    }, {});
  }, [tokenValues]);

  const backgroundStyle = useMemo(() => {
    const imageUrl = selectedBg ? `url('${toPublicUrl(selectedBg)}')` : "none";
    return {
      backgroundImage: `radial-gradient(ellipse at center, hsl(var(--background-veil-strong) / var(--background-veil-strong-alpha)) 0%, hsl(var(--background-veil-strong) / var(--background-veil-strong-alpha)) 28%, hsl(var(--background-veil-strong) / 0) 68%, hsl(var(--background-veil-strong) / 0) 100%), ${imageUrl}`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      backgroundAttachment: "fixed",
    };
  }, [selectedBg]);

  const heroVideo = videos[0];
  const galleryVideos = videos.slice(1, 6);
  const galleryIds = galleryVideos.map((video) => video.id);
  const videosById = useMemo(() => new Map(videos.map((video) => [video.id, video])), [videos]);
  const messages = useMemo<Message[]>(() => {
    const items: Message[] = [
      {
        id: "assistant-1",
        role: "assistant",
        text:
          "Welcome to the design lab! This is where we tweak the vibe before the hamster declares it perfect.",
      },
      {
        id: "user-1",
        role: "user",
        text: "I want to test gradients, shadows, and background moods.",
      },
      {
        id: "assistant-2",
        role: "assistant",
        text: "Feast your eyes on the hero video, a gallery, and the contact card—wired to your live tokens.",
      },
    ];

    if (heroVideo?.id) {
      items.push({ id: "hero-video", role: "widget", type: "hero", videoId: heroVideo.id });
    }

    if (galleryIds.length) {
      items.push({ id: "gallery", role: "widget", type: "gallery", videoIds: galleryIds });
    }

    items.push({ id: "contact-card", role: "widget", type: "contact-card" });
    items.push({
      id: "user-2",
      role: "user",
      text: "Once the look feels right, I will copy the values into globals.css.",
    });

    return items;
  }, [galleryIds, heroVideo?.id]);

  const handleTokenChange = (name: string, value: string) => {
    setTokenValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleReset = () => {
    setTokenValues(defaultTokens);
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden" style={{ ...variableStyles, ...backgroundStyle }}>
      {children}
      <ChatConversation
        messages={messages}
        input={input}
        isTyping={false}
        isRunningAct1={false}
        hasRunLanding
        activeChips={[]}
        animateAct1Chips={false}
        dots={0}
        scrollRef={scrollRef}
        videosById={videosById}
        onInputChange={setInput}
        onSubmit={(event) => event.preventDefault()}
        onChipClick={() => {}}
        onOpenVideo={() => {}}
        onPlayingChange={() => {}}
        onMutedChange={() => {}}
        onReachedMidpoint={() => {}}
        onReachedNearEnd={() => {}}
        onPlayed10s={() => {}}
        onScrubForward={() => {}}
        onScrubBackward={() => {}}
        onStoppedEarly={() => {}}
      />

      <div className="fixed bottom-6 right-6 z-40 w-[320px] sm:w-[360px]">
        <div className="glass-surface overflow-hidden">
          <div className="flex items-center justify-between border-b border-[hsl(var(--surface-border-soft))] px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-foreground">Design controls</p>
              <p className="text-xs text-muted-foreground">Live tokens + background</p>
            </div>
            <button
              type="button"
              onClick={() => setIsPanelOpen((prev) => !prev)}
              className="rounded-full border border-[hsl(var(--surface-border-soft))] px-2 py-1 text-xs text-muted-foreground"
            >
              {isPanelOpen ? "Minimize" : "Expand"}
            </button>
          </div>

          {isPanelOpen && (
            <div className="max-h-[70vh] space-y-6 overflow-y-auto px-4 py-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold text-foreground">Choose BG image</h2>
                  <span className="text-xs text-muted-foreground">{backgroundImages.length} assets</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {backgroundImages.map((image) => {
                    const isActive = image === selectedBg;
                    const src = toPublicUrl(image);
                    return (
                      <button
                        key={image}
                        type="button"
                        onClick={() => setSelectedBg(image)}
                        className={`group relative overflow-hidden rounded-lg border text-left transition ${
                          isActive
                            ? "border-[hsl(var(--accent))] ring-2 ring-[hsl(var(--accent))]/40"
                            : "border-[hsl(var(--surface-border-soft))]"
                        }`}
                      >
                        <img src={src} alt={image} className="h-24 w-full object-cover" loading="lazy" />
                        <div className="absolute inset-x-0 bottom-0 bg-black/60 px-2 py-1 text-[10px] text-white">
                          {image}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold text-foreground">Design tokens</h2>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="text-xs font-medium text-[hsl(var(--accent))] hover:text-[hsl(var(--accent))]/80"
                  >
                    Reset defaults
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Adjust these to preview styles. Names match globals.css tokens for easy copy/paste.
                </p>
                <div className="space-y-4">
                  {TOKEN_GROUPS.map((group) => (
                    <div key={group.label} className="space-y-2">
                      <div className="rounded-lg border border-[hsl(var(--surface-border-soft))] bg-[hsl(var(--surface-1))] px-3 py-2">
                        <p className="text-xs font-semibold text-foreground">{group.label}</p>
                        <p className="text-[11px] text-muted-foreground">{group.description}</p>
                      </div>
                      <div className="space-y-3">
                        {group.tokens.map((name) => (
                          <label key={name} className="flex flex-col gap-1 text-xs text-muted-foreground">
                            <span className="font-medium text-foreground">{name}</span>
                            <input
                              value={tokenValues[name] ?? ""}
                              onChange={(event) => handleTokenChange(name, event.target.value)}
                              className="w-full rounded-md border border-[hsl(var(--surface-border-soft))] bg-[hsl(var(--surface-1))] px-2 py-1 text-xs text-foreground shadow-sm outline-none focus:border-[hsl(var(--accent))] focus:ring-2 focus:ring-[hsl(var(--accent))]/40"
                            />
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
