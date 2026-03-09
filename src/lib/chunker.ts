import { DocumentChunk } from "@/types";
import { v4 as uuidv4 } from "uuid";
import { RAG_CONFIG } from "../../rag.config";

export function chunkDocument(
  content: string,
  metadata: { source_url: string; article_title: string }
): Omit<DocumentChunk, "embedding">[] {
  const { chunkSize, chunkOverlap } = RAG_CONFIG.chunking;
  const sentences = content.split(/(?<=[.!?])\s+/);
  const chunks: Omit<DocumentChunk, "embedding">[] = [];
  let currentChunk = "";
  let chunkIndex = 0;

  for (const sentence of sentences) {
    if (
      currentChunk.length + sentence.length > chunkSize &&
      currentChunk.length > 0
    ) {
      chunks.push({
        id: uuidv4(),
        content: currentChunk.trim(),
        metadata: { ...metadata, chunk_index: chunkIndex },
      });
      const words = currentChunk.split(" ");
      const overlapWords = words.slice(
        -Math.ceil((chunkOverlap / currentChunk.length) * words.length)
      );
      currentChunk = overlapWords.join(" ") + " " + sentence;
      chunkIndex++;
    } else {
      currentChunk += (currentChunk ? " " : "") + sentence;
    }
  }

  if (currentChunk.trim()) {
    chunks.push({
      id: uuidv4(),
      content: currentChunk.trim(),
      metadata: { ...metadata, chunk_index: chunkIndex },
    });
  }

  return chunks;
}
