import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Extract a display-friendly domain from a URL.
 * Returns "Note" for resources without a URL.
 */
export function extractDomain(url: string | null): string {
  if (!url) return "Note";
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url;
  }
}

/** Human-readable labels for all resource statuses. */
export const STATUS_LABELS: Record<string, string> = {
  inbox: "Inbox",
  unread: "Unread",
  read: "Read",
  favorite: "Favorite",
  archived: "Archived",
  about_to_do: "About to Do",
  lets_do: "Let's Do",
  doing: "Doing",
  done: "Done",
  archive: "Archive",
};

/** Tailwind color classes for each resource status badge. */
export const STATUS_COLORS: Record<string, string> = {
  inbox: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
  unread: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  read: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  archived: "bg-muted text-muted-foreground",
  favorite: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  about_to_do: "bg-sky-500/10 text-sky-500 border-sky-500/20",
  lets_do: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  doing: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  done: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  archive: "bg-muted text-muted-foreground",
};
