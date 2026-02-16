import { NextResponse } from "next/server";
import { getSession } from "@/lib/sessionStore";
import { generateExecutiveSummary } from "@/lib/openai";


export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const session = body?.session;

    if (!session || typeof session !== "string") {
      return NextResponse.json({ error: "Missing session" }, { status: 400 });
    }

    const doc = getSession(session);
    if (!doc) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const summary = await generateExecutiveSummary(doc.text);

    return NextResponse.json({
      session,
      filename: doc.filename,
      summary,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Analyze failed", details: String(err) },
      { status: 500 }
    );
  }
}
