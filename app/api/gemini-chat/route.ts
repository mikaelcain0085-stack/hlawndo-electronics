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
          systemInstruction: {
            parts: [
              {
                text:
                  "You are the helpful shopping assistant for Hlawndo Electronics, " +
                  "an electronics store selling laptops, smartphones, audio gear, TVs, " +
                  "and chargers/cables. Keep answers concise, friendly, and focused on " +
                  "helping the visitor find products or answer store questions. If you " +
                  "don't know something specific to this store (like live stock or an " +
                  "order status), say so and suggest contacting the store directly.",
              },
            ],
          },
          generationConfig: {
            maxOutputTokens: 512,
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
