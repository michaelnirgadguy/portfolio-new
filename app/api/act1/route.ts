import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const { idea } = await req.json();

    const promptPath = path.join(process.cwd(), "lib/llm/prompts/act1.txt");
    const systemPrompt = fs.readFileSync(promptPath, "utf-8");

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: idea || "" },
      ],
      temperature: 0.9,
      max_tokens: 200,
    });

    const raw = completion.choices[0]?.message?.content?.trim() || "";

    // Try parsing strict JSON
    let parsed: any = null;

    try {
      parsed = JSON.parse(raw);
    } catch {
      // Fallback: extract JSON substring if the model wrapped it
      const m = raw.match(/\{[\s\S]*\}$/);
      if (m) {
        parsed = JSON.parse(m[0]);
      }
    }

    const title =
      (typeof parsed?.title === "string" && parsed.title.trim()) ||
      "Hamster Render Attempt";

    const scriptArray = Array.isArray(parsed?.script)
      ? parsed.script.map((s: any) => String(s).trim()).filter(Boolean)
      : [];

    return NextResponse.json({
      title,
      script: scriptArray,
    });
  } catch (err: any) {
    console.error("Act1 API error", err);
    return NextResponse.json(
      { error: "Failed to generate Act1 output" },
      { status: 500 }
    );
  }
}
