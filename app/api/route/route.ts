// /app/api/route/route.ts
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const text: string = typeof body?.text === "string" ? body.text.trim() : "";

    if (!text) {
      return new Response(
        JSON.stringify({ error: "Missing 'text' in request body." }),
        { status: 400, headers: { "content-type": "application/json" } }
      );
    }

    // STUB LOGIC ONLY:
    // - Always return an "information" intent with a friendly echo message.
    // - No external calls, no dataset access yet.
    const payload = {
      intent: "information",
      message: `You said: “${text}”. (Router stub: real curation coming soon)`,
      videoIds: [] as string[],
    };

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Unexpected server error." }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
