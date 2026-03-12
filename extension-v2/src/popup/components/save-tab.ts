const container = () => document.getElementById("tab-save")!;

interface PageInfo {
  url: string;
  title: string;
  selectedText: string;
}

let pageInfo: PageInfo | null = null;

function el(tag: string, props?: Record<string, string>, text?: string): HTMLElement {
  const e = document.createElement(tag);
  if (props) Object.entries(props).forEach(([k, v]) => {
    if (k === "className") e.className = v;
    else e.setAttribute(k, v);
  });
  if (text) e.textContent = text;
  return e;
}

export function initSaveTab() {
  const root = container();
  root.textContent = "";

  const titleLabel = el("div", { className: "field-label" }, "Page Title");
  const titleEl = document.createElement("input");
  titleEl.type = "text";
  titleEl.id = "save-title";
  titleEl.className = "page-title";
  titleEl.placeholder = "Page title";
  titleEl.value = "Loading...";

  const urlLabel = el("div", { className: "field-label" }, "URL");
  const urlEl = document.createElement("input");
  urlEl.type = "text";
  urlEl.id = "save-url";
  urlEl.className = "page-url";
  urlEl.placeholder = "https://...";
  urlEl.value = "Loading...";

  const selectedSection = el("div", { className: "selected-text-section hidden", id: "save-selected-section" });
  const selectedLabel = el("div", { className: "field-label" }, "Selected Text");
  const selectedEl = el("p", { className: "selected-text", id: "save-selected" });
  selectedSection.append(selectedLabel, selectedEl);

  const notesLabel = el("div", { className: "field-label", style: "margin-top: 8px;" }, "Notes (optional)");
  const notesEl = document.createElement("textarea");
  notesEl.id = "save-notes";
  notesEl.placeholder = "Add any notes...";
  notesEl.rows = 2;

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

  // Action toggle switch
  let isAction = false;
  const actionRow = el("div", { className: "action-toggle-row", style: "display: flex; align-items: center; gap: 8px; margin-top: 8px;" });
  const actionToggle = document.createElement("button");
  actionToggle.type = "button";
  actionToggle.className = "toggle-switch";
  actionToggle.setAttribute("role", "switch");
  actionToggle.setAttribute("aria-checked", "false");
  const toggleThumb = el("span", { className: "toggle-thumb" });
  actionToggle.appendChild(toggleThumb);
  actionToggle.addEventListener("click", () => {
    isAction = !isAction;
    actionToggle.classList.toggle("active", isAction);
    actionToggle.setAttribute("aria-checked", String(isAction));
  });
  const actionLabel = el("span", { className: "field-label" }, "Action");
  actionLabel.style.margin = "0";
  actionLabel.style.cursor = "pointer";
  actionLabel.addEventListener("click", () => actionToggle.click());
  actionRow.append(actionToggle, actionLabel);

  const saveBtn = document.createElement("button");
  saveBtn.id = "save-btn";
  saveBtn.className = "btn btn-primary";
  saveBtn.style.marginTop = "10px";
  saveBtn.disabled = true;
  saveBtn.textContent = "Save Resource";

  const statusEl = el("div", { className: "status hidden", id: "save-status" });

  root.append(titleLabel, titleEl, urlLabel, urlEl, selectedSection, notesLabel, notesEl, tagsLabel, tagsContainer, actionRow, saveBtn, statusEl);

  urlEl.addEventListener("input", () => {
    saveBtn.disabled = !urlEl.value.trim();
  });

  loadPageInfo();

  async function loadPageInfo() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) {
        showStatus("Cannot access this page.", "error");
        return;
      }

      chrome.tabs.sendMessage(tab.id, { action: "getPageInfo" }, (response) => {
        if (chrome.runtime.lastError || !response) {
          pageInfo = { url: tab.url || "", title: tab.title || "Untitled", selectedText: "" };
        } else {
          pageInfo = response;
        }
        render();
      });
    } catch {
      showStatus("Failed to get page information.", "error");
    }
  }

  function render() {
    if (!pageInfo) return;
    titleEl.value = pageInfo.title || "Untitled";
    urlEl.value = pageInfo.url || "";
    if (pageInfo.selectedText) {
      selectedEl.textContent = pageInfo.selectedText;
      selectedSection.classList.remove("hidden");
    }
    saveBtn.disabled = false;
  }

  saveBtn.addEventListener("click", () => {
    if (!pageInfo) return;
    saveBtn.disabled = true;
    saveBtn.textContent = "Saving...";
    hideStatus();

    chrome.runtime.sendMessage(
      {
        action: "saveResource",
        payload: {
          url: urlEl.value.trim(),
          title: titleEl.value.trim(),
          selectedText: pageInfo.selectedText,
          notes: notesEl.value.trim(),
          isAction,
          tags,
        },
      },
      (response) => {
        if (chrome.runtime.lastError) {
          showStatus(chrome.runtime.lastError.message || "Unknown error", "error");
          resetBtn();
          return;
        }
        if (response?.success) {
          showStatus("Resource saved!", "success");
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
    saveBtn.textContent = "Save Resource";
  }

  function showStatus(msg: string, type: "success" | "error") {
    statusEl.textContent = msg;
    statusEl.className = `status ${type}`;
  }

  function hideStatus() {
    statusEl.className = "status hidden";
  }
}
