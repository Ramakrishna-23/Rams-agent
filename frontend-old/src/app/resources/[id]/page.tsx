"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Resource } from "@/lib/types";
import {
  ArrowLeft,
  ExternalLink,
  Trash2,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Save,
} from "lucide-react";

const statuses = ["unread", "read", "archived", "favorite"];

export default function ResourceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

  const [resource, setResource] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [notesChanged, setNotesChanged] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getResource(id);
        setResource(data);
        setNotes(data.notes || "");
      } catch (err) {
        console.error("Failed to load resource:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const handleStatusChange = async (newStatus: string) => {
    if (!resource) return;
    try {
      const updated = await api.updateResource(id, { status: newStatus });
      setResource(updated);
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const handleSaveNotes = async () => {
    setSaving(true);
    try {
      const updated = await api.updateResource(id, { notes });
      setResource(updated);
      setNotesChanged(false);
    } catch (err) {
      console.error("Failed to save notes:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleReview = async () => {
    try {
      const updated = await api.reviewResource(id);
      setResource(updated);
    } catch (err) {
      console.error("Failed to review resource:", err);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this resource?")) return;
    try {
      await api.deleteResource(id);
      router.push("/resources");
    } catch (err) {
      console.error("Failed to delete resource:", err);
    }
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-sm text-zinc-400">
        Loading resource...
      </div>
    );
  }

  if (!resource) {
    return (
      <div className="py-12 text-center text-sm text-zinc-400">
        Resource not found.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Back button */}
      <button
        onClick={() => router.push("/resources")}
        className="flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-zinc-100"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Resources
      </button>

      {/* Header */}
      <div className="card space-y-4">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-xl font-bold">{resource.title || "Untitled"}</h1>
          <select
            value={resource.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="input text-sm"
          >
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <a
          href={resource.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300"
        >
          <ExternalLink className="h-4 w-4" />
          {resource.url}
        </a>

        {/* Tags */}
        {resource.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {resource.tags.map((tag) => (
              <span
                key={tag.id}
                className="badge bg-blue-500/20 text-blue-400"
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}

        <div className="text-xs text-zinc-500">
          Saved on{" "}
          {new Date(resource.created_at).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}{" "}
          | Reviewed {resource.review_count} time
          {resource.review_count !== 1 ? "s" : ""}
          {resource.next_review_at && (
            <>
              {" "}
              | Next review:{" "}
              {new Date(resource.next_review_at).toLocaleDateString()}
            </>
          )}
        </div>
      </div>

      {/* Summary */}
      {resource.summary && (
        <div className="card">
          <h2 className="mb-2 text-sm font-semibold text-zinc-300">Summary</h2>
          <p className="text-sm leading-relaxed text-zinc-400">
            {resource.summary}
          </p>
        </div>
      )}

      {/* Scraped Content (Collapsible) */}
      <div className="card">
        <button
          onClick={() => setShowContent(!showContent)}
          className="flex w-full items-center justify-between text-sm font-semibold text-zinc-300"
        >
          Scraped Content
          {showContent ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
        {showContent && (
          <div className="mt-3 max-h-96 overflow-auto rounded-lg bg-zinc-900 p-4 text-sm leading-relaxed text-zinc-400">
            {(resource as any).content || "No content available."}
          </div>
        )}
      </div>

      {/* Notes */}
      <div className="card">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-300">Notes</h2>
          {notesChanged && (
            <button
              onClick={handleSaveNotes}
              disabled={saving}
              className="btn-primary flex items-center gap-1 text-xs"
            >
              <Save className="h-3 w-3" />
              {saving ? "Saving..." : "Save Notes"}
            </button>
          )}
        </div>
        <textarea
          value={notes}
          onChange={(e) => {
            setNotes(e.target.value);
            setNotesChanged(true);
          }}
          placeholder="Add your notes here..."
          rows={4}
          className="input w-full resize-y"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button onClick={handleReview} className="btn-primary flex items-center gap-2">
          <CheckCircle className="h-4 w-4" />
          Mark as Reviewed
        </button>
        <button onClick={handleDelete} className="btn-danger flex items-center gap-2">
          <Trash2 className="h-4 w-4" />
          Delete
        </button>
      </div>
    </div>
  );
}
