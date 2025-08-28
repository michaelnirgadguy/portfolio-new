// lib/llm/intents.ts

// Single source of truth for router intents
export const INTENTS = [
  "show_videos",
  "navigate_video",
  "information",
  "show_portfolio",
] as const;

export type RouterIntent = typeof INTENTS[number];

// Type guard
export function isRouterIntent(x: unknown): x is RouterIntent {
  return typeof x === "string" && (INTENTS as readonly string[]).includes(x);
}
