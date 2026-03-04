import { chatStream, getChatSession } from "../../shared/api-client";
import { parseSSEStream } from "../../shared/sse-parser";
import type { ChatMessage } from "../../shared/types";

export interface ChatController {
  sendMessage: (text: string) => Promise<void>;
  loadSession: (id: string) => Promise<void>;
  clearMessages: () => void;
  getSessionId: () => string | undefined;
}

export function initChatView(
  onSessionId: (id: string) => void
): ChatController {
  const messagesEl = document.getElementById("messages")!;
  const indicator = document.getElementById("streaming-indicator")!;

  let messages: ChatMessage[] = [];
  let sessionId: string | undefined;
  let streaming = false;

  function renderMessages() {
    messagesEl.textContent = "";
    messages.forEach((msg) => {
      const bubble = document.createElement("div");
      bubble.className = `message ${msg.role}`;
      bubble.textContent = msg.content;
      messagesEl.appendChild(bubble);
    });
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function updateLastAssistant(content: string) {
    const last = messages[messages.length - 1];
    if (last?.role === "assistant") {
      last.content += content;
      // Update the last bubble directly for performance
      const lastBubble = messagesEl.lastElementChild as HTMLElement;
      if (lastBubble) lastBubble.textContent = last.content;
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }
  }

  function setStreaming(val: boolean) {
    streaming = val;
    indicator.classList.toggle("hidden", !val);
  }

  async function sendMessage(text: string) {
    if (streaming || !text.trim()) return;

    const userMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: text,
      resource_ids: [],
      created_at: new Date().toISOString(),
    };
    messages.push(userMsg);

    const assistantMsg: ChatMessage = {
      id: `temp-assistant-${Date.now()}`,
      role: "assistant",
      content: "",
      resource_ids: [],
      created_at: new Date().toISOString(),
    };
    messages.push(assistantMsg);
    renderMessages();
    setStreaming(true);

    try {
      const res = await chatStream(text, sessionId);
      await parseSSEStream(res, {
        onContent(content) {
          updateLastAssistant(content);
        },
        onSessionId(id) {
          sessionId = id;
          onSessionId(id);
        },
        onDone() {},
        onError(err) {
          console.error("SSE error:", err);
        },
      });
    } catch (err) {
      console.error("Chat error:", err);
      const errorMsg: ChatMessage = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: "Sorry, something went wrong. Please try again.",
        resource_ids: [],
        created_at: new Date().toISOString(),
      };
      messages.push(errorMsg);
      renderMessages();
    } finally {
      setStreaming(false);
    }
  }

  async function loadSession(id: string) {
    try {
      const data = await getChatSession(id);
      messages = data.messages;
      sessionId = id;
      renderMessages();
    } catch (err) {
      console.error("Failed to load session:", err);
    }
  }

  function clearMessages() {
    messages = [];
    sessionId = undefined;
    messagesEl.textContent = "";
  }

  return {
    sendMessage,
    loadSession,
    clearMessages,
    getSessionId: () => sessionId,
  };
}
