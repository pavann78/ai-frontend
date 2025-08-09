import { Suspense } from "react";
import ResultPage from "./resultPage";

export default function ResultPageWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResultPage />
    </Suspense>
  );
}
