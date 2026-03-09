# Architecture
**Project**: notion-rag
**Language**: TypeScript
**Framework**: Next.js (App Router)
**Database**: Supabase (Postgres + pgvector)
**LLM**: OpenAI GPT-4o-mini
**Embeddings**: OpenAI text-embedding-3-small (1536 dims)
**Complexity**: moderate

## Features
- RAG-based support chatbot with citation and scope enforcement
- Document ingestion with chunking (800 chars, 200 overlap)
- Vector similarity search via pgvector
- Scope guardrail — refuses to answer outside help docs
- Citations with article title, URL, and excerpt

## Pipeline
```
Document Ingestion → Chunking → Embedding (text-embedding-3-small)
→ Vector Store (Supabase pgvector) → Retrieval (cosine similarity, top 5)
→ LLM with Citations (GPT-4o-mini) → Scope Guardrail
```

## Key Files
- `src/lib/chunker.ts` — Document chunking (800 char chunks, 200 overlap)
- `src/lib/embeddings.ts` — OpenAI embedding generation
- `src/lib/retriever.ts` — Vector similarity search via Supabase RPC
- `src/lib/llm.ts` — LLM answer generation with citations + scope guard
- `src/lib/supabase.ts` — Supabase client
- `src/app/api/chat/route.ts` — Chat endpoint
- `src/app/api/ingest/route.ts` — Document ingestion endpoint
- `scripts/setup-supabase.sql` — Database schema + match function
- `src/types/index.ts` — Shared TypeScript types
