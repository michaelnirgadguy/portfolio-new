import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const RECIPIENT = "michael.nirgadguy@gmail.com";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      name?: string;
      email?: string;
      message?: string;
      subject?: string;
    };

    const email = body.email?.trim() ?? "";
    const name = body.name?.trim() ?? "";
    const message = body.message?.trim() ?? "";
    const subject = body.subject?.trim() || `New message from ${name || "a friend"}`;

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    const fromAddress = process.env.CONTACT_FROM_EMAIL;

    if (!resendApiKey || !fromAddress) {
      return NextResponse.json(
        {
          error: "Email service is not configured. Please set RESEND_API_KEY and CONTACT_FROM_EMAIL.",
        },
        { status: 500 },
      );
    }

    const lines = [
      `Name: ${name || "(not provided)"}`,
      `Email: ${email}`,
      "",
      message || "(no message provided)",
    ];

    const payload = {
      from: fromAddress,
      to: RECIPIENT,
      subject,
      reply_to: email,
      text: lines.join("\n"),
    };

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error("Failed to send contact email", data);
      return NextResponse.json({ error: data?.message || "Failed to send email." }, { status: response.status });
    }

    return NextResponse.json({ id: data?.id ?? null });
  } catch (err) {
    console.error("Unexpected error while sending contact email", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
