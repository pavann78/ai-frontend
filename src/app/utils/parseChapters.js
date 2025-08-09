import { markdownToHtml } from "./markdownToHtml";

export const parseChapters = (chapters) => {
    const sidebarData = [];
    const contentMap = {};

    Object.entries(chapters).forEach(([key, markdownContent]) => {
        const titleMatch = markdownContent.match(
            /^#\s*(Chapter\s*\d+:\s*.*?)\s*$/m
        );
        let title = titleMatch ? titleMatch[1].trim() : key;

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
