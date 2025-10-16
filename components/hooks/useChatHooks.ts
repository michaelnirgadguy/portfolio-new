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
