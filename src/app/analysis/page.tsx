import { Suspense } from "react";
import AnalysisClient from "./AnalysisClient";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          Loading…
        </div>
      }
    >
      <AnalysisClient />
    </Suspense>
  );
}
