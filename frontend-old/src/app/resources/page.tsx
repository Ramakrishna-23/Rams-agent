"use client";

import { useResources } from "@/hooks/useResources";
import { ResourceCard } from "@/components/ResourceCard";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

const statuses = ["all", "unread", "read", "archived", "favorite"];

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
  } = useResources();

  const totalPages = Math.ceil(total / 12);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Resources</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Browse and manage your saved resources
        </p>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Filter by tag..."
            value={tag || ""}
            onChange={(e) => {
              setTag(e.target.value || undefined);
              setPage(1);
            }}
            className="input w-full pl-10"
          />
        </div>
        <select
          value={status || "all"}
          onChange={(e) => {
            setStatus(e.target.value === "all" ? undefined : e.target.value);
            setPage(1);
          }}
          className="input"
        >
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Resource Grid */}
      {loading ? (
        <div className="py-12 text-center text-sm text-zinc-400">
          Loading resources...
        </div>
      ) : resources.length === 0 ? (
        <div className="card py-12 text-center text-sm text-zinc-400">
          No resources found. Try adjusting your filters or save a new resource.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {resources.map((r) => (
            <ResourceCard key={r.id} resource={r} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="btn-secondary flex items-center gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </button>
          <span className="text-sm text-zinc-400">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            className="btn-secondary flex items-center gap-1"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
