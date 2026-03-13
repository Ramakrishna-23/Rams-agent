export interface Tag {
  id: number;
  name: string;
}

export interface Subtask {
  id: string;
  resource_id: string;
  title: string;
  is_done: boolean;
  sort_order: number;
  created_at: string;
}

export interface Resource {
  id: number;
  url: string | null;
  title: string;
  summary: string;
  notes: string;
  status: string;
  tags: Tag[];
  subtasks: Subtask[];
  review_count: number;
  next_review_at: string | null;
  due_at: string | null;
  priority: number | null;
  recurrence_rule: string | null;
  created_at: string;
  updated_at: string;
}

export const PRIORITY_LABELS: Record<number, string> = {
  1: "Urgent",
  2: "High",
  3: "Medium",
  4: "Low",
};

export const PRIORITY_COLORS: Record<number, string> = {
  1: "bg-red-500",
  2: "bg-orange-500",
  3: "bg-blue-500",
  4: "bg-gray-400",
};

export const RECURRENCE_OPTIONS = ["daily", "weekdays", "weekly", "monthly"] as const;

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

// Status domains
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

export function isInboxResource(resource: Resource): boolean {
  return resource.status === "inbox";
}
