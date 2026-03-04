import { initTheme } from "../shared/theme";
import { initChatView } from "./components/chat-view";
import { initSessionsList } from "./components/sessions-list";
import "./sidepanel.css";

document.addEventListener("DOMContentLoaded", () => {
  initTheme();

  const chatController = initChatView((newSessionId) => {
    sessionsController.setActive(newSessionId);
  });

  const sessionsController = initSessionsList((session) => {
    chatController.loadSession(session.id);
  });

  document.getElementById("new-chat-btn")?.addEventListener("click", () => {
    chatController.clearMessages();
  });

  // Chat form
  const form = document.getElementById("chat-form") as HTMLFormElement;
  const input = document.getElementById("chat-input") as HTMLTextAreaElement;
  const sendBtn = document.getElementById("send-btn") as HTMLButtonElement;

  input.addEventListener("input", () => {
    sendBtn.disabled = !input.value.trim();
    // Auto-resize textarea
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 120) + "px";
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submitMessage();
    }
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    submitMessage();
  });

  async function submitMessage() {
    const text = input.value.trim();
    if (!text) return;
    input.value = "";
    input.style.height = "auto";
    sendBtn.disabled = true;
    await chatController.sendMessage(text);
    sessionsController.refresh();
  }
});
