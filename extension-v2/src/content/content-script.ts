chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === "getPageInfo") {
    const selectedText = window.getSelection()?.toString().trim() || "";
    sendResponse({
      url: window.location.href,
      title: document.title,
      selectedText,
    });
  }
});
