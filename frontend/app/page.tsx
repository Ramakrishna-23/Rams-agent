"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { Resource, isReadingResource } from "@/lib/types";
import { ResourceCard } from "@/components/resource-card";
import { ResourceDetailPanel } from "@/components/resource-detail-panel";
import { NewCardSection } from "@/components/new-card-section";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BookOpen,
  Eye,
  Star,
  Archive,
} from "lucide-react";

interface KanbanColumn {
  id: string;
  title: string;
  icon: React.ReactNode;
  status: string;
  color: string;
}

const columns: KanbanColumn[] = [
  {
    id: "unread",
    title: "Yet to Read",
    icon: <BookOpen className="size-4" />,
    status: "unread",
    color: "border-t-amber-500",
  },
  {
    id: "read",
    title: "Read",
    icon: <Eye className="size-4" />,
    status: "read",
    color: "border-t-emerald-500",
  },
  {
    id: "favorite",
    title: "Favorites",
    icon: <Star className="size-4" />,
    status: "favorite",
    color: "border-t-purple-500",
  },
  {
    id: "archived",
    title: "Archived",
    icon: <Archive className="size-4" />,
    status: "archived",
    color: "border-t-muted-foreground",
  },
];

export default function DashboardPage() {
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

  const readingResources = resources.filter(isReadingResource);

  const getColumnResources = (status: string) =>
    readingResources.filter((r) => r.status === status);

  const stats = {
    total: readingResources.length,
    unread: getColumnResources("unread").length,
    favorites: getColumnResources("favorite").length,
    archived: getColumnResources("archived").length,
  };

  return (
    <div className="space-y-6">
      {/* New Card Section */}
      <NewCardSection defaultAction={false} onCreated={fetchAllResources} />

      {/* Kanban Board */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
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

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-xs text-muted-foreground">Total Resources</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-amber-500">{stats.unread}</div>
            <div className="text-xs text-muted-foreground">Yet to Read</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-500">{stats.favorites}</div>
            <div className="text-xs text-muted-foreground">Favorites</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-muted-foreground">{stats.archived}</div>
            <div className="text-xs text-muted-foreground">Archived</div>
          </CardContent>
        </Card>
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
