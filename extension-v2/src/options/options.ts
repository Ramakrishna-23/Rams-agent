import { getSettings, saveSettings } from "../shared/storage";
import { initTheme } from "../shared/theme";
import "./options.css";

const apiUrlInput = document.getElementById("apiUrl") as HTMLInputElement;
const apiKeyInput = document.getElementById("apiKey") as HTMLInputElement;
const saveBtn = document.getElementById("saveBtn") as HTMLButtonElement;
const resetBtn = document.getElementById("resetBtn") as HTMLButtonElement;
const statusEl = document.getElementById("status") as HTMLDivElement;

async function loadSettings() {
  const settings = await getSettings();
  apiUrlInput.value = settings.apiUrl;
  apiKeyInput.value = settings.apiKey;
}

function showStatus(message: string, type: "success" | "error") {
  statusEl.textContent = message;
  statusEl.className = `status visible ${type}`;
  setTimeout(() => {
    statusEl.className = "status";
  }, 3000);
}

saveBtn.addEventListener("click", async () => {
  const apiUrl = apiUrlInput.value.trim();
  const apiKey = apiKeyInput.value.trim();

  if (!apiUrl) {
    showStatus("Backend URL is required.", "error");
    return;
  }
  try {
    new URL(apiUrl);
  } catch {
    showStatus("Please enter a valid URL.", "error");
    return;
  }

  try {
    await saveSettings({ apiUrl, apiKey });
    showStatus("Settings saved successfully.", "success");
  } catch {
    showStatus("Failed to save settings.", "error");
  }
});

resetBtn.addEventListener("click", async () => {
  await saveSettings({ apiUrl: "http://localhost:8000", apiKey: "" });
  await loadSettings();
  showStatus("Settings reset to defaults.", "success");
});

document.addEventListener("DOMContentLoaded", () => {
  loadSettings();
  initTheme();
});
