"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Project } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { FolderKanban, Plus, Pencil, Trash2, Clock } from "lucide-react";

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  if (hrs === 0) return `${mins} min`;
  if (remMins === 0) return `${hrs} hr`;
  return `${hrs} hr ${remMins} min`;
}

const COLOR_SWATCHES = [
  "#6497D6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
];

interface ProjectFormState {
  name: string;
  description: string;
  color: string | null;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [form, setForm] = useState<ProjectFormState>({ name: "", description: "", color: null });
  const [saving, setSaving] = useState(false);

  const fetchProjects = async () => {
    try {
      const data = await api.getProjects();
      setProjects(data);
    } catch (err) {
      console.error("Failed to fetch projects:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const openCreate = () => {
    setEditingProject(null);
    setForm({ name: "", description: "", color: null });
    setDialogOpen(true);
  };

  const openEdit = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    e.preventDefault();
    setEditingProject(project);
    setForm({ name: project.name, description: project.description ?? "", color: project.color });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editingProject) {
        await api.updateProject(editingProject.id, {
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          color: form.color ?? undefined,
        });
      } else {
        await api.createProject({
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          color: form.color ?? undefined,
        });
      }
      setDialogOpen(false);
      fetchProjects();
    } catch (err) {
      console.error("Failed to save project:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.deleteProject(deleteTarget.id);
      setDeleteTarget(null);
      fetchProjects();
    } catch (err) {
      console.error("Failed to delete project:", err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Projects</h1>
        <Button size="sm" onClick={openCreate}>
          <Plus className="size-4 mr-1" />
          New Project
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 rounded-lg border bg-card animate-pulse" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <FolderKanban className="size-12 text-muted-foreground/40 mb-4" />
          <p className="text-sm text-muted-foreground">No projects yet.</p>
          <Button size="sm" className="mt-4" onClick={openCreate}>
            <Plus className="size-4 mr-1" />
            Create your first project
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <div
                className="group relative rounded-lg border border-t-4 bg-card p-4 hover:border-primary/50 hover:bg-accent/30 transition-colors cursor-pointer"
                style={{ borderTopColor: project.color ?? "hsl(var(--border))" }}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-medium text-sm leading-snug">{project.name}</h3>
                  <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => openEdit(e, project)}
                      className="p-1 rounded hover:bg-muted transition-colors"
                    >
                      <Pencil className="size-3.5 text-muted-foreground" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setDeleteTarget(project);
                      }}
                      className="p-1 rounded hover:bg-muted transition-colors"
                    >
                      <Trash2 className="size-3.5 text-muted-foreground" />
                    </button>
                  </div>
                </div>
                {project.description && (
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                    {project.description}
                  </p>
                )}
                <div className="mt-3 space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{project.done_count}/{project.resource_count} tasks done</span>
                    <span>
                      {project.resource_count > 0
                        ? Math.round((project.done_count / project.resource_count) * 100)
                        : 0}%
                    </span>
                  </div>
                  <Progress
                    value={project.resource_count > 0 ? (project.done_count / project.resource_count) * 100 : 0}
                    className="h-1.5"
                  />
                  {project.total_seconds > 0 && (
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground pt-0.5">
                      <Clock className="size-3" />
                      {formatDuration(project.total_seconds)}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingProject ? "Edit Project" : "New Project"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Name</label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Project name"
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Description</label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Optional description..."
                className="resize-none min-h-[80px] text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Color</label>
              <div className="flex items-center gap-2">
                {COLOR_SWATCHES.map((color) => (
                  <button
                    key={color}
                    onClick={() => setForm((f) => ({ ...f, color: f.color === color ? null : color }))}
                    className="size-7 rounded-full border-2 transition-all"
                    style={{
                      backgroundColor: color,
                      borderColor: form.color === color ? "hsl(var(--foreground))" : "transparent",
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving || !form.name.trim()}>
              {saving ? "Saving..." : editingProject ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete project?</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{deleteTarget?.name}&quot; will be deleted. Tasks in this project will remain
              but will be unassigned from it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
