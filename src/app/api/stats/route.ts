import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const { count: totalChunks } = await supabase
      .from("documents")
      .select("*", { count: "exact", head: true });

    const { data: articles } = await supabase
      .from("documents")
      .select("article_title")
      .limit(1000);

    const uniqueArticles = new Set(
      articles?.map((a) => a.article_title) || []
    );

    return NextResponse.json({
      status: "healthy",
      total_chunks: totalChunks || 0,
      total_articles: uniqueArticles.size,
      articles: Array.from(uniqueArticles).sort(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: "error", error: error.message },
      { status: 500 }
    );
  }
}
