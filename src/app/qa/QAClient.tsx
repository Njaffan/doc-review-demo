"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";

type ChatMsg = {
  role: "user" | "assistant";
  content: string;
  ts: number;
};

type StoredChunk = {
  id: string;
  start: number;
  end: number;
  text: string;
  embedding: number[];
};

type StoredDoc = {
  session: string;
  fileName: string;
  text: string;
  chunks: StoredChunk[];
  createdAt: number;
};

function storageKey(session: string) {
  return `docReview:${session}`;
}

export default function QAClient() {
  const searchParams = useSearchParams();
  const session = useMemo(() => searchParams.get("session"), [searchParams]);

  const [doc, setDoc] = useState<StoredDoc | null>(null);

  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load doc from sessionStorage using the SAME key as AnalysisClient
  useEffect(() => {
    setMessages([]);
    setError(null);
    setQuestion("");

    if (!session) {
      setDoc(null);
      return;
    }

    try {
      const raw = sessionStorage.getItem(storageKey(session));
      if (!raw) {
        setDoc(null);
        return;
      }
      const parsed = JSON.parse(raw) as StoredDoc;

      if (
        !parsed?.text ||
        !Array.isArray(parsed?.chunks) ||
        parsed.chunks.length === 0
      ) {
        setDoc(null);
        return;
      }

      setDoc(parsed);
    } catch {
      setDoc(null);
    }
  }, [session]);

  async function ask() {
    const q = question.trim();

    if (!session) {
      setError("Missing session in URL.");
      return;
    }
    if (!doc?.chunks || doc.chunks.length === 0) {
      setError("Missing document data. Go back and re-upload.");
      return;
    }
    if (!q) return;

    setError(null);
    setLoading(true);

    const userMsg: ChatMsg = { role: "user", content: q, ts: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setQuestion("");

    try {
      const res = await fetch("/api/qa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, chunks: doc.chunks }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Q&A request failed");

      const answer =
        (typeof data?.answer === "string" && data.answer) ||
        (typeof data?.response === "string" && data.response) ||
        (typeof data?.text === "string" && data.text) ||
        "";

      if (!answer.trim()) throw new Error("API returned no answer.");

      const botMsg: ChatMsg = {
        role: "assistant",
        content: answer.trim(),
        ts: Date.now(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (e: any) {
      setError(e?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!loading) ask();
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black py-12 px-6 flex justify-center">
      <div className="w-full max-w-3xl">
        <a
          href={session ? `/analysis?session=${session}` : "/analysis"}
          className="text-sm text-zinc-600 dark:text-zinc-400 hover:underline"
        >
          ← Back to Analysis
        </a>

        <div className="mt-6 flex flex-col items-center">
          <Image
            src="/avatar.png"
            alt="Avatar"
            width={90}
            height={90}
            className="rounded-full shadow-md"
            priority
          />
        </div>

        <h1 className="mt-6 text-3xl font-semibold text-black dark:text-white text-center">
          Q&amp;A
        </h1>

        {!session && (
          <p className="mt-3 text-red-600 text-center">Missing session in URL</p>
        )}

        {session && !doc && (
          <p className="mt-3 text-red-600 text-center">
            Session not found in this browser. Re-upload the document.
          </p>
        )}

        <div className="mt-8 rounded-xl bg-white dark:bg-zinc-900 p-6 shadow-sm">
          {messages.length === 0 ? (
            <p className="text-zinc-600 dark:text-zinc-400">
              Ask a question about the uploaded document.
            </p>
          ) : (
            <div className="space-y-4">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`rounded-xl px-4 py-3 ${
                    m.role === "user"
                      ? "bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white"
                      : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200"
                  }`}
                >
                  <div className="text-xs mb-1 text-zinc-500">
                    {m.role === "user" ? "You" : "Assistant"}
                  </div>
                  <div className="whitespace-pre-wrap leading-relaxed">
                    {m.content}
                  </div>
                </div>
              ))}
            </div>
          )}

          {error && (
            <p className="mt-4 text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}

          <div className="mt-6 flex flex-col gap-3">
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Type your question… (Enter to send, Shift+Enter for a new line)"
              className="w-full min-h-[96px] rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-3 text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-700"
              disabled={!session || !doc || loading}
            />

            <div className="flex items-center gap-3">
              <button
                onClick={ask}
                disabled={!session || !doc || loading || !question.trim()}
                className="px-6 py-3 rounded-full bg-black text-white hover:bg-zinc-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Asking…" : "Ask"}
              </button>

              <button
                onClick={() => {
                  setMessages([]);
                  setError(null);
                }}
                disabled={loading || messages.length === 0}
                className="px-6 py-3 rounded-full bg-zinc-200 text-zinc-900 hover:bg-zinc-300 transition disabled:opacity-50 disabled:cursor-not-allowed dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 text-xs text-zinc-500 text-center">
          Tip: Ask things like “Summarize the top risks and propose improved wording.”
        </div>
      </div>
    </div>
  );
}
