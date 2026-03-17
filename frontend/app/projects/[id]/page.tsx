"use client";

import { useState, useEffect, useCallback, useRef, use } from "react";
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
  Timer,
  Square,
} from "lucide-react";

// ── Timer types ──────────────────────────────────────────────────────────────
interface RecentTimer { focus_min: number; rest_min: number }
type TimerPhase = "idle" | "focus" | "rest";

function pad(n: number) { return n.toString().padStart(2, "0"); }
function fmtCountdown(secs: number) {
  return `${pad(Math.floor(secs / 60))}:${pad(secs % 60)}`;
}

// ── Timer widget ─────────────────────────────────────────────────────────────
function TimerWidget({ projectId }: { projectId: string }) {
  const [focusMin, setFocusMin] = useState(25);
  const [restMin, setRestMin] = useState(5);
  const [phase, setPhase] = useState<TimerPhase>("idle");
  const [remaining, setRemaining] = useState(0);
  const [startedAt, setStartedAt] = useState<Date | null>(null);
  const [logMsg, setLogMsg] = useState<string | null>(null);
  const [recentTimers, setRecentTimers] = useState<RecentTimer[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load recent timers from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("recentTimers");
      if (raw) setRecentTimers(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  const saveRecent = (fm: number, rm: number) => {
    const updated: RecentTimer[] = [
      { focus_min: fm, rest_min: rm },
      ...recentTimers.filter((t) => !(t.focus_min === fm && t.rest_min === rm)),
    ].slice(0, 5);
    setRecentTimers(updated);
    localStorage.setItem("recentTimers", JSON.stringify(updated));
  };

  const clearInterval_ = () => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
  };

  const logSession = useCallback(async (seconds: number, start: Date) => {
    const ended = new Date();
    try {
      await api.logTimeSession(projectId, {
        duration_seconds: seconds,
        started_at: start.toISOString(),
        ended_at: ended.toISOString(),
      });
      const mins = Math.round(seconds / 60);
      setLogMsg(`Session logged ✓ — ${mins}m focus`);
      setTimeout(() => setLogMsg(null), 4000);
    } catch (err) {
      console.error("Failed to log session:", err);
    }
  }, [projectId]);

  const startRest = useCallback(() => {
    setPhase("rest");
    setRemaining(restMin * 60);
    setStartedAt(null);
    clearInterval_();
    intervalRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval_();
          setPhase("idle");
          return 0;
        }
        return r - 1;
      });
    }, 1000);
  }, [restMin]);

  const handleStart = () => {
    if (phase !== "idle") return;
    saveRecent(focusMin, restMin);
    const secs = focusMin * 60;
    setPhase("focus");
    setRemaining(secs);
    const now = new Date();
    setStartedAt(now);
    clearInterval_();
    intervalRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval_();
          // Focus done naturally — log full session then start rest
          logSession(secs, now);
          startRest();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
  };

  const handleStop = () => {
    if (phase === "idle") return;
    clearInterval_();
    if (phase === "focus" && startedAt) {
      const elapsed = focusMin * 60 - remaining;
      if (elapsed > 0) logSession(elapsed, startedAt);
    }
    setPhase("idle");
    setRemaining(0);
    setStartedAt(null);
  };

  // Cleanup on unmount
  useEffect(() => () => clearInterval_(), []);

  const displaySecs = phase === "idle" ? focusMin * 60 : remaining;

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Timer className="size-4" />
        Focus Timer
      </div>

      {/* Config inputs */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <label className="text-xs text-muted-foreground whitespace-nowrap">Focus (min)</label>
          <Input
            type="number"
            min={1}
            value={focusMin}
            onChange={(e) => setFocusMin(Math.max(1, parseInt(e.target.value) || 1))}
            disabled={phase !== "idle"}
            className="w-16 h-7 text-xs text-center"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <label className="text-xs text-muted-foreground whitespace-nowrap">Rest (min)</label>
          <Input
            type="number"
            min={0}
            value={restMin}
            onChange={(e) => setRestMin(Math.max(0, parseInt(e.target.value) || 0))}
            disabled={phase !== "idle"}
            className="w-16 h-7 text-xs text-center"
          />
        </div>
      </div>

      {/* Countdown display */}
      <div className="flex items-center gap-4">
        <div className={`text-3xl font-mono font-bold tabular-nums ${
          phase === "focus" ? "text-blue-500" : phase === "rest" ? "text-emerald-500" : "text-foreground"
        }`}>
          {fmtCountdown(displaySecs)}
        </div>
        <div className="flex items-center gap-1.5">
          {phase === "idle" ? (
            <Button size="sm" className="h-8 gap-1.5" onClick={handleStart}>
              <PlayCircle className="size-4" />
              Start
            </Button>
          ) : (
            <Button size="sm" variant="destructive" className="h-8 gap-1.5" onClick={handleStop}>
              <Square className="size-3.5" />
              Stop
            </Button>
          )}
          {phase !== "idle" && (
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              phase === "focus" ? "bg-blue-500/10 text-blue-500" : "bg-emerald-500/10 text-emerald-500"
            }`}>
              {phase === "focus" ? "Focus" : "Rest"}
            </span>
          )}
        </div>
      </div>

      {/* Log message */}
      {logMsg && (
        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">{logMsg}</p>
      )}

      {/* Recent timers */}
      {recentTimers.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {recentTimers.map((t, i) => (
            <button
              key={i}
              onClick={() => { setFocusMin(t.focus_min); setRestMin(t.rest_min); }}
              disabled={phase !== "idle"}
              className="text-[11px] px-2 py-0.5 rounded-full border bg-muted/50 hover:bg-muted transition-colors disabled:opacity-50"
            >
              {t.focus_min}m / {t.rest_min}m
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

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

      {/* Timer widget */}
      <TimerWidget projectId={id} />

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
