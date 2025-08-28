// app/api/route/route.ts
import { client } from "@/lib/openai";
import { buildRouterRequest } from "@/lib/llm/buildRouterRequest";
import { RouterPayloadSchema } from "@/lib/llm/routerSchema";
import { isRouterIntent } from "@/lib/llm/intents";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any));
    const userText: string = typeof body?.text === "string" ? body.text : "";
    const recent: { role: "user" | "assistant"; content: string }[] = Array.isArray(body?.recent) ? body.recent : [];

    // 1) Build prompt + schema for the router
    const request = await buildRouterRequest({ userText, recent });

    // 2) Call LLM
    const completion = await client.chat.completions.create({
      model: request.model,
      temperature: request.temperature,
      response_format: request.response_format,
      messages: request.messages,
    });

    const raw = completion.choices?.[0]?.message?.content ?? "";
    if (!raw) {
      return new Response(JSON.stringify({ error: "Empty completion from model" }), {
        status: 502,
        headers: { "content-type": "application/json" },
      });
    }

    // 3) Parse → validate with Zod
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return new Response(JSON.stringify({ error: "Model returned non-JSON", raw }), {
        status: 500,
        headers: { "content-type": "application/json" },
      });
    }

    const result = RouterPayloadSchema.safeParse(parsed);
    if (!result.success) {
      return new Response(JSON.stringify({ error: "Invalid payload", issues: result.error.flatten() }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    let out = result.data;

    // 4) Coerce/guard intent
    if (!isRouterIntent(out.intent)) {
      out.intent = "show_portfolio";
    }

    // 5) Sanitize videoIds to whitelist (max 3)
    const validSet = new Set<string>(request.VALID_IDS);
    const incomingIds = Array.isArray(out.args?.videoIds) ? out.args!.videoIds : [];
    const filtered = incomingIds.filter((id) => validSet.has(id)).slice(0, 3);

    if (filtered.length > 0) {
      out = { ...out, args: { ...(out.args ?? {}), videoIds: filtered } };
    } else if (out.intent === "show_videos") {
      const fallback = request.VALID_IDS.slice(0, 3);
      out = {
        ...out,
        message: out.message || "Here are a few to start with.",
        args: { ...(out.args ?? {}), videoIds: fallback },
      };
    }

    // 6) Return clean JSON (always)
    return new Response(JSON.stringify(out), { headers: { "content-type": "application/json" } });
  } catch (err: any) {
    console.error("❌ /api/route error:", err);
    return new Response(
      JSON.stringify({ error: "Internal Server Error", details: String(err?.message ?? err) }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }
}
