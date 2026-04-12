"use client";

import { Resource, PRIORITY_COLORS } from "@/lib/types";
import { extractDomain, STATUS_COLORS, STATUS_LABELS } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Clock, Repeat, CheckSquare } from "lucide-react";

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
  projectName?: string;
  projectColor?: string;
}

export function ResourceCard({
  resource,
  compact,
  onClick,
  projectName,
  projectColor,
}: ResourceCardProps) {
  const domain = extractDomain(resource.url);

  const isOverdue = resource.due_at && new Date(resource.due_at) < new Date() && !["done", "archive"].includes(resource.status);
  const subtasks = resource.subtasks || [];
  const doneSubtasks = subtasks.filter((s) => s.is_done).length;

  return (
    <div onClick={onClick} className={onClick ? "cursor-pointer" : undefined}>
      <Card className={`group h-full transition-colors hover:border-primary/50 hover:bg-accent/50 ${isOverdue ? "border-red-500/50" : ""}`}>
        <CardHeader className={compact ? "p-3 pb-1" : "pb-2"}>
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              {resource.priority && (
                <span className={`size-2 rounded-full shrink-0 ${PRIORITY_COLORS[resource.priority] || ""}`} />
              )}
              <h3 className={`font-medium leading-snug line-clamp-2 ${compact ? "text-xs" : "text-sm"}`}>
                {resource.title || "Untitled"}
              </h3>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {resource.recurrence_rule && (
                <Repeat className="size-3 text-muted-foreground" />
              )}
              <Badge
                variant="outline"
                className={`text-[10px] ${STATUS_COLORS[resource.status] || ""}`}
              >
                {STATUS_LABELS[resource.status] || resource.status}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-1 min-w-0">
              <ExternalLink className="size-3 shrink-0" />
              <span className="truncate">{domain}</span>
            </div>
            {resource.due_at && (
              <span className={`shrink-0 px-1 py-0.5 rounded text-[10px] ${isOverdue ? "bg-red-500/10 text-red-500" : "bg-muted"}`}>
                {new Date(resource.due_at).toLocaleDateString()}
              </span>
            )}
            {subtasks.length > 0 && (
              <span className="shrink-0 flex items-center gap-0.5 text-[10px]">
                <CheckSquare className="size-3" />
                {doneSubtasks}/{subtasks.length}
              </span>
            )}
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
          {projectName && (
            <div className="mt-1.5 flex items-center gap-1 text-[10px]">
              <span
                className="size-2 rounded-full shrink-0"
                style={{ backgroundColor: projectColor ?? "#6497D6" }}
              />
              <span className="truncate text-muted-foreground">{projectName}</span>
            </div>
          )}
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
