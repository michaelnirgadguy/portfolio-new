import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const RECIPIENT = "michael.nirgadguy@gmail.com";
const DEFAULT_WEB3FORMS_KEY = "c54fcf1d-f6e6-4319-99bc-4f4160d6d7e6";

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

    const web3formsKey = process.env.WEB3FORMS_ACCESS_KEY || DEFAULT_WEB3FORMS_KEY;

    if (!web3formsKey) {
      return NextResponse.json({ error: "Email service is not configured." }, { status: 500 });
    }

    const payload = {
      access_key: web3formsKey,
      name: name || "Portfolio visitor",
      email,
      subject,
      message: message || "(no message provided)",
      to: RECIPIENT,
    };

    const originHeader = req.headers.get("origin")?.trim() || "";
    const refererHeader = req.headers.get("referer")?.trim() || "";
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
    const proto = req.headers.get("x-forwarded-proto") || "https";
    const fallbackOrigin = host ? `${proto}://${host}` : "";
    const inferredOrigin = originHeader || (refererHeader ? new URL(refererHeader).origin : "") || fallbackOrigin;

    const web3formsHeaders: HeadersInit = {
      Accept: "application/json",
      "Content-Type": "application/json",
    };

    if (inferredOrigin) {
      web3formsHeaders["Origin"] = inferredOrigin;
    }
    if (refererHeader || inferredOrigin) {
      web3formsHeaders["Referer"] = refererHeader || inferredOrigin;
    }
    const userAgent = req.headers.get("user-agent");
    if (userAgent) web3formsHeaders["User-Agent"] = userAgent;

    const response = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: web3formsHeaders,
      body: JSON.stringify({
        ...payload,
        from_url: refererHeader || inferredOrigin || fallbackOrigin || "unknown",
      }),
      cache: "no-store",
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || data?.success === false) {
      console.error("Failed to send contact email", data);
      return NextResponse.json(
        { error: data?.message || "Failed to send email." },
        { status: response.ok ? 400 : response.status },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Unexpected error while sending contact email", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
