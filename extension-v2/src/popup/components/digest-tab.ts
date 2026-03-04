import { getDigest, reviewResource } from "../../shared/api-client";
import { domainFromUrl } from "../../shared/constants";
import type { DigestItem } from "../../shared/types";

const container = () => document.getElementById("tab-digest")!;

function makeEl(tag: string, className?: string, text?: string): HTMLElement {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text) e.textContent = text;
  return e;
}

export function initDigestTab() {
  const root = container();
  root.textContent = "";
  const loading = makeEl("div", "loading", "Loading digest...");
  const spinner = makeEl("div", "spinner");
  loading.prepend(spinner, document.createElement("br"));
  root.appendChild(loading);
  loadDigest();
}

async function loadDigest() {
  const el = container();
  try {
    const items = await getDigest();
    el.textContent = "";
    if (items.length === 0) {
      el.appendChild(makeEl("div", "empty-state", "All caught up! No resources due for review."));
      return;
    }
    render(items);
  } catch {
    el.textContent = "";
    el.appendChild(makeEl("div", "empty-state", "Could not load digest. Check your settings."));
  }
}

function render(items: DigestItem[]) {
  const el = container();
  el.textContent = "";
  const list = makeEl("div");

  items.forEach((d) => {
    const r = d.resource;
    const item = makeEl("div", "digest-item");
    item.dataset.url = r.url;
    item.style.cursor = "pointer";

    item.appendChild(makeEl("div", "result-title text-truncate", r.title));
    item.appendChild(makeEl("div", "result-domain", domainFromUrl(r.url)));
    if (r.summary) item.appendChild(makeEl("div", "result-summary", r.summary));

    if (r.tags.length > 0) {
      const tagsEl = makeEl("div", "tags");
      r.tags.forEach((t) => tagsEl.appendChild(makeEl("span", "tag", t.name)));
      item.appendChild(tagsEl);
    }

    item.appendChild(makeEl("div", "digest-reason", d.reason));

    const actions = makeEl("div", "digest-actions");
    const btn = document.createElement("button");
    btn.className = "btn btn-sm btn-outline";
    btn.textContent = "Mark Reviewed";
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      btn.disabled = true;
      btn.textContent = "...";
      try {
        await reviewResource(r.id);
        item.style.opacity = "0";
        item.style.transition = "opacity 0.3s";
        setTimeout(() => {
          item.remove();
          if (!el.querySelector(".digest-item")) {
            el.textContent = "";
            el.appendChild(makeEl("div", "empty-state", "All caught up!"));
          }
        }, 300);
      } catch {
        btn.disabled = false;
        btn.textContent = "Mark Reviewed";
      }
    });
    actions.appendChild(btn);
    item.appendChild(actions);

    item.addEventListener("click", () => chrome.tabs.create({ url: r.url }));
    list.appendChild(item);
  });

  el.appendChild(list);
}
