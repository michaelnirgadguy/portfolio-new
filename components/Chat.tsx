// /components/Chat.tsx
"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";

type Role = "user" | "assistant";

type Message = {
  id: string;
  role: Role;
  text: string;
};

function Bubble({ role, text }: { role: Role; text: string }) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm leading-6 shadow
        ${isUser ? "bg-black text-white rounded-br-sm" : "bg-gray-100 text-gray-900 rounded-bl-sm"}`}
      >
        {text}
      </div>
    </div>
  );
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "m0",
      role: "assistant",
      text:
        "Hi! I’m Michael’s portfolio guide. Ask for a vibe (e.g., “clever tech explainer”), and I’ll suggest a few videos.",
    },
  ]);
  const [input, setInput] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  function pushAssistant(text: string) {
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "assistant", text },
    ]);
  }

  function pushUser(text: string) {
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "user", text }]);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    pushUser(trimmed);
    setInput("");

    // STUB ONLY — no external calls.
    const reply = `Got it: “${trimmed}”. (Stub reply — next step will wire routing/curation.)`;
    pushAssistant(reply);
  }

  return (
    <section className="w-full space-y-4">
      <div className="space-y-3">
        {messages.map((m) => (
          <Bubble key={m.id} role={m.role} text={m.text} />
        ))}
      </div>

      <form ref={formRef} onSubmit={onSubmit} className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder='Try: "show something bold and funny"'
          className="flex-1 rounded-xl border px-4 py-2 outline-none focus:ring-2 focus:ring-black"
        />
        <Button type="submit">Send</Button>
      </form>
    </section>
  );
}
