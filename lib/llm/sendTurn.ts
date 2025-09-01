// lib/llm/sendTurn.ts
// One-turn LLM call with optional tool handling. Returns assistant text + next log.

export type SendTurnResult = { text: string; nextLog: any[] };
type ShowVideos = (ids: string[]) => void;

export async function sendTurn(opts: {
  log: any[];
  userText: string;
  onShowVideo?: ShowVideos;
}): Promise<SendTurnResult> {
  const { log, userText, onShowVideo } = opts;

  // 1) Start log
  const turnStartLog = [...log, { role: "user", content: userText }];

  // 2) Primary call
  const res1 = await fetch("/api/route", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ input: turnStartLog }),
  });
  const data1 = await res1.json();
  const output: any[] = Array.isArray(data1?.output) ? data1.output : [];
  let afterModelLog = [...turnStartLog, ...output];

  // 3) Handle tool calls (ui_show_videos)
  const toolOutputs: any[] = [];
  for (const item of output) {
    if (item?.type !== "function_call") continue;
    if (item?.name !== "ui_show_videos") continue;

    // Parse videoIds
    let ids: string[] = [];
    try {
      const parsed = JSON.parse(item.arguments || "{}");
      const arr = Array.isArray(parsed?.videoIds) ? parsed.videoIds : [];
      ids = arr.filter((x: any) => typeof x === "string");
    } catch {}

    // Execute UI side-effect
    if (ids.length) {
      if (onShowVideo) onShowVideo(ids);
      else (globalThis as any).uiTool?.show_videos?.(ids);
    }

    toolOutputs.push({
      type: "function_call_output",
      call_id: item.call_id,
      output: JSON.stringify(
        ids.length
          ? {
              ok: true,
              kind: ids.length === 1 ? "player" : "grid",
              videoIds: ids,
              message:
                ids.length === 1
                  ? `UI launched player for ${ids[0]}`
                  : `UI showing grid for ${ids.join(", ")}`,
            }
          : { ok: false, kind: "error", videoIds: [], message: "No valid video IDs." }
      ),
    });
  }

  // 4) If no tools, return first reply
  if (!toolOutputs.length) {
    const text = (typeof data1?.text === "string" && data1.text.trim()) || "";
    return { text, nextLog: afterModelLog };
  }

  // 5) Second pass with function_call_output(s)
  const logWithToolOutputs = [...afterModelLog, ...toolOutputs];
  const res2 = await fetch("/api/route", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ input: logWithToolOutputs }),
  });
  const data2 = await res2.json();

  const followText =
    (typeof data2?.text === "string" && data2.text.trim()) || "";

  const finalOutput: any[] = Array.isArray(data2?.output) ? data2.output : [];
  return { text: followText, nextLog: [...logWithToolOutputs, ...finalOutput] };
}
