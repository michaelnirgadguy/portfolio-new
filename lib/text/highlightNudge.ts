// lib/text/highlightNudge.ts
// Find the segment containing "mimsy:" (case-insensitive) for accent highlighting.
// The highlighted span is from the nearest preceding punctuation/comma/newline
// up to and INCLUDING the next punctuation/comma/newline after the cue.
// Returns the span indices and a version with **mimsy** (quotes removed).

export type NudgeSpan = {
  start: number;   // start index in original text
  end: number;     // end index (exclusive)
  text: string;    // original slice
  rendered: string;// slice with **mimsy** bolded (quotes stripped)
};

// Support straight + curly quotes
const QUOTES = `"'“”‘’`;

// Match mimsy with optional quotes BEFORE and AFTER the colon.
// Examples matched: mimsy:, "mimsy":, ‘mimsy’: , mimsy:" , "mimsy:" , etc.
const CUE_RE = /["'“”‘’]?\bmimsy\b["'“”‘’]?\s*:\s*["'“”‘’]?/i;

// Punctuation boundaries (include comma) + line breaks.
// We INCLUDE the found punctuation at the END boundary.
const PUNCT = /[,\.\!?;:…—–]/;
const NL = /\n|\r/;

export function findNudgeSpan(full: string): NudgeSpan | null {
  if (!full) return null;

  const m = CUE_RE.exec(full);
  if (!m) return null;

  const cueIndex = m.index;

  // Walk backward to the nearest punctuation/comma/newline (or start).
  let start = 0;
  for (let i = cueIndex - 1; i >= 0; i--) {
    if (PUNCT.test(full[i]) || NL.test(full[i])) { start = i + 1; break; }
    if (i === 0) start = 0;
  }

  // Walk forward to the next punctuation/comma/newline (or end),
  // starting AFTER the cue (incl. any optional quote after colon).
  let end = full.length;
  for (let i = cueIndex + m[0].length; i < full.length; i++) {
    if (PUNCT.test(full[i]) || NL.test(full[i])) { end = i + 1; break; } // include punctuation
  }

  // Trim surrounding whitespace (keep punctuation at end)
  while (start < end && /\s/.test(full[start])) start++;
  while (end > start && /\s/.test(full[end - 1])) end--;

  const text = full.slice(start, end);

  // Bold "mimsy" and strip any quotes around it and any quote right after the colon.
  // Replace first occurrence only.
  const rendered = text.replace(/["'“”‘’]?\bmimsy\b["'“”‘’]?\s*:\s*["'“”‘’]?/i, "**mimsy**:");

  return { start, end, text, rendered };
}
