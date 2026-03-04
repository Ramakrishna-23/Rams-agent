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

export const READING_STATUSES = ["unread", "read", "favorite", "archived"] as const;
export const ACTION_STATUSES = ["about_to_do", "lets_do", "doing", "done", "archive"] as const;

export type ReadingStatus = (typeof READING_STATUSES)[number];
export type ActionStatus = (typeof ACTION_STATUSES)[number];

export function isReadingResource(resource: Resource): boolean {
  return (READING_STATUSES as readonly string[]).includes(resource.status);
}

export function isActionResource(resource: Resource): boolean {
  return (ACTION_STATUSES as readonly string[]).includes(resource.status);
}
