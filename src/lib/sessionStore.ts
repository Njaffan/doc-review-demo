
// src/lib/sessionStore.ts
export type StoredChunk = {
  id: string;
  start: number;
  end: number;
  text: string;
  embedding: number[];
};

export type SessionData = {
  fileName?: string;
  text?: string;
  chunks?: StoredChunk[];
  createdAt: number;
};




declare global {
  // eslint-disable-next-line no-var
  var __docReviewSessionStore: Map<string, SessionData> | undefined;
}

const store =
  globalThis.__docReviewSessionStore ?? new Map<string, SessionData>();

globalThis.__docReviewSessionStore = store;

export function setSession(id: string, data: SessionData) {
  store.set(id, data);
}

export function getSession(id: string) {
  return store.get(id);
}

export function hasSession(id: string) {
  return store.has(id);
}

export function deleteSession(id: string) {
  store.delete(id);
}
