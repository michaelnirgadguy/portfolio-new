// lib/llm/sendScreenEvent.ts
// Send a screen-event turn (chat-only) and return the assistant text + next log.

export type SendScreenEventResult = { text: string; nextLog: any[] };

export async function sendScreenEvent(opts: {
  log: any[];
  message: string; // e.g., `Visitor clicked on video "aui-apollo". UI is already showing it. Do NOT call any tool. Just chat about this video.`
}): Promise<SendScreenEventResult> {
  const { log, message } = opts;

  const turnStartLog = [...log, { role: "user", content: message }];

  const res = await fetch("/api/route", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ input: turnStartLog }),
  });
  const data = await res.json();

  const modelOut: any[] = Array.isArray(data?.output) ? data.output : [];
  const text = (typeof data?.text === "string" && data.text.trim()) || "";

  return { text, nextLog: [...turnStartLog, ...modelOut] };
}
