"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { ChatSession } from "@/lib/types";
import { useChat } from "@/hooks/useChat";
import { ChatWindow } from "@/components/ChatWindow";
import { Plus, MessageSquare } from "lucide-react";

export default function ChatPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | undefined>();
  const { messages, streaming, sessionId, sendMessage, loadSession, clearMessages } = useChat();

  useEffect(() => {
    async function loadSessions() {
      try {
        const data = await api.getChatSessions();
        setSessions(data);
      } catch (err) {
        console.error("Failed to load sessions:", err);
      }
    }
    loadSessions();
  }, []);

  // Refresh sessions when a new session is created
  useEffect(() => {
    if (sessionId && !sessions.find((s) => s.id === sessionId)) {
      api.getChatSessions().then(setSessions).catch(console.error);
    }
  }, [sessionId, sessions]);

  const handleSelectSession = async (id: string) => {
    setActiveSessionId(id);
    await loadSession(id);
  };

  const handleNewChat = () => {
    setActiveSessionId(undefined);
    clearMessages();
  };

  const handleSendMessage = (text: string) => {
    sendMessage(text, activeSessionId);
  };

  return (
    <div className="flex h-[calc(100vh-3rem)] gap-4">
      {/* Sessions Sidebar */}
      <div className="flex w-64 shrink-0 flex-col rounded-lg border border-zinc-700 bg-zinc-800">
        <div className="border-b border-zinc-700 p-3">
          <button
            onClick={handleNewChat}
            className="btn-primary flex w-full items-center justify-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Chat
          </button>
        </div>
        <div className="flex-1 overflow-auto p-2 space-y-1">
          {sessions.length === 0 ? (
            <p className="px-3 py-4 text-center text-xs text-zinc-500">
              No conversations yet
            </p>
          ) : (
            sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => handleSelectSession(session.id)}
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  activeSessionId === session.id
                    ? "bg-zinc-700 text-zinc-100"
                    : "text-zinc-400 hover:bg-zinc-700/50 hover:text-zinc-200"
                }`}
              >
                <MessageSquare className="h-4 w-4 shrink-0" />
                <span className="truncate">
                  {session.title || "Untitled Chat"}
                </span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Window */}
      <div className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800">
        <ChatWindow
          messages={messages}
          streaming={streaming}
          onSendMessage={handleSendMessage}
        />
      </div>
    </div>
  );
}
