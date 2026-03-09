-- Enable pgvector extension
create extension if not exists vector;

-- Documents table with embeddings
create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  source_url text not null,
  article_title text not null,
  chunk_index integer not null default 0,
  embedding vector(1536),
  created_at timestamptz default now()
);

-- HNSW index for accurate similarity search (works well at any dataset size)
create index if not exists documents_embedding_idx
  on documents
  using hnsw (embedding vector_cosine_ops);

-- Similarity search function
create or replace function match_documents(
  query_embedding vector(1536),
  match_threshold float default 0.2,
  match_count int default 5
)
returns table (
  id uuid,
  content text,
  source_url text,
  article_title text,
  chunk_index integer,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    d.id,
    d.content,
    d.source_url,
    d.article_title,
    d.chunk_index,
    1 - (d.embedding <=> query_embedding) as similarity
  from documents d
  where 1 - (d.embedding <=> query_embedding) > match_threshold
  order by d.embedding <=> query_embedding
  limit match_count;
end;
$$;
