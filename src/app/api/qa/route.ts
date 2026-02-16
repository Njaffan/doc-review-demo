import { NextResponse } from "next/server";
import { getSession } from "@/lib/sessionStore";
import { embedTexts, openai } from "@/lib/openai";
import { retrieveTopChunks } from "@/lib/retrieval";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const session = body?.session;
  const question = body?.question;

  if (!session || typeof session !== "string") {
    return NextResponse.json({ error: "Missing session" }, { status: 400 });
  }

  if (!question || typeof question !== "string") {
    return NextResponse.json({ error: "Missing question" }, { status: 400 });
  }

  const doc = getSession(session);
  if (!doc) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  // 1) Embed the question
  const [qEmbedding] = await embedTexts([question]);

  // 2) Retrieve top chunks
  const topChunks = retrieveTopChunks(qEmbedding, doc.chunks, 5);

  const context = topChunks
    .map((c, i) => `Chunk ${i + 1}:\n${c.text}`)
    .join("\n\n---\n\n");

  // 3) Grounded answer prompt
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
Quote exact phrases when helpful.
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
    session,
    question,
    answer,
    sources: topChunks.map((c) => ({
      id: c.id,
      start: c.start,
      end: c.end,
      preview: c.text.slice(0, 220),
    })),
  });
}
