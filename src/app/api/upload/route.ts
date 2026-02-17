import { NextResponse } from "next/server";
import { extractDocxText } from "@/lib/textExtract";
import { chunkText } from "@/lib/chunking";
import { embedTexts } from "@/lib/openai";

export const runtime = "nodejs";

type StoredChunk = {
  id: string;
  start: number;
  end: number;
  text: string;
  embedding: number[];
};

export async function POST(req: Request) {
  try {
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
    if (!text || !text.trim()) {
      return NextResponse.json(
        { error: "No text could be extracted from the DOCX." },
        { status: 400 }
      );
    }

    // Chunk the text
    const chunks = chunkText(text, 1200, 200); // (text, chunkSize, overlap)

    if (!chunks || chunks.length === 0) {
      return NextResponse.json(
        { error: "Chunking produced no chunks." },
        { status: 400 }
      );
    }

    // Embed each chunk
    const embeddings = await embedTexts(chunks.map((c) => c.text));

    // Build stored chunks (with embeddings)
    const storedChunks: StoredChunk[] = chunks.map((c, i) => ({
      id: c.id,
      start: c.start,
      end: c.end,
      text: c.text,
      embedding: embeddings[i],
    }));

    return NextResponse.json({
      session,
      filename: file.name,
      text,
      chunks: storedChunks,
      extractedChars: text.length,
      chunkCount: storedChunks.length,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Upload failed", details: String(err) },
      { status: 500 }
    );
  }
}
