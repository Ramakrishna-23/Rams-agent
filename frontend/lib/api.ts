import { Resource, ResourceList, Tag, ChatSession, ChatMessage, SearchResult, DigestItem, Subtask, Project, ProjectWithResources, Comment, Note, Book, TimeSession, TimeSessionsResponse } from "./types";

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

  async createResource(url: string | null, title?: string, notes?: string): Promise<Resource> {
    return this.request<Resource>("/api/resources", {
      method: "POST",
      body: JSON.stringify({ url: url || null, title, notes }),
    });
  }

  async createAction(url: string | null, title?: string, notes?: string): Promise<Resource> {
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

  // Tags
  async getTags(): Promise<Tag[]> {
    return this.request<Tag[]>("/api/tags");
  }

  async updateResourceTags(id: number, tagNames: string[]): Promise<Resource> {
    return this.request<Resource>(`/api/resources/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ tags: tagNames }),
    });
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
  async getDigest(): Promise<Resource[]> {
    return this.request<Resource[]>("/api/digest");
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

  // Subtasks
  async createSubtask(resourceId: number, title: string, sortOrder = 0): Promise<Subtask> {
    return this.request<Subtask>(`/api/resources/${resourceId}/subtasks`, {
      method: "POST",
      body: JSON.stringify({ title, sort_order: sortOrder }),
    });
  }

  async updateSubtask(id: string, data: Partial<Pick<Subtask, "title" | "is_done" | "sort_order">>): Promise<Subtask> {
    return this.request<Subtask>(`/api/subtasks/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteSubtask(id: string): Promise<void> {
    await this.request<void>(`/api/subtasks/${id}`, { method: "DELETE" });
  }

  // Projects
  async getProjects(): Promise<Project[]> {
    return this.request<Project[]>("/api/projects");
  }

  async getProject(id: string): Promise<ProjectWithResources> {
    return this.request<ProjectWithResources>(`/api/projects/${id}`);
  }

  async createProject(data: { name: string; description?: string; color?: string }): Promise<Project> {
    return this.request<Project>("/api/projects", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateProject(id: string, data: Partial<Pick<Project, "name" | "description" | "color">>): Promise<Project> {
    return this.request<Project>(`/api/projects/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteProject(id: string): Promise<void> {
    await this.request<void>(`/api/projects/${id}`, { method: "DELETE" });
  }

  // Comments
  async getComments(resourceId: string): Promise<Comment[]> {
    return this.request<Comment[]>(`/api/resources/${resourceId}/comments`);
  }

  async createComment(resourceId: string | number, content: string): Promise<Comment> {
    return this.request<Comment>(`/api/resources/${resourceId}/comments`, {
      method: "POST",
      body: JSON.stringify({ content }),
    });
  }

  async deleteComment(commentId: string): Promise<void> {
    await this.request<void>(`/api/comments/${commentId}`, { method: "DELETE" });
  }

  // Notes
  async getNotes(tag?: string): Promise<Note[]> {
    const params = new URLSearchParams();
    if (tag) params.set("tag", tag);
    const qs = params.toString();
    return this.request<Note[]>(`/api/notes${qs ? `?${qs}` : ""}`);
  }

  async getNote(id: string): Promise<Note> {
    return this.request<Note>(`/api/notes/${id}`);
  }

  async createNote(data: { title?: string; content?: string; tag_names?: string[] }): Promise<Note> {
    return this.request<Note>("/api/notes", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateNote(id: string, data: { title?: string; content?: string; tag_names?: string[] }): Promise<Note> {
    return this.request<Note>(`/api/notes/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteNote(id: string): Promise<void> {
    await this.request<void>(`/api/notes/${id}`, { method: "DELETE" });
  }

  // Books
  async getBooks(status?: string, tag?: string): Promise<Book[]> {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (tag) params.set("tag", tag);
    const qs = params.toString();
    return this.request<Book[]>(`/api/books${qs ? `?${qs}` : ""}`);
  }

  async getBook(id: string): Promise<Book> {
    return this.request<Book>(`/api/books/${id}`);
  }

  async createBook(data: Partial<Book> & { title: string; tag_names?: string[] }): Promise<Book> {
    return this.request<Book>("/api/books", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateBook(id: string, data: Partial<Book> & { tag_names?: string[] }): Promise<Book> {
    return this.request<Book>(`/api/books/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteBook(id: string): Promise<void> {
    await this.request<void>(`/api/books/${id}`, { method: "DELETE" });
  }

  async lookupBook(url: string): Promise<{ title?: string; author?: string; cover_url?: string; isbn?: string; description?: string }> {
    return this.request(`/api/books/lookup?url=${encodeURIComponent(url)}`);
  }

  // Time sessions
  async logTimeSession(
    projectId: string,
    data: { duration_seconds: number; started_at: string; ended_at: string }
  ): Promise<TimeSession> {
    return this.request<TimeSession>(`/api/projects/${projectId}/time-sessions`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getTimeSessions(projectId: string): Promise<TimeSessionsResponse> {
    return this.request<TimeSessionsResponse>(`/api/projects/${projectId}/time-sessions`);
  }

  // Push notifications
  async subscribePush(subscription: { endpoint: string; p256dh_key: string; auth_key: string }): Promise<void> {
    await this.request<void>("/api/push/subscribe", {
      method: "POST",
      body: JSON.stringify(subscription),
    });
  }

  async unsubscribePush(endpoint: string): Promise<void> {
    await this.request<void>("/api/push/unsubscribe", {
      method: "POST",
      body: JSON.stringify({ endpoint, p256dh_key: "", auth_key: "" }),
    });
  }

  async getVapidPublicKey(): Promise<string> {
    const res = await this.request<{ public_key: string }>("/api/push/vapid-public-key");
    return res.public_key;
  }

  // Voice
  async voiceStream(message: string, sessionId?: string): Promise<Response> {
    const body: Record<string, string> = { message };
    if (sessionId) body.session_id = sessionId;

    const res = await fetch(`${this.baseUrl}/api/voice/stream`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Voice error ${res.status}: ${text}`);
    }

    return res;
  }

  async clearVoiceSession(sessionId: string): Promise<void> {
    await this.request<void>(`/api/voice/sessions/${sessionId}`, { method: "DELETE" });
  }
}

export const api = new ApiClient();
export default ApiClient;
