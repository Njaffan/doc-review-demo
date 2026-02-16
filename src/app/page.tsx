import Image from "next/image";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-black p-6">
      <Image
        src="/avatar.png"
        alt="Avatar"
        width={120}
        height={120}
        priority
        className="rounded-full shadow-md mb-6"
      />

      <h1 className="text-4xl font-semibold text-black dark:text-white">
        Document Review Demo
      </h1>

      <p className="mt-4 text-zinc-600 dark:text-zinc-400 text-center max-w-lg">
        Upload a DOCX file and generate an executive summary, identified issues, and interactive Q&amp;A.
      </p>

      <a
        href="/analysis"
        className="mt-8 px-8 py-4 rounded-full bg-black text-white hover:bg-zinc-800 transition"
      >
        Start Analysis
      </a>

      <p className="mt-4 text-sm text-zinc-500">
        Built by Nadir Jaffan
      </p>
    </main>
  );
}
