type LogItem = {
  type?: string;
  call_id?: string;
};

const isFunctionCall = (item: LogItem) => item?.type === "function_call";
const isFunctionCallOutput = (item: LogItem) => item?.type === "function_call_output";

export function compactLog(log: LogItem[], maxEntries: number): LogItem[] {
  if (!Array.isArray(log) || maxEntries <= 0) {
    return [];
  }

  const trimmed = log.slice(-maxEntries);
  const seenCallIds = new Set<string>();
  const compacted: LogItem[] = [];

  for (const item of trimmed) {
    if (isFunctionCall(item)) {
      if (typeof item.call_id === "string") {
        seenCallIds.add(item.call_id);
      }
      compacted.push(item);
      continue;
    }

    if (isFunctionCallOutput(item)) {
      if (typeof item.call_id === "string" && seenCallIds.has(item.call_id)) {
        compacted.push(item);
      }
      continue;
    }

    compacted.push(item);
  }

  return compacted;
}
