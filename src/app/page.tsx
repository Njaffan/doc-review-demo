export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-black">
      <img
        src="/avatar.png"
        alt="Nadir Jaffan Avatar"
        className="w-24 h-24 rounded-full object-cover mb-4 shadow-md"
      />

      <h1 className="text-4xl font-semibold text-black dark:text-white">
        Documents Insight
      </h1>

      <p className="mt-4 text-center max-w-xl text-zinc-600 dark:text-zinc-400">
        AI-powered document analysis using retrieval-augmented generation (RAG) to deliver structured insights and grounded answers.
      </p>

      <p className="mt-2 text-sm text-zinc-500">
        Built by Nadir Jaffan
      </p>

      <a
        href="/analysis"
        className="mt-8 px-6 py-3 rounded-full bg-black text-white hover:bg-zinc-800 transition inline-block"
      >
        Upload Document
      </a>
    </div>
  );
}
