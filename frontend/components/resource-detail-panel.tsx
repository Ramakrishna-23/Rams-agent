"use client";

import { useState, useEffect, useRef } from "react";
import {
  Resource,
  Tag,
  Subtask,
  READING_STATUSES,
  ACTION_STATUSES,
  isActionResource,
  PRIORITY_LABELS,
  PRIORITY_COLORS,
  RECURRENCE_OPTIONS,
} from "@/lib/types";
import { api } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
  Flag,
  CalendarDays,
  Repeat,
  CheckSquare,
} from "lucide-react";

const statusLabels: Record<string, string> = {
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
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
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

  const isInbox = resource.status === "inbox";
  const isAction = isActionResource(resource);
  const allStatuses = ["inbox", ...READING_STATUSES, ...ACTION_STATUSES] as const;
  const statuses = isInbox ? allStatuses : isAction ? ACTION_STATUSES : READING_STATUSES;

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

  const handlePriorityChange = async (value: string) => {
    const priority = value === "none" ? null : parseInt(value);
    try {
      await api.updateResource(resource.id, { priority } as any);
      onResourceUpdate();
    } catch (err) {
      console.error("Failed to update priority:", err);
    }
  };

  const handleDueDateChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const due_at = e.target.value ? new Date(e.target.value).toISOString() : null;
    try {
      await api.updateResource(resource.id, { due_at } as any);
      onResourceUpdate();
    } catch (err) {
      console.error("Failed to update due date:", err);
    }
  };

  const handleRecurrenceChange = async (value: string) => {
    const recurrence_rule = value === "none" ? null : value;
    try {
      await api.updateResource(resource.id, { recurrence_rule } as any);
      onResourceUpdate();
    } catch (err) {
      console.error("Failed to update recurrence:", err);
    }
  };

  const handleAddSubtask = async () => {
    if (!newSubtaskTitle.trim()) return;
    try {
      await api.createSubtask(resource.id, newSubtaskTitle.trim(), (resource.subtasks?.length || 0));
      setNewSubtaskTitle("");
      onResourceUpdate();
    } catch (err) {
      console.error("Failed to add subtask:", err);
    }
  };

  const handleToggleSubtask = async (subtask: Subtask) => {
    try {
      await api.updateSubtask(subtask.id, { is_done: !subtask.is_done });
      onResourceUpdate();
    } catch (err) {
      console.error("Failed to toggle subtask:", err);
    }
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    try {
      await api.deleteSubtask(subtaskId);
      onResourceUpdate();
    } catch (err) {
      console.error("Failed to delete subtask:", err);
    }
  };

  const handleSubtaskKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddSubtask();
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
    if (!resource.url) return "Note";
    try {
      return new URL(resource.url).hostname.replace("www.", "");
    } catch {
      return resource.url;
    }
  })();

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl w-full p-0 max-h-[90vh] flex flex-col">
        {/* Header */}
        <DialogHeader className="border-b px-5 py-4">
          <DialogTitle className="text-base font-semibold leading-snug line-clamp-2">
            {resource.title || "Untitled"}
          </DialogTitle>
          <DialogDescription asChild>
            {resource.url ? (
              <a
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary truncate"
              >
                <ExternalLink className="size-3 shrink-0" />
                {domain}
              </a>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                Note
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-auto max-h-[calc(90vh-80px)]">
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

              {/* Priority Row */}
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground w-24 shrink-0">
                  <Flag className="size-4" />
                  <span>Priority</span>
                </div>
                <div className="flex-1">
                  <Select
                    value={resource.priority ? String(resource.priority) : "none"}
                    onValueChange={handlePriorityChange}
                  >
                    <SelectTrigger className="h-8 text-xs border-0 bg-transparent shadow-none hover:bg-accent/50 -ml-2 px-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="1">
                        <span className="flex items-center gap-2"><span className="size-2 rounded-full bg-red-500" /> Urgent</span>
                      </SelectItem>
                      <SelectItem value="2">
                        <span className="flex items-center gap-2"><span className="size-2 rounded-full bg-orange-500" /> High</span>
                      </SelectItem>
                      <SelectItem value="3">
                        <span className="flex items-center gap-2"><span className="size-2 rounded-full bg-blue-500" /> Medium</span>
                      </SelectItem>
                      <SelectItem value="4">
                        <span className="flex items-center gap-2"><span className="size-2 rounded-full bg-gray-400" /> Low</span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Due Date Row */}
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground w-24 shrink-0">
                  <CalendarDays className="size-4" />
                  <span>Due</span>
                </div>
                <div className="flex-1">
                  <input
                    type="datetime-local"
                    value={resource.due_at ? new Date(resource.due_at).toISOString().slice(0, 16) : ""}
                    onChange={handleDueDateChange}
                    className="h-8 text-xs bg-transparent border-0 hover:bg-accent/50 rounded-md px-2 w-full outline-none"
                  />
                </div>
              </div>

              {/* Recurrence Row */}
              {isAction && (
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground w-24 shrink-0">
                    <Repeat className="size-4" />
                    <span>Repeat</span>
                  </div>
                  <div className="flex-1">
                    <Select
                      value={resource.recurrence_rule || "none"}
                      onValueChange={handleRecurrenceChange}
                    >
                      <SelectTrigger className="h-8 text-xs border-0 bg-transparent shadow-none hover:bg-accent/50 -ml-2 px-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekdays">Weekdays</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
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

            {/* Subtasks */}
            <Separator className="my-4" />
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckSquare className="size-3.5 text-muted-foreground" />
                <p className="text-xs font-medium text-muted-foreground">
                  Subtasks
                  {resource.subtasks?.length > 0 && (
                    <span className="ml-1">
                      ({resource.subtasks.filter((s) => s.is_done).length}/{resource.subtasks.length})
                    </span>
                  )}
                </p>
              </div>
              <div className="space-y-1">
                {(resource.subtasks || []).map((subtask) => (
                  <div key={subtask.id} className="flex items-center gap-2 group">
                    <input
                      type="checkbox"
                      checked={subtask.is_done}
                      onChange={() => handleToggleSubtask(subtask)}
                      className="size-4 rounded border-border accent-primary cursor-pointer"
                    />
                    <span className={`flex-1 text-sm ${subtask.is_done ? "line-through text-muted-foreground" : ""}`}>
                      {subtask.title}
                    </span>
                    <button
                      onClick={() => handleDeleteSubtask(subtask.id)}
                      className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-muted transition-all"
                    >
                      <X className="size-3 text-muted-foreground" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  onKeyDown={handleSubtaskKeyDown}
                  placeholder="Add subtask..."
                  className="h-7 text-xs flex-1"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleAddSubtask}
                  disabled={!newSubtaskTitle.trim()}
                  className="h-7 px-2"
                >
                  <Plus className="size-3" />
                </Button>
              </div>
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
      </DialogContent>
    </Dialog>
  );
}
