"use client";

import { useState, useCallback } from "react";
import { api } from "@/lib/api";
import { ChatMessage } from "@/lib/types";

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>();

  const sendMessage = useCallback(
    async (text: string, sid?: string) => {
      const currentSessionId = sid || sessionId;

      const userMsg: ChatMessage = {
        id: `temp-${Date.now()}`,
        role: "user",
        content: text,
        resource_ids: [],
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setStreaming(true);

      try {
        const res = await api.chatStream(text, currentSessionId);

        const assistantMsg: ChatMessage = {
          id: `temp-assistant-${Date.now()}`,
          role: "assistant",
          content: "",
          resource_ids: [],
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMsg]);

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") continue;

              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  setMessages((prev) => {
                    const updated = [...prev];
                    const last = updated[updated.length - 1];
                    if (last.role === "assistant") {
                      updated[updated.length - 1] = {
                        ...last,
                        content: last.content + parsed.content,
                      };
                    }
                    return updated;
                  });
                }
                if (parsed.session_id) {
                  setSessionId(parsed.session_id);
                }
              } catch {
                setMessages((prev) => {
                  const updated = [...prev];
                  const last = updated[updated.length - 1];
                  if (last.role === "assistant") {
                    updated[updated.length - 1] = {
                      ...last,
                      content: last.content + data,
                    };
                  }
                  return updated;
                });
              }
            }
          }
        }
      } catch (err) {
        console.error("Chat error:", err);
        const errorMsg: ChatMessage = {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: "Sorry, something went wrong. Please try again.",
          resource_ids: [],
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setStreaming(false);
      }
    },
    [sessionId]
  );

  const loadSession = useCallback(async (id: string) => {
    try {
      const data = await api.getChatSession(id);
      setMessages(data.messages);
      setSessionId(id);
    } catch (err) {
      console.error("Failed to load session:", err);
    }
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setSessionId(undefined);
  }, []);

  return {
    messages,
    streaming,
    sessionId,
    sendMessage,
    loadSession,
    clearMessages,
  };
}
