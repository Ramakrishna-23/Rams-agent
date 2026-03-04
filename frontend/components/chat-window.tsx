"use client";

import { useRef, useEffect, useState } from "react";
import { ChatMessage } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Loader2, Bot, User } from "lucide-react";

interface ChatWindowProps {
  messages: ChatMessage[];
  streaming: boolean;
  onSendMessage: (text: string) => void;
}

export function ChatWindow({ messages, streaming, onSendMessage }: ChatWindowProps) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || streaming) return;
    onSendMessage(input.trim());
    setInput("");
  };

  return (
    <div className="flex h-full flex-col">
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="flex h-64 flex-col items-center justify-center gap-2 text-muted-foreground">
              <Bot className="size-10 opacity-30" />
              <p className="text-sm">Start a conversation with your AI assistant</p>
              <p className="text-xs">Ask questions about your saved resources</p>
            </div>
          )}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Bot className="size-4" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
                {streaming &&
                  msg.role === "assistant" &&
                  msg === messages[messages.length - 1] && (
                    <span className="ml-1 inline-block size-2 animate-pulse rounded-full bg-current" />
                  )}
              </div>
              {msg.role === "user" && (
                <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                  <User className="size-4" />
                </div>
              )}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      <form
        onSubmit={handleSubmit}
        className="flex gap-2 border-t p-4"
      >
        <Input
          placeholder="Ask about your resources..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={streaming}
          className="flex-1"
        />
        <Button type="submit" size="icon" disabled={streaming || !input.trim()}>
          {streaming ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Send className="size-4" />
          )}
        </Button>
      </form>
    </div>
  );
}
