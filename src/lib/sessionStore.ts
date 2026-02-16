export type StoredChunk = {
  id: string;
  text: string;
  start: number;
  end: number;
  embedding: number[];
};

export type StoredDoc = {
  filename: string;
  mimeType: string;
  text: string;
  chunks: StoredChunk[];
  createdAt: number;
};

const store = new Map<string, StoredDoc>();

export function setSession(sessionId: string, doc: StoredDoc) {
  store.set(sessionId, doc);
}

export function getSession(sessionId: string) {
  return store.get(sessionId);
}

export function deleteSession(sessionId: string) {
  store.delete(sessionId);
}
