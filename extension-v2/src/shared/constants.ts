export const IS_CHROME = typeof chrome !== "undefined" && !!chrome.runtime?.id;
export const HAS_SIDE_PANEL = IS_CHROME && "sidePanel" in chrome;

export const ACTION_COLUMNS = [
  { status: "about_to_do", label: "About to Do" },
  { status: "lets_do", label: "Let's Do" },
  { status: "doing", label: "Doing" },
] as const;

export function domainFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}
