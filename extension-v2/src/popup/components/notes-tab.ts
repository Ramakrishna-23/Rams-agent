const container = () => document.getElementById("tab-notes")!;

function el(tag: string, props?: Record<string, string>, text?: string): HTMLElement {
  const e = document.createElement(tag);
  if (props) {
    Object.entries(props).forEach(([k, v]) => {
      if (k === "className") e.className = v;
      else e.setAttribute(k, v);
    });
  }
  if (text) e.textContent = text;
  return e;
}

export function initNotesTab() {
  const root = container();
  root.textContent = "";

  const titleLabel = el("div", { className: "field-label" }, "Title");
  const titleEl = document.createElement("input");
  titleEl.type = "text";
  titleEl.className = "page-title";
  titleEl.placeholder = "Note title";

  const contentLabel = el("div", { className: "field-label", style: "margin-top: 8px;" }, "Content");
  const contentEl = document.createElement("textarea");
  contentEl.className = "";
  contentEl.placeholder = "Write your note...";
  contentEl.rows = 5;
  contentEl.style.width = "100%";
  contentEl.style.resize = "vertical";
  contentEl.style.fontFamily = "monospace";

  // Tags input
  const tagsLabel = el("div", { className: "field-label", style: "margin-top: 8px;" }, "Tags");
  const tagsContainer = el("div", { className: "tags-input-container" });
  const tagsChips = el("div", { className: "tags-chips" });
  const tagInput = document.createElement("input");
  tagInput.type = "text";
  tagInput.className = "tag-input";
  tagInput.placeholder = "Type and press Enter...";
  const tags: string[] = [];

  tagInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const val = tagInput.value.trim().replace(/,/g, "");
      if (val && !tags.includes(val)) {
        tags.push(val);
        renderTags();
      }
      tagInput.value = "";
    }
    if (e.key === "Backspace" && !tagInput.value && tags.length) {
      tags.pop();
      renderTags();
    }
  });

  function renderTags() {
    tagsChips.textContent = "";
    tags.forEach((t, i) => {
      const chip = el("span", { className: "tag-chip" }, t);
      const removeBtn = el("span", { className: "tag-chip-remove" }, "×");
      removeBtn.addEventListener("click", () => { tags.splice(i, 1); renderTags(); });
      chip.appendChild(removeBtn);
      tagsChips.appendChild(chip);
    });
  }

  tagsContainer.append(tagsChips, tagInput);
  tagsContainer.addEventListener("click", () => tagInput.focus());

  const saveBtn = document.createElement("button");
  saveBtn.className = "btn btn-primary";
  saveBtn.style.marginTop = "10px";
  saveBtn.textContent = "Save Note";

  const statusEl = el("div", { className: "status hidden" });

  root.append(titleLabel, titleEl, contentLabel, contentEl, tagsLabel, tagsContainer, saveBtn, statusEl);

  saveBtn.addEventListener("click", () => {
    saveBtn.disabled = true;
    saveBtn.textContent = "Saving...";
    statusEl.className = "status hidden";

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
          showStatus(chrome.runtime.lastError.message || "Unknown error", "error");
          resetBtn();
          return;
        }
        if (response?.success) {
          showStatus("Note saved!", "success");
          titleEl.value = "";
          contentEl.value = "";
          tags.length = 0;
          renderTags();
          saveBtn.textContent = "Saved";
          setTimeout(resetBtn, 2000);
        } else {
          showStatus(response?.error || "Save failed.", "error");
          resetBtn();
        }
      }
    );
  });

  function resetBtn() {
    saveBtn.disabled = false;
    saveBtn.textContent = "Save Note";
  }

  function showStatus(msg: string, type: "success" | "error") {
    statusEl.textContent = msg;
    statusEl.className = `status ${type}`;
  }
}
