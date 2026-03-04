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
  const titleEl = el("p", { className: "page-title", id: "save-title" }, "Loading...");
  const urlLabel = el("div", { className: "field-label" }, "URL");
  const urlEl = el("p", { className: "page-url", id: "save-url" }, "Loading...");

  const selectedSection = el("div", { className: "selected-text-section hidden", id: "save-selected-section" });
  const selectedLabel = el("div", { className: "field-label" }, "Selected Text");
  const selectedEl = el("p", { className: "selected-text", id: "save-selected" });
  selectedSection.append(selectedLabel, selectedEl);

  const notesLabel = el("div", { className: "field-label", style: "margin-top: 8px;" }, "Notes (optional)");
  const notesEl = document.createElement("textarea");
  notesEl.id = "save-notes";
  notesEl.placeholder = "Add any notes...";
  notesEl.rows = 2;

  const saveBtn = document.createElement("button");
  saveBtn.id = "save-btn";
  saveBtn.className = "btn btn-primary";
  saveBtn.style.marginTop = "10px";
  saveBtn.disabled = true;
  saveBtn.textContent = "Save Resource";

  const statusEl = el("div", { className: "status hidden", id: "save-status" });

  root.append(titleLabel, titleEl, urlLabel, urlEl, selectedSection, notesLabel, notesEl, saveBtn, statusEl);

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
    titleEl.textContent = pageInfo.title || "Untitled";
    urlEl.textContent = pageInfo.url || "";
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
          url: pageInfo.url,
          title: pageInfo.title,
          selectedText: pageInfo.selectedText,
          notes: notesEl.value.trim(),
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
