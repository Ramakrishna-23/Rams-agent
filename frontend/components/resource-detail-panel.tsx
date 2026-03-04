"use client";

import { useState, useEffect } from "react";
import {
  Resource,
  READING_STATUSES,
  ACTION_STATUSES,
  isActionResource,
} from "@/lib/types";
import { api } from "@/lib/api";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ExternalLink,
  Trash2,
  RotateCcw,
  Clock,
} from "lucide-react";

const statusLabels: Record<string, string> = {
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

interface ResourceDetailPanelProps {
  resource: Resource | null;
  open: boolean;
  onClose: () => void;
  onResourceUpdate: () => void;
}

export function ResourceDetailPanel({
  resource,
  open,
  onClose,
  onResourceUpdate,
}: ResourceDetailPanelProps) {
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (resource) {
      setNotes(resource.notes || "");
    }
  }, [resource]);

  if (!resource) return null;

  const isAction = isActionResource(resource);
  const statuses = isAction ? ACTION_STATUSES : READING_STATUSES;

  const handleStatusChange = async (newStatus: string) => {
    try {
      await api.updateResource(resource.id, { status: newStatus });
      onResourceUpdate();
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const handleToggleAction = async (checked: boolean) => {
    const newStatus = checked ? "about_to_do" : "unread";
    try {
      await api.updateResource(resource.id, { status: newStatus });
      onResourceUpdate();
    } catch (err) {
      console.error("Failed to toggle action:", err);
    }
  };

  const handleSaveNotes = async () => {
    setSaving(true);
    try {
      await api.updateResource(resource.id, { notes });
      onResourceUpdate();
    } catch (err) {
      console.error("Failed to save notes:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleReview = async () => {
    try {
      await api.reviewResource(resource.id);
      onResourceUpdate();
    } catch (err) {
      console.error("Failed to review:", err);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.deleteResource(resource.id);
      onClose();
      onResourceUpdate();
    } catch (err) {
      console.error("Failed to delete:", err);
    } finally {
      setDeleting(false);
    }
  };

  const domain = (() => {
    try {
      return new URL(resource.url).hostname.replace("www.", "");
    } catch {
      return resource.url;
    }
  })();

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-[460px] sm:max-w-[460px] p-0">
        <SheetHeader className="border-b px-4 py-3">
          <SheetTitle className="text-sm font-semibold leading-snug line-clamp-2">
            {resource.title || "Untitled"}
          </SheetTitle>
          <SheetDescription asChild>
            <a
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary truncate"
            >
              <ExternalLink className="size-3 shrink-0" />
              {domain}
            </a>
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 h-[calc(100vh-64px)]">
          <div className="space-y-5 p-4">
            {/* Status & Action Toggle */}
            <div className="flex items-center gap-4">
              <div className="flex-1 space-y-1.5">
                <Label className="text-xs">Status</Label>
                <Select value={resource.status} onValueChange={handleStatusChange}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((s) => (
                      <SelectItem key={s} value={s}>
                        {statusLabels[s] || s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Action</Label>
                <div className="flex items-center h-8">
                  <Switch
                    checked={isAction}
                    onCheckedChange={handleToggleAction}
                  />
                </div>
              </div>
            </div>

            {/* Tags */}
            {resource.tags.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-xs">Tags</Label>
                <div className="flex flex-wrap gap-1">
                  {resource.tags.map((tag) => (
                    <Badge key={tag.id} variant="outline" className="text-xs">
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Summary */}
            {resource.summary && (
              <div className="space-y-1.5">
                <Label className="text-xs">Summary</Label>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {resource.summary}
                </p>
              </div>
            )}

            {/* Notes */}
            <div className="space-y-1.5">
              <Label className="text-xs">Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add your notes..."
                className="min-h-[120px] text-xs resize-y"
              />
              <Button
                size="sm"
                onClick={handleSaveNotes}
                disabled={saving || notes === (resource.notes || "")}
                className="text-xs"
              >
                {saving ? "Saving..." : "Save Notes"}
              </Button>
            </div>

            {/* Meta */}
            <div className="space-y-1 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="size-3" />
                Created {new Date(resource.created_at).toLocaleDateString()}
              </div>
              {resource.review_count > 0 && (
                <div>Reviewed {resource.review_count} time{resource.review_count > 1 ? "s" : ""}</div>
              )}
              {resource.next_review_at && (
                <div>Next review: {new Date(resource.next_review_at).toLocaleDateString()}</div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2 border-t">
              <Button size="sm" variant="outline" onClick={handleReview} className="text-xs">
                <RotateCcw className="size-3 mr-1" />
                Mark Reviewed
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting}
                className="text-xs"
              >
                <Trash2 className="size-3 mr-1" />
                {deleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
