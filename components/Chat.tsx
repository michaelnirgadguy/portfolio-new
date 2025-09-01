// /components/Chat.tsx
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { SuggestedPrompts } from "@/lib/suggestedPrompts";
import { ArrowUp } from "lucide-react";

type Role = "user" | "assistant";
type Message = { id: string; role: Role; text: string };
type SurfaceStatus = "idle" | "pending" | "answer";

export default function Chat({
  onShowVideo,
}: {
  onShowVideo?: (videoIds: string[]) => void;
}) {
  // Visible messages (simple surface)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "m0",
      role: "assistant",
      text:
        "Hi! I’m Michael’s portfolio guide. Ask for a vibe (e.g., “clever tech explainer”), and I’ll suggest a few videos.",
    },
  ]);

  // Running log we send to the API (best practice for tools)
  const [log, setLog] = useState<any[]>([]);

  const [input, setInput] = useState("");

  const [status, setStatus] = useState<SurfaceStatus>("idle");
  const [userLine, setUserLine] = useState<string>("");
  const [assistantFull, setAssistantFull] = useState<string>("");
  const [typed, setTyped] = useState<string>("");

  // Dots animation
  const [dots, setDots] = useState<number>(0);
  useEffect(() => {
    if (status !== "pending") return;
    setDots(0);
    const t = setInterval(() => setDots((d) => (d + 1) % 4), 400);
    return () => clearInterval(t);
  }, [status]);

  // Typewriter
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

  // Show greeting as the first visible surface
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

    // UI surface
    push("user", trimmed);
    setInput("");
    setUserLine(trimmed);
    setAssistantFull("");
    setTyped("");
    setStatus("pending");

    // 1) Append user to running log
    const turnStartLog = [...log, { role: "user", content: trimmed }];

    try {
      // 2) PRIMARY CALL — get assistant text + potential tool calls
      const res1 = await fetch("/api/route", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ input: turnStartLog }),
      });
      const data1 = await res1.json();

      const output: any[] = Array.isArray(data1?.output) ? data1.output : [];
      // Extend log with model output (includes function_call items)
      let afterModelLog = [...turnStartLog, ...output];

      // 3) Execute any tool calls locally and append function_call_output
      const toolOutputs: any[] = [];
      for (const item of output) {
        if (item?.type !== "function_call") continue;
        if (item?.name !== "ui_show_videos") continue;

        // Parse arguments
        let ids: string[] = [];
        try {
          const parsed = JSON.parse(item.arguments || "{}");
          const arr = Array.isArray(parsed?.videoIds) ? parsed.videoIds : [];
          ids = arr.filter((x: any) => typeof x === "string");
        } catch {
          ids = [];
        }

        // Execute UI tool
        const hasIds = Array.isArray(ids) && ids.length > 0;
        if (hasIds) {
          if (onShowVideo) onShowVideo(ids);
          else if ((globalThis as any).uiTool?.show_videos) {
            (globalThis as any).uiTool.show_videos(ids);
          }
        }

        // Prepare function_call_output result for the model
        const outputPayload = hasIds
          ? {
              ok: true,
              kind: ids.length === 1 ? "player" : "grid",
              videoIds: ids,
              message:
                ids.length === 1
                  ? `UI launched player for ${ids[0]}`
                  : `UI showing grid for ${ids.join(", ")}`,
            }
          : {
              ok: false,
              kind: "error",
              videoIds: [],
              message: "No valid video IDs provided to ui_show_videos.",
            };

        toolOutputs.push({
          type: "function_call_output",
          call_id: item.call_id,
          output: JSON.stringify(outputPayload),
        });
      }

      // If no tool calls: we can finalize with assistant’s text (if any)
      if (toolOutputs.length === 0) {
        const text = (typeof data1?.text === "string" && data1.text.trim()) || "Done.";
        push("assistant", text);
        setAssistantFull(text);
        setStatus("answer");
        // Keep log in sync with model output
        setLog(afterModelLog);
        return;
      }

      // 4) SECOND CALL — send function_call_output back for a contextual follow-up
      const logWithToolOutputs = [...afterModelLog, ...toolOutputs];
      const res2 = await fetch("/api/route", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ input: logWithToolOutputs }),
      });
      const data2 = await res2.json();

      const followText =
        (typeof data2?.text === "string" && data2.text.trim()) ||
        "All set — enjoy!";

      // Visible surface
      push("assistant", followText);
      setAssistantFull(followText);
      setStatus("answer");

      // Persist the full log for future turns
      const finalOutput: any[] = Array.isArray(data2?.output) ? data2.output : [];
      setLog([...logWithToolOutputs, ...finalOutput]);
    } catch {
      const errMsg = "Hmm, something went wrong. Try again?";
      push("assistant", errMsg);
      setAssistantFull(errMsg);
      setStatus("answer");
    }
  }

  // ✨ Prompt generator
  function handleSparkle() {
    if (!SuggestedPrompts.length) return;
    const idx = Math.floor(Math.random() * SuggestedPrompts.length);
    setInput(SuggestedPrompts[idx]);
  }
  // 🔔 Register global function so page can notify us about video opens
  useEffect(() => {
    (globalThis as any).dispatchLLMEvent = (evt: { type: string; id?: string; url?: string }) => {
      if (evt?.type === "video_opened") {
        const msg = `The visitor opened a video: id="${evt.id ?? "unknown"}"`;
        void sendEventToLLM(msg);
      }
    };
    return () => {
      delete (globalThis as any).dispatchLLMEvent;
    };
  }, [log]);

  
  async function sendEventToLLM(text: string) {
    // Build a minimal turn list: previous log + this event as a user turn
    const turnStartLog = [...log, { role: "user", content: text }];

    try {
      const res = await fetch("/api/route", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ input: turnStartLog }),
      });
      const data = await res.json();
      console.log(">>> SCREEN EVENT SENT:", text);
      console.log(">>> SCREEN EVENT RESPONSE:", data);

      // Keep internal log in sync so the next user turn has context
      const modelOut: any[] = Array.isArray(data?.output) ? data.output : [];
      setLog([...turnStartLog, ...modelOut]);
    } catch (e) {
      console.error("sendEventToLLM error:", e);
    }
  }

  return (
    <section className="w-full space-y-6">
      {/* Curator surface */}
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
