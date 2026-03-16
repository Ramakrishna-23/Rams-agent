"use client";

import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { ProjectWithResources, Resource, Subtask } from "@/lib/types";
import { ResourceDetailPanel } from "@/components/resource-detail-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Plus, CheckSquare } from "lucide-react";

const statusLabels: Record<string, string> = {
  about_to_do: "About to Do",
  lets_do: "Let's Do",
  doing: "Doing",
  done: "Done",
  archive: "Archive",
};

const statusColors: Record<string, string> = {
  about_to_do: "bg-sky-500/10 text-sky-500 border-sky-500/20",
  lets_do: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  doing: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  done: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  archive: "bg-muted text-muted-foreground",
};

interface PageParams {
  id: string;
}

export default function ProjectDetailPage({ params }: { params: Promise<PageParams> }) {
  const { id } = use(params);
  const [project, setProject] = useState<ProjectWithResources | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [addingTask, setAddingTask] = useState(false);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  const fetchProject = useCallback(async () => {
    try {
      const data = await api.getProject(id);
      setProject(data);
    } catch (err) {
      console.error("Failed to fetch project:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;
    setAddingTask(true);
    try {
      const resource = await api.createAction(null, newTaskTitle.trim());
      await api.updateResource(resource.id, { project_id: id } as any);
      setNewTaskTitle("");
      setAddTaskOpen(false);
      fetchProject();
    } catch (err) {
      console.error("Failed to add task:", err);
    } finally {
      setAddingTask(false);
    }
  };

  const handleToggleSubtask = async (subtask: Subtask) => {
    try {
      await api.updateSubtask(subtask.id, { is_done: !subtask.is_done });
      fetchProject();
    } catch (err) {
      console.error("Failed to toggle subtask:", err);
    }
  };

  const handleCardClick = (resource: Resource) => {
    setSelectedResource(resource);
    setPanelOpen(true);
  };

  const handleResourceUpdate = () => {
    fetchProject();
    if (selectedResource) {
      api.getResource(selectedResource.id).then(setSelectedResource).catch(() => {
        setPanelOpen(false);
        setSelectedResource(null);
      });
    }
  };

  const filteredResources = (project?.resources ?? []).filter(
    (r) => filterStatus === "all" || r.status === filterStatus
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 rounded bg-muted animate-pulse" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 rounded-lg border bg-card animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-24 text-muted-foreground text-sm">Project not found.</div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link href="/projects" className="mt-0.5">
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground h-8 px-2">
            <ArrowLeft className="size-4" />
            Projects
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {project.color && (
              <span
                className="size-3 rounded-full shrink-0"
                style={{ backgroundColor: project.color }}
              />
            )}
            <h1 className="text-xl font-semibold truncate">{project.name}</h1>
          </div>
          {project.description && (
            <p className="mt-1 text-sm text-muted-foreground">{project.description}</p>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <Button size="sm" onClick={() => setAddTaskOpen(true)}>
          <Plus className="size-4 mr-1" />
          Add Task
        </Button>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="h-8 w-40 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="about_to_do">About to Do</SelectItem>
            <SelectItem value="lets_do">Let&apos;s Do</SelectItem>
            <SelectItem value="doing">Doing</SelectItem>
            <SelectItem value="done">Done</SelectItem>
            <SelectItem value="archive">Archive</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground ml-auto">
          {filteredResources.length} {filteredResources.length === 1 ? "task" : "tasks"}
        </span>
      </div>

      {/* Task Grid */}
      {filteredResources.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <CheckSquare className="size-10 text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">No tasks yet.</p>
          <Button size="sm" className="mt-3" onClick={() => setAddTaskOpen(true)}>
            <Plus className="size-4 mr-1" />
            Add first task
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredResources.map((resource) => {
            const subtasks = resource.subtasks || [];
            const doneCount = subtasks.filter((s) => s.is_done).length;
            const progress = subtasks.length > 0 ? (doneCount / subtasks.length) * 100 : 0;
            const isOverdue =
              resource.due_at &&
              new Date(resource.due_at) < new Date() &&
              !["done", "archive"].includes(resource.status);

            return (
              <div
                key={resource.id}
                onClick={() => handleCardClick(resource)}
                className="cursor-pointer rounded-lg border bg-card hover:border-primary/50 hover:bg-accent/30 transition-colors"
              >
                {/* Card Header */}
                <div className="flex items-start justify-between gap-2 p-4 pb-2">
                  <h3 className="text-sm font-medium leading-snug line-clamp-2 flex-1">
                    {resource.title || "Untitled"}
                  </h3>
                  <Badge
                    variant="outline"
                    className={`text-[10px] shrink-0 ${statusColors[resource.status] ?? ""}`}
                  >
                    {statusLabels[resource.status] ?? resource.status}
                  </Badge>
                </div>
                {resource.due_at && (
                  <p
                    className={`px-4 text-[11px] ${
                      isOverdue ? "text-red-500" : "text-muted-foreground"
                    }`}
                  >
                    Due {new Date(resource.due_at).toLocaleDateString()}
                  </p>
                )}

                {/* Subtasks */}
                {subtasks.length > 0 && (
                  <div className="px-4 pb-3 pt-2 border-t mt-2 space-y-1.5">
                    {subtasks.slice(0, 4).map((subtask) => (
                      <div
                        key={subtask.id}
                        className="flex items-center gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={subtask.is_done}
                          onChange={() => handleToggleSubtask(subtask)}
                          className="size-3.5 rounded border-border accent-primary cursor-pointer shrink-0"
                        />
                        <span
                          className={`text-xs flex-1 truncate ${
                            subtask.is_done ? "line-through text-muted-foreground" : ""
                          }`}
                        >
                          {subtask.title}
                        </span>
                      </div>
                    ))}
                    {subtasks.length > 4 && (
                      <p className="text-[10px] text-muted-foreground">
                        +{subtasks.length - 4} more
                      </p>
                    )}
                    <div className="pt-1 space-y-1">
                      <Progress value={progress} className="h-1.5" />
                      <p className="text-[10px] text-muted-foreground">
                        {doneCount}/{subtasks.length} done
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Task Dialog */}
      <Dialog open={addTaskOpen} onOpenChange={setAddTaskOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Task</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Input
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
              placeholder="Task title..."
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setAddTaskOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleAddTask} disabled={addingTask || !newTaskTitle.trim()}>
              {addingTask ? "Adding..." : "Add Task"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ResourceDetailPanel
        resource={selectedResource}
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        onResourceUpdate={handleResourceUpdate}
      />
    </div>
  );
}
