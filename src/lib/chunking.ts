export type TextChunk = {
  id: string;
  text: string;
  start: number;
  end: number;
};

export function chunkText(
  text: string,
  chunkSize = 1200,
  overlap = 200
): TextChunk[] {
  const clean = (text || "").replace(/\r\n/g, "\n").trim();
  if (!clean) return [];

  const chunks: TextChunk[] = [];
  let start = 0;

  while (start < clean.length) {
    const end = Math.min(start + chunkSize, clean.length);
    const slice = clean.slice(start, end).trim();

    if (slice) {
      chunks.push({
        id: crypto.randomUUID(),
        text: slice,
        start,
        end,
      });
    }

    if (end >= clean.length) break;
    start = Math.max(0, end - overlap);
  }

  return chunks;
}
