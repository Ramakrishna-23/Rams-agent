"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { Resource } from "@/lib/types";
import { ResourceCard } from "@/components/resource-card";
import { ResourceDetailPanel } from "@/components/resource-detail-panel";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Zap, Inbox } from "lucide-react";

export default function InboxPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  const fetchInbox = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getResources(1, "inbox");
      let allItems = [...data.items];
      if (data.total > data.page_size) {
        const totalPages = Math.ceil(data.total / data.page_size);
        const promises = [];
        for (let p = 2; p <= Math.min(totalPages, 10); p++) {
          promises.push(api.getResources(p, "inbox"));
        }
        const results = await Promise.all(promises);
        allItems = [...allItems, ...results.flatMap((r) => r.items)];
      }
      setResources(allItems);
    } catch (err) {
      console.error("Failed to fetch inbox:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInbox();
  }, [fetchInbox]);

  const handleCategorize = async (id: string, status: "unread" | "about_to_do") => {
    try {
      await api.updateResource(id, { status });
      setResources((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error("Failed to categorize:", err);
    }
  };

  const handleCardClick = (resource: Resource) => {
    setSelectedResource(resource);
    setPanelOpen(true);
  };

  const handleResourceUpdate = () => {
    fetchInbox();
    if (selectedResource) {
      api.getResource(selectedResource.id).then(setSelectedResource).catch(() => {
        setPanelOpen(false);
        setSelectedResource(null);
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Inbox</h1>
        <p className="text-sm text-muted-foreground">
          Triage new items — send them to Reading or Actions
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      ) : resources.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Inbox className="size-12 text-muted-foreground/50 mb-4" />
          <h2 className="text-lg font-medium">All caught up!</h2>
          <p className="text-sm text-muted-foreground">Your inbox is empty.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {resources.map((resource) => (
            <div
              key={resource.id}
              className="flex items-center gap-3"
            >
              <div className="flex-1 min-w-0">
                <ResourceCard
                  resource={resource}
                  onClick={() => handleCardClick(resource)}
                />
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-400"
                  onClick={() => handleCategorize(resource.id, "unread")}
                >
                  <BookOpen className="size-4 mr-1.5" />
                  Read
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-sky-500 border-sky-500/30 hover:bg-sky-500/10 hover:text-sky-400"
                  onClick={() => handleCategorize(resource.id, "about_to_do")}
                >
                  <Zap className="size-4 mr-1.5" />
                  Action
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ResourceDetailPanel
        resource={selectedResource}
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        onResourceUpdate={handleResourceUpdate}
      />
    </div>
  );
}
