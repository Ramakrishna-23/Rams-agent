"use client";

import { useState, useEffect, useRef } from "react";
import {
  Resource,
  Tag,
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  ExternalLink,
  Trash2,
  RotateCcw,
  Clock,
  Settings2,
  Zap,
  TagIcon,
  Plus,
  X,
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
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [tagSearch, setTagSearch] = useState("");
  const [tagPopoverOpen, setTagPopoverOpen] = useState(false);
  const tagInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (resource) {
      setNotes(resource.notes || "");
    }
  }, [resource]);

  useEffect(() => {
    if (tagPopoverOpen) {
      api.getTags().then(setAllTags).catch(console.error);
    }
  }, [tagPopoverOpen]);

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

  const currentTagNames = resource.tags.map((t) => t.name);

  const handleAddTag = async (name: string) => {
    if (currentTagNames.includes(name)) return;
    try {
      await api.updateResourceTags(resource.id, [...currentTagNames, name]);
      setTagSearch("");
      onResourceUpdate();
    } catch (err) {
      console.error("Failed to add tag:", err);
    }
  };

  const handleRemoveTag = async (name: string) => {
    try {
      await api.updateResourceTags(
        resource.id,
        currentTagNames.filter((t) => t !== name)
      );
      onResourceUpdate();
    } catch (err) {
      console.error("Failed to remove tag:", err);
    }
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && tagSearch.trim()) {
      e.preventDefault();
      handleAddTag(tagSearch.trim().toLowerCase());
    }
  };

  const filteredTags = allTags.filter(
    (t) =>
      !currentTagNames.includes(t.name) &&
      t.name.toLowerCase().includes(tagSearch.toLowerCase())
  );

  const domain = (() => {
    try {
      return new URL(resource.url).hostname.replace("www.", "");
    } catch {
      return resource.url;
    }
  })();

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-[50vw] sm:max-w-[50vw] p-0">
        {/* Header */}
        <SheetHeader className="border-b px-5 py-4">
          <SheetTitle className="text-base font-semibold leading-snug line-clamp-2">
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

        <ScrollArea className="flex-1 h-[calc(100vh-80px)]">
          <div className="p-5 space-y-0">
            {/* Property Rows */}
            <div className="rounded-lg border divide-y">
              {/* Status Row */}
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground w-24 shrink-0">
                  <Settings2 className="size-4" />
                  <span>Status</span>
                </div>
                <div className="flex-1">
                  <Select value={resource.status} onValueChange={handleStatusChange}>
                    <SelectTrigger className="h-8 text-xs border-0 bg-transparent shadow-none hover:bg-accent/50 -ml-2 px-2">
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
              </div>

              {/* Action Toggle Row */}
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground w-24 shrink-0">
                  <Zap className="size-4" />
                  <span>Action</span>
                </div>
                <div className="flex-1">
                  <Switch
                    checked={isAction}
                    onCheckedChange={handleToggleAction}
                  />
                </div>
              </div>

              {/* Tags Row */}
              <div className="flex items-start gap-3 px-4 py-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground w-24 shrink-0 pt-0.5">
                  <TagIcon className="size-4" />
                  <span>Tags</span>
                </div>
                <div className="flex-1 flex flex-wrap items-center gap-1.5">
                  {resource.tags.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant="secondary"
                      className="text-xs gap-1 pr-1"
                    >
                      {tag.name}
                      <button
                        onClick={() => handleRemoveTag(tag.name)}
                        className="ml-0.5 rounded-full hover:bg-muted-foreground/20 p-0.5"
                      >
                        <X className="size-3" />
                      </button>
                    </Badge>
                  ))}
                  <Popover open={tagPopoverOpen} onOpenChange={setTagPopoverOpen}>
                    <PopoverTrigger asChild>
                      <button className="inline-flex items-center justify-center size-6 rounded-md border border-dashed text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors">
                        <Plus className="size-3.5" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 p-2" align="start">
                      <Input
                        ref={tagInputRef}
                        value={tagSearch}
                        onChange={(e) => setTagSearch(e.target.value)}
                        onKeyDown={handleTagKeyDown}
                        placeholder="Search or create tag..."
                        className="h-8 text-xs mb-2"
                      />
                      <div className="max-h-32 overflow-y-auto space-y-0.5">
                        {filteredTags.map((tag) => (
                          <button
                            key={tag.id}
                            onClick={() => handleAddTag(tag.name)}
                            className="w-full text-left px-2 py-1.5 text-xs rounded-md hover:bg-accent transition-colors"
                          >
                            {tag.name}
                          </button>
                        ))}
                        {tagSearch.trim() &&
                          !allTags.some(
                            (t) => t.name.toLowerCase() === tagSearch.trim().toLowerCase()
                          ) && (
                            <button
                              onClick={() => handleAddTag(tagSearch.trim().toLowerCase())}
                              className="w-full text-left px-2 py-1.5 text-xs rounded-md hover:bg-accent transition-colors text-primary"
                            >
                              Create &quot;{tagSearch.trim().toLowerCase()}&quot;
                            </button>
                          )}
                        {filteredTags.length === 0 && !tagSearch.trim() && (
                          <p className="px-2 py-1.5 text-xs text-muted-foreground">
                            No tags yet
                          </p>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            {/* Summary */}
            {resource.summary && (
              <>
                <Separator className="my-4" />
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">Summary</p>
                  <p className="text-sm leading-relaxed">
                    {resource.summary}
                  </p>
                </div>
              </>
            )}

            {/* Notes */}
            <Separator className="my-4" />
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Notes</p>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add your notes..."
                className="min-h-[120px] text-sm resize-y"
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
            <Separator className="my-4" />
            <div className="space-y-1.5 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Clock className="size-3" />
                Created {new Date(resource.created_at).toLocaleDateString()}
              </div>
              {resource.review_count > 0 && (
                <div>
                  Reviewed {resource.review_count} time
                  {resource.review_count > 1 ? "s" : ""}
                </div>
              )}
              {resource.next_review_at && (
                <div>
                  Next review:{" "}
                  {new Date(resource.next_review_at).toLocaleDateString()}
                </div>
              )}
            </div>

            {/* Actions */}
            <Separator className="my-4" />
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleReview}
                className="text-xs"
              >
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
