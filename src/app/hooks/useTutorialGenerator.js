import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const GITHUB_REGEX = /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+(?:\.git)?\/?$/;
const WINDOWS_REGEX = /^[a-zA-Z]:\\(?:[^\\/:*?"<>|\r\n]+\\)*[^\\/:*?"<>|\r\n]*$/;
const UNIX_REGEX = /^(\/|~\/)([^\/\0]+\/?)*$/;
const API_ENDPOINT = "/api/generate-tutorial";

const isValidGitHubRepo = (url) => GITHUB_REGEX.test(url);
const isValidLocalPath = (path) => WINDOWS_REGEX.test(path) || UNIX_REGEX.test(path);

export function useTutorialGenerator() {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const generate = async (repoUrl) => {
        let finalRepoUrl = repoUrl.trim();

        // Validation logic
        if (isValidGitHubRepo(finalRepoUrl)) {
            if (!finalRepoUrl.endsWith(".git")) {
                finalRepoUrl = finalRepoUrl.replace(/\/+$/, "") + ".git";
            }
        } else if (!isValidLocalPath(finalRepoUrl)) {
            toast.error("Please enter a valid GitHub URL or local directory.", {
                description:
                    "Examples:\nhttps://github.com/user/repo\nC:\\Users\\User\\Repo or /Users/you/Repo",
            });
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(API_ENDPOINT, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ repo_url: finalRepoUrl }),
            });

            const result = await response.json();
            localStorage.setItem("tutorialData", JSON.stringify(result.data || {}));

            const destination = result.success ? "/files" : "/result";
            router.push(`${destination}?repo=${encodeURIComponent(finalRepoUrl)}`);

        } catch (error) {
            console.error("🔥 Exception:", error);
            toast.error("Something went wrong", { description: error.message });
        } finally {
            setLoading(false);
        }
    };

    return { loading, generate };
}