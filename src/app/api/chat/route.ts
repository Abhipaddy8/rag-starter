import { NextRequest, NextResponse } from "next/server";
import { retrieveRelevantChunks } from "@/lib/retriever";
import { generateAnswer } from "@/lib/llm";
import { ChatRequest } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { message, history } = body;

    if (!message?.trim()) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Retrieve relevant chunks from vector store
    const chunks = await retrieveRelevantChunks(message);

    // Generate answer with citations and scope enforcement
    const response = await generateAnswer(message, chunks, history || []);

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
