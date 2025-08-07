export async function POST(req) {
    try {
        const body = await req.json();
        const { repo_url } = body;
        if (!repo_url) {
            return new Response("Missing repo_url", { status: 400 });
        }

        const res = await fetch("https://ai-backend-p6sz.onrender.com/tutorial/generate-stream", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ repo_url }),
        });

        if (!res.ok) {
            return new Response("Failed to fetch stream from backend", {
                status: res.status,
            });
        }
        return new Response(res.body, {
            headers: { "Content-Type": "text/plain" },
        });
    } catch (err) {
        return new Response("Internal server error", { status: 500 });
    }
}
