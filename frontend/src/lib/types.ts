export interface Tag {
  id: number;
  name: string;
}

export interface Resource {
  id: number;
  url: string;
  title: string;
  summary: string;
  notes: string;
  status: string;
  tags: Tag[];
  review_count: number;
  next_review_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChatSession {
  id: string;
  title: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  resource_ids: number[];
  created_at: string;
}

export interface ResourceList {
  items: Resource[];
  total: number;
  page: number;
  page_size: number;
}

export interface DigestItem {
  resource: Resource;
  reason: string;
}

export interface SearchResult {
  id: number;
  title: string;
  url: string;
  summary: string;
  score: number;
}
