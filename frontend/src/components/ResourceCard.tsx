"use client";

import Link from "next/link";
import { Resource } from "@/lib/types";
import { ExternalLink } from "lucide-react";

const statusColors: Record<string, string> = {
  unread: "bg-amber-500/20 text-amber-400",
  read: "bg-green-500/20 text-green-400",
  archived: "bg-zinc-500/20 text-zinc-400",
  favorite: "bg-purple-500/20 text-purple-400",
};

const tagColors = [
  "bg-blue-500/20 text-blue-400",
  "bg-teal-500/20 text-teal-400",
  "bg-pink-500/20 text-pink-400",
  "bg-orange-500/20 text-orange-400",
  "bg-indigo-500/20 text-indigo-400",
];

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url;
  }
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

interface ResourceCardProps {
  resource: Resource;
}

export function ResourceCard({ resource }: ResourceCardProps) {
  const summarySnippet = resource.summary
    ? resource.summary.length > 100
      ? resource.summary.slice(0, 100) + "..."
      : resource.summary
    : "No summary available";

  return (
    <Link href={`/resources/${resource.id}`} className="card block transition-colors hover:border-zinc-600">
      <div className="mb-2 flex items-start justify-between gap-2">
        <h3 className="font-medium leading-tight text-zinc-100 line-clamp-2">
          {resource.title || "Untitled"}
        </h3>
        <span
          className={`badge shrink-0 ${statusColors[resource.status] || statusColors.unread}`}
        >
          {resource.status}
        </span>
      </div>

      <div className="mb-2 flex items-center gap-1 text-xs text-zinc-500">
        <ExternalLink className="h-3 w-3" />
        {getDomain(resource.url)}
      </div>

      <p className="mb-3 text-sm text-zinc-400">{summarySnippet}</p>

      <div className="flex flex-wrap items-center gap-2">
        {resource.tags.slice(0, 3).map((tag, i) => (
          <span key={tag.id} className={`badge ${tagColors[i % tagColors.length]}`}>
            {tag.name}
          </span>
        ))}
        {resource.tags.length > 3 && (
          <span className="text-xs text-zinc-500">
            +{resource.tags.length - 3} more
          </span>
        )}
      </div>

      <div className="mt-3 text-xs text-zinc-500">
        {formatDate(resource.created_at)}
      </div>
    </Link>
  );
}
