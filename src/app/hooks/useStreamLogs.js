import { useState, useRef, useCallback, useEffect } from "react";
import { toast } from "sonner";
import {
    GitBranch,
    FileText,
    Search,
    CheckCircle,
    BookOpen,
} from "lucide-react";

export function useStreamLogs(repo) {
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
            if (!repo) {
                setError("No repository URL provided.");
                return;
            }

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

            const processSingleLogLineInternal = (line) => {
                let cleanedLine = line.replace(/^(data:\s*)+/g, "").trim();
                cleanedLine = cleanedLine.trim();

                if (
                    !cleanedLine ||
                    cleanedLine === "data:" ||
                    cleanedLine.startsWith(": ping -") ||
                    cleanedLine.includes("Tutorial for 'python-crud' already exists.") ||
                    cleanedLine === "DONE" ||
                    cleanedLine === "data: DONE" ||
                    cleanedLine.includes("Combining tutorial into directory:") ||
                    cleanedLine.includes("Tutorial generation complete!") ||
                    cleanedLine.includes(
                        "Preparing to embed and store code + docs in Chroma vector DB..."
                    ) ||
                    (cleanedLine.includes("Created") &&
                        cleanedLine.includes("chunks from code and documentation.")) ||
                    cleanedLine.includes("Creating vector store at:") ||
                    cleanedLine.includes("✅ Embedding and storage complete.")
                ) {
                    return null;
                }

                let logEntry = null;
                let updates = {};

                if (cleanedLine.includes("Crawling repository:")) {
                    updates.currentPhase = "Crawling Repository";
                    logEntry = {
                        type: "info",
                        message: ` Crawling repository: ${repo}`,
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
                        message: ` Fetched ${fileCount} files successfully`,
                        timestamp: new Date().toLocaleTimeString(),
                        icon: FileText,
                    };
                } else if (cleanedLine.includes("Identifying abstractions")) {
                    updates.currentPhase = "Identifying Abstractions";
                    logEntry = {
                        type: "info",
                        message: ` Identifying abstractions using LLM...`,
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
                        message: ` Identified ${abstractionCount} abstractions`,
                        timestamp: new Date().toLocaleTimeString(),
                        icon: CheckCircle,
                    };
                } else if (cleanedLine.includes("Analyzing relationships")) {
                    updates.currentPhase = "Analyzing Relationships";
                    logEntry = {
                        type: "info",
                        message: ` Analyzing relationships using LLM...`,
                        timestamp: new Date().toLocaleTimeString(),
                        icon: Search,
                    };
                } else if (cleanedLine.includes("Generated project summary")) {
                    updates.currentPhase = "Generating Summary";
                    logEntry = {
                        type: "success",
                        message: ` Generated project summary and relationship details`,
                        timestamp: new Date().toLocaleTimeString(),
                        icon: CheckCircle,
                    };
                } else if (cleanedLine.includes("Determining chapter order")) {
                    updates.currentPhase = "Determining Chapter Order";
                    logEntry = {
                        type: "info",
                        message: ` Determining chapter order using LLM...`,
                        timestamp: new Date().toLocaleTimeString(),
                        icon: BookOpen,
                    };
                } else if (cleanedLine.includes("Determined chapter order")) {
                    updates.currentPhase = "Organizing Chapters";
                    logEntry = {
                        type: "success",
                        message: ` Determined optimal chapter order`,
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
                        message: ` Preparing to write ${chapterCount} chapters...`,
                        timestamp: new Date().toLocaleTimeString(),
                        icon: BookOpen,
                    };
                } else if (
                    cleanedLine.trim() &&
                    !cleanedLine.includes("Stream complete")
                ) {
                    logEntry = {
                        type: "success",
                        message: cleanedLine,
                        timestamp: new Date().toLocaleTimeString(),
                        icon: FileText,
                    };
                }

                if (Object.keys(updates).length > 0) {
                    setStats((prevStats) => ({ ...prevStats, ...updates }));
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
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split("\n");
                    buffer = lines.pop();

                    for (const line of lines) {
                        if (line.trim()) {
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
                    }
                }

                setIsStreamComplete(true);
                setStats((prev) => ({ ...prev, currentPhase: "Complete!" }));
                toast.success("Tutorial generation complete!");
            } catch (err) {
                if (err.name !== "AbortError") {
                    setError(err.message || "An unknown error occurred during streaming.");
                    toast.error("Error during tutorial generation", {
                        description: err.message || "Please try again.",
                    });
                }
            } finally {
                setIsLoading(false);
            }
        },
        [repo]
    );

    useEffect(() => {
        const controller = new AbortController();
        startStreaming(controller.signal);
        return () => controller.abort();
    }, [startStreaming]);

    return {
        filteredLogs,
        isLoading,
        isStreamComplete,
        error,
        stats,
        logRef,
    };
}
