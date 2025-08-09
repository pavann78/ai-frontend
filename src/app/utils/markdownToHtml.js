import mermaid from "mermaid";

// Initialize Mermaid.js once
mermaid.initialize({
    startOnLoad: false,
    theme: "default",
});

export const markdownToHtml = (markdown) => {
    let html = markdown
        .replace(/^### (.+)$/gim, "<h3>$1</h3>")
        .replace(/^## (.+)$/gim, "<h2>$1</h2>")
        .replace(/^# (.+)$/gim, "<h1>$1</h1>")
        .replace(/^---\s*$/gim, '<hr class="my-6 border-gray-300" />')
        .replace(
            /```mermaid\n([\s\S]*?)\n```/gim,
            (_, code) =>
                `<div style="background-color: white; padding: 1rem; border: 1px solid #e2e8f0; border-radius: 0.5rem; margin-top: 1rem; margin-bottom: 1rem;"><div class="mermaid">${code.trim()}</div></div>`
        )
        .replace(/```(\w+)?\n([\s\S]*?)\n```/gim, (_, lang, code) => {
            const languageClass = lang ? `language-${lang}` : "";
            return `<pre class="bg-gray-800 text-white p-4 rounded-lg overflow-x-auto my-4 text-sm"><code class="${languageClass}">${code.trim()}</code></pre>`;
        })
        .replace(
            /`([^`]+?)`/g,
            '<code class="bg-gray-200 text-red-700 px-1 rounded text-sm">$1</code>'
        )
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.+?)\*/g, "<em>$1</em>")
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<p  class="inline">$1</p>');

    const lines = html.split("\n");
    const processedLines = [];
    let inUl = false;
    let inOl = false;

    for (const line of lines) {
        if (/^\s*[*-]\s+/.test(line)) {
            if (!inUl) {
                if (inOl) processedLines.push("</ol>");
                processedLines.push("<ul>");
                inUl = true;
                inOl = false;
            }
            processedLines.push(`<li>${line.replace(/^\s*[*-]\s+/, "")}</li>`);
        } else if (/^\s*\d+\.\s+/.test(line)) {
            if (!inOl) {
                if (inUl) processedLines.push("</ul>");
                processedLines.push("<ol>");
                inOl = true;
                inUl = false;
            }
            processedLines.push(`<li>${line.replace(/^\s*\d+\.\s+/, "")}</li>`);
        } else {
            if (inUl) {
                processedLines.push("</ul>");
                inUl = false;
            }
            if (inOl) {
                processedLines.push("</ol>");
                inOl = false;
            }
            processedLines.push(line);
        }
    }

    if (inUl) processedLines.push("</ul>");
    if (inOl) processedLines.push("</ol>");

    html = processedLines
        .map((line) => {
            const trimmed = line.trim();
            if (!trimmed) return "";
            if (/^<(h\d|pre|hr|ul|ol|li|strong|em|code|a|div)[>\s]/i.test(trimmed)) {
                return trimmed;
            }
            return `<p>${trimmed}</p>`;
        })
        .join("\n");

    html = html
        .replace(/<\/p>\s*<p>/g, "\n")
        .replace(/<p>\s*<(h\d|ul|ol|pre|hr|div)>/g, "<$1>")
        .replace(/<\/(h\d|ul|ol|pre|hr|div)>\s*<\/p>/g, "</$1>");

    return html;
};
