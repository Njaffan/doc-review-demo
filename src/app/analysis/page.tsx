export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-black p-6">
      <h1 className="text-4xl font-semibold text-black dark:text-white">
        Document Review Demo
      </h1>

      <p className="mt-4 text-zinc-600 dark:text-zinc-400 text-center max-w-lg">
        Upload a DOCX file and generate an executive summary, identified issues,
        and interactive Q&A.
      </p>

      <a
        href="/analysis"
        className="mt-8 px-8 py-4 rounded-full bg-black text-white hover:bg-zinc-800 transition"
      >
        Start Analysis
      </a>
    </main>
  );
}
