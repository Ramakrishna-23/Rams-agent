import { getSettings } from "./storage";
import {
  Resource,
  ResourceList,
  ChatSession,
  ChatMessage,
  SearchResult,
  DigestItem,
} from "./types";

async function getConfig() {
  const { apiUrl, apiKey } = await getSettings();
  return { baseUrl: apiUrl.replace(/\/+$/, ""), apiKey };
}

function headers(apiKey: string): HeadersInit {
  const h: HeadersInit = { "Content-Type": "application/json" };
  if (apiKey) h["X-API-Key"] = apiKey;
  return h;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const { baseUrl, apiKey } = await getConfig();
  const res = await fetch(`${baseUrl}/api${path}`, {
    ...options,
    headers: { ...headers(apiKey), ...options?.headers },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json();
}

// Resources
export function getResources(
  page = 1,
  status?: string,
  tag?: string
): Promise<ResourceList> {
  const params = new URLSearchParams({ page: String(page), page_size: "20" });
  if (status) params.set("status", status);
  if (tag) params.set("tag", tag);
  return request<ResourceList>(`/resources?${params}`);
}

export function getResource(id: number): Promise<Resource> {
  return request<Resource>(`/resources/${id}`);
}

export function createResource(
  url: string,
  title?: string,
  notes?: string,
  selectedText?: string
): Promise<Resource> {
  return request<Resource>("/resources", {
    method: "POST",
    body: JSON.stringify({ url, title, notes, selected_text: selectedText }),
  });
}

export function updateResource(
  id: number,
  data: Partial<Resource>
): Promise<Resource> {
  return request<Resource>(`/resources/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function reviewResource(id: number): Promise<Resource> {
  return request<Resource>(`/resources/${id}/review`, { method: "POST" });
}

// Search
export function search(
  query: string,
  type?: string
): Promise<SearchResult[]> {
  const params = new URLSearchParams({ q: query });
  if (type) params.set("type", type);
  return request<SearchResult[]>(`/search?${params}`);
}

// Chat
export async function chatStream(
  message: string,
  sessionId?: string
): Promise<Response> {
  const { baseUrl, apiKey } = await getConfig();
  const body: Record<string, string> = { message };
  if (sessionId) body.session_id = sessionId;

  const res = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: headers(apiKey),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Chat error ${res.status}: ${text}`);
  }
  return res;
}

export function getChatSessions(): Promise<ChatSession[]> {
  return request<ChatSession[]>("/chat/sessions");
}

export function getChatSession(
  id: string
): Promise<{ session: ChatSession; messages: ChatMessage[] }> {
  return request<{ session: ChatSession; messages: ChatMessage[] }>(
    `/chat/sessions/${id}`
  );
}

// Digest
export function getDigest(): Promise<DigestItem[]> {
  return request<DigestItem[]>("/digest");
}
