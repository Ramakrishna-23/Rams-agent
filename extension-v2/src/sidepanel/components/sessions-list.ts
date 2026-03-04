import { getChatSessions } from "../../shared/api-client";
import type { ChatSession } from "../../shared/types";

export interface SessionsController {
  refresh: () => Promise<void>;
  setActive: (id: string) => void;
}

export function initSessionsList(
  onSelect: (session: ChatSession) => void
): SessionsController {
  const listEl = document.getElementById("sessions-list")!;
  let activeId: string | null = null;

  async function refresh() {
    try {
      const sessions = await getChatSessions();
      listEl.textContent = "";
      sessions.forEach((s) => {
        const item = document.createElement("div");
        item.className = `session-item${s.id === activeId ? " active" : ""}`;
        item.textContent = s.title || "Untitled chat";
        item.addEventListener("click", () => {
          activeId = s.id;
          updateActive();
          onSelect(s);
        });
        listEl.appendChild(item);
      });
    } catch {
      listEl.textContent = "";
      const err = document.createElement("div");
      err.style.padding = "10px";
      err.style.fontSize = "12px";
      err.style.color = "var(--fg-hint)";
      err.textContent = "Could not load sessions.";
      listEl.appendChild(err);
    }
  }

  function updateActive() {
    listEl.querySelectorAll(".session-item").forEach((el, i) => {
      // We can't easily get session id from DOM, so just re-render
    });
    refresh();
  }

  function setActive(id: string) {
    activeId = id;
    refresh();
  }

  refresh();

  return { refresh, setActive };
}
