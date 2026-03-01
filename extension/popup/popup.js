/**
 * Popup logic for Resource Agent Saver.
 * Gets page info from the content script, lets the user add notes,
 * and sends a save request through the background service worker.
 */

const pageTitleEl = document.getElementById("pageTitle");
const pageUrlEl = document.getElementById("pageUrl");
const selectedTextSection = document.getElementById("selectedTextSection");
const selectedTextEl = document.getElementById("selectedText");
const notesEl = document.getElementById("notes");
const saveBtn = document.getElementById("saveBtn");
const statusEl = document.getElementById("status");
const optionsLink = document.getElementById("optionsLink");

let pageInfo = null;

// ---- Initialize ----

document.addEventListener("DOMContentLoaded", init);

async function init() {
  optionsLink.addEventListener("click", (e) => {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
  });

  saveBtn.addEventListener("click", handleSave);

  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (!tab || !tab.id) {
      showStatus("Cannot access this page.", "error");
      return;
    }

    // Try to get info from the content script
    chrome.tabs.sendMessage(
      tab.id,
      { action: "getPageInfo" },
      (response) => {
        if (chrome.runtime.lastError || !response) {
          // Content script may not be injected (e.g. chrome:// pages).
          // Fall back to tab properties.
          pageInfo = {
            url: tab.url || "",
            title: tab.title || "Untitled",
            selectedText: "",
          };
        } else {
          pageInfo = response;
        }
        renderPageInfo();
      }
    );
  } catch (err) {
    showStatus("Failed to get page information.", "error");
  }
}

function renderPageInfo() {
  pageTitleEl.textContent = pageInfo.title || "Untitled";
  pageUrlEl.textContent = pageInfo.url || "";

  if (pageInfo.selectedText) {
    selectedTextEl.textContent = pageInfo.selectedText;
    selectedTextSection.classList.remove("hidden");
  }

  saveBtn.disabled = false;
}

// ---- Save ----

async function handleSave() {
  if (!pageInfo) return;

  saveBtn.disabled = true;
  saveBtn.textContent = "Saving...";
  saveBtn.classList.add("saving");
  hideStatus();

  const payload = {
    url: pageInfo.url,
    title: pageInfo.title,
    selectedText: pageInfo.selectedText,
    notes: notesEl.value.trim(),
  };

  chrome.runtime.sendMessage(
    { action: "saveResource", payload },
    (response) => {
      saveBtn.classList.remove("saving");

      if (chrome.runtime.lastError) {
        showStatus(chrome.runtime.lastError.message, "error");
        saveBtn.disabled = false;
        saveBtn.textContent = "Save Resource";
        return;
      }

      if (response && response.success) {
        showStatus("Resource saved successfully!", "success");
        saveBtn.textContent = "Saved";
        // Re-enable after a short delay so user can save again if needed
        setTimeout(() => {
          saveBtn.disabled = false;
          saveBtn.textContent = "Save Resource";
        }, 2000);
      } else {
        const errorMsg =
          response && response.error
            ? response.error
            : "An unknown error occurred.";
        showStatus(errorMsg, "error");
        saveBtn.disabled = false;
        saveBtn.textContent = "Save Resource";
      }
    }
  );
}

// ---- Status helpers ----

function showStatus(message, type) {
  statusEl.textContent = message;
  statusEl.className = `status ${type}`;
}

function hideStatus() {
  statusEl.className = "status hidden";
  statusEl.textContent = "";
}
