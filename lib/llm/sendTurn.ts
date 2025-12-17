// lib/llm/sendTurn.ts
// One-turn LLM call with optional tool handling. Returns assistant text + next log.

export type SendTurnResult = {
  text: string;
  chips: string[];
  nextLog: any[];
  pendingVideoQueues: string[][];
  showAllVideos: boolean;
  darkModeEnabled: boolean | null;
};

enum ToolName {
  ShowVideos = "ui_show_videos",
  ShowAllVideos = "ui_show_all_videos",
  SetDarkMode = "ui_set_dark_mode",
}

export async function sendTurn(opts: {
  log: any[];
  userText: string;
  syntheticAfterUser?: string; // ✅ NEW
}): Promise<SendTurnResult> {
  const { log, userText, syntheticAfterUser } = opts;

  const DEFAULT_CHIPS = ["Show me tech", "Show me humor", "Surprise me"];

  function parseLLMResponse(raw: any) {
    let text = typeof raw === "string" ? raw.trim() : "";
    let chips: string[] = DEFAULT_CHIPS;

    const tryObject = (val: any) => {
      if (val && typeof val === "object") {
        if (typeof val.text === "string") text = val.text;
        if (Array.isArray(val.chips)) chips = val.chips.filter((c) => typeof c === "string");
      }
    };

    if (typeof raw === "string") {
      try {
        const parsed = JSON.parse(raw);
        tryObject(parsed);
      } catch {
        // fallback to raw text
      }
    } else {
      tryObject(raw);
    }

    if (!chips.length) chips = DEFAULT_CHIPS;

    return { text, chips };
  }

  // 1) Start log (real user message, then optional synthetic user message)
  const turnStartLog = [
    ...log,
    { role: "user", content: userText },
    ...(syntheticAfterUser ? [{ role: "user", content: syntheticAfterUser }] : []),
  ];

  // 2) Primary call
  const res1 = await fetch("/api/route", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ input: turnStartLog }),
  });
  const data1 = await res1.json();
  const output: any[] = Array.isArray(data1?.output) ? data1.output : [];
  let afterModelLog = [...turnStartLog, ...output];

  // 3) Handle tool calls (ui_show_videos, ui_show_all_videos, ui_set_dark_mode)
  const toolOutputs: any[] = [];
  const pendingVideoQueues: string[][] = [];
  let shouldShowAllVideos = false;
  let darkModeEnabled: boolean | null = null;
  for (const item of output) {
    if (item?.type !== "function_call") continue;

    // ui_show_videos(videoIds: string[])
    if (item.name === ToolName.ShowVideos) {
      let ids: string[] = [];
      try {
        const parsed = JSON.parse(item.arguments || "{}");
        const arr = Array.isArray(parsed?.videoIds) ? parsed.videoIds : [];
        ids = arr.filter((x: any) => typeof x === "string");
      } catch {}

      if (ids.length) pendingVideoQueues.push(ids);

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
                    ? `Widget launched player for ${ids[0]}`
                    : `Widget showing grid for ${ids.join(", ")}`,
              }
            : {
                ok: false,
                kind: "error",
                videoIds: [],
                message: "No valid video IDs.",
              }
        ),
      });

      continue;
    }

    // ui_show_all_videos()
    if (item.name === ToolName.ShowAllVideos) {
      shouldShowAllVideos = true;

      toolOutputs.push({
        type: "function_call_output",
        call_id: item.call_id,
        output: JSON.stringify({
          ok: true,
          kind: "all_videos",
          message: "Widget gallery opened.",
        }),
      });

      continue;
    }

    // ui_set_dark_mode({ enabled: boolean })
    if (item.name === ToolName.SetDarkMode) {
      let enabled = true;
      try {
        const parsed = JSON.parse(item.arguments || "{}");
        if (typeof parsed?.enabled === "boolean") enabled = parsed.enabled;
      } catch {}

      darkModeEnabled = enabled;

      toolOutputs.push({
        type: "function_call_output",
        call_id: item.call_id,
        output: JSON.stringify({
          ok: true,
          kind: "dark_mode",
          enabled,
          message: enabled ? "Dark mode enabled." : "Dark mode disabled.",
        }),
      });

      continue;
    }
  }

  // 4) If no tools, return first reply
  if (!toolOutputs.length) {
    const { text, chips } = parseLLMResponse(data1?.text);
    return {
      text,
      chips,
      nextLog: afterModelLog,
      pendingVideoQueues,
      showAllVideos: shouldShowAllVideos,
      darkModeEnabled,
    };
  }

  // 5) Second pass with function_call_output(s)
  const logWithToolOutputs = [...afterModelLog, ...toolOutputs];
  const res2 = await fetch("/api/route", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ input: logWithToolOutputs }),
  });
  const data2 = await res2.json();

  const { text: followText, chips } = parseLLMResponse(data2?.text);
  const finalOutput: any[] = Array.isArray(data2?.output) ? data2.output : [];
  return {
    text: followText,
    chips,
    nextLog: [...logWithToolOutputs, ...finalOutput],
    pendingVideoQueues,
    showAllVideos: shouldShowAllVideos,
    darkModeEnabled,
  };
}
