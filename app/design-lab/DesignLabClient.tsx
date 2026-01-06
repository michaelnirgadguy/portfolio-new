"use client";

import { useEffect, useMemo, useState } from "react";
import HeroPlayerBubble from "@/components/bubbles/HeroPlayerBubble";
import GalleryBubble from "@/components/bubbles/GalleryBubble";
import ContactCard from "@/components/ContactCard";
import type { VideoItem } from "@/types/video";

const TOKEN_NAMES = [
  "--background",
  "--foreground",
  "--muted",
  "--muted-foreground",
  "--card",
  "--card-foreground",
  "--border",
  "--primary",
  "--primary-foreground",
  "--secondary",
  "--secondary-foreground",
  "--accent",
  "--accent-foreground",
  "--ring",
  "--radius",
  "--surface-1",
  "--surface-2",
  "--surface-border-soft",
  "--surface-border-strong",
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
  "--background-veil-strong",
  "--background-veil-strong-alpha",
  "--shadow-sm",
  "--shadow-md",
  "--shadow-lg",
];

const toPublicUrl = (filePath: string) =>
  `/${filePath.split("/").map(encodeURIComponent).join("/")}`;

type DesignLabClientProps = {
  videos: VideoItem[];
  backgroundImages: string[];
};

type TokenValues = Record<string, string>;

export default function DesignLabClient({ videos, backgroundImages }: DesignLabClientProps) {
  const [tokenValues, setTokenValues] = useState<TokenValues>({});
  const [defaultTokens, setDefaultTokens] = useState<TokenValues>({});
  const [selectedBg, setSelectedBg] = useState(backgroundImages[0] ?? "");

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

  const handleTokenChange = (name: string, value: string) => {
    setTokenValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleReset = () => {
    setTokenValues(defaultTokens);
  };

  return (
    <div className="min-h-screen" style={{ ...variableStyles, ...backgroundStyle }}>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 xl:flex-row">
        <section className="glass-surface flex min-h-[720px] flex-1 flex-col overflow-hidden">
          <header className="flex items-center justify-between border-b border-[hsl(var(--surface-border-soft))] px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-foreground">Mimsy Chat Preview</p>
              <p className="text-xs text-muted-foreground">Design sandbox · static messages</p>
            </div>
            <span className="rounded-full border border-[hsl(var(--surface-border-soft))] bg-[hsl(var(--surface-1))] px-3 py-1 text-xs text-muted-foreground">
              Live styling
            </span>
          </header>

          <div className="flex-1 space-y-4 overflow-y-auto px-4 pb-10 pt-6">
            <div className="flex w-full justify-start">
              <div className="flex items-start gap-3 max-w-[92%] sm:max-w-[80%]">
                <img src="/bigger-avatar.png" alt="Mimsy" className="mt-1 h-10 w-10 rounded-full shrink-0" />
                <div className="flex-1 px-4 py-2 rounded-[var(--radius)] whitespace-pre-wrap leading-relaxed border shadow-[var(--bubble-shadow-soft)] bg-[linear-gradient(145deg,hsl(var(--bubble-assistant-from)),hsl(var(--bubble-assistant-to)))] text-[hsl(var(--bubble-assistant-foreground))] border-[hsl(var(--bubble-assistant-border))]">
                  Welcome to the design lab! This is where we tweak the vibe before the hamster declares it perfect.
                </div>
              </div>
            </div>

            <div className="flex w-full justify-end">
              <div className="max-w-[75%]">
                <div className="px-4 py-2 rounded-[var(--radius)] whitespace-pre-wrap leading-relaxed border shadow-[var(--bubble-shadow-strong)] bg-[linear-gradient(145deg,hsl(var(--bubble-user-from)),hsl(var(--bubble-user-to)))] border-[hsl(var(--bubble-user-border))] text-[hsl(var(--bubble-user-foreground))]">
                  I want to test gradients, shadows, and background moods.
                </div>
              </div>
            </div>

            <div className="flex w-full justify-start">
              <div className="flex items-start gap-3 max-w-[92%] sm:max-w-[80%]">
                <img src="/bigger-avatar.png" alt="Mimsy" className="mt-1 h-10 w-10 rounded-full shrink-0" />
                <div className="flex-1 px-4 py-2 rounded-[var(--radius)] whitespace-pre-wrap leading-relaxed border shadow-[var(--bubble-shadow-soft)] bg-[linear-gradient(145deg,hsl(var(--bubble-assistant-from)),hsl(var(--bubble-assistant-to)))] text-[hsl(var(--bubble-assistant-foreground))] border-[hsl(var(--bubble-assistant-border))]">
                  Feast your eyes on a hero video, a gallery, and the contact card—all wired to your live tokens.
                </div>
              </div>
            </div>

            <HeroPlayerBubble video={heroVideo} />

            <GalleryBubble videoIds={galleryIds} videosById={videosById} />

            <ContactCard />

            <div className="flex w-full justify-end">
              <div className="max-w-[75%]">
                <div className="px-4 py-2 rounded-[var(--radius)] whitespace-pre-wrap leading-relaxed border shadow-[var(--bubble-shadow-strong)] bg-[linear-gradient(145deg,hsl(var(--bubble-user-from)),hsl(var(--bubble-user-to)))] border-[hsl(var(--bubble-user-border))] text-[hsl(var(--bubble-user-foreground))]">
                  Once the look feels right, I will copy the values into globals.css.
                </div>
              </div>
            </div>
          </div>

          <div className="pointer-events-none border-t border-[hsl(var(--surface-border-soft))] px-4 py-4">
            <div className="glass-surface mx-auto flex items-center gap-2 rounded-full px-3 py-2">
              <input
                disabled
                placeholder='Try "Show me a geeky video"'
                className="flex-1 bg-transparent px-2 py-1 text-sm text-muted-foreground outline-none"
              />
              <button
                type="button"
                className="shrink-0 rounded-full border border-[hsl(var(--surface-border-soft))] px-3 py-1 text-xs text-muted-foreground"
              >
                Send
              </button>
            </div>
          </div>
        </section>

        <aside className="glass-surface w-full shrink-0 space-y-6 p-5 xl:w-[360px]">
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
            <div className="space-y-3">
              {TOKEN_NAMES.map((name) => (
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
        </aside>
      </div>
    </div>
  );
}
