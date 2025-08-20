// /components/Chat.tsx
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type Role = "user" | "assistant";
type Message = { id: string; role: Role; text: string };

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

  // Only show the latest assistant message, with a simple typewriter
  const lastAssistantText =
    [...messages].reverse().find((m) => m.role === "assistant")?.text ?? "";

  const [typed, setTyped] = useState("");
  useEffect(() => {
    setTyped("");
    if (!lastAssistantText) return;

    let i = 0;
    let timer: number | undefined;
    const tick = () => {
      i++;
      setTyped(lastAssistantText.slice(0, i));
      if (i < lastAssistantText.length) {
        timer = window.setTimeout(tick, 18) as unknown as number;
      }
    };
    timer = window.setTimeout(tick, 0) as unknown as number;
    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, [lastAssistantText]);

  function push(role: Role, text: string) {
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role, text }]);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;

    // Keep user message internally (not displayed)
    push("user", trimmed);
    setInput("");

    try {
      console.log("➡️ Sending to /api/route:", { text: trimmed });
      
      const res = await fetch("/api/route", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: trimmed }),
      });
      
      console.log("⬅️ Response status:", res.status);
      
      const data = await res.json().catch((err) => {
        console.error("❌ Failed to parse JSON:", err);
        return {} as any;
      });
      
      console.log("⬅️ Response JSON:", data);
 
      const msg =
        typeof data?.message === "string"
          ? data.message
          : "Router returned no message.";

      // Show assistant text
      push("assistant", msg);

      // Notify parent
      onAssistantMessage?.(msg);
      onIntent?.(String(data?.intent ?? ""), data?.args ?? undefined);
    } catch {
      const errMsg = "Hmm, something went wrong. Try again?";
      push("assistant", errMsg);
      onAssistantMessage?.(errMsg);
      onIntent?.("", undefined);
    }
  }

  return (
    <section className="w-full space-y-4">
      {/* Answer-only display (typewriter) */}
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
