// /hooks/useChatHooks.ts
import { useEffect, useRef, useState } from "react";

/** Typewriter for assistant text */
export function useTypewriter(fullText: string, speedMs = 16) {
  const [typed, setTyped] = useState("");
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    setTyped("");
    if (!fullText) return;

    let i = 0;
    const tick = () => {
      i += 1;
      setTyped(fullText.slice(0, i));
      if (i < fullText.length) {
        timerRef.current = window.setTimeout(tick, speedMs) as unknown as number;
      }
    };

    timerRef.current = window.setTimeout(tick, 0) as unknown as number;
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = null;
    };
  }, [fullText, speedMs]);

  return typed;
}



/** One-time intro message with optional sessionStorage override */
export function useIntroMessage() {
  const [intro] = useState(() => {
    // Default line lives here now
    let val =
      "Hi! I’m Mimsy. a hamster, a genius, and your guide to Michael’s video portfolio. Tell me what would you like to watch?";

    try {
      const key = "mimsy_intro_override";
      const override = sessionStorage.getItem(key);
      if (override) {
        val = override;
        sessionStorage.removeItem(key); // clear after using
      }
    } catch {}

    return val;
  });
  return intro;
}

