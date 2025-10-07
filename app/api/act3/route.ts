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

    const promptPath = path.join(process.cwd(), "lib/llm/prompts/act3.txt");
    const systemPrompt = fs.readFileSync(promptPath, "utf-8");

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: idea || "" },
      ],
      temperature: 0.9,
      max_tokens: 300,
    });

    const raw = completion.choices[0]?.message?.content?.trim() || "";

    let parsed: any = null;
    try {
      parsed = JSON.parse(raw);
    } catch {
      const m = raw.match(/\{[\s\S]*\}$/);
      if (m) parsed = JSON.parse(m[0]);
    }

    const subject =
      (typeof parsed?.subject === "string" && parsed.subject.trim()) ||
      "HELP - Mimsy Meltdown!";
    const body =
      (typeof parsed?.body === "string" && parsed.body.trim()) ||
      "Michael HELP ME! Something went wrong and I’m spinning again! Could you pweeease back me up on this one?";

    return NextResponse.json({ subject, body });
  } catch (err: any) {
    console.error("Act3 API error", err);
    return NextResponse.json(
      { error: "Failed to generate Act3 output" },
      { status: 500 }
    );
  }
}
