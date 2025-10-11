// lib/nudges.ts
// Simple, act-aware nudge helper:
// - Single counter that resets after each nudge and on act change
// - Stage machine per your rules (Act1: first → reminder; Act2: single nudge; Act3: none)
// - Returns one of the six template keys to inject as a synthetic user message

import { getAct } from "@/lib/acts";

/** Tweak thresholds here (number of actions until each nudge) */
export const NUDGE_THRESHOLDS = {
  ACT1_FIRST: 3,     // Act 1 → first nudge after this many actions
  ACT1_REMINDER: 5,  // Act 1 → reminder after this many actions (after we reset on the first)
  ACT2_FIRST: 3,     // Act 2 → single nudge after this many actions
} as const;

/** Session keys (per-tab) */
const KEY_STAGE = "mimsy_nudge_stage";             // "none" | "act1_first" | "act1_reminder" | "act2_done"
const KEY_COUNT = "mimsy_actions_since_reset";      // number
const KEY_ACT_SNAPSHOT = "mimsy_nudge_act_snapshot";// last seen act to detect changes

type Source = "message" | "video";

// Use your exact six template keys
export type NudgeTemplateKey =
  | "first_nudge_after_message"
  | "first_nudge_after_video"
  | "reminder_after_message"
  | "reminder_after_video"
  | "act2_nudge_after_message"
  | "act2_nudge_after_video"; 

export type NudgeDecision = null | { templateKey: NudgeTemplateKey };

/* ---------- tiny storage helpers ---------- */
const sget = (k: string) => {
  if (typeof window === "undefined") return null;
  try { return sessionStorage.getItem(k); } catch { return null; }
};
const sset = (k: string, v: string) => {
  if (typeof window === "undefined") return;
  try { sessionStorage.setItem(k, v); } catch {}
};
const sgetNum = (k: string) => {
  const v = sget(k);
  const n = v ? parseInt(v, 10) : 0;
  return Number.isFinite(n) ? n : 0;
};

/* ---------- state helpers (no placeholders) ---------- */
function hardReset() {
  sset(KEY_STAGE, "none");
  sset(KEY_COUNT, "0");
}

function getStage(): "none" | "act1_first" | "act1_reminder" | "act2_done" {
  const v = sget(KEY_STAGE);
  return (v === "act1_first" || v === "act1_reminder" || v === "act2_done") ? v : "none";
}
function setStage(v: "none" | "act1_first" | "act1_reminder" | "act2_done") {
  sset(KEY_STAGE, v);
}
function getCount() { return sgetNum(KEY_COUNT); }
function setCount(n: number) { sset(KEY_COUNT, String(n)); }

/** Reset if act changed since last call (always same action: clear stage+counter) */
function resetOnActChange(): void {
  const cur = getAct(); // "none" | "1" | "2" | "3" | "all" (depending on your acts.ts)
  const prev = sget(KEY_ACT_SNAPSHOT);
  if (prev !== cur) {
    sset(KEY_ACT_SNAPSHOT, cur);
    hardReset(); // same behavior for any act change
  }
}

/** Public: record a user action and decide whether to nudge */
export function recordAction(source: Source): NudgeDecision {
  resetOnActChange();

  const act = getAct();

  // Only nudge in Act 1 or Act 2
  if (act !== "1" && act !== "2") return null;

  let stage = getStage();
  let count = getCount() + 1;
  setCount(count);

  if (act === "1") {
    // Act 1: first nudge → reset → reminder → reset → stop
    if (stage === "none" && count >= NUDGE_THRESHOLDS.ACT1_FIRST) {
      setStage("act1_first");
      setCount(0);
      return { templateKey: source === "message" ? "first_nudge_after_message" : "first_nudge_after_video" };
    }
    if (stage === "act1_first" && count >= NUDGE_THRESHOLDS.ACT1_REMINDER) {
      setStage("act1_reminder");
      setCount(0);
      return { templateKey: source === "message" ? "reminder_after_message" : "reminder_after_video" };
    }
    return null;
  }

  // Act 2: one nudge total
  if (stage !== "act2_done" && count >= NUDGE_THRESHOLDS.ACT2_FIRST) {
    setStage("act2_done");
    setCount(0);
    return { templateKey: source === "message" ? "act2_nudge_after_message" : "act2_nudge-after_video" };
  }
  return null;
}

/** Public: manual reset for QA/dev */
export function resetNudges() {
  // Align snapshot to current act and clear counters/stage
  sset(KEY_ACT_SNAPSHOT, getAct());
  hardReset();
}
