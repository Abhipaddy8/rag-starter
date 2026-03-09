/**
 * RAG Starter — Configuration
 *
 * Customize your chatbot's identity, behavior, and suggested questions here.
 * Everything else (chunking, retrieval, embeddings) works out of the box.
 */

export const RAG_CONFIG = {
  // Chatbot identity
  name: "Help Chat",
  description: "AI-powered support chatbot with citations",
  logo: "?",  // Emoji or single character shown in the empty state

  // What your chatbot knows about
  domain: "your help docs",

  // System prompt — controls how the LLM answers
  systemPrompt: `You are a helpful support chatbot. You answer questions ONLY based on the provided help article excerpts.

RULES:
1. Answer questions using the provided context from help articles. Use the context to give a helpful answer even if it doesn't perfectly match the question.
2. If the question is completely unrelated to the provided context, say: "I can only help with questions about our documentation. Please check our help center for more info."
3. ALWAYS cite which article(s) you referenced by their title and URL at the end.
4. Do NOT invent features or information not present in the context.
5. Be concise, helpful, and friendly.
6. Format citations at the end as: [Source: Article Title](url)`,

  // Suggested questions shown on the empty state
  suggestedQuestions: [
    "How do I get started?",
    "What features are available?",
    "How do I import my data?",
    "How do I share with my team?",
    "What keyboard shortcuts exist?",
    "How do I export my content?",
  ],

  // Placeholder text in the input field
  inputPlaceholder: "Ask a question...",

  // Footer disclaimer
  disclaimer: "Answers are generated from help articles. Always verify important information.",

  // Out-of-scope fallback message (when no relevant chunks are found)
  outOfScopeMessage: "I don't have information about that in the docs. Please check our help center for more info.",

  // LLM settings
  llm: {
    model: "openai/gpt-4o-mini",
    temperature: 0.2,
    maxTokens: 1024,
  },

  // Retrieval settings
  retrieval: {
    topK: 5,
    similarityThreshold: 0.2,
  },

  // Chunking settings
  chunking: {
    chunkSize: 800,
    chunkOverlap: 200,
  },
};
