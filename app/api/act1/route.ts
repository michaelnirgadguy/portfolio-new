import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { client } from "@/lib/openai";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { idea } = ((await req.json().catch(() => ({}))) || {}) as {
      idea?: string;
    };

    const promptPath = path.join(process.cwd(), "lib/llm/prompts/act1.txt");
    const systemPrompt = await fs.readFile(promptPath, "utf-8");

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: idea || "" },
      ],
      temperature: 0.9,
      max_tokens: 300,
    });

    const raw = completion.choices[0]?.message?.content?.trim() || "";

    let title = "";
    let script: string[] = [];

    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed?.title === "string") {
        title = parsed.title.trim();
      }

      if (Array.isArray(parsed?.script)) {
        script = parsed.script
          .map((line: any) => String(line).trim())
          .filter(Boolean);
      }
    } catch (err) {
      console.warn("Act1 JSON parse error", err);
    }

    if (!script.length && raw) {
      script = raw
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
    }

    return NextResponse.json({ title, script, text: raw });
  } catch (err) {
    console.error("Act1 API error", err);
    return NextResponse.json({ error: "Failed to generate Act1 output" }, { status: 500 });
  }
}
