// /components/Chat.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

type Role = "user" | "assistant";
type Message = { id: string; role: Role; text: string };

export default function Chat() {
  // We still keep the full history internally
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "m0",
      role: "assistant",
      text:
        "Hi! I’m Michael’s portfolio guide. Ask for a vibe (e.g., “clever tech explainer”), and I’ll suggest a few videos.",
    },
  ]);
  const [input, setInput] = useState("");

  // ---- Display: only LAST assistant message, with typewriter ----
  const lastAssistantText =
    [...messages].reverse().find((m) => m.role === "assistant")?.text ?? "";

  const [typed, setTyped] = useState("");
  useEffect(() => {
    // typewriter for the most recent assistant text
    setTyped("");
    if (!lastAssistantText) return;

    let i = 0;
    const tick = () => {
      i++;
      setTyped(lastAssistantText.slice(0, i));
      if (i < lastAssistantText.length) {
        timer = window.setTimeout(tick, 18); // ~18ms per char
      }
    };
    let timer = window.setTimeout(tick, 0);
    return () => window.clearTimeout(timer);
  }, [lastAssistantText]);

  function push(role: Role, text: string) {
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role, text }]);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;

    // keep user message in history (not displayed)
    push("user", trimmed);
    setInput("");

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
      push("assistant", msg);
    } catch {
      push("assistant", "Hmm, something went wrong. Try again?");
    }
  }

  return (
    <section className="w-full space-y-4">
      {/* ANSWER-ONLY DISPLAY (typewriter effect) */}
      <div className="rounded-xl border bg-white p-4 text-base leading-7">
        <div className="font-normal tracking-normal whitespace-pre-wrap">
          {typed}
        </div>
      </div>

      {/* Composer */}
      <form onSubmit={onSubmit} className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder='Type a request… e.g., "bold, funny tech ad"'
          className="flex-1 rounded-xl border px-4 py-2 outline-none focus:ring-2 focus:ring-black"
        />
        <Button type="submit">Send</Button>
      </form>
    </section>
  );
}
