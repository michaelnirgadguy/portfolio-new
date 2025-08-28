// /components/Chat.tsx
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { SuggestedPrompts } from "@/lib/suggestedPrompts";
import { ArrowUp} from "lucide-react";


type Role = "user" | "assistant";
type Message = { id: string; role: Role; text: string };

type SurfaceStatus = "idle" | "pending" | "answer";

export default function Chat({
  onAssistantMessage,
  onIntent,
}: {
  onAssistantMessage?: (message: string) => void;
  onIntent?: (intent: string, args?: any) => void;
}) {
  // Internal history (not fully displayed)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "m0",
      role: "assistant",
      text:
        "Hi! I’m Michael’s portfolio guide. Ask for a vibe (e.g., “clever tech explainer”), and I’ll suggest a few videos.",
    },
  ]);

  const [input, setInput] = useState("");

  // Single visible “surface” (no thread UI)
  const [status, setStatus] = useState<SurfaceStatus>("idle");
  const [userLine, setUserLine] = useState<string>("");
  const [assistantFull, setAssistantFull] = useState<string>("");
  const [typed, setTyped] = useState<string>("");

  // Dots animation for the pending state
  const [dots, setDots] = useState<number>(0);
  useEffect(() => {
    if (status !== "pending") return;
    setDots(0);
    const t = setInterval(() => setDots((d) => (d + 1) % 4), 400);

    return () => clearInterval(t);
  }, [status]);

  // Typewriter effect for assistant answer
  useEffect(() => {
    if (status !== "answer" || !assistantFull) return;
    setTyped("");
    let i = 0;
    let timer: number | undefined;
    const tick = () => {
      i++;
      setTyped(assistantFull.slice(0, i));
      if (i < assistantFull.length) {
        timer = window.setTimeout(tick, 16) as unknown as number;
      }
    };
    timer = window.setTimeout(tick, 0) as unknown as number;
    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, [status, assistantFull]);

  // On first render, show the greeting as the visible surface
  useEffect(() => {
    const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
    if (status === "idle" && lastAssistant) {
      setAssistantFull(lastAssistant.text);
      setStatus("answer");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function push(role: Role, text: string) {
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role, text }]);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;

    // Keep internal history (not displayed as a thread)
    push("user", trimmed);
    setInput("");

    // Visible surface → show the user line + pending dots
    setUserLine(trimmed);
    setAssistantFull("");
    setTyped("");
    setStatus("pending");

    try {
      const res = await fetch("/api/route", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: trimmed }),
      });
      const data = await res.json().catch(() => ({} as any));

      const msg =
        typeof data?.message === "string"
          ? data.message
          : "Router returned no message.";

      // Update visible surface → replace with assistant typewriter
      push("assistant", msg);
      setAssistantFull(msg);
      setStatus("answer");

      // Notify parent
      onAssistantMessage?.(msg);
      onIntent?.(String(data?.intent ?? ""), data?.args ?? undefined);
    } catch {
      const errMsg = "Hmm, something went wrong. Try again?";
      push("assistant", errMsg);
      setAssistantFull(errMsg);
      setStatus("answer");
      onAssistantMessage?.(errMsg);
      onIntent?.("", undefined);
    }
  }

  // ✨ Prompt generator: insert a random idea into the input (don’t submit yet)
  function handleSparkle() {
    if (!SuggestedPrompts.length) return;
    const idx = Math.floor(Math.random() * SuggestedPrompts.length);
    setInput(SuggestedPrompts[idx]);
  }

return (
  <section className="w-full space-y-6">
    {/* Curator surface (no box, no bubbles) */}
    <div className="leading-8 text-[17px] md:text-[18px] tracking-tight">
      {status === "pending" ? (
        <div className="space-y-2">
          <div className="text-[16px] md:text-[17px]">{userLine}</div>
          <div className="text-sm text-muted-foreground/70">
            {"•".repeat(dots)}
          </div>
        </div>
      ) : (
        <div className="whitespace-pre-wrap">{typed}</div>
      )}
    </div>

    {/* Composer */}
    <form onSubmit={onSubmit} className="flex items-center">
      <div className="w-full flex items-center gap-2 rounded-full border bg-white/70 px-3 py-2 shadow-sm backdrop-blur">
        {/* ✨ prompt generator — pill, emoji, no text */}
        <Button
          type="button"
          variant="outlineAccent"
          size="pill"
          onClick={handleSparkle}
          title="Generate a prompt"
          aria-label="Generate a prompt"
          className="shrink-0 border-transparent hover:border-[hsl(var(--accent))]"
        >
          <span className="text-xl leading-none">✨</span>
        </Button>

        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder='Type a request… e.g., "bold, funny tech ad"'
          className="flex-1 bg-transparent px-2 py-1 outline-none placeholder:text-muted-foreground focus:ring-0"
        />

        {/* Send — circular, bigger/thicker arrow; no border until hover */}
        <Button
          type="submit"
          variant="outlineAccent"
          size="icon"
          title="Send"
          aria-label="Send"
          className="shrink-0 border-transparent hover:border-[hsl(var(--accent))]"
        >
          <ArrowUp className="w-6 h-6" strokeWidth={2.5} />
        </Button>
      </div>
    </form>
  </section>
);

}
