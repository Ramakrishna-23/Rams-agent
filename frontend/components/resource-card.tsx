"use client";

import { Resource } from "@/lib/types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Clock } from "lucide-react";

const statusColors: Record<string, string> = {
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

const statusLabels: Record<string, string> = {
  inbox: "Inbox",
  about_to_do: "about to do",
  lets_do: "let's do",
  doing: "doing",
  done: "done",
  archive: "archive",
};

const tagColors = [
  "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "bg-teal-500/10 text-teal-400 border-teal-500/20",
  "bg-pink-500/10 text-pink-400 border-pink-500/20",
  "bg-orange-500/10 text-orange-400 border-orange-500/20",
  "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
];

interface ResourceCardProps {
  resource: Resource;
  compact?: boolean;
  onClick?: () => void;
}

export function ResourceCard({
  resource,
  compact,
  onClick,
}: ResourceCardProps) {
  const domain = (() => {
    if (!resource.url) return "Note";
    try {
      return new URL(resource.url).hostname.replace("www.", "");
    } catch {
      return resource.url;
    }
  })();

  return (
    <div onClick={onClick} className={onClick ? "cursor-pointer" : undefined}>
      <Card className="group h-full transition-colors hover:border-primary/50 hover:bg-accent/50">
        <CardHeader className={compact ? "p-3 pb-1" : "pb-2"}>
          <div className="flex items-start justify-between gap-2">
            <h3 className={`font-medium leading-snug line-clamp-2 ${compact ? "text-xs" : "text-sm"}`}>
              {resource.title || "Untitled"}
            </h3>
            <div className="flex items-center gap-1.5 shrink-0">
              <Badge
                variant="outline"
                className={`text-[10px] ${statusColors[resource.status] || ""}`}
              >
                {statusLabels[resource.status] || resource.status}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <ExternalLink className="size-3" />
            <span className="truncate">{domain}</span>
          </div>
        </CardHeader>
        <CardContent className={compact ? "p-3 pt-0" : "pt-0"}>
          {!compact && resource.summary && (
            <p className="mb-2 text-xs text-muted-foreground line-clamp-2">
              {resource.summary}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-1">
            {resource.tags.slice(0, compact ? 2 : 3).map((tag, i) => (
              <Badge
                key={tag.id}
                variant="outline"
                className={`text-[10px] px-1.5 py-0 ${tagColors[i % tagColors.length]}`}
              >
                {tag.name}
              </Badge>
            ))}
            {resource.tags.length > (compact ? 2 : 3) && (
              <span className="text-[10px] text-muted-foreground">
                +{resource.tags.length - (compact ? 2 : 3)}
              </span>
            )}
          </div>
          {!compact && (
            <div className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground">
              <Clock className="size-3" />
              {new Date(resource.created_at).toLocaleDateString()}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
