"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { ChatSession, Resource } from "@/lib/types";
import { useChat } from "@/hooks/useChat";
import { ChatWindow } from "@/components/chat-window";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, MessageSquare, Inbox, Check, Loader2, ExternalLink } from "lucide-react";
import Link from "next/link";

function SaveMode() {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [recentItems, setRecentItems] = useState<Resource[]>([]);

  useEffect(() => {
    api.getResources(1, "inbox").then((data) => {
      setRecentItems(data.items.slice(0, 5));
    }).catch(() => {});
  }, [saved]);

  const handleSave = async () => {
    if (!url.trim()) {
      setError("URL is required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await api.createResource(url.trim(), title.trim() || undefined, notes.trim() || undefined);
      setSaved(true);
      setUrl("");
      setTitle("");
      setNotes("");
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="mx-auto flex w-full max-w-lg flex-col gap-4 p-4">
        <div className="flex flex-col gap-3">
          <Input
            type="url"
            placeholder="Paste URL..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSave()}
          />
          <Input
            type="text"
            placeholder="Title (optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Textarea
            placeholder="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : saved ? (
              <Check className="mr-2 size-4 text-green-500" />
            ) : (
              <Inbox className="mr-2 size-4" />
            )}
            {saving ? "Saving..." : saved ? "Saved!" : "Save to Inbox"}
          </Button>
        </div>

        {recentItems.length > 0 && (
          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Recent saves</span>
              <Link href="/inbox" className="text-xs text-muted-foreground hover:text-foreground">
                View all
              </Link>
            </div>
            <div className="space-y-1">
              {recentItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground"
                >
                  <ExternalLink className="size-3 shrink-0" />
                  <span className="truncate">{item.title || item.url}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ChatMode() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const { messages, streaming, sessionId, sendMessage, loadSession, clearMessages } =
    useChat();

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const data = await api.getChatSessions();
        setSessions(data);
      } catch (err) {
        console.error("Failed to fetch sessions:", err);
      } finally {
        setLoadingSessions(false);
      }
    };
    fetchSessions();
  }, []);

  useEffect(() => {
    if (sessionId && !sessions.find((s) => s.id === sessionId)) {
      setSessions((prev) => [
        { id: sessionId, title: "New Chat", created_at: new Date().toISOString() },
        ...prev,
      ]);
    }
  }, [sessionId, sessions]);

  const handleNewChat = () => {
    clearMessages();
  };

  return (
    <div className="flex h-full gap-4">
      {/* Sessions Sidebar */}
      <div className="hidden w-64 shrink-0 flex-col rounded-lg border md:flex">
        <div className="flex items-center justify-between border-b p-3">
          <span className="text-sm font-medium">Sessions</span>
          <Button variant="ghost" size="icon-sm" onClick={handleNewChat}>
            <Plus className="size-4" />
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {loadingSessions ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-md" />
              ))
            ) : sessions.length === 0 ? (
              <p className="px-2 py-4 text-center text-xs text-muted-foreground">
                No sessions yet
              </p>
            ) : (
              sessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => loadSession(session.id)}
                  className={`flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors hover:bg-accent ${
                    sessionId === session.id
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  <MessageSquare className="size-4 shrink-0" />
                  <span className="truncate">{session.title}</span>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex flex-1 flex-col rounded-lg border">
        <ChatWindow
          messages={messages}
          streaming={streaming}
          onSendMessage={(text) => sendMessage(text)}
        />
      </div>
    </div>
  );
}

type Mode = "save" | "chat";

export default function ChatPage() {
  const [mode, setMode] = useState<Mode>("chat");

  return (
    <div className="flex h-[calc(100vh-theme(spacing.12)-theme(spacing.12))] flex-col">
      {/* Toggle */}
      <div className="mb-4 flex items-center justify-center">
        <div className="inline-flex rounded-lg border p-1">
          <Button
            variant={mode === "save" ? "default" : "ghost"}
            size="sm"
            onClick={() => setMode("save")}
          >
            <Inbox className="mr-2 size-4" />
            Save
          </Button>
          <Button
            variant={mode === "chat" ? "default" : "ghost"}
            size="sm"
            onClick={() => setMode("chat")}
          >
            <MessageSquare className="mr-2 size-4" />
            Chat
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {mode === "save" ? <SaveMode /> : <ChatMode />}
      </div>
    </div>
  );
}
