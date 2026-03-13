"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { Resource, isActionResource } from "@/lib/types";
import { ResourceCard } from "@/components/resource-card";
import { ResourceDetailPanel } from "@/components/resource-detail-panel";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Clock,
  Zap,
  PlayCircle,
  CheckCircle2,
  ArchiveIcon,
} from "lucide-react";
import { NewCardSection } from "@/components/new-card-section";

interface KanbanColumn {
  id: string;
  title: string;
  icon: React.ReactNode;
  status: string;
  color: string;
}

const columns: KanbanColumn[] = [
  {
    id: "about_to_do",
    title: "About to Do",
    icon: <Clock className="size-4" />,
    status: "about_to_do",
    color: "border-t-sky-500",
  },
  {
    id: "lets_do",
    title: "Let's Do",
    icon: <Zap className="size-4" />,
    status: "lets_do",
    color: "border-t-blue-500",
  },
  {
    id: "doing",
    title: "Doing",
    icon: <PlayCircle className="size-4" />,
    status: "doing",
    color: "border-t-orange-500",
  },
  {
    id: "done",
    title: "Done",
    icon: <CheckCircle2 className="size-4" />,
    status: "done",
    color: "border-t-emerald-500",
  },
  {
    id: "archive",
    title: "Archive",
    icon: <ArchiveIcon className="size-4" />,
    status: "archive",
    color: "border-t-muted-foreground",
  },
];

export default function ActionsPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedResource, setDraggedResource] = useState<Resource | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  const fetchAllResources = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getResources(1, undefined, undefined);
      let allItems = [...data.items];
      if (data.total > data.page_size) {
        const totalPages = Math.ceil(data.total / data.page_size);
        const promises = [];
        for (let p = 2; p <= Math.min(totalPages, 5); p++) {
          promises.push(api.getResources(p));
        }
        const results = await Promise.all(promises);
        allItems = [...allItems, ...results.flatMap((r) => r.items)];
      }
      setResources(allItems);
    } catch (err) {
      console.error("Failed to fetch resources:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllResources();
  }, [fetchAllResources]);

  const handleDragStart = (resource: Resource) => {
    setDraggedResource(resource);
    setPanelOpen(false);
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    setDragOverColumn(columnId);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = async (columnId: string) => {
    setDragOverColumn(null);
    if (!draggedResource || draggedResource.status === columnId) {
      setDraggedResource(null);
      return;
    }
    try {
      await api.updateResource(draggedResource.id, { status: columnId });
      setResources((prev) =>
        prev.map((r) =>
          r.id === draggedResource.id ? { ...r, status: columnId } : r
        )
      );
    } catch (err) {
      console.error("Failed to update resource status:", err);
    } finally {
      setDraggedResource(null);
    }
  };

  const handleCardClick = (resource: Resource) => {
    setSelectedResource(resource);
    setPanelOpen(true);
  };

  const handleResourceUpdate = () => {
    fetchAllResources();
    if (selectedResource) {
      api.getResource(selectedResource.id).then(setSelectedResource).catch(() => {
        setPanelOpen(false);
        setSelectedResource(null);
      });
    }
  };

  const actionResources = resources.filter(isActionResource);

  const getColumnResources = (status: string) =>
    actionResources
      .filter((r) => r.status === status)
      .sort((a, b) => {
        // Sort by priority first (lower number = higher priority), nulls last
        const pa = a.priority ?? 99;
        const pb = b.priority ?? 99;
        if (pa !== pb) return pa - pb;
        // Then by due date (sooner first), nulls last
        if (a.due_at && b.due_at) return new Date(a.due_at).getTime() - new Date(b.due_at).getTime();
        if (a.due_at) return -1;
        if (b.due_at) return 1;
        return 0;
      });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Actions</h1>
        <span className="text-sm text-muted-foreground">
          {actionResources.length} action items
        </span>
      </div>

      <NewCardSection defaultAction={true} onCreated={fetchAllResources} className="xl:w-[calc(60%-0.8rem)] md:w-[calc(66.67%-0.67rem)]" />

      {/* Kanban Board */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {columns.map((col) => {
          const colResources = getColumnResources(col.status);
          return (
            <div
              key={col.id}
              className={`flex flex-col rounded-lg border border-t-4 bg-card/50 transition-colors ${col.color} ${
                dragOverColumn === col.id ? "ring-2 ring-primary/50 bg-accent/30" : ""
              }`}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDragLeave={handleDragLeave}
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
                      <Skeleton className="h-24 w-full rounded-lg" />
                      <Skeleton className="h-24 w-full rounded-lg" />
                    </>
                  ) : colResources.length === 0 ? (
                    <div className="flex h-[200px] items-center justify-center text-xs text-muted-foreground">
                      No items
                    </div>
                  ) : (
                    colResources.map((resource) => (
                      <div
                        key={resource.id}
                        draggable
                        onDragStart={() => handleDragStart(resource)}
                        className="cursor-grab active:cursor-grabbing"
                      >
                        <ResourceCard
                          resource={resource}
                          compact
                          onClick={() => handleCardClick(resource)}
                        />
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          );
        })}
      </div>

      <ResourceDetailPanel
        resource={selectedResource}
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        onResourceUpdate={handleResourceUpdate}
      />
    </div>
  );
}
