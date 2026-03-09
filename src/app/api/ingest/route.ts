import { NextRequest, NextResponse } from "next/server";
import { chunkDocument } from "@/lib/chunker";
import { generateEmbeddings } from "@/lib/embeddings";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const { documents } = await request.json();

    if (!Array.isArray(documents) || documents.length === 0) {
      return NextResponse.json(
        { error: "documents array is required" },
        { status: 400 }
      );
    }

    let totalChunks = 0;

    for (const doc of documents) {
      const { content, source_url, article_title } = doc;

      if (!content || !source_url || !article_title) {
        continue;
      }

      // Chunk the document
      const chunks = chunkDocument(content, { source_url, article_title });

      // Generate embeddings in batches
      const batchSize = 20;
      for (let i = 0; i < chunks.length; i += batchSize) {
        const batch = chunks.slice(i, i + batchSize);
        const embeddings = await generateEmbeddings(
          batch.map((c) => c.content)
        );

        const rows = batch.map((chunk, idx) => ({
          id: chunk.id,
          content: chunk.content,
          source_url: chunk.metadata.source_url,
          article_title: chunk.metadata.article_title,
          chunk_index: chunk.metadata.chunk_index,
          embedding: embeddings[idx],
        }));

        const { error } = await supabase.from("documents").insert(rows);
        if (error) throw new Error(`Insert error: ${error.message}`);

        totalChunks += batch.length;
      }
    }

    return NextResponse.json({
      success: true,
      chunks_created: totalChunks,
    });
  } catch (error: any) {
    console.error("Ingest API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
