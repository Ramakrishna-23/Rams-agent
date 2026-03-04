import { search } from "../../shared/api-client";
import { domainFromUrl } from "../../shared/constants";
import type { SearchResult } from "../../shared/types";

const container = () => document.getElementById("tab-search")!;

let debounceTimer: ReturnType<typeof setTimeout>;

function makeEl(tag: string, className?: string, text?: string): HTMLElement {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text) e.textContent = text;
  return e;
}

export function initSearchTab() {
  const root = container();
  root.textContent = "";

  const wrapper = makeEl("div", "search-input-wrapper");
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", "search-icon");
  svg.setAttribute("width", "14");
  svg.setAttribute("height", "14");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2");
  const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  circle.setAttribute("cx", "11");
  circle.setAttribute("cy", "11");
  circle.setAttribute("r", "8");
  const line = document.createElementNS("http://www.w3.org/2000/svg", "path");
  line.setAttribute("d", "m21 21-4.35-4.35");
  svg.append(circle, line);

  const input = document.createElement("input");
  input.type = "text";
  input.id = "search-input";
  input.placeholder = "Search your resources...";
  wrapper.append(svg, input);

  const resultsContainer = makeEl("div");
  root.append(wrapper, resultsContainer);

  input.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    const q = input.value.trim();
    if (!q) {
      resultsContainer.textContent = "";
      return;
    }
    debounceTimer = setTimeout(() => runSearch(q), 300);
  });

  async function runSearch(query: string) {
    resultsContainer.textContent = "";
    const loading = makeEl("div", "loading", "Searching...");
    const spinner = makeEl("div", "spinner");
    loading.prepend(spinner, document.createElement("br"));
    resultsContainer.appendChild(loading);

    try {
      const items = await search(query, "hybrid");
      resultsContainer.textContent = "";
      if (items.length === 0) {
        resultsContainer.appendChild(makeEl("div", "empty-state", "No results found."));
        return;
      }
      const ul = makeEl("ul", "result-list");
      items.forEach((r) => ul.appendChild(buildResultItem(r)));
      resultsContainer.appendChild(ul);
    } catch {
      resultsContainer.textContent = "";
      resultsContainer.appendChild(makeEl("div", "empty-state", "Search failed. Check your settings."));
    }
  }

  function buildResultItem(r: SearchResult): HTMLElement {
    const li = makeEl("li", "result-item");
    li.dataset.url = r.url;
    li.appendChild(makeEl("div", "result-title text-truncate", r.title));
    li.appendChild(makeEl("div", "result-domain", domainFromUrl(r.url)));
    if (r.summary) li.appendChild(makeEl("div", "result-summary", r.summary));
    li.addEventListener("click", () => chrome.tabs.create({ url: r.url }));
    return li;
  }
}
