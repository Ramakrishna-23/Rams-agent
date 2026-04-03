import "./notespanel.css";

interface NoteDraft {
  title: string;
  content: string;
  tags: string[];
  updatedAt: string;
}

const DRAFT_KEY = "noteDraft";

const titleEl = document.getElementById("note-title") as HTMLInputElement;
const contentEl = document.getElementById("note-content") as HTMLTextAreaElement;
const tagsContainer = document.getElementById("tags-container") as HTMLDivElement;
const tagsChips = document.getElementById("tags-chips") as HTMLDivElement;
const tagInput = document.getElementById("tag-input") as HTMLInputElement;
const autosaveStatus = document.getElementById("autosave-status") as HTMLSpanElement;
const sendBtn = document.getElementById("send-btn") as HTMLButtonElement;
const sendStatus = document.getElementById("send-status") as HTMLDivElement;

const tags: string[] = [];
let autosaveTimer: ReturnType<typeof setTimeout> | null = null;

// --- Tag chip rendering ---
function renderTags() {
  tagsChips.textContent = "";
  tags.forEach((t, i) => {
    const chip = document.createElement("span");
    chip.className = "tag-chip";
    chip.textContent = t;

    const removeBtn = document.createElement("span");
    removeBtn.className = "tag-chip-remove";
    removeBtn.textContent = "×";
    removeBtn.addEventListener("click", () => {
      tags.splice(i, 1);
      renderTags();
      scheduleSave();
    });

    chip.appendChild(removeBtn);
    tagsChips.appendChild(chip);
  });
}

tagInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === ",") {
    e.preventDefault();
    const val = tagInput.value.trim().replace(/,/g, "");
    if (val && !tags.includes(val)) {
      tags.push(val);
      renderTags();
      scheduleSave();
    }
    tagInput.value = "";
  }
  if (e.key === "Backspace" && !tagInput.value && tags.length) {
    tags.pop();
    renderTags();
    scheduleSave();
  }
});

tagsContainer.addEventListener("click", () => tagInput.focus());

// --- Auto-save ---
function scheduleSave() {
  if (autosaveTimer) clearTimeout(autosaveTimer);
  autosaveStatus.textContent = "Saving…";
  autosaveTimer = setTimeout(saveDraft, 800);
}

function saveDraft() {
  const draft: NoteDraft = {
    title: titleEl.value,
    content: contentEl.value,
    tags: [...tags],
    updatedAt: new Date().toISOString(),
  };
  chrome.storage.local.set({ [DRAFT_KEY]: draft }, () => {
    autosaveStatus.textContent = "Saved locally ✓";
  });
}

titleEl.addEventListener("input", scheduleSave);
contentEl.addEventListener("input", scheduleSave);

// --- Load draft on open ---
chrome.storage.local.get(DRAFT_KEY, (result) => {
  const draft = result[DRAFT_KEY] as NoteDraft | undefined;
  if (!draft) return;
  titleEl.value = draft.title ?? "";
  contentEl.value = draft.content ?? "";
  if (draft.tags?.length) {
    tags.push(...draft.tags);
    renderTags();
  }
  if (draft.updatedAt) {
    autosaveStatus.textContent = "Saved locally ✓";
  }
});

// --- Send to Rams ---
sendBtn.addEventListener("click", () => {
  sendBtn.disabled = true;
  sendBtn.textContent = "Sending…";
  hideSendStatus();

  chrome.runtime.sendMessage(
    {
      action: "saveNote",
      payload: {
        title: titleEl.value.trim() || "Untitled",
        content: contentEl.value.trim(),
        tagNames: [...tags],
      },
    },
    (response) => {
      if (chrome.runtime.lastError) {
        showSendStatus(chrome.runtime.lastError.message || "Unknown error", "error");
        resetSendBtn();
        return;
      }
      if (response?.success) {
        showSendStatus("Sent to Rams ✓", "success");
        // Clear editor and local draft
        titleEl.value = "";
        contentEl.value = "";
        tags.length = 0;
        renderTags();
        autosaveStatus.textContent = "";
        chrome.storage.local.remove(DRAFT_KEY);
        sendBtn.textContent = "Sent ✓";
        setTimeout(resetSendBtn, 2000);
      } else {
        showSendStatus(response?.error || "Send failed.", "error");
        resetSendBtn();
      }
    }
  );
});

function resetSendBtn() {
  sendBtn.disabled = false;
  sendBtn.textContent = "Send to Rams";
}

function showSendStatus(msg: string, type: "success" | "error") {
  sendStatus.textContent = msg;
  sendStatus.className = `send-status ${type}`;
}

function hideSendStatus() {
  sendStatus.textContent = "";
  sendStatus.className = "send-status hidden";
}
