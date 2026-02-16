import { NextResponse } from "next/server";
import { setSession } from "@/lib/sessionStore";
import { extractDocxText } from "@/lib/textExtract";
import { chunkText } from "@/lib/chunking";
import { embedTexts } from "@/lib/openai";

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  const nameLower = file.name.toLowerCase();
  if (!nameLower.endsWith(".docx")) {
    return NextResponse.json(
      { error: "V1 supports DOCX only (PDF coming next)." },
      { status: 400 }
    );
  }

  const session = crypto.randomUUID();

  const text = await extractDocxText(file);
  if (!text) {
    return NextResponse.json(
      { error: "No text could be extracted from the DOCX." },
      { status: 400 }
    );
  }

  const chunks = chunkText(text, 1200, 200);
  const embeddings = await embedTexts(chunks.map((c) => c.text));

  const storedChunks = chunks.map((c, i) => ({
    ...c,
    embedding: embeddings[i],
  }));

  setSession(session, {
    filename: file.name,
    mimeType:
      file.type ||
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    text,
    chunks: storedChunks,
    createdAt: Date.now(),
  });

  return NextResponse.json({
    session,
    filename: file.name,
    extractedChars: text.length,
    chunkCount: storedChunks.length,
  });
}
