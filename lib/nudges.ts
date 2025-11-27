// lib/nudges.ts
// Simple, act-aware nudge helper:
// - Single counter that resets after each nudge and on act change
// - Stage machine per your rules (Act1: first → reminder; Act2: single nudge; Act3: none)
// - Returns one of the template keys to inject as a synthetic user message

import { getAct } from "@/lib/acts";

/** Tweak thresholds here (number of actions until each nudge) */
export const NUDGE_THRESHOLDS = {
  ACT1_FIRST: 8,     // Act 1 → first nudge after this many actions
  ACT1_REMINDER: 3,  // Act 1 → reminder after this many actions (after we reset on the first)
  ACT2_FIRST: 3,     // Act 2 → single nudge directing to Act 3
} as const;

const KEY_STAGE = "mimsy_nudge_stage";
const KEY_COUNT = "mimsy_actions_since_reset";
const KEY_ACT_SNAPSHOT = "mimsy_nudge_act_snapshot";
// One-shot gate for Act 2 (hard cap one nudge per tab/session)
const KEY_ACT2_ONCE = "mimsy_act2_nudged_once";

type NudgeTemplateKey =
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
const sgetBool = (k: string) => sget(k) === "1";
const ssetBool = (k: string, v: boolean) => sset(k, v ? "1" : "0");

/* ---------- state helpers ---------- */
function hardReset() {
  sset(KEY_STAGE, "none");
  sset(KEY_COUNT, "0");
  // also clear the Act 2 one-shot flag on hard resets
  sset(KEY_ACT2_ONCE, "0");
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

/** Reset if act changed since last call (clear stage+counter and Act2 one-shot) */
function resetOnActChange(): void {
  const cur = getAct(); // "none" | "1" | "2" | "3" | "all"
  const prev = sget(KEY_ACT_SNAPSHOT);
  if (prev !== cur) {
    sset(KEY_ACT_SNAPSHOT, cur);
    hardReset();
  }
}

/**
 * Call this after each relevant user action (message sent, video clicked, etc.)
 * It increments counters and decides whether to return a nudge template key.
 */
type Source = "message" | "video";

export function recordAction(source: Source): NudgeDecision {
  resetOnActChange();

  const act = getAct();

  // Only nudge in Act 1 or Act 2
  if (act !== "1" && act !== "2") return null;

  let stage = getStage();
  let count = getCount() + 1;
  setCount(count);

  // ----- Act 1: first nudge → reminder -----
  if (act === "1") {
    if (stage === "none" && count >= NUDGE_THRESHOLDS.ACT1_FIRST) {
      setStage("act1_first");
      setCount(0);
      return {
        templateKey: source === "message"
          ? "first_nudge_after_message"
          : "first_nudge_after_video",
      };
    }
    if (stage === "act1_first" && count >= NUDGE_THRESHOLDS.ACT1_REMINDER) {
      setStage("act1_reminder");
      setCount(0);
      return {
        templateKey: source === "message"
          ? "reminder_after_message"
          : "reminder_after_video",
      };
    }
    return null;
  }

  // ----- Act 2: hard cap to exactly one nudge per tab/session -----
  if (act === "2") {
    if (sgetBool(KEY_ACT2_ONCE)) return null; // already nudged once this session

    if (stage !== "act2_done" && count >= NUDGE_THRESHOLDS.ACT2_FIRST) {
      setStage("act2_done");
      setCount(0);
      ssetBool(KEY_ACT2_ONCE, true); // mark as used
      return {
        templateKey: source === "message"
          ? "act2_nudge_after_message"
          : "act2_nudge_after_video",
      };
    }
    return null;
  }

  return null;
}

/** Public: manual reset for QA/dev */
export function resetNudges() {
  // Align snapshot to current act and clear counters/stage + Act2 one-shot
  sset(KEY_ACT_SNAPSHOT, getAct());
  hardReset();
}
