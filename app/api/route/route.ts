// /app/api/route/route.ts
import { client } from "@/lib/openai";
import { getAllVideos } from "@/lib/videos";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({} as any));
  const text: string = typeof body?.text === "string" ? body.text : "";

  // Minimal grounding: give the LLM the list of video IDs (and a few fields)
  const videos = getAllVideos().map(({ id, title, client, description }) => ({
    id,
    title,
    client,
    description,
  }));

  const input = [
    {
      role: "system",
      content: [
        {
          type: "text",
          text:
            "You are the router for Michael's portfolio. " +
            "Always reply with ONE JSON object: { intent: string, message: string, args?: object }. " +
            "If suggesting videos, set args.videoIds to 2–3 IDs taken ONLY from the dataset.",
        },
      ],
    },
    {
      role: "developer",
      content: [
        {
          type: "text",
          text: "DATASET (read-only):\n" + JSON.stringify({ videos }, null, 2),
        },
      ],
    },
    { role: "user", content: [{ type: "text", text }] },
  ] as const;

  try {
    const resp = await client.responses.create({
      model: "gpt-4o-mini",
      input,
    });

    // Debug: see exactly what OpenAI returned
    console.log("🔎 OpenAI raw response object:", resp);
    const raw = resp.output_text ?? "";
    console.log("🔎 OpenAI output_text:", raw);

    let parsed: any = null;
    try {
      parsed = JSON.parse(raw);
    } catch {
      /* no-op */
    }

    if (!parsed) {
      return new Response(
        JSON.stringify({ error: "LLM did not return JSON", raw }),
        { status: 500, headers: { "content-type": "application/json" } },
      );
    }

    return new Response(JSON.stringify(parsed), {
      headers: { "content-type": "application/json" },
    });
  } catch (err: any) {
    console.error("❌ OpenAI error:", err);
    return new Response(
      JSON.stringify({ error: String(err?.message ?? err) }),
      { status: 500, headers: { "content-type": "application/json" } },
    );
  }
}
