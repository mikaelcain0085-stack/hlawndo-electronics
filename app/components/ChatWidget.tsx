"use client";

import { FormEvent, useState } from "react";

type ChatTurn = {
  role: "user" | "ai";
  text: string;
};

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);

  const openChat = () => {
    setIsOpen(true);
    if (messages.length === 0) {
      setMessages([
        {
          role: "ai",
          text: "Hi! I'm the Hlawndo Electronics assistant. Ask me about laptops, phones, audio gear, TVs, or chargers.",
        },
      ]);
    }
  };

  const sendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const text = input.trim();
    if (!text || isSending) return;

    const nextMessages: ChatTurn[] = [...messages, { role: "user", text }];
    setMessages(nextMessages);
    setInput("");
    setIsSending(true);

    try {
      const res = await fetch("/api/gemini-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history: nextMessages }),
      });

      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          { role: "ai", text: "Sorry, something went wrong. Please try again." },
        ]);
        return;
      }

      const data = await res.json();
      setMessages((prev) => [...prev, { role: "ai", text: data.reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "ai", text: "Sorry, I couldn't connect. Please check your connection and try again." },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      {/* LAUNCHER */}
      <button
        type="button"
        onClick={openChat}
        aria-label="Open chat"
        className={`fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#e9a33f] text-2xl text-black shadow-2xl transition hover:bg-[#ffd078] ${
          isOpen ? "hidden" : "flex"
        }`}
      >
        💬
      </button>

      {/* PANEL */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-40 flex h-[520px] max-h-[calc(100vh-100px)] w-[350px] max-w-[calc(100vw-32px)] flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#0d141d] shadow-2xl">
          {/* HEADER */}
          <div className="flex items-center justify-between border-b border-white/10 bg-[#080d14] px-5 py-4">
            <div>
              <p className="text-xs tracking-[0.2em] text-[#e9a33f]">
                HLAWNDO ELECTRONICS
              </p>
              <p className="mt-1 text-sm font-bold text-white">Chat with us</p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
              className="text-gray-500 transition hover:text-[#e9a33f]"
            >
              ✕
            </button>
          </div>

          {/* MESSAGES */}
          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "rounded-br-sm bg-[#e9a33f] text-black"
                      : "rounded-bl-sm border border-white/10 bg-[#151d27] text-gray-200"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {isSending && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-sm border border-white/10 bg-[#151d27] px-4 py-2.5 text-sm text-gray-500">
                  Typing...
                </div>
              </div>
            )}
          </div>

          {/* INPUT */}
          <form
            onSubmit={sendMessage}
            className="flex gap-2 border-t border-white/10 bg-[#080d14] p-3"
          >
            <input
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Type a message..."
              disabled={isSending}
              className="flex-1 rounded-full border border-white/10 bg-[#0d141d] px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-[#e9a33f] disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={isSending}
              aria-label="Send message"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e9a33f] text-black transition hover:bg-[#ffd078] disabled:cursor-not-allowed disabled:opacity-60"
            >
              ➤
            </button>
          </form>
        </div>
      )}
    </>
  );
}
