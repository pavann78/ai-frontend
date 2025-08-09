"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { Toaster } from "sonner";
import { CheckCircle } from "lucide-react";
import LogList from "./LogList";
import { useStreamLogs } from "../hooks/useStreamLogs";

import { useLayoutEffect } from "react";

export default function ResultPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const repo = searchParams.get("repo");
  const { filteredLogs, isLoading, isStreamComplete, error, logRef } =
    useStreamLogs(repo);

  async function goToFiles() {
    const response = await fetch("/api/generate-tutorial", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ repo_url: repo }),
    });
    const result = await response.json();
    localStorage.setItem("tutorialData", JSON.stringify(result.data || {}));
    router.push(
      result.success ? `/files?repo=${encodeURIComponent(repo)}` : `/`
    );
  }

    // Auto-scroll to bottom whenever logs change (smooth)
  useLayoutEffect(() => {
    if (logRef.current) {
      requestAnimationFrame(() => {
        logRef.current.scrollTo({
          top: logRef.current.scrollHeight,
          behavior: "smooth",
        });
      });
    }
  }, [filteredLogs]);

  return (
    <div className="min-h-full bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-8">
      <Toaster position="top-center" richColors expand />

      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-200">
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-3"></div>
                  Live Processing Stream
                </>
              ) : isStreamComplete ? (
                <>
                  <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                  Stream Complete
                </>
              ) : (
                <>
                  <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-3"></div>
                  <span className="text-gray-600">Processing Logs</span>
                </>
              )}
            </h3>
          </div>

          <div ref={logRef} className="h-96 overflow-y-auto bg-gray-50 p-6">
            <LogList logs={filteredLogs} />
          </div>
        </div>

        {isStreamComplete && !isLoading && !error && (
          <div className="flex justify-center mt-6">
            <button
              onClick={goToFiles}
              className="px-5 py-2.5 cursor-pointer bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 text-white rounded-lg flex items-center "
            >
              Go to Files
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
