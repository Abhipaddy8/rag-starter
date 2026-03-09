import { supabase } from "./supabase";
import { generateEmbedding } from "./embeddings";
import { DocumentChunk } from "@/types";
import { RAG_CONFIG } from "../../rag.config";

export async function retrieveRelevantChunks(
  query: string
): Promise<DocumentChunk[]> {
  const queryEmbedding = await generateEmbedding(query);

  const { data, error } = await supabase.rpc("match_documents", {
    query_embedding: JSON.stringify(queryEmbedding),
    match_threshold: RAG_CONFIG.retrieval.similarityThreshold,
    match_count: RAG_CONFIG.retrieval.topK,
  });

  if (error) {
    console.error("Retrieval error:", error);
    throw new Error(`Retrieval error: ${error.message}`);
  }

  console.log(`Retrieved ${data?.length || 0} chunks for query: "${query}"`);

  return (data || []).map((row: any) => ({
    id: row.id,
    content: row.content,
    metadata: {
      source_url: row.source_url,
      article_title: row.article_title,
      chunk_index: row.chunk_index,
    },
  }));
}
