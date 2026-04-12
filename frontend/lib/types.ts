export interface Tag {
  id: string;
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

export interface Comment {
  id: string;
  resource_id: string;
  content: string;
  created_at: string;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  resource_count: number;
  done_count: number;
  total_seconds: number;
  created_at: string;
  updated_at: string;
}

export interface TimeSession {
  id: string;
  project_id: string;
  duration_seconds: number;
  started_at: string;
  ended_at: string;
  created_at: string;
}

export interface TimeSessionsResponse {
  sessions: TimeSession[];
  total_seconds: number;
}

export interface Note {
  id: string;
  title: string;
  content: string | null;
  tags: Tag[];
  created_at: string;
  updated_at: string;
}

export interface Book {
  id: string;
  title: string;
  author: string | null;
  cover_url: string | null;
  isbn: string | null;
  genre: string | null;
  status: "want_to_read" | "reading" | "finished";
  total_chapters: number | null;
  current_chapter: number | null;
  rating: number | null;
  notes: string | null;
  tags: Tag[];
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectWithResources extends Project {
  resources: Resource[];
}

export interface Resource {
  id: string;
  url: string | null;
  title: string;
  summary: string;
  notes: string;
  status: string;
  tags: Tag[];
  subtasks: Subtask[];
  comments: Comment[];
  review_count: number;
  next_review_at: string | null;
  due_at: string | null;
  priority: number | null;
  recurrence_rule: string | null;
  project_id: string | null;
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
  resource_ids: string[];
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
  id: string;
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

// ── Mental Models ────────────────────────────────────────────────────────────

export interface PracticeSession {
  id: string;
  model_slug: string;
  scenario_type: string;
  user_response: string | null;
  logged: boolean;
  created_at: string;
}

export interface DecisionLog {
  id: string;
  practice_session_id: string | null;
  model_slugs: string[];
  entry_type: string;
  domain: string | null;
  summary: string | null;
  verdict: string | null;
  note: string | null;
  tags: string[];
  revisit_at: string | null;
  outcome: string | null;
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  current_streak: number;
  best_streak: number;
  total_sessions: number;
  models_used: number;
  decisions_logged: number;
  revisits_due: number;
  sessions_by_date: Record<string, number>;
  model_usage: Record<string, number>;
}

export interface MentalModelRealExample {
  type: "business" | "personal" | "historical";
  title: string;
  description: string;
}

export interface MentalModelScenario {
  prompt: string;
  question: string;
  insight: string;
  category: "business" | "personal" | "historical";
}

export interface MentalModelRelatedRef {
  slug: string;
  type: "combines_with" | "contrasts_with" | "prerequisite_for";
}

export interface MentalModelRecord {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  author: string;
  era: string;
  source_book: string;
  theory: string;
  metaphor: string;
  key_question: string;
  field: string[];
  domain: string[];
  real_examples: MentalModelRealExample[];
  self_check_questions: string[];
  related_models: MentalModelRelatedRef[];
  scenarios: MentalModelScenario[];
  created_at: string;
  updated_at: string;
}

export type MentalModelCreateInput = Omit<
  MentalModelRecord,
  "id" | "created_at" | "updated_at"
>;

