// lib/acts.ts
// Central place to manage Mimsy "acts" and visit milestones.
//
// Storage model (from plan):
// - localStorage.mimsy_acts: "none" | "1" | "2" | "all"
// - sessionStorage.mimsy_video_opens: number (per-tab counter)
// - Dev overrides: ?act=act1|act2|act3|main and ?reset

export type ActKey = "none" | "1" | "2" | "all";

const ACTS_KEY = "mimsy_acts";
const VIDEO_OPENS_KEY = "mimsy_video_opens";

function safeLocalGet(k: string): string | null {
  if (typeof window === "undefined") return null;
  try { return window.localStorage.getItem(k); } catch { return null; }
}
function safeLocalSet(k: string, v: string) {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(k, v); } catch {}
}
function safeLocalRemove(k: string) {
  if (typeof window === "undefined") return;
  try { window.localStorage.removeItem(k); } catch {}
}
function safeSessionGetNumber(k: string): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = window.sessionStorage.getItem(k);
    const n = raw ? parseInt(raw, 10) : 0;
    return Number.isFinite(n) ? n : 0;
  } catch { return 0; }
}
function safeSessionSet(k: string, v: number) {
  if (typeof window === "undefined") return;
  try { window.sessionStorage.setItem(k, String(v)); } catch {}
}
function safeSessionRemove(k: string) {
  if (typeof window === "undefined") return;
  try { window.sessionStorage.removeItem(k); } catch {}
}

export function getAct(): ActKey {
  const v = safeLocalGet(ACTS_KEY);
  if (v === "1" || v === "2" || v === "all") return v;
  // default is "none" on first visit
  return "none";
}

export function setAct(next: ActKey) {
  // Monotonic progression: none -> 1 -> 2 -> all
  const order: ActKey[] = ["none", "1", "2", "all"];
  const cur = getAct();
  const curIdx = order.indexOf(cur);
  const nextIdx = order.indexOf(next);
  const final = nextIdx >= curIdx ? next : cur; // don’t regress
  safeLocalSet(ACTS_KEY, final);
}

export function resetActs() {
  safeLocalRemove(ACTS_KEY);
  safeSessionRemove(VIDEO_OPENS_KEY);
}

export function getVideoOpens(): number {
  return safeSessionGetNumber(VIDEO_OPENS_KEY);
}

export function bumpVideoOpens(): number {
  const n = getVideoOpens() + 1;
  safeSessionSet(VIDEO_OPENS_KEY, n);
  return n;
}

/**
 * Dev overrides via querystring:
 *  - ?reset → clear storage
 *  - ?act=act1|act2|act3|main → force state
 *    act1 => "none"
 *    main => "1"
 *    act2 => "2"
 *    act3 => "all" (acts completed; we’ll still allow replays later)
 */
export function applyDevOverridesFromLocation() {
  if (typeof window === "undefined") return;

  try {
    const url = new URL(window.location.href);
    const reset = url.searchParams.get("reset");
    const act = url.searchParams.get("act");

    if (reset !== null) {
      resetActs();
    }

    if (act) {
      const map: Record<string, ActKey> = {
        act1: "none",
        main: "1",
        act2: "2",
        act3: "all",
      };
      const forced = map[act.toLowerCase()];
      if (forced) {
        safeLocalSet(ACTS_KEY, forced);
      }
    }
  } catch {
    // ignore
  }
}

/** Convenience helpers used by UI */
export const Acts = {
  get: getAct,
  set: setAct,
  reset: resetActs,
  getVideoOpens,
  bumpVideoOpens,
  applyDevOverridesFromLocation,
};
