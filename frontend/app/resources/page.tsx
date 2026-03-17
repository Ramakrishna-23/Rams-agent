"use client";

import { useState } from "react";
import { Resource } from "@/lib/types";
import { useResources } from "@/hooks/useResources";
import { ResourceCard } from "@/components/resource-card";
import { ResourceDetailPanel } from "@/components/resource-detail-panel";
import { Button } from "@/components/ui/button";
import { TagAutocompleteInput } from "@/components/tag-autocomplete-input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function ResourcesPage() {
  const {
    resources,
    total,
    loading,
    page,
    setPage,
    status,
    setStatus,
    tag,
    setTag,
    refresh,
  } = useResources();

  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  const totalPages = Math.ceil(total / 12);

  const handleCardClick = (resource: Resource) => {
    setSelectedResource(resource);
    setPanelOpen(true);
  };

  const handleResourceUpdate = () => {
    refresh();
    if (selectedResource) {
      const updated = resources.find((r) => r.id === selectedResource.id);
      if (updated) setSelectedResource(updated);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Resources</h1>
        <span className="text-sm text-muted-foreground">{total} total</span>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <TagAutocompleteInput
          value={tag || ""}
          onChange={(v) => { setTag(v || undefined); setPage(1); }}
          onSelect={(name) => { setTag(name); setPage(1); }}
          placeholder="Filter by tag..."
          className="sm:max-w-[200px]"
        />
        <Select
          value={status || "all"}
          onValueChange={(v) => {
            setStatus(v === "all" ? undefined : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="sm:w-[160px]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="unread">Unread</SelectItem>
            <SelectItem value="read">Read</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
            <SelectItem value="favorite">Favorite</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-lg" />
          ))}
        </div>
      ) : resources.length === 0 ? (
        <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
          No resources found
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {resources.map((resource) => (
            <ResourceCard
              key={resource.id}
              resource={resource}
              onClick={() => handleCardClick(resource)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            <ChevronLeft className="size-4" />
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
            <ChevronRight className="size-4" />
          </Button>
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
