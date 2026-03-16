"use client";

import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { ProjectWithResources, Resource, Subtask } from "@/lib/types";
import { ResourceDetailPanel } from "@/components/resource-detail-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Plus,
  Clock,
  Zap,
  PlayCircle,
  CheckCircle2,
  ArchiveIcon,
} from "lucide-react";

const columns = [
  { id: "about_to_do", title: "About to Do", icon: <Clock className="size-4" />, color: "border-t-sky-500" },
  { id: "lets_do",     title: "Let's Do",    icon: <Zap className="size-4" />,   color: "border-t-blue-500" },
  { id: "doing",       title: "Doing",       icon: <PlayCircle className="size-4" />, color: "border-t-orange-500" },
  { id: "done",        title: "Done",        icon: <CheckCircle2 className="size-4" />, color: "border-t-emerald-500" },
  { id: "archive",     title: "Archive",     icon: <ArchiveIcon className="size-4" />, color: "border-t-muted-foreground" },
];

interface PageParams { id: string }

export default function ProjectDetailPage({ params }: { params: Promise<PageParams> }) {
  const { id } = use(params);
  const [project, setProject] = useState<ProjectWithResources | null>(null);
  const [loading, setLoading] = useState(true);
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [addingTask, setAddingTask] = useState(false);
  const [draggedResource, setDraggedResource] = useState<Resource | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
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

  useEffect(() => { fetchProject(); }, [fetchProject]);

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

  const handleToggleSubtask = async (e: React.MouseEvent, subtask: Subtask) => {
    e.stopPropagation();
    try {
      await api.updateSubtask(subtask.id, { is_done: !subtask.is_done });
      fetchProject();
    } catch (err) {
      console.error("Failed to toggle subtask:", err);
    }
  };

  const handleCardClick = async (resource: Resource) => {
    try {
      const full = await api.getResource(resource.id);
      setSelectedResource(full);
      setPanelOpen(true);
    } catch (err) {
      console.error("Failed to fetch resource:", err);
    }
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

  const handleDragStart = (resource: Resource) => {
    setDraggedResource(resource);
    setPanelOpen(false);
  };

  const handleDragOver = (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    setDragOverColumn(colId);
  };

  const handleDrop = async (colId: string) => {
    setDragOverColumn(null);
    if (!draggedResource || draggedResource.status === colId) {
      setDraggedResource(null);
      return;
    }
    try {
      await api.updateResource(draggedResource.id, { status: colId });
      setProject((prev) =>
        prev
          ? { ...prev, resources: prev.resources.map((r) => r.id === draggedResource.id ? { ...r, status: colId } : r) }
          : prev
      );
    } catch (err) {
      console.error("Failed to move task:", err);
    } finally {
      setDraggedResource(null);
    }
  };

  const getColumnResources = (status: string) =>
    (project?.resources ?? []).filter((r) => r.status === status);

  if (!project && loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 rounded bg-muted animate-pulse" />
        <div className="grid grid-cols-5 gap-4">
          {[1,2,3,4,5].map((i) => <Skeleton key={i} className="h-48 rounded-lg" />)}
        </div>
      </div>
    );
  }

  if (!project) {
    return <div className="text-center py-24 text-muted-foreground text-sm">Project not found.</div>;
  }

  const totalTasks = project.resources.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link href="/projects">
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground h-8 px-2">
            <ArrowLeft className="size-4" />
            Projects
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {project.color && (
              <span className="size-3 rounded-full shrink-0" style={{ backgroundColor: project.color }} />
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
        <span className="text-sm text-muted-foreground ml-auto">
          {totalTasks} {totalTasks === 1 ? "task" : "tasks"}
        </span>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {columns.map((col) => {
          const colResources = getColumnResources(col.id);
          return (
            <div
              key={col.id}
              className={`flex flex-col rounded-lg border border-t-4 bg-card/50 transition-colors ${col.color} ${
                dragOverColumn === col.id ? "ring-2 ring-primary/50 bg-accent/30" : ""
              }`}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDragLeave={() => setDragOverColumn(null)}
              onDrop={() => handleDrop(col.id)}
            >
              <div className="flex items-center justify-between p-3 pb-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  {col.icon}
                  {col.title}
                </div>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {colResources.length}
                </span>
              </div>

              <ScrollArea className="flex-1 px-2 pb-2">
                <div className="space-y-2 p-1" style={{ minHeight: "200px" }}>
                  {loading ? (
                    <>
                      <Skeleton className="h-20 w-full rounded-lg" />
                      <Skeleton className="h-20 w-full rounded-lg" />
                    </>
                  ) : colResources.length === 0 ? (
                    <div className="flex h-[200px] items-center justify-center text-xs text-muted-foreground">
                      No tasks
                    </div>
                  ) : (
                    colResources.map((resource) => {
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
                          draggable
                          onDragStart={() => handleDragStart(resource)}
                          onClick={() => handleCardClick(resource)}
                          className="cursor-pointer rounded-lg border bg-card p-3 hover:border-primary/50 hover:bg-accent/50 transition-colors cursor-grab active:cursor-grabbing"
                        >
                          <p className="text-xs font-medium leading-snug line-clamp-2 mb-1">
                            {resource.title || "Untitled"}
                          </p>
                          {resource.due_at && (
                            <p className={`text-[10px] mb-1.5 ${isOverdue ? "text-red-500" : "text-muted-foreground"}`}>
                              Due {new Date(resource.due_at).toLocaleDateString()}
                            </p>
                          )}
                          {subtasks.length > 0 && (
                            <div className="mt-1.5 space-y-1">
                              {subtasks.slice(0, 3).map((subtask) => (
                                <div
                                  key={subtask.id}
                                  className="flex items-center gap-1.5"
                                  onClick={(e) => handleToggleSubtask(e, subtask)}
                                >
                                  <input
                                    type="checkbox"
                                    checked={subtask.is_done}
                                    onChange={() => {}}
                                    className="size-3 rounded border-border accent-primary cursor-pointer shrink-0"
                                  />
                                  <span className={`text-[10px] truncate ${subtask.is_done ? "line-through text-muted-foreground" : ""}`}>
                                    {subtask.title}
                                  </span>
                                </div>
                              ))}
                              {subtasks.length > 3 && (
                                <p className="text-[10px] text-muted-foreground">+{subtasks.length - 3} more</p>
                              )}
                              <Progress value={progress} className="h-1 mt-1" />
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </div>
          );
        })}
      </div>

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
            <Button variant="outline" size="sm" onClick={() => setAddTaskOpen(false)}>Cancel</Button>
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
