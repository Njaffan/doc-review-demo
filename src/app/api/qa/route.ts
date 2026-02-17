import { NextResponse } from "next/server";
import { embedTexts, openai } from "@/lib/openai";
import { retrieveTopChunks } from "@/lib/retrieval";

export const runtime = "nodejs";

type IncomingChunk = {
  id: string;
  start: number;
  end: number;
  text: string;
  embedding: number[];
};

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const question = body?.question;
    const chunks: IncomingChunk[] = body?.chunks;

    if (!question || typeof question !== "string") {
      return NextResponse.json(
        { error: "Missing question" },
        { status: 400 }
      );
    }

    if (!Array.isArray(chunks) || chunks.length === 0) {
      return NextResponse.json(
        { error: "Missing document chunks" },
        { status: 400 }
      );
    }

    // 1️⃣ Embed question
    const [qEmbedding] = await embedTexts([question]);

    // 2️⃣ Retrieve relevant chunks
    const topChunks = retrieveTopChunks(qEmbedding, chunks, 5);

    const context = topChunks
      .map((c, i) => `Chunk ${i + 1}:\n${c.text}`)
      .join("\n\n---\n\n");

    // 3️⃣ Grounded answer
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
You are a document QA system.

You MUST answer using only the provided context.
If the answer is not explicitly stated in the context, respond exactly with:
"Not specified in the document."

Do not infer.
Do not assume.
Do not use outside knowledge.
Be concise.
`,
        },
        {
          role: "user",
          content: `CONTEXT:\n${context}\n\nQUESTION:\n${question}`,
        },
      ],
    });

    const answer = response.choices[0]?.message?.content || "";

    return NextResponse.json({
      answer: answer.trim(),
      sources: topChunks.map((c) => ({
        id: c.id,
        start: c.start,
        end: c.end,
        preview: c.text.slice(0, 220),
      })),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Q&A failed", details: String(err) },
      { status: 500 }
    );
  }
}
