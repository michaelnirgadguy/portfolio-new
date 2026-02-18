"use client";

import { FormEvent, useEffect, useRef } from "react";
import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";

const LANDING_SUGGESTIONS = [
  "dogs dancing on the moon",
  "a short ad for a wine brand",
  "timelapse of NY skyline",
];

type ChatLandingProps = {
  input: string;
  isTyping: boolean;
  isRunningAct1: boolean;
  isActionLimitReached: boolean;
  onInputChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
  onChipClick: (chip: string) => void;
};

export default function ChatLanding({
  input,
  isTyping,
  isRunningAct1,
  isActionLimitReached,
  onInputChange,
  onSubmit,
  onChipClick,
}: ChatLandingProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const isInputDisabled = isTyping || isRunningAct1 || isActionLimitReached;

  useEffect(() => {
    if (!isInputDisabled) {
      inputRef.current?.focus();
    }
  }, [isInputDisabled]);

  return (
    <section className="min-h-[100svh] w-full grid place-items-center px-6">
      <div className="w-full max-w-[min(42rem,calc(100vw-3rem))]">
        <div className="glass-surface relative overflow-hidden rounded-2xl border border-border/70 px-6 py-8 shadow-lg">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,hsl(var(--accent)/0.12),transparent_60%)]" />
          <div className="relative z-10 space-y-8 text-center">
            <img src="/tiny-Mimsy.png" alt="Mimsy" className="mx-auto h-24 w-24" />

            <p className="text-lg sm:text-xl md:text-2xl font-semibold text-foreground leading-snug">
              Hi, I’m Mimsy,
              <br />a hamster, a film creator, a genius!
            </p>

            <div className="space-y-4">
              <p className="text-base md:text-lg font-medium text-foreground/80 md:whitespace-nowrap">
                Tell me your idea for a video - and I’ll generate it for you
              </p>

              <form onSubmit={onSubmit} className="flex items-center justify-center">
                <div className="w-full">
                  <div className="glass-surface flex w-full items-center gap-2 rounded-full px-3 py-2">
                    <input
                      ref={inputRef}
                      value={input}
                      onChange={(event) => onInputChange(event.target.value)}
                      maxLength={280}
                      autoFocus
                      placeholder="Type your video idea here"
                      disabled={isInputDisabled}
                      className="flex-1 bg-transparent px-2 py-1 outline-none placeholder:text-muted-foreground/70 disabled:opacity-50"
                    />

                    <Button
                      type="submit"
                      disabled={isInputDisabled}
                      size="icon"
                      aria-label="Generate"
                      className="relative z-10 h-10 w-10 shrink-0 border border-[hsl(var(--accent))] bg-[hsl(var(--accent))] text-white shadow-[0_10px_20px_hsl(var(--accent)/0.35)] transition hover:bg-[hsl(var(--accent))]/95 hover:shadow-[0_16px_30px_hsl(var(--accent)/0.4)] sm:h-10 sm:w-auto sm:px-4"
                    >
                      <span className="hidden sm:inline">Generate</span>
                      <ArrowUp className="h-5 w-5 sm:hidden" strokeWidth={2.5} />
                    </Button>
                  </div>
                </div>
              </form>

              <div className="chip-scroll-hint mx-auto flex w-full flex-nowrap items-center justify-center gap-2 overflow-x-auto px-0.5 pt-1 pb-1 no-scrollbar">
                {LANDING_SUGGESTIONS.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => {
                      if (isInputDisabled) return;
                      onChipClick(chip);
                      inputRef.current?.focus();
                    }}
                    disabled={isInputDisabled}
                    className="suggestion-chip shrink-0 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
