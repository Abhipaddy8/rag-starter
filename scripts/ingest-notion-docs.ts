/**
 * Notion Help Docs Ingestion Script
 *
 * Crawls Notion help articles from their sitemap, chunks them,
 * generates embeddings, and stores in Supabase pgvector.
 *
 * Usage: npx tsx scripts/ingest-notion-docs.ts
 *
 * Requires .env.local with:
 *   OPENROUTER_API_KEY
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import * as cheerio from "cheerio";
import { v4 as uuidv4 } from "uuid";
import * as fs from "fs";
import * as path from "path";

// Load env
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    process.env[key] = val;
  }
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

const CHUNK_SIZE = 800;
const CHUNK_OVERLAP = 200;
const EMBEDDING_MODEL = "openai/text-embedding-3-small";
const BATCH_SIZE = 20;

// Known Notion help article URLs — a curated starter set.
// In production, you'd crawl notion.so/help/sitemap.xml for all 2000+ articles.
const NOTION_HELP_URLS = [
  "https://www.notion.so/help/what-is-notion",
  "https://www.notion.so/help/navigate-notion",
  "https://www.notion.so/help/create-your-first-page",
  "https://www.notion.so/help/writing-and-editing-basics",
  "https://www.notion.so/help/what-is-a-block",
  "https://www.notion.so/help/what-is-a-database",
  "https://www.notion.so/help/intro-to-databases",
  "https://www.notion.so/help/database-properties",
  "https://www.notion.so/help/views-filters-and-sorts",
  "https://www.notion.so/help/formulas",
  "https://www.notion.so/help/relations-and-rollups",
  "https://www.notion.so/help/sharing-and-permissions",
  "https://www.notion.so/help/teamspaces",
  "https://www.notion.so/help/guides/using-templates",
  "https://www.notion.so/help/keyboard-shortcuts",
  "https://www.notion.so/help/synced-blocks",
  "https://www.notion.so/help/import-data-into-notion",
  "https://www.notion.so/help/export-your-content",
  "https://www.notion.so/help/comments-and-discussions",
  "https://www.notion.so/help/notion-ai",
];

function chunkText(
  content: string,
  metadata: { source_url: string; article_title: string }
) {
  const sentences = content.split(/(?<=[.!?])\s+/);
  const chunks: { id: string; content: string; source_url: string; article_title: string; chunk_index: number }[] = [];
  let current = "";
  let idx = 0;

  for (const sentence of sentences) {
    if (current.length + sentence.length > CHUNK_SIZE && current.length > 0) {
      chunks.push({
        id: uuidv4(),
        content: current.trim(),
        source_url: metadata.source_url,
        article_title: metadata.article_title,
        chunk_index: idx,
      });
      const words = current.split(" ");
      const overlapWords = words.slice(
        -Math.ceil((CHUNK_OVERLAP / current.length) * words.length)
      );
      current = overlapWords.join(" ") + " " + sentence;
      idx++;
    } else {
      current += (current ? " " : "") + sentence;
    }
  }

  if (current.trim()) {
    chunks.push({
      id: uuidv4(),
      content: current.trim(),
      source_url: metadata.source_url,
      article_title: metadata.article_title,
      chunk_index: idx,
    });
  }

  return chunks;
}

async function fetchArticle(url: string): Promise<{ title: string; content: string } | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      },
    });
    if (!res.ok) {
      console.log(`  SKIP ${url} — ${res.status}`);
      return null;
    }
    const html = await res.text();
    const $ = cheerio.load(html);

    // Remove script, style, nav, footer
    $("script, style, nav, footer, header, [role='navigation']").remove();

    const title =
      $("h1").first().text().trim() ||
      $("title").text().trim() ||
      url.split("/").pop() ||
      "Untitled";

    // Get main article content
    const content =
      $("article").text().trim() ||
      $("main").text().trim() ||
      $("[role='main']").text().trim() ||
      $("body").text().trim();

    // Clean up whitespace
    const cleaned = content.replace(/\s+/g, " ").trim();

    if (cleaned.length < 50) {
      console.log(`  SKIP ${url} — too short (${cleaned.length} chars)`);
      return null;
    }

    return { title, content: cleaned };
  } catch (err: any) {
    console.log(`  ERROR ${url} — ${err.message}`);
    return null;
  }
}

async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const res = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: texts,
    dimensions: 1536,
  });
  return res.data.map((d) => d.embedding);
}

async function main() {
  console.log("=== Notion Help Docs Ingestion ===\n");
  console.log(`Processing ${NOTION_HELP_URLS.length} articles...\n`);

  let totalChunks = 0;
  let articlesProcessed = 0;

  for (const url of NOTION_HELP_URLS) {
    console.log(`[${articlesProcessed + 1}/${NOTION_HELP_URLS.length}] ${url}`);

    const article = await fetchArticle(url);
    if (!article) continue;

    console.log(`  Title: "${article.title}" (${article.content.length} chars)`);

    const chunks = chunkText(article.content, {
      source_url: url,
      article_title: article.title,
    });

    console.log(`  Chunks: ${chunks.length}`);

    // Embed and insert in batches
    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, i + BATCH_SIZE);
      const embeddings = await generateEmbeddings(batch.map((c) => c.content));

      const rows = batch.map((chunk, idx) => ({
        id: chunk.id,
        content: chunk.content,
        source_url: chunk.source_url,
        article_title: chunk.article_title,
        chunk_index: chunk.chunk_index,
        embedding: embeddings[idx],
      }));

      const { error } = await supabase.from("documents").insert(rows);
      if (error) {
        console.error(`  INSERT ERROR: ${error.message}`);
        continue;
      }

      totalChunks += batch.length;
    }

    articlesProcessed++;

    // Small delay to be respectful
    await new Promise((r) => setTimeout(r, 500));
  }

  console.log(`\n=== Done ===`);
  console.log(`Articles processed: ${articlesProcessed}`);
  console.log(`Total chunks stored: ${totalChunks}`);
}

main().catch(console.error);
