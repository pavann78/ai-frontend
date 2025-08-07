"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  GitBranch,
  RefreshCcw,
  XCircle,
  CheckCircle,
  FileText,
  Search,
  BookOpen,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast, Toaster } from "sonner";

import { useRouter, useSearchParams } from "next/navigation";

export default function ResultPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const repo = searchParams.get("repo");

  const [filteredLogs, setFilteredLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreamComplete, setIsStreamComplete] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    filesProcessed: 0,
    abstractionsIdentified: 0,
    chaptersGenerated: 0,
    currentPhase: "Initializing...",
  });
  const logRef = useRef(null);

  const startStreaming = useCallback(
    async (signal) => {
      // DEBUG: Log the start of the streaming process
      console.log(`[DEBUG] startStreaming called for repo: ${repo}`);

      if (!repo) {
        setError("No repository URL provided.");
        console.error("[DEBUG] No repository URL found in search params.");
        return;
      }

      // Resetting state
      setFilteredLogs([]);
      setIsLoading(true);
      setIsStreamComplete(false);
      setError(null);
      setStats({
        filesProcessed: 0,
        abstractionsIdentified: 0,
        chaptersGenerated: 0,
        currentPhase: "Initializing...",
      });

      console.log("[DEBUG] State has been reset for a new stream.");

      const processSingleLogLineInternal = (line) => {
        // DEBUG: Log the raw line received from the stream
        console.log(`[RAW LINE] Received: "${line}"`);

        let cleanedLine = line.startsWith("data: ") ? line.substring(6) : line;
        cleanedLine = cleanedLine.trim();

        // DEBUG: Log the cleaned line after removing "data: " and trimming
        if (line !== cleanedLine) {
          console.log(`[CLEANED LINE] Processed to: "${cleanedLine}"`);
        }

        if (
          !cleanedLine ||
          cleanedLine === "data:" ||
          cleanedLine.startsWith(": ping -") ||
          cleanedLine.includes("Tutorial for 'python-crud' already exists.") ||
          cleanedLine === "DONE" ||
          cleanedLine === "data: DONE" ||
          cleanedLine.includes("Combining tutorial into directory:") ||
          cleanedLine.includes("Tutorial generation complete! Files are in:") ||
          cleanedLine.includes(
            "Preparing to embed and store code + docs in Chroma vector DB..."
          ) ||
          (cleanedLine.includes("Created") &&
            cleanedLine.includes("chunks from code and documentation.")) ||
          cleanedLine.includes("Creating vector store at:") ||
          cleanedLine.includes("✅ Embedding and storage complete.")
        ) {
          // DEBUG: Log when a line is being ignored by the filter
          console.log(`[IGNORED] Filtering out line: "${cleanedLine}"`);
          return null;
        }

        let logEntry = null;
        let updates = {};

        if (cleanedLine.includes("Crawling repository:")) {
          updates.currentPhase = "Crawling Repository";
          logEntry = {
            type: "info",
            message: `🔍 Crawling repository: ${repo}`,
            timestamp: new Date().toLocaleTimeString(),
            icon: GitBranch,
          };
        } else if (
          cleanedLine.includes("Fetched") &&
          cleanedLine.includes("files")
        ) {
          const fileCount =
            cleanedLine.match(/Fetched (\d+) files/)?.[1] || "0";
          updates.filesProcessed = parseInt(fileCount);
          updates.currentPhase = "Processing Files";
          logEntry = {
            type: "success",
            message: `📁 Fetched ${fileCount} files successfully`,
            timestamp: new Date().toLocaleTimeString(),
            icon: FileText,
          };
        } else if (cleanedLine.includes("Identifying abstractions")) {
          updates.currentPhase = "Identifying Abstractions";
          logEntry = {
            type: "info",
            message: `🧠 Identifying abstractions using LLM...`,
            timestamp: new Date().toLocaleTimeString(),
            icon: Search,
          };
        } else if (
          cleanedLine.includes("Identified") &&
          cleanedLine.includes("abstractions")
        ) {
          const abstractionCount =
            cleanedLine.match(/Identified (\d+) abstractions/)?.[1] || "0";
          updates.abstractionsIdentified = parseInt(abstractionCount);
          logEntry = {
            type: "success",
            message: `✨ Identified ${abstractionCount} abstractions`,
            timestamp: new Date().toLocaleTimeString(),
            icon: CheckCircle,
          };
        } else if (cleanedLine.includes("Analyzing relationships")) {
          updates.currentPhase = "Analyzing Relationships";
          logEntry = {
            type: "info",
            message: `🔗 Analyzing relationships using LLM...`,
            timestamp: new Date().toLocaleTimeString(),
            icon: Search,
          };
        } else if (cleanedLine.includes("Generated project summary")) {
          updates.currentPhase = "Generating Summary";
          logEntry = {
            type: "success",
            message: `📋 Generated project summary and relationship details`,
            timestamp: new Date().toLocaleTimeString(),
            icon: CheckCircle,
          };
        } else if (cleanedLine.includes("Determining chapter order")) {
          updates.currentPhase = "Determining Chapter Order";
          logEntry = {
            type: "info",
            message: `📚 Determining chapter order using LLM...`,
            timestamp: new Date().toLocaleTimeString(),
            icon: BookOpen,
          };
        } else if (cleanedLine.includes("Determined chapter order")) {
          updates.currentPhase = "Organizing Chapters";
          logEntry = {
            type: "success",
            message: `📖 Determined optimal chapter order`,
            timestamp: new Date().toLocaleTimeString(),
            icon: CheckCircle,
          };
        } else if (
          cleanedLine.includes("Preparing to write") &&
          cleanedLine.includes("chapters")
        ) {
          const chapterCount =
            cleanedLine.match(/write (\d+) chapters/)?.[1] || "0";
          updates.chaptersGenerated = parseInt(chapterCount);
          updates.currentPhase = "Writing Chapters";
          logEntry = {
            type: "info",
            message: `✍️ Preparing to write ${chapterCount} chapters...`,
            timestamp: new Date().toLocaleTimeString(),
            icon: BookOpen,
          };
        } else if (
          cleanedLine.trim() &&
          !cleanedLine.includes("Stream complete")
        ) {
          logEntry = {
            type: "info",
            message: cleanedLine,
            timestamp: new Date().toLocaleTimeString(),
            icon: FileText,
          };
        }

        if (Object.keys(updates).length > 0) {
          setStats((prevStats) => ({ ...prevStats, ...updates }));
        }

        // DEBUG: Log the final parsed log entry before it's added to the state
        if (logEntry) {
          console.log("[PARSED]", logEntry);
        }

        return logEntry;
      };

      try {
        const response = await fetch("/api/generate-stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ repo_url: repo }),
          signal: signal,
        });

        if (!response.ok || !response.body) {
          throw new Error(
            `Failed to connect to streaming endpoint. Status: ${response.status}`
          );
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) {
            // DEBUG: Log when the reader is done
            console.log("[STREAM] Reader finished.");
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop();

          for (const line of lines) {
            if (line.trim()) {
              // Process only non-empty lines
              const processedLine = processSingleLogLineInternal(line);
              if (processedLine) {
                setFilteredLogs((prev) => [...prev, processedLine]);
                if (logRef.current) {
                  logRef.current.scrollTop = logRef.current.scrollHeight;
                }
              }
            }
          }
        }

        if (buffer.trim()) {
          const processedLine = processSingleLogLineInternal(buffer);
          if (processedLine) {
            setFilteredLogs((prev) => [...prev, processedLine]);
            if (logRef.current) {
              logRef.current.scrollTop = logRef.current.scrollHeight;
            }
          }
        }

        // DEBUG: Log stream completion
        console.log("[SUCCESS] Stream processing complete.");
        setIsStreamComplete(true);
        setStats((prev) => ({ ...prev, currentPhase: "Complete!" }));

        toast.success("Tutorial generation complete!", {
          description: "All logs have been processed.",
        });
      } catch (err) {
        // DEBUG: Log any error that occurs
        if (err.name === "AbortError") {
          console.log("Fetch request was cancelled as expected."); // Optional: log for clarity
          return; // Exit silently
        }
        console.error("[ERROR] An error occurred during streaming:", err);
        setError(err.message || "An unknown error occurred during streaming.");
        toast.error("Error during tutorial generation", {
          description: err.message || "Please try again.",
        });
      } finally {
        // DEBUG: Log the final state after everything is done
        console.log("[FINALLY] Setting isLoading to false.");
        setIsLoading(false);
      }
    },
    [repo]
  );

  useEffect(() => {
    // DEBUG: Log when the useEffect hook for startStreaming is triggered
    console.log("[EFFECT] useEffect triggered, calling startStreaming.");
    const controller = new AbortController();
    startStreaming(controller.signal);
    return () => {
      console.log("[CLEANUP] Aborting previous fetch request.");
      controller.abort();
    };
  }, [startStreaming]);

  async function goToFiles() {
    try {
      const response = await fetch("/api/generate-tutorial", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ repo_url: repo }),
      });

      const result = await response.json();

      // Store in localStorage
      localStorage.setItem("tutorialData", JSON.stringify(result.data || {}));

      // Navigate based on result
      if (result.success) {
        router.push(`/files?repo=${encodeURIComponent(repo)}`);
      } else {
        router.push(`/`);
      }
    } catch (error) {
      console.error("🔥 Exception:", error);
      toast.error("Something went wrong", {
        description: error.message,
      });
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-8">
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
            {/* <div className="flex space-x-3">
              <button
                onClick={startStreaming}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center text-sm font-medium"
                disabled={isLoading}
              >
                <RefreshCcw className="w-4 h-4 mr-2" /> Retry
              </button>
            </div> */}
          </div>

          <div ref={logRef} className="h-96 overflow-y-auto bg-gray-50 p-6">
            <AnimatePresence mode="popLayout">
              {filteredLogs.map((logEntry, index) => {
                const IconComponent = logEntry.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className={`flex items-start space-x-3 p-4 rounded-lg mb-3 ${
                      logEntry.type === "success"
                        ? "bg-green-50 border-l-4 border-green-400"
                        : logEntry.type === "error"
                        ? "bg-red-50 border-l-4 border-red-400"
                        : "bg-white border-l-4 border-blue-400"
                    }`}
                  >
                    <IconComponent
                      className={`w-5 h-5 mt-0.5 ${
                        logEntry.type === "success"
                          ? "text-green-600"
                          : logEntry.type === "error"
                          ? "text-red-600"
                          : "text-blue-600"
                      }`}
                    />
                    <div className="flex-1">
                      <p className="text-gray-800 font-medium">
                        {logEntry.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {logEntry.timestamp}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* {filteredLogs.length === 0 && !isLoading && !error && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">
                  Tutorials already generated. Go to files to view.
                </p>
              </div>
            )} */}
          </div>
        </div>

        {isStreamComplete && !isLoading && !error && (
          <div className="flex justify-center mt-6">
            <button
              onClick={goToFiles}
              className="px-5 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center"
            >
              Go to Files
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
