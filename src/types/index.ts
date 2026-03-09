export interface DocumentChunk {
  id: string;
  content: string;
  metadata: {
    source_url: string;
    article_title: string;
    chunk_index: number;
  };
  embedding?: number[];
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
}

export interface Citation {
  article_title: string;
  source_url: string;
  excerpt: string;
}

export interface ChatRequest {
  message: string;
  history: ChatMessage[];
}

export interface ChatResponse {
  answer: string;
  citations: Citation[];
  in_scope: boolean;
}
