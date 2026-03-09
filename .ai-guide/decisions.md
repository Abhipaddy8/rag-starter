# Decisions Log

### 2026-03-09 Decision: TypeScript + Next.js App Router / Reason: Modern full-stack framework with built-in API routes, matches project complexity needs

### 2026-03-09 Decision: Supabase pgvector for vector store / Reason: Native Postgres extension, no extra infra needed, Supabase already in stack

### 2026-03-09 Decision: text-embedding-3-small (1536 dims) / Reason: Best cost/performance ratio for help doc search, sufficient accuracy for support articles

### 2026-03-09 Decision: GPT-4o-mini for answer generation / Reason: Fast, cheap, sufficient quality for scoped Q&A with provided context

### 2026-03-09 Decision: 800 char chunks with 200 overlap / Reason: Balances context completeness vs retrieval precision for help articles

### 2026-03-09 Decision: Cosine similarity threshold 0.7, top 5 results / Reason: Filters irrelevant matches while providing enough context for accurate answers

### 2026-03-09 Decision: Scope enforcement in system prompt / Reason: Simpler than a separate classifier, effective for single-domain chatbot (Notion help only)

### 2026-03-09 Decision: OpenRouter instead of OpenAI direct / Reason: OpenAI API key was out of quota, OpenRouter provides same models via unified gateway

### 2026-03-09 Decision: HNSW index instead of IVFFlat / Reason: IVFFlat with lists=100 on 518 rows caused probe misses — Sharing article (0.67 similarity) was invisible. HNSW is accurate at any dataset size without tuning.

### 2026-03-09 Decision: Lowered similarity threshold to 0.2 / Reason: OpenRouter embeddings produce lower cosine similarities (0.3-0.7 range). 0.7 threshold returned zero results; 0.2 catches relevant matches while filtering noise.

### 2026-03-09 Decision: Git-tracked .env.local.example, excluded .env.local / Reason: Standard practice — template for env vars without exposing secrets

### 2026-03-09 Decision: rag.config.ts for all customization / Reason: Single file to configure chatbot identity, system prompt, suggested questions, LLM/retrieval/chunking settings — makes the repo fork-and-customize friendly

### 2026-03-09 Decision: Auto-detect OpenRouter vs OpenAI direct / Reason: Check OPENROUTER_API_KEY first, fall back to OPENAI_API_KEY. Users can use either provider without code changes.

### 2026-03-09 Decision: Position as "RAG Starter Kit" not "RAG Builder" / Reason: It's a fork-and-go template for developers, not a no-code platform. Comparable to create-t3-app positioning.
