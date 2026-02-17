"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type StoredChunk = {
  id: string;
  start: number;
  end: number;
  text: string;
  embedding: number[];
};

type Issue = {
  issueType: "Clarity" | "Risk" | "Missing Info" | "Inconsistency";
  quotedText: string;
  suggestedImprovement: string;
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

export default function AnalysisClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const session = useMemo(() => searchParams.get("session"), [searchParams]);

  const [fileName, setFileName] = useState<string | null>(null);

  // Loaded/stored doc data
  const [doc, setDoc] = useState<StoredDoc | null>(null);

  // Executive Summary state
  const [summary, setSummary] = useState<string[]>([]);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  // Issues state
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loadingIssues, setLoadingIssues] = useState(false);
  const [issuesError, setIssuesError] = useState<string | null>(null);

  // -----------------------------
  // Load doc from sessionStorage when session param exists
  // -----------------------------
  useEffect(() => {
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
      if (!parsed?.text || !Array.isArray(parsed?.chunks)) {
        setDoc(null);
        return;
      }
      setDoc(parsed);
    } catch {
      setDoc(null);
    }
  }, [session]);

  // -----------------------------
  // Upload + store in sessionStorage
  // -----------------------------
  async function handleUploadAndAnalyze() {
    const input = document.getElementById("fileUpload") as HTMLInputElement | null;
    const file = input?.files?.[0];

    if (!file) {
      alert("Please select a DOCX first.");
      return;
    }

    const fd = new FormData();
    fd.append("file", file);

    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      alert(data?.error || "Upload failed");
      return;
    }

    // Expect upload API to return these fields
    const newSession = String(data?.session || "").trim();
    const returnedText = typeof data?.text === "string" ? data.text : "";
    const returnedChunks = Array.isArray(data?.chunks) ? (data.chunks as StoredChunk[]) : [];
    const returnedFileName = typeof data?.filename === "string" ? data.filename : file.name;

    if (!newSession || !returnedText || returnedChunks.length === 0) {
      alert(
        "Upload succeeded but response was missing text/chunks. Check /api/upload response."
      );
      return;
    }

    const stored: StoredDoc = {
      session: newSession,
      fileName: returnedFileName,
      text: returnedText,
      chunks: returnedChunks,
      createdAt: Date.now(),
    };

    sessionStorage.setItem(storageKey(newSession), JSON.stringify(stored));

    // Navigate to results view
    router.push(`/analysis?session=${newSession}`);
  }

  // -----------------------------
  // Fetch Executive Summary (send text directly)
  // -----------------------------
  useEffect(() => {
    if (!session || !doc?.text) return;

    setLoadingSummary(true);
    setSummaryError(null);
    setSummary([]);

    fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: doc.text }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || "Analyze failed");

        const raw = String(data.summary || "").trim();
        const bullets = raw
          .split("\n")
          .map((l) => l.replace(/^[-•\s]+/, "").trim())
          .filter(Boolean);

        setSummary(bullets);
        setLoadingSummary(false);
      })
      .catch((err) => {
        setSummary([]);
        setSummaryError(err?.message || "Failed to generate summary.");
        setLoadingSummary(false);
      });
  }, [session, doc?.text]);

  // -----------------------------
  // Fetch Identified Issues (send text directly)
  // -----------------------------
  useEffect(() => {
    if (!session || !doc?.text) return;

    setLoadingIssues(true);
    setIssuesError(null);
    setIssues([]);

    fetch("/api/issues", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: doc.text }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || "Issues failed");

        setIssues(Array.isArray(data.issues) ? data.issues : []);
        setLoadingIssues(false);
      })
      .catch((err) => {
        setIssues([]);
        setIssuesError(err?.message || "Failed to generate issues.");
        setLoadingIssues(false);
      });
  }, [session, doc?.text]);

  // -----------------------
  // UPLOAD MODE
  // -----------------------
  if (!session) {
    return (
      <div className="min-h-screen flex flex-col items-center bg-zinc-50 dark:bg-black py-20 px-6">
        <a href="/" className="self-start text-sm text-zinc-600 dark:text-zinc-400 hover:underline">
          ← Back
        </a>

        <h1 className="mt-6 text-3xl font-semibold text-black dark:text-white">
          Upload Document
        </h1>

        <p className="mt-4 text-zinc-600 dark:text-zinc-400 text-center max-w-lg">
          Upload a DOCX file to generate an executive summary and identified issues.
        </p>

        <div className="mt-10 w-full max-w-md flex flex-col items-center gap-6">
          <input
            type="file"
            accept=".docx"
            id="fileUpload"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              setFileName(f ? f.name : null);
            }}
          />

          <label
            htmlFor="fileUpload"
            className="w-full cursor-pointer rounded-xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-8 text-center hover:border-zinc-400 dark:hover:border-zinc-600 transition"
          >
            <div className="text-lg font-semibold text-black dark:text-white">
              Drag &amp; drop your file here
            </div>
            <div className="mt-2 text-sm text-zinc-500">
              DOCX only
            </div>
          </label>

          <button
            type="button"
            onClick={() => document.getElementById("fileUpload")?.click()}
            className="px-6 py-3 rounded-full bg-black text-white hover:bg-zinc-800 transition"
          >
            Select File
          </button>

          {fileName && (
            <>
              <p className="text-sm text-green-600 dark:text-green-400">
                Selected: {fileName}
              </p>

              <button
                onClick={handleUploadAndAnalyze}
                className="mt-2 px-6 py-3 rounded-full bg-black text-white hover:bg-zinc-800 transition"
              >
                Analyze Document
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // -----------------------
  // RESULTS MODE
  // -----------------------
  if (session && !doc) {
    return (
      <div className="min-h-screen flex flex-col items-center bg-zinc-50 dark:bg-black py-20 px-6">
        <a
          href="/analysis"
          className="self-start text-sm text-zinc-600 dark:text-zinc-400 hover:underline"
        >
          ← Upload another document
        </a>

        <h1 className="mt-6 text-3xl font-semibold text-black dark:text-white">
          Analysis Results
        </h1>

        <p className="mt-2 text-sm text-zinc-500">Session: {session}</p>

        <div className="mt-10 w-full max-w-3xl bg-white dark:bg-zinc-900 rounded-xl p-8 shadow-sm">
          <p className="text-red-600 dark:text-red-400">
            Session data not found in this browser.
          </p>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Re-upload the document (sessions are stored in your browser only for this demo).
          </p>

          <a
            href="/analysis"
            className="mt-6 inline-block px-6 py-3 rounded-full bg-black text-white hover:bg-zinc-800 transition"
          >
            Upload Document
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-zinc-50 dark:bg-black py-20 px-6">
      <a
        href="/analysis"
        className="self-start text-sm text-zinc-600 dark:text-zinc-400 hover:underline"
      >
        ← Upload another document
      </a>

      <h1 className="mt-6 text-3xl font-semibold text-black dark:text-white">
        Analysis Results
      </h1>

      <p className="mt-2 text-sm text-zinc-500">Session: {session}</p>
      {doc?.fileName && (
        <p className="mt-1 text-sm text-zinc-500">File: {doc.fileName}</p>
      )}

      {/* Executive Summary */}
      <div className="mt-10 w-full max-w-3xl bg-white dark:bg-zinc-900 rounded-xl p-8 shadow-sm">
        <h2 className="text-xl font-semibold text-black dark:text-white">
          Executive Summary
        </h2>

        {loadingSummary && (
          <p className="mt-4 text-zinc-500">Generating summary...</p>
        )}

        {summaryError && (
          <p className="mt-4 text-red-600 dark:text-red-400">{summaryError}</p>
        )}

        {!loadingSummary && !summaryError && summary.length > 0 && (
          <ul className="mt-4 list-disc pl-5 text-zinc-700 dark:text-zinc-300">
            {summary.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
        )}
      </div>

      {/* Identified Issues */}
      <div className="mt-8 w-full max-w-3xl bg-white dark:bg-zinc-900 rounded-xl p-8 shadow-sm">
        <h2 className="text-xl font-semibold text-black dark:text-white">
          Identified Issues
        </h2>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-zinc-500">
                <th className="py-2 pr-4">Issue Type</th>
                <th className="py-2 pr-4">Quoted Text</th>
                <th className="py-2">Suggested Improvement</th>
              </tr>
            </thead>

            <tbody className="text-zinc-700 dark:text-zinc-300">
              {loadingIssues && (
                <tr>
                  <td colSpan={3} className="py-4 text-zinc-500">
                    Generating issues…
                  </td>
                </tr>
              )}

              {issuesError && (
                <tr>
                  <td colSpan={3} className="py-4 text-red-600">
                    {issuesError}
                  </td>
                </tr>
              )}

              {!loadingIssues &&
                !issuesError &&
                issues.map((it, idx) => (
                  <tr
                    key={idx}
                    className="border-t border-zinc-200 dark:border-zinc-800 align-top"
                  >
                    <td className="py-3 pr-4 font-medium">{it.issueType}</td>
                    <td className="py-3 pr-4">“{it.quotedText}”</td>
                    <td className="py-3">{it.suggestedImprovement}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      <a
        href={`/qa?session=${session}`}
        className="mt-8 px-6 py-3 rounded-full bg-black text-white hover:bg-zinc-800 transition inline-block"
      >
        Go to Q&amp;A
      </a>
    </div>
  );
}
