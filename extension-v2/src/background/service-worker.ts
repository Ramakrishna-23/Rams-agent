import { createResource } from "../shared/api-client";
import { HAS_SIDE_PANEL } from "../shared/constants";

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === "saveResource") {
    const { url, title, selectedText, notes } = message.payload;
    createResource(url, title, notes, selectedText)
      .then((resource) => sendResponse({ success: true, data: resource }))
      .catch((err: Error) =>
        sendResponse({ success: false, error: err.message })
      );
    return true; // async response
  }

  if (message.action === "openSidePanel") {
    if (HAS_SIDE_PANEL) {
      chrome.sidePanel
        .open({ windowId: message.windowId })
        .catch(console.error);
    } else {
      // Safari fallback: open in a new tab
      chrome.tabs.create({
        url: chrome.runtime.getURL("sidepanel/sidepanel.html"),
      });
    }
    sendResponse({ success: true });
    return true;
  }
});
