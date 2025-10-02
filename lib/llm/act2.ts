// lib/llm/act2.ts
export async function act2Justify(idea: string): Promise<string> {
  const res = await fetch("/api/act2", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idea }),
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(`Act2 API error: ${msg || res.status}`);
  }

  const data = (await res.json()) as { text?: string };
  return (data.text ?? "").trim();
}
