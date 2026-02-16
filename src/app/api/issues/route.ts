import { NextResponse } from "next/server";
import { generateIdentifiedIssues } from "@/lib/openai";
import { getSession, setSession } from "@/lib/sessionStore";
export const runtime = "nodejs";

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

    const issues = await generateIdentifiedIssues(doc.text);

    return NextResponse.json({ session, issues });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Issues generation failed" },
      { status: 500 }
    );
  }
}
