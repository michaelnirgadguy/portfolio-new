// lib/text/highlightNudge.ts
// Finds the sentence containing "mimsy:" (case-insensitive) for accent highlighting.

export type NudgeSpan = {
  start: number;      // start index in original text
  end: number;        // end index (exclusive)
  text: string;       // raw slice
  rendered: string;   // slice with **mimsy** bolded, quotes removed
};

const CUE_RE = /["']?\bmimsy\b["']?\s*:/i;
const PUNCT_BOUNDARY = /[\.!?;:…—–]|[\n\r]/;

export function findNudgeSpan(full: string): NudgeSpan | null {
  if (!full) return null;

  const m = CUE_RE.exec(full);
  if (!m) return null;

  const cueIndex = m.index;

  // Go back to previous punctuation or start
  let start = cueIndex;
  for (let i = cueIndex - 1; i >= 0; i--) {
    if (PUNCT_BOUNDARY.test(full[i])) { start = i + 1; break; }
    if (i === 0) start = 0;
  }

  // Forward to next punctuation or end
  let end = full.length;
  for (let i = cueIndex + m[0].length; i < full.length; i++) {
    if (PUNCT_BOUNDARY.test(full[i])) { end = i; break; }
  }

  // Trim spaces
  while (start > 0 && /\s/.test(full[start])) start++;
  while (end > start && /\s/.test(full[end - 1])) end--;

  const text = full.slice(start, end);

  // Bold and clean “mimsy”
  const rendered = text.replace(
    /["']?\bmimsy\b["']?\s*:/i,
    "**mimsy**:"
  );

  return { start, end, text, rendered };
}
