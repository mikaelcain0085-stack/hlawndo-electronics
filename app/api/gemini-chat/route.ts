import { NextRequest, NextResponse } from "next/server";

// This route runs on the server only (Vercel function), never in the browser,
// so GEMINI_API_KEY is never exposed to visitors.

type ChatTurn = {
  role: "user" | "ai";
  text: string;
};

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error("GEMINI_API_KEY is not set");
    return NextResponse.json(
      { error: "Server is not configured" },
      { status: 500 }
    );
  }

  let body: { message?: string; history?: ChatTurn[] };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const { message, history } = body;

  if (!message || typeof message !== "string") {
    return NextResponse.json(
      { error: 'Missing "message" in request body' },
      { status: 400 }
    );
  }

  // Basic guardrails so one request can't run up your Gemini bill.
  const trimmedMessage = message.slice(0, 4000);
  const safeHistory = Array.isArray(history) ? history.slice(-10) : [];

  const contents = [
    ...safeHistory.map((turn) => ({
      role: turn.role === "ai" ? "model" : "user",
      parts: [{ text: String(turn.text).slice(0, 4000) }],
    })),
    { role: "user", parts: [{ text: trimmedMessage }] },
  ];

  try {
    const geminiRes = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents,
          generationConfig: {
            maxOutputTokens: 3000,
            temperature: 0.7,
          },
        }),
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error("Gemini API error:", geminiRes.status, errText);
      return NextResponse.json(
        { error: "Upstream AI request failed" },
        { status: 502 }
      );
    }

    const data = await geminiRes.json();
    const reply =
      data?.candidates?.[0]?.content?.parts?.map((p: { text: string }) => p.text).join("") ||
      "Sorry, I couldn't come up with a response to that.";

    return NextResponse.json({ reply });
  } catch (err) {
    console.error("Gemini proxy error:", err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
