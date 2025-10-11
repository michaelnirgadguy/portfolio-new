// lib/text/highlightNudge.ts
// Find the sentence containing "mimsy:" (case-insensitive) for accent highlighting.
// Returns the span indices and a version with **mimsy** (quotes removed).

export type NudgeSpan = {
  start: number;   // start index in original text
  end: number;     // end index (exclusive)
  text: string;    // original slice
  rendered: string;// slice with **mimsy** bolded (quotes stripped)
};

const CUE_RE = /["']?\bmimsy\b["']?\s*:/i;
// Sentence boundaries: punctuation or line breaks
const PUNCT_BOUNDARY = /[\.!?;:…—–]|[\n\r]/;

export function findNudgeSpan(full: string): NudgeSpan | null {
  if (!full) return null;

  const m = CUE_RE.exec(full);
  if (!m) return null;

  const cueIndex = m.index;

  // Walk backward to previous boundary (or start)
  let start = cueIndex;
  for (let i = cueIndex - 1; i >= 0; i--) {
    if (PUNCT_BOUNDARY.test(full[i])) { start = i + 1; break; }
    if (i === 0) start = 0;
  }

  // Walk forward to next boundary (or end)
  let end = full.length;
  for (let i = cueIndex + m[0].length; i < full.length; i++) {
    if (PUNCT_BOUNDARY.test(full[i])) { end = i; break; }
  }

  // Trim surrounding whitespace
  while (start > 0 && /\s/.test(full[start])) start++;
  while (end > start && /\s/.test(full[end - 1])) end--;

  const text = full.slice(start, end);

  // Bold "mimsy" and strip optional quotes before the colon (first occurrence only)
  const rendered = text.replace(/["']?\bmimsy\b["']?\s*:/i, "**mimsy**:");

  return { start, end, text, rendered };
}
