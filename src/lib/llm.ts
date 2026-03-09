import OpenAI from "openai";
import { ChatMessage, ChatResponse, Citation, DocumentChunk } from "@/types";
import { RAG_CONFIG } from "../../rag.config";

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENROUTER_API_KEY
    ? "https://openrouter.ai/api/v1"
    : "https://api.openai.com/v1",
});

export async function generateAnswer(
  query: string,
  chunks: DocumentChunk[],
  history: ChatMessage[]
): Promise<ChatResponse> {
  if (chunks.length === 0) {
    return {
      answer: RAG_CONFIG.outOfScopeMessage,
      citations: [],
      in_scope: false,
    };
  }

  const context = chunks
    .map(
      (c, i) =>
        `[Article ${i + 1}: "${c.metadata.article_title}" — ${c.metadata.source_url}]\n${c.content}`
    )
    .join("\n\n");

  const systemMessage = `${RAG_CONFIG.systemPrompt}\n\nCONTEXT FROM HELP ARTICLES:\n${context}`;

  const messages: OpenAI.ChatCompletionMessageParam[] = [
    { role: "system", content: systemMessage },
    ...history.slice(-6).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user", content: query },
  ];

  const completion = await openai.chat.completions.create({
    model: RAG_CONFIG.llm.model,
    messages,
    temperature: RAG_CONFIG.llm.temperature,
    max_tokens: RAG_CONFIG.llm.maxTokens,
  });

  const answer = completion.choices[0].message.content || "";

  // Extract citations from the chunks used
  const uniqueArticles = new Map<string, Citation>();
  for (const chunk of chunks) {
    if (!uniqueArticles.has(chunk.metadata.source_url)) {
      uniqueArticles.set(chunk.metadata.source_url, {
        article_title: chunk.metadata.article_title,
        source_url: chunk.metadata.source_url,
        excerpt: chunk.content.slice(0, 150) + "...",
      });
    }
  }

  return {
    answer,
    citations: Array.from(uniqueArticles.values()),
    in_scope: true,
  };
}
