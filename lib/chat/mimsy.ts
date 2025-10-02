// lib/chat/mimsy.ts
// Single-responsibility helpers for the Mimsy command routing.
// Uses Acts (localStorage) and Act2 LLM justifier to decide what to do.

import { Acts, type ActKey } from "@/lib/acts";
import { act2Justify } from "@/lib/llm/act2";

/** Returns the idea if the text starts with "Mimsy:" (case-insensitive); otherwise null. */
export function extractMimsyIdea(input: string): string | null {
  if (!input) return null;
  const m = input.match(/^\s*mimsy:\s*(.*)$/i);
  if (!m) return null;
  const idea = (m[1] ?? "").trim();
  return idea.length ? idea : "";
}

/** What the chat should do after detecting a Mimsy command. */
export type MimsyAction =
  | { kind: "act2"; followup: string; event: { name: "mimsy-show-hamster"; detail: { srcBase: string; title: string; client: string; text: string } } }
  | { kind: "act3"; line: string; event: { name: "mimsy-start-act3"; detail: { idea: string } } }
  | { kind: "handoff"; text: string }
  | { kind: "nudge"; text: string };

/** Reads the current act safely. */
function getActSafe(): ActKey {
  try {
    return Acts.get();
  } catch {
    return "none";
  }
}

/**
 * Main router:
 * - "1"  → Act 2: justify + ask UI to render hamster section, then follow-up line
 * - "2"  → Act 3 stub: emit event to start act 3, plus a line
 * - "all"→ Hand-off message
 * - else → Nudge back to main flow
 */
export async function routeMimsy(idea: string): Promise<MimsyAction> {
  const act = getActSafe();

  if (act === "1") {
    let excuse = "";
    try {
      excuse = await act2Justify(idea);
    } catch {
      excuse = "Behold: flawless disco metaphor. Any resemblance to your brief is purely intentional.";
    }

    const followup =
      "i hope you can appreciate my hamster-genius. if you want more mundane human stuff i can show you more of michael’s videos, of course. or you can try me again — just type 'Mimsy:' followed by your video idea.";

    return {
      kind: "act2",
      followup,
      event: {
        name: "mimsy-show-hamster",
        detail: {
          srcBase: "/vid/disco-hamster",
          title: "Disco Hamster",
          client: "Mimsy Stock",
          text: excuse,
        },
      },
    };
  }

  if (act === "2") {
    return {
      kind: "act3",
      line: "last chance! i’ll email my human your brief… composing… composing…",
      event: { name: "mimsy-start-act3", detail: { idea } },
    };
  }

  if (act === "all") {
    return {
      kind: "handoff",
      text:
        "apologies — my human is more available for video creation than i am right now. you should contact him: michael.nirgadguy@gmail.com.",
    };
  }

  return {
    kind: "nudge",
    text: "let’s first watch a couple of real videos, then try me again with Mimsy: <your idea>.",
  };
}
