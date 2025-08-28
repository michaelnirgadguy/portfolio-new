// /components/Chat.tsx
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

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

  return (
    <section className="w-full space-y-4">
      {/* Curator surface (no bubbles) */}
      <div className="rounded-xl border bg-white p-5 leading-7 shadow-sm">
        {status === "pending" ? (
          <div className="space-y-2">
            <div className="text-[0.95rem]">{userLine}</div>
            <div className="text-sm text-muted-foreground">
              {Array(dots).fill("•").join("")}
            </div>
          </div>
        ) : (
          <div className="font-normal tracking-normal whitespace-pre-wrap">
            {typed}
          </div>
        )}
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
