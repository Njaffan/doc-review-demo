import OpenAI from "openai";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateExecutiveSummary(text: string) {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `
You are an enterprise document analyst.

Generate an executive summary in no more than 5 bullet points.

Rules:
- Each bullet must be one concise sentence.
- Use only information explicitly present in the document.
- Do not infer or assume missing information.
- Prioritize concrete details such as fees, rates, deadlines, parties, and obligations.
- Do not use marketing language.
- Do not include introductory phrases like "This document outlines".
Return only the bullet points.
`,
      },
      {
        role: "user",
        content: text.slice(0, 12000),
      },
    ],
  });

  return response.choices[0]?.message?.content || "";
  
}
export async function embedTexts(texts: string[]) {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: texts,
  });

  return response.data.map((d) => d.embedding);
}

export type IdentifiedIssue = {
  issueType: "Clarity" | "Risk" | "Missing Info" | "Inconsistency";
  quotedText: string;
  suggestedImprovement: string;
};

export async function generateIdentifiedIssues(text: string) {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `
You are an enterprise document reviewer for a bank.

Task:
Identify issues in the document that an editor, legal, compliance, or risk reviewer would flag.

Return JSON ONLY in this exact shape:
{
  "issues": [
    {
      "issueType": "Clarity" | "Risk" | "Missing Info" | "Inconsistency",
      "quotedText": "exact quote from document",
      "suggestedImprovement": "specific fix"
    }
  ]
}

Rules:
- Provide 6 to 15 issues if possible.
- quotedText MUST be copied exactly from the document (short snippet).
- If you cannot find issues, return {"issues": []}.
- No extra keys. No commentary. JSON only.
`,
      },
      {
        role: "user",
        content: text.slice(0, 18000),
      },
    ],
  });

  const raw = response.choices[0]?.message?.content || "";
  const parsed = JSON.parse(raw);
  return (parsed.issues || []) as IdentifiedIssue[];
}


export const __EXPORT_TEST__ = "seen";