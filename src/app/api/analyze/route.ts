import { NextResponse } from "next/server";
import { generateExecutiveSummary } from "@/lib/openai";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const text = body?.text;

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Missing document text" }, { status: 400 });
    }

    const summary = await generateExecutiveSummary(text);

    return NextResponse.json({ summary });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Analyze failed", details: String(err) },
      { status: 500 }
    );
  }
}
