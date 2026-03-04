import { getResources } from "../../shared/api-client";
import { ACTION_COLUMNS } from "../../shared/constants";
import type { Resource } from "../../shared/types";

const container = () => document.getElementById("tab-actions")!;

function makeEl(tag: string, className?: string, text?: string): HTMLElement {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text) e.textContent = text;
  return e;
}

export function initActionsTab() {
  const root = container();
  root.textContent = "";
  const loading = makeEl("div", "loading", "Loading actions...");
  const spinner = makeEl("div", "spinner");
  loading.prepend(spinner, document.createElement("br"));
  root.appendChild(loading);
  loadActions();
}

interface ColumnData {
  status: string;
  label: string;
  items: Resource[];
  total: number;
}

async function loadActions() {
  const el = container();
  try {
    const results = await Promise.all(
      ACTION_COLUMNS.map((col) => getResources(1, col.status))
    );
    const columns: ColumnData[] = ACTION_COLUMNS.map((col, i) => ({
      ...col,
      items: results[i].items,
      total: results[i].total,
    }));
    el.textContent = "";
    render(columns);
  } catch {
    el.textContent = "";
    el.appendChild(makeEl("div", "empty-state", "Could not load actions. Check your settings."));
  }
}

function render(columns: ColumnData[]) {
  const el = container();
  const grid = makeEl("div", "actions-grid");

  columns.forEach((col) => {
    const column = makeEl("div", "action-column");

    const header = makeEl("div", "action-column-header");
    header.appendChild(document.createTextNode(col.label));
    const badge = makeEl("span", "count-badge", String(col.total));
    header.appendChild(badge);
    column.appendChild(header);

    if (col.items.length === 0) {
      const empty = makeEl("div", "empty-state", "None");
      empty.style.padding = "8px";
      empty.style.fontSize = "11px";
      column.appendChild(empty);
    } else {
      col.items.slice(0, 8).forEach((r) => {
        const item = makeEl("div", "action-item", r.title);
        item.dataset.url = r.url;
        item.title = r.title;
        item.addEventListener("click", () => chrome.tabs.create({ url: r.url }));
        column.appendChild(item);
      });
    }

    grid.appendChild(column);
  });

  el.appendChild(grid);
}
