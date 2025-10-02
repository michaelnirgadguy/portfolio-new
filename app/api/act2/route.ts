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

    const promptPath = path.join(process.cwd(), "lib/llm/prompts/act2.txt");
    const systemPrompt = fs.readFileSync(promptPath, "utf-8");

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: idea || "" },
      ],
      temperature: 0.9,
      max_tokens: 250,
    });

    const raw = completion.choices[0]?.message?.content?.trim() || "";

    // Robust JSON parse (model should return strict JSON per prompt)
    let parsed: any = null;
    try {
      parsed = JSON.parse(raw);
    } catch {
      // Fallback: try to extract a JSON object substring if something slipped in
      const m = raw.match(/\{[\s\S]*\}$/);
      if (m) {
        parsed = JSON.parse(m[0]);
      }
    }

    const title =
      (typeof parsed?.title === "string" && parsed.title.trim()) ||
      "Disco Hamster";
    const description =
      (typeof parsed?.description === "string" && parsed.description.trim()) ||
      raw || "A perfectly reasonable justification, surely.";

    return NextResponse.json({ title, description });
  } catch (err: any) {
    console.error("Act2 API error", err);
    return NextResponse.json(
      { error: "Failed to generate Act2 output" },
      { status: 500 }
    );
  }
}
