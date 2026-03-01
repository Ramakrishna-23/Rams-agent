/**
 * Options page logic for Resource Agent Saver.
 * Saves and loads API URL and API Key to/from chrome.storage.sync.
 */

const apiUrlInput = document.getElementById("apiUrl");
const apiKeyInput = document.getElementById("apiKey");
const saveBtn = document.getElementById("saveBtn");
const resetBtn = document.getElementById("resetBtn");
const statusEl = document.getElementById("status");

// ---- Load saved settings on page open ----

document.addEventListener("DOMContentLoaded", loadSettings);

function loadSettings() {
  chrome.storage.sync.get(["apiUrl", "apiKey"], (data) => {
    apiUrlInput.value = data.apiUrl || "";
    apiKeyInput.value = data.apiKey || "";
  });
}

// ---- Save ----

saveBtn.addEventListener("click", () => {
  const apiUrl = apiUrlInput.value.trim();
  const apiKey = apiKeyInput.value.trim();

  if (!apiUrl) {
    showStatus("API URL is required.", "error");
    return;
  }

  try {
    new URL(apiUrl);
  } catch {
    showStatus("Please enter a valid URL.", "error");
    return;
  }

  if (!apiKey) {
    showStatus("API Key is required.", "error");
    return;
  }

  chrome.storage.sync.set({ apiUrl, apiKey }, () => {
    if (chrome.runtime.lastError) {
      showStatus("Failed to save settings.", "error");
    } else {
      showStatus("Settings saved successfully.", "success");
    }
  });
});

// ---- Reset ----

resetBtn.addEventListener("click", () => {
  chrome.storage.sync.remove(["apiUrl", "apiKey"], () => {
    apiUrlInput.value = "";
    apiKeyInput.value = "";
    showStatus("Settings cleared.", "success");
  });
});

// ---- Status helper ----

function showStatus(message, type) {
  statusEl.textContent = message;
  statusEl.className = `status visible ${type}`;
  setTimeout(() => {
    statusEl.className = "status";
  }, 3000);
}
