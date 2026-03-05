import { Resource, ResourceList, ChatSession, ChatMessage, SearchResult, DigestItem } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || "";

class ApiClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(apiUrl?: string, apiKey?: string) {
    this.baseUrl = apiUrl || API_URL;
    this.apiKey = apiKey || API_KEY;
  }

  private headers(): HeadersInit {
    const h: HeadersInit = {
      "Content-Type": "application/json",
    };
    if (this.apiKey) {
      h["X-API-Key"] = this.apiKey;
    }
    return h;
  }

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        ...this.headers(),
        ...options?.headers,
      },
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`API error ${res.status}: ${text}`);
    }
    return res.json();
  }

  // Resources
  async getResources(page = 1, status?: string, tag?: string): Promise<ResourceList> {
    const params = new URLSearchParams({ page: String(page), page_size: "12" });
    if (status) params.set("status", status);
    if (tag) params.set("tag", tag);
    return this.request<ResourceList>(`/api/resources?${params}`);
  }

  async getResource(id: number): Promise<Resource> {
    return this.request<Resource>(`/api/resources/${id}`);
  }

  async createResource(url: string, title?: string, notes?: string): Promise<Resource> {
    return this.request<Resource>("/api/resources", {
      method: "POST",
      body: JSON.stringify({ url, title, notes }),
    });
  }

  async createAction(url: string, title?: string, notes?: string): Promise<Resource> {
    const resource = await this.createResource(url, title, notes);
    return this.updateResource(resource.id, { status: "about_to_do" });
  }

  async updateResource(id: number, data: Partial<Resource>): Promise<Resource> {
    return this.request<Resource>(`/api/resources/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteResource(id: number): Promise<void> {
    await this.request<void>(`/api/resources/${id}`, { method: "DELETE" });
  }

  async reviewResource(id: number): Promise<Resource> {
    return this.request<Resource>(`/api/resources/${id}/review`, { method: "POST" });
  }

  // Search
  async search(query: string, type?: string): Promise<SearchResult[]> {
    const params = new URLSearchParams({ q: query });
    if (type) params.set("type", type);
    return this.request<SearchResult[]>(`/api/search?${params}`);
  }

  // Chat
  async chatStream(message: string, sessionId?: string): Promise<Response> {
    const body: Record<string, string> = { message };
    if (sessionId) body.session_id = sessionId;

    const res = await fetch(`${this.baseUrl}/api/chat`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Chat error ${res.status}: ${text}`);
    }

    return res;
  }

  async getChatSessions(): Promise<ChatSession[]> {
    return this.request<ChatSession[]>("/api/chat/sessions");
  }

  async getChatSession(id: string): Promise<{ session: ChatSession; messages: ChatMessage[] }> {
    return this.request<{ session: ChatSession; messages: ChatMessage[] }>(`/api/chat/sessions/${id}`);
  }

  // Digest
  async getDigest(): Promise<DigestItem[]> {
    return this.request<DigestItem[]>("/api/digest");
  }

  // Reminders
  async createReminder(resourceId: number, remindAt: string): Promise<{ id: number }> {
    return this.request<{ id: number }>("/api/reminders", {
      method: "POST",
      body: JSON.stringify({ resource_id: resourceId, remind_at: remindAt }),
    });
  }

  async deleteReminder(id: number): Promise<void> {
    await this.request<void>(`/api/reminders/${id}`, { method: "DELETE" });
  }
}

export const api = new ApiClient();
export default ApiClient;
