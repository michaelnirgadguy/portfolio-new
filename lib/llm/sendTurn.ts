// lib/llm/sendTurn.ts
// One-turn LLM call with optional tool handling. Returns assistant text + next log.

export type SendTurnResult = {
  text: string;
  chips: string[];
  nextLog: any[];
  pendingVideoQueues: string[][];
  showAllVideos: boolean;
  darkModeEnabled: boolean | null;
  showContactCard: boolean;
  responseStatus: string;
  statusDetails?: unknown;
};

enum ToolName {
  ShowVideos = "ui_show_videos",
  ShowAllVideos = "ui_show_all_videos",
  SetDarkMode = "ui_set_dark_mode",
  ShowContactCard = "ui_show_contact_card",
}

const FALLBACK_ERROR_TEXT = "Mimsy got shy. Mind trying again?";

type AssistantPayload = {
  text: string;
  chips: string[];
  status?: string;
  statusDetails?: unknown;
};

function normalizeAssistantPayload(data: any): AssistantPayload {
  const text = typeof data?.text === "string" ? data.text.trim() : "";
  const chips = Array.isArray(data?.chips)
    ? data.chips
        .map((chip: unknown) => (typeof chip === "string" ? chip.trim() : ""))
        .filter(Boolean)
    : [];

  return {
    text,
    chips,
    status: typeof data?.status === "string" ? data.status : undefined,
    statusDetails: data?.statusDetails ?? data?.status_details,
  };
}

function resolveAssistantText(payload: AssistantPayload): string {
  if (payload.status && payload.status !== "completed") {
    return payload.text || FALLBACK_ERROR_TEXT;
  }

  return payload.text;
}

export async function sendTurn(opts: {
  log: any[];
  userText: string;
  syntheticAfterUser?: string; // ✅ NEW
  seenVideoIds?: string[];
}): Promise<SendTurnResult> {
  const { log, userText, syntheticAfterUser, seenVideoIds } = opts;

  // 1) Start logs (real user message, then optional synthetic user message)
  const persistedLog = [...log, { role: "user", content: userText }];
  const modelInputLog = syntheticAfterUser
    ? [...persistedLog, { role: "user", content: syntheticAfterUser }]
    : persistedLog;

  // 2) Primary call
  const res1 = await fetch("/api/route", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ input: modelInputLog, seenVideoIds }),
  });
  const data1 = await res1.json();
  const output: any[] = Array.isArray(data1?.output) ? data1.output : [];
  const persistedAfterModelLog = [...persistedLog, ...output];
  const modelInputAfterLog = [...modelInputLog, ...output];
  const primaryPayload = normalizeAssistantPayload(data1);
  const primaryText = resolveAssistantText(primaryPayload);

  // 3) Handle tool calls (ui_show_videos, ui_show_all_videos, ui_set_dark_mode)
  const toolOutputs: any[] = [];
  const pendingVideoQueues: string[][] = [];
  let shouldShowAllVideos = false;
  let darkModeEnabled: boolean | null = null;
  let shouldShowContactCard = false;
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
          message: "Widget video-gallery opened.",
        }),
      });

      continue;
    }

    // ui_show_contact_card()
    if (item.name === ToolName.ShowContactCard) {
      shouldShowContactCard = true;

      toolOutputs.push({
        type: "function_call_output",
        call_id: item.call_id,
        output: JSON.stringify({
          ok: true,
          kind: "contact_card",
          message: "Contact card displayed. <instructions> in the *suggestion chips* , do not mention sending an email, but use them to steer conversation to more video contact or asking about Michael's work</instructions>",
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
    return {
      text: primaryText,
      chips: primaryPayload.chips,
      nextLog: persistedAfterModelLog,
      pendingVideoQueues,
      showAllVideos: shouldShowAllVideos,
      darkModeEnabled,
      showContactCard: shouldShowContactCard,
      responseStatus: primaryPayload.status ?? "unknown",
      statusDetails: primaryPayload.statusDetails,
    };
  }

  // 5) Second pass with function_call_output(s)
  const modelLogWithToolOutputs = [...modelInputAfterLog, ...toolOutputs];
  const persistedLogWithToolOutputs = [...persistedAfterModelLog, ...toolOutputs];
  const res2 = await fetch("/api/route", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ input: modelLogWithToolOutputs, seenVideoIds }),
  });
  const data2 = await res2.json();
  const followPayload = normalizeAssistantPayload(data2);
  const followText = resolveAssistantText(followPayload);

  const finalOutput: any[] = Array.isArray(data2?.output) ? data2.output : [];
  return {
    text: followText,
    chips: followPayload.chips,
    nextLog: [...persistedLogWithToolOutputs, ...finalOutput],
    pendingVideoQueues,
    showAllVideos: shouldShowAllVideos,
    darkModeEnabled,
    showContactCard: shouldShowContactCard,
    responseStatus:
      followPayload.status ?? primaryPayload.status ?? "unknown",
    statusDetails: followPayload.statusDetails ?? primaryPayload.statusDetails,
  };
}
