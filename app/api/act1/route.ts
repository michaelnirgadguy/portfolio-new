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

    const text = completion.choices[0]?.message?.content?.trim() || "";
    return NextResponse.json({ text });
  } catch (err: any) {
    console.error("Act1 API error", err);
    return NextResponse.json({ error: "Failed to generate Act1 output" }, { status: 500 });
  }
}
