// lib/llm/act2.ts

export type Act2Result = {
  title: string;
  description: string;
};

/** Calls /api/act2 with the visitor's idea and returns { title, description }. */
export async function act2Justify(idea: string): Promise<Act2Result> {
  const res = await fetch("/api/act2", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idea }),
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(`Act2 API error: ${msg || res.status}`);
  }

  // Server now responds with { title, description }
  const data = (await res.json()) as Partial<Act2Result> | null;

  const title =
    (typeof data?.title === "string" && data.title.trim()) || "Disco Hamster";
  const description =
    (typeof data?.description === "string" && data.description.trim()) ||
    "An unimpeachable artistic rationale, obviously.";

  return { title, description };
}
