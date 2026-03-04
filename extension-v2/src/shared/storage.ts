export interface Settings {
  apiUrl: string;
  apiKey: string;
}

const DEFAULTS: Settings = {
  apiUrl: "http://localhost:8000",
  apiKey: "",
};

export async function getSettings(): Promise<Settings> {
  return new Promise((resolve) => {
    chrome.storage.sync.get(["apiUrl", "apiKey"], (data) => {
      resolve({
        apiUrl: data.apiUrl || DEFAULTS.apiUrl,
        apiKey: data.apiKey || DEFAULTS.apiKey,
      });
    });
  });
}

export async function saveSettings(settings: Partial<Settings>): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.set(settings, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve();
      }
    });
  });
}

export function onSettingsChanged(
  callback: (changes: Partial<Settings>) => void
): void {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "sync") return;
    const updated: Partial<Settings> = {};
    if (changes.apiUrl) updated.apiUrl = changes.apiUrl.newValue;
    if (changes.apiKey) updated.apiKey = changes.apiKey.newValue;
    if (Object.keys(updated).length > 0) callback(updated);
  });
}
