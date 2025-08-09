"use client";

import React, { useState, useEffect, useRef } from "react";
import Chatbot from "../components/Chatbot";
import Sidebar from "../components/Sidebar";
import { parseChapters } from "../utils/parseChapters";
import mermaid from "mermaid";

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
            const { svg } = await mermaid.render(
              `mermaid-diagram-${Math.random().toString(36).substring(2, 9)}`,
              mermaidCode
            );
            div.innerHTML = svg;
          } catch (error) {
            console.error("Mermaid rendering error:", error);
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
    <div className="flex h-screen bg-gray-50 font-sans text-gray-900 overflow-hidden">
      <Sidebar
        sidebarData={sidebarData}
        activeId={activeId}
        setActiveId={setActiveId}
      />
      <main
        ref={mainContentRef}
        className="flex-1 p-8 bg-white text-gray-900 shadow-lg rounded-lg m-4 ml-0 overflow-y-auto"
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