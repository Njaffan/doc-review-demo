import { NextResponse } from "next/server";
import { generateIdentifiedIssues } from "@/lib/openai";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const text = body?.text;

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Missing document text" }, { status: 400 });
    }

    const issues = await generateIdentifiedIssues(text);

    return NextResponse.json({ issues });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Issues failed", details: String(err) },
      { status: 500 }
    );
  }
}
