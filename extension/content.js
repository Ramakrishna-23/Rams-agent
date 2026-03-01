/**
 * Content script for Resource Agent Saver.
 * Captures current URL, page title, and any selected text.
 */

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "getPageInfo") {
    const selectedText = window.getSelection().toString().trim();

    sendResponse({
      url: window.location.href,
      title: document.title,
      selectedText: selectedText,
    });
  }
});
