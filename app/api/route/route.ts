// /app/api/route/route.ts
import { client } from "@/lib/openai";
import { getAllVideos } from "@/lib/videos";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({} as any));
  const text: string = typeof body?.text === "string" ? body.text : "";

  // tiny grounding (optional)
  const videos = getAllVideos().map(({ id, title }) => ({ id, title }));

  // IMPORTANT: make this a normal mutable array (no `as const`)
  const input: any[] = [
    {
      role: "system",
      content: [
        {
          type: "text",
          text:
            "You are the router for Michael's portfolio. " +
            "Always reply with ONE JSON object: { intent: string, message: string, args?: object }. " +
            "If suggesting videos, set args.videoIds to 2–3 IDs from the dataset.",
        },
      ],
    },
    {
      role: "developer",
      content: [
        { type: "text", text: "DATASET:\n" + JSON.stringify({ videos }) },
      ],
    },
    { role: "user", content: [{ type: "text", text }] },
  ];

  try {
    const resp = await client.responses.create({
      model: "gpt-4o-mini",
      input, // <- mutable, not readonly
    });

    // Debug logs
    console.log("🔎 OpenAI resp object:", resp);
    const raw = resp.output_text ?? "";
    console.log("🔎 OpenAI output_text:", raw);

    // Try to parse as JSON and return it verbatim
    let parsed: any = null;
    try { parsed = JSON.parse(raw); } catch {}
    if (parsed) {
      return new Response(JSON.stringify(parsed), {
        headers: { "content-type": "application/json" },
      });
    }

    // If not JSON, return what we got to inspect
    return new Response(
      JSON.stringify({ error: "LLM did not return JSON", raw }),
      { status: 500, headers: { "content-type": "application/json" } },
    );
  } catch (err: any) {
    console.error("❌ OpenAI error:", err);
    return new Response(
      JSON.stringify({ error: String(err?.message ?? err) }),
      { status: 500, headers: { "content-type": "application/json" } },
    );
  }
}
