"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

type ChatMsg = {
  role: "user" | "assistant";
  content: string;
  ts: number;
};

export default function QAClient() {
  const searchParams = useSearchParams();
  const session = useMemo(() => searchParams.get("session"), [searchParams]);

  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMsg[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Optional: reset chat when session changes
  useEffect(() => {
    setMessages([]);
    setError(null);
    setQuestion("");
  }, [session]);

  async function ask() {
    const q = question.trim();
    if (!session) {
      setError("Missing session in URL.");
      return;
    }
    if (!q) return;

    setError(null);
    setLoading(true);

    // Optimistic add user message
    const userMsg: ChatMsg = { role: "user", content: q, ts: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setQuestion("");

    try {
      const res = await fetch("/api/qa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // IMPORTANT: this must match what your /api/qa expects
        body: JSON.stringify({ session, question: q }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Q&A request failed");

      // Accept several possible field names to reduce brittleness
      const answer =
        (typeof data?.answer === "string" && data.answer) ||
        (typeof data?.response === "string" && data.response) ||
        (typeof data?.text === "string" && data.text) ||
        "";

      if (!answer.trim()) {
        throw new Error(
          "API returned no answer. Check /api/qa response JSON field name (expected: answer)."
        );
      }

      const botMsg: ChatMsg = { role: "assistant", content: answer.trim(), ts: Date.now() };
      setMessages((prev) => [...prev, botMsg]);
    } catch (e: any) {
      setError(e?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Enter to send, Shift+Enter for newline
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

        <h1 className="mt-6 text-3xl font-semibold text-black dark:text-white">
          Q&amp;A
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Session: {session ?? "(none)"}
        </p>

        {!session && (
          <div className="mt-6 rounded-xl bg-white dark:bg-zinc-900 p-6 shadow-sm">
            <p className="text-zinc-700 dark:text-zinc-300">
              No session provided. Go back to Analysis and click “Go to Q&amp;A”.
            </p>
          </div>
        )}

        {/* Chat */}
        <div className="mt-8 rounded-xl bg-white dark:bg-zinc-900 p-6 shadow-sm">
          {messages.length === 0 ? (
            <p className="text-zinc-600 dark:text-zinc-400">
              Ask a question about the uploaded document (summary + issues).
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
                  <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
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
              disabled={!session || loading}
            />

            <div className="flex items-center gap-3">
              <button
                onClick={ask}
                disabled={!session || loading || !question.trim()}
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

        <div className="mt-6 text-xs text-zinc-500">
          Tip: If you want the assistant to reference the exact issues table, ask things like:
          “Explain the top 3 risks and propose improved wording.”
        </div>
      </div>
    </div>
  );
}
