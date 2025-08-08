"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast, Toaster } from "sonner";

export default function Search() {
  const [repoUrl, setRepoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const router = useRouter();

  const isValidGitHubRepo = (url) => {
    const githubRegex = /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/?$/;
    return githubRegex.test(url);
  };

  const isValidLocalPath = (path) => {
    const windowsRegex =
      /^[a-zA-Z]:\\(?:[^\\/:*?"<>|\r\n]+\\)*[^\\/:*?"<>|\r\n]*$/;
    const unixRegex = /^(\/|~\/)([^\/\0]+\/?)*$/;
    return windowsRegex.test(path) || unixRegex.test(path);
  };

  const handleGenerate = async () => {
    if (!isValidGitHubRepo(repoUrl) && !isValidLocalPath(repoUrl)) {
      toast.error("Please enter a valid GitHub URL or local directory.", {
        description:
          "Examples:\nhttps://github.com/user/repo\nC:\\Users\\User\\Repo or /Users/you/Repo",
        action: {
          label: "Clear",
          onClick: () => setRepoUrl(""),
        },
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/generate-tutorial", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ repo_url: repoUrl }),
      });

      const result = await response.json();
      localStorage.setItem("tutorialData", JSON.stringify(result.data || {}));

      if (result.success) {
        router.push(`/files?repo=${encodeURIComponent(repoUrl)}`);
      } else {
        router.push(`/result?repo=${encodeURIComponent(repoUrl)}`);
      }
    } catch (error) {
      console.error("🔥 Exception:", error);
      toast.error("Something went wrong", {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center p-4">
      <Toaster position="top-center" expand={true} richColors />

      <div className="w-full max-w-2xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-gray-500 to-gray-600 rounded-2xl mb-6 shadow-lg">
            <svg
              className="w-8 h-8 text-white"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 0.297C5.373 0.297 0 5.67 0 12.297c0 5.287 3.438 9.773 8.205 11.387.6.113.82-.26.82-.577v-2.234c-3.338.726-4.033-1.61-4.033-1.61-.546-1.387-1.333-1.755-1.333-1.755-1.09-.745.083-.729.083-.729 1.205.085 1.84 1.238 1.84 1.238 1.07 1.832 2.807 1.303 3.492.996.108-.776.42-1.303.762-1.603-2.665-.305-5.467-1.332-5.467-5.931 0-1.31.468-2.381 1.235-3.221-.124-.303-.535-1.527.117-3.176 0 0 1.008-.322 3.3 1.23.96-.267 1.98-.4 3-.405 1.02.005 2.04.138 3 .405 2.29-1.552 3.297-1.23 3.297-1.23.653 1.649.242 2.873.118 3.176.77.84 1.233 1.911 1.233 3.221 0 4.61-2.807 5.624-5.48 5.921.432.372.816 1.102.816 2.222v3.293c0 .32.218.694.825.576C20.565 22.07 24 17.584 24 12.297c0-6.627-5.373-12-12-12" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3  bg-clip-text">
            Tutorial Generator
          </h1>
          <p className="text-lg text-gray-600 max-w-md mx-auto">
            Transform any GitHub repository into a comprehensive tutorial with
            AI-powered analysis
          </p>
        </div>

        {/* Search Section */}
        <div className="space-y-8">
          {/* Input Section */}
          <div className="space-y-4">
            <div
              className={`relative transition-all duration-300 ${
                isFocused ? "transform scale-[1.02]" : ""
              }`}
            >
              <div
                className={`absolute left-4 top-1/2 transform -translate-y-1/2 transition-colors duration-200 z-10 ${
                  isFocused ? "text-slate-500" : "text-gray-600"
                }`}
              >
                <svg
                  className="w-6 h-6"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 0.297C5.373 0.297 0 5.67 0 12.297c0 5.287 3.438 9.773 8.205 11.387.6.113.82-.26.82-.577v-2.234c-3.338.726-4.033-1.61-4.033-1.61-.546-1.387-1.333-1.755-1.333-1.755-1.09-.745.083-.729.083-.729 1.205.085 1.84 1.238 1.84 1.238 1.07 1.832 2.807 1.303 3.492.996.108-.776.42-1.303.762-1.603-2.665-.305-5.467-1.332-5.467-5.931 0-1.31.468-2.381 1.235-3.221-.124-.303-.535-1.527.117-3.176 0 0 1.008-.322 3.3 1.23.96-.267 1.98-.4 3-.405 1.02.005 2.04.138 3 .405 2.29-1.552 3.297-1.23 3.297-1.23.653 1.649.242 2.873.118 3.176.77.84 1.233 1.911 1.233 3.221 0 4.61-2.807 5.624-5.48 5.921.432.372.816 1.102.816 2.222v3.293c0 .32.218.694.825.576C20.565 22.07 24 17.584 24 12.297c0-6.627-5.373-12-12-12" />
                </svg>
              </div>

              <input
                type="text"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleGenerate();
                  }
                }}
                placeholder="Enter Github or your local repo url"
                className={`w-full pl-12 pr-32 py-4 border-2 rounded-xl font-medium transition-all duration-200 bg-white/80 backdrop-blur-sm focus:bg-white focus:outline-none focus:ring-4 focus:ring-slate-200 shadow-lg ${
                  isFocused
                    ? "border-slate-400 shadow-xl"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              />

              {/* Generate Button Inside Input */}
              <button
                onClick={handleGenerate}
                disabled={loading}
                className={`absolute right-2 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-medium px-4 py-2 rounded-lg transition-all duration-200 hover:shadow-md disabled:cursor-not-allowed flex items-center space-x-2 text-sm ${
                  loading ? "animate-pulse" : ""
                }`}
              >
                {loading ? (
                  <>
                    <svg
                      className="w-4 h-4 animate-spin"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                    <span>Generate</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center group">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-200 transition-colors">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">
              AI-Powered Analysis
            </h3>
            <p className="text-sm text-gray-600">
              Deep code understanding and structure analysis
            </p>
          </div>

          <div className="text-center group">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-purple-200 transition-colors">
              <svg
                className="w-6 h-6 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">
              Comprehensive Tutorials
            </h3>
            <p className="text-sm text-gray-600">
              Step-by-step guides with examples and explanations
            </p>
          </div>

          <div className="text-center group">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-green-200 transition-colors">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Lightning Fast</h3>
            <p className="text-sm text-gray-600">
              Generate tutorials in minutes, not hours
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
