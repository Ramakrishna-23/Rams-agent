"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { ChatSession } from "@/lib/types";
import { useChat } from "@/hooks/useChat";
import { ChatWindow } from "@/components/chat-window";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, MessageSquare } from "lucide-react";

export default function ChatPage() {
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
    <div className="flex h-[calc(100vh-theme(spacing.12)-theme(spacing.12))] gap-4">
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
