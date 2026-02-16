import { Suspense } from "react";
import QAClient from "./QAClient";

// Keep only if you really want this route to be dynamic.
// (If you're doing static export, remove it.)
export const dynamic = "force-dynamic";

export default function QAPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading…</div>}>
      <QAClient />
    </Suspense>
  );
}
