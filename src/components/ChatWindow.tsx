"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ChatMessage, Citation } from "@/types";
import { RAG_CONFIG } from "../../rag.config";

export default function ChatWindow() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || loading) return;

      setError(null);
      const userMessage: ChatMessage = { role: "user", content: text };
      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setLoading(true);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            history: messages,
          }),
        });

        if (!res.ok) {
          throw new Error(`Server error (${res.status})`);
        }

        const data = await res.json();

        if (data.error) {
          throw new Error(data.error);
        }

        const assistantMessage: ChatMessage = {
          role: "assistant",
          content: data.answer,
          citations: data.citations,
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } catch (err: any) {
        setError(err.message || "Something went wrong");
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "Sorry, something went wrong. Please try again.",
          },
        ]);
      } finally {
        setLoading(false);
        inputRef.current?.focus();
      }
    },
    [loading, messages]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  function clearChat() {
    setMessages([]);
    setError(null);
    inputRef.current?.focus();
  }

  return (
    <div className="flex flex-col h-screen max-w-3xl mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 px-4 py-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">
            {RAG_CONFIG.name}
          </h1>
          <p className="text-xs text-neutral-500">
            {RAG_CONFIG.description}
          </p>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearChat}
            className="text-xs text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors px-3 py-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            Clear chat
          </button>
        )}
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-6">
            <div className="text-center">
              <div className="text-4xl mb-3">{RAG_CONFIG.logo}</div>
              <p className="text-lg font-medium mb-1">
                {RAG_CONFIG.name}
              </p>
              <p className="text-sm text-neutral-500 max-w-sm">
                Ask anything about {RAG_CONFIG.domain}. Answers are sourced
                directly from your docs with citations.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 w-full max-w-md">
              {RAG_CONFIG.suggestedQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(q)}
                  className="text-left text-xs px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors text-neutral-600 dark:text-neutral-400"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                msg.role === "user"
                  ? "bg-black text-white dark:bg-white dark:text-black"
                  : "bg-neutral-100 dark:bg-neutral-800"
              }`}
            >
              <p className="whitespace-pre-wrap text-sm leading-relaxed">
                {msg.content}
              </p>

              {msg.citations && msg.citations.length > 0 && (
                <div className="mt-3 pt-2 border-t border-neutral-300/50 dark:border-neutral-600/50">
                  <p className="text-[10px] uppercase tracking-wider font-medium text-neutral-500 mb-1.5">
                    Sources
                  </p>
                  {msg.citations.map((cite: Citation, j: number) => (
                    <a
                      key={j}
                      href={cite.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-blue-500 hover:text-blue-600 hover:underline mb-1"
                    >
                      <span className="inline-block w-1 h-1 rounded-full bg-blue-400 flex-shrink-0" />
                      {cite.article_title}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-neutral-100 dark:bg-neutral-800 rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex space-x-1">
                  <div className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" />
                  <div
                    className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.15s" }}
                  />
                  <div
                    className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.3s" }}
                  />
                </div>
                <span className="text-xs text-neutral-400">
                  Searching docs...
                </span>
              </div>
            </div>
          </div>
        )}

        {error && !loading && (
          <div className="text-center">
            <p className="text-xs text-red-500">{error}</p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="border-t border-neutral-200 dark:border-neutral-800 p-4"
      >
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={RAG_CONFIG.inputPlaceholder}
            className="flex-1 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-transparent px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
            disabled={loading}
            autoFocus
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="rounded-xl bg-black text-white dark:bg-white dark:text-black px-6 py-3 text-sm font-medium disabled:opacity-40 hover:opacity-80 transition-opacity"
          >
            {loading ? "..." : "Send"}
          </button>
        </div>
        <p className="text-[10px] text-neutral-400 mt-2 text-center">
          {RAG_CONFIG.disclaimer}
        </p>
      </form>
    </div>
  );
}
