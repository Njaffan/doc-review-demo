import { NextResponse } from "next/server";
import { generateExecutiveSummary } from "@/lib/openai";
import { getSession } from "@/lib/sessionStore";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const session = body?.session;

    if (!session || typeof session !== "string") {
      return NextResponse.json({ error: "Missing session" }, { status: 400 });
    }

    const doc = getSession(session);
    if (!doc || !doc.text) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const summary = await generateExecutiveSummary(doc.text);

    return NextResponse.json({
      session,
      filename: doc.fileName ?? null, // ✅ correct property name
      summary,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Analyze failed", details: String(err) },
      { status: 500 }
    );
  }
}
