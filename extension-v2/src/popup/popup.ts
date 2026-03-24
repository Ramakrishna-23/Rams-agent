import { initTheme } from "../shared/theme";
import { initSaveTab } from "./components/save-tab";
import { initActionsTab } from "./components/actions-tab";
import { initNotesTab } from "./components/notes-tab";
import { initTimerTab } from "./components/timer-tab";
import "./popup.css";

const tabs = document.querySelectorAll<HTMLButtonElement>(".tab");
const tabContents = document.querySelectorAll<HTMLDivElement>(".tab-content");

function switchTab(tabName: string) {
  tabs.forEach((t) => t.classList.toggle("active", t.dataset.tab === tabName));
  tabContents.forEach((c) =>
    c.classList.toggle("active", c.id === `tab-${tabName}`)
  );
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    const name = tab.dataset.tab;
    if (name) switchTab(name);
  });
});

// Notes button
document.getElementById("notesBtn")?.addEventListener("click", async () => {
  const win = await chrome.windows.getCurrent();
  chrome.runtime.sendMessage({ action: "openNotesPanel", windowId: win.id });
});

// Chat button
document.getElementById("chatBtn")?.addEventListener("click", async () => {
  const win = await chrome.windows.getCurrent();
  chrome.runtime.sendMessage({
    action: "openSidePanel",
    windowId: win.id,
  });
});

// Settings button
document.getElementById("settingsBtn")?.addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initSaveTab();
  initTimerTab();
  initActionsTab();
  initNotesTab();
});
