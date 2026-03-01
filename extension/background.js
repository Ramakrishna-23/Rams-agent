/**
 * Background service worker for Resource Agent Saver.
 * Handles saving resources to the backend API.
 * Reads API URL and API Key from chrome.storage.sync.
 */

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "saveResource") {
    handleSaveResource(message.payload)
      .then((result) => sendResponse(result))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    // Return true to indicate we will send a response asynchronously
    return true;
  }
});

async function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(["apiUrl", "apiKey"], (data) => {
      resolve({
        apiUrl: data.apiUrl || "",
        apiKey: data.apiKey || "",
      });
    });
  });
}

async function handleSaveResource(payload) {
  const { apiUrl, apiKey } = await getSettings();

  if (!apiUrl) {
    throw new Error(
      "API URL is not configured. Please set it in the extension options."
    );
  }

  if (!apiKey) {
    throw new Error(
      "API Key is not configured. Please set it in the extension options."
    );
  }

  const endpoint = `${apiUrl.replace(/\/+$/, "")}/api/resources`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": apiKey,
    },
    body: JSON.stringify({
      url: payload.url,
      title: payload.title,
      selected_text: payload.selectedText || "",
      notes: payload.notes || "",
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new Error(
      `Server responded with ${response.status}${errorBody ? ": " + errorBody : ""}`
    );
  }

  const data = await response.json();
  return { success: true, data };
}
