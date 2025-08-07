"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import Chatbot from "../components/chatbot";
import mermaid from "mermaid";

// Initialize Mermaid.js once when the component loads
mermaid.initialize({
  startOnLoad: false,
  theme: "default",
});

const markdownToHtml = (markdown) => {
  // Initial replacements
  let html = markdown
    .replace(/^### (.+)$/gim, "<h3>$1</h3>")
    .replace(/^## (.+)$/gim, "<h2>$1</h2>")
    .replace(/^# (.+)$/gim, "<h1>$1</h1>")
    .replace(/^---\s*$/gim, '<hr class="my-6 border-gray-300" />')
    // MODIFIED: Added a styled div with a white background to ensure diagram visibility
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

  // Handle ordered and unordered lists
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

  // Paragraph wrapping
  html = processedLines
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return "";
      // MODIFIED: Updated regex to account for the new styled div wrapper
      if (/^<(h\d|pre|hr|ul|ol|li|strong|em|code|a|div)[>\s]/i.test(trimmed)) {
        return trimmed;
      }
      return `<p>${trimmed}</p>`;
    })
    .join("\n");

  // Clean up wrongly wrapped block elements
  html = html
    .replace(/<\/p>\s*<p>/g, "\n")
    .replace(/<p>\s*<(h\d|ul|ol|pre|hr|div)>/g, "<$1>")
    .replace(/<\/(h\d|ul|ol|pre|hr|div)>\s*<\/p>/g, "</$1>");

  return html;
};

const parseChapters = (chapters) => {
  const sidebarData = [];
  const contentMap = {};

  Object.entries(chapters).forEach(([key, markdownContent]) => {
    const titleMatch = markdownContent.match(
      /^#\s*(Chapter\s*\d+:\s*.*?)\s*$/m
    );
    let title = titleMatch ? titleMatch[1].trim() : key;

    // Remove (...) content and anything after slash
    title = title
      .replace(/\s*\(.*?\)\s*/g, "")
      .replace(/\s*\/.*$/, "")
      .trim();

    const id = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-*|-*$/g, "");
    sidebarData.push({ id, title });
    contentMap[id] = markdownToHtml(markdownContent);
  });

  return { sidebarData, contentMap };
};

export default function FilesPage() {
  const [activeId, setActiveId] = useState("");
  const [sidebarData, setSidebarData] = useState([]);
  const [contentMap, setContentMap] = useState({});
  const contentRef = useRef(null);
  const mainContentRef = useRef(null);

  useEffect(() => {
    try {
      const tutorialData = JSON.parse(
        localStorage.getItem("tutorialData") || "{}"
      );
      const chapters = tutorialData?.chapters || {};
      const { sidebarData, contentMap } = parseChapters(chapters);
      setSidebarData(sidebarData);
      setContentMap(contentMap);
      if (sidebarData.length > 0) {
        setActiveId(sidebarData[0].id);
      }
    } catch (e) {
      console.error("Failed to parse tutorial data from localStorage:", e);
    }
  }, []);

  useEffect(() => {
    // When activeId changes or component mounts, render Mermaid diagrams
    if (mainContentRef.current) {
      mainContentRef.current.scrollTop = 0;
    }
    const renderMermaidDiagrams = async () => {
      if (contentRef.current) {
        const mermaidDivs = contentRef.current.querySelectorAll(".mermaid");
        for (const div of mermaidDivs) {
          if (div.querySelector("svg")) {
            div.innerHTML = div.textContent;
          }
          const mermaidCode = div.textContent;
          try {
            // Generate a unique ID for the diagram
            const { svg } = await mermaid.render(
              `mermaid-diagram-${Math.random().toString(36).substring(2, 9)}`,
              mermaidCode
            );
            div.innerHTML = svg; // Replace the text content with the rendered SVG
          } catch (error) {
            console.error("Mermaid rendering error:", error);
            // Display a user-friendly error message in place of the diagram
            div.innerHTML = `<p style="color: red; font-weight: bold;">Error rendering diagram:</p><pre style="background-color: #ffe0e0; padding: 10px; border-radius: 5px; overflow-x: auto;">${mermaidCode}</pre><p style="color: red; font-style: italic;">${error.message}</p>`;
          }
        }
      }
    };
    const timeoutId = setTimeout(() => {
      renderMermaidDiagrams();
    }, 50);
    return () => clearTimeout(timeoutId);
  }, [activeId]);

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white text-black p-4 flex flex-col overflow-y-auto shadow-lg border-r border-gray-200 rounded-lg m-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Chapters</h2>
          <nav>
            <ul className="space-y-2">
              {sidebarData.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => setActiveId(item.id)}
                    className={`
                      w-full text-left px-4 py-2 rounded-lg transition-colors duration-200
                      ${
                        activeId === item.id
                          ? "bg-blue-100 text-blue-800 font-medium shadow-sm"
                          : "hover:bg-gray-100 hover:text-gray-900"
                      }
                    `}
                  >
                    {item.title}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </aside>

      {/* Content */}
      <main
        ref={mainContentRef}
        className="flex-1 p-8 overflow-y-auto bg-white text-gray-900 shadow-lg rounded-lg m-4 ml-0"
      >
        <div
          key={activeId}
          ref={contentRef}
          className="prose max-w-none animate-slide-in"
          dangerouslySetInnerHTML={{ __html: contentMap[activeId] }}
        />
      </main>
      <Chatbot />
    </div>
  );
}
