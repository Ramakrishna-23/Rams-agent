"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Resource } from "@/lib/types";
import { BookOpen, Eye, Clock, Plus } from "lucide-react";
import { ResourceCard } from "@/components/ResourceCard";

export default function DashboardPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [url, setUrl] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getResources(1);
        setResources(data.items.slice(0, 5));
        setTotal(data.total);

        const unread = data.items.filter((r) => r.status === "unread").length;
        setUnreadCount(unread);

        const due = data.items.filter((r) => {
          if (!r.next_review_at) return false;
          return new Date(r.next_review_at) <= new Date();
        }).length;
        setReviewCount(due);
      } catch (err) {
        console.error("Failed to load dashboard:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setSaving(true);
    try {
      await api.createResource(url.trim());
      setUrl("");
      const data = await api.getResources(1);
      setResources(data.items.slice(0, 5));
      setTotal(data.total);
    } catch (err) {
      console.error("Failed to save resource:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Overview of your saved resources
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card flex items-center gap-4">
          <div className="rounded-lg bg-blue-500/10 p-3">
            <BookOpen className="h-6 w-6 text-blue-500" />
          </div>
          <div>
            <p className="text-2xl font-bold">{loading ? "--" : total}</p>
            <p className="text-sm text-zinc-400">Total Resources</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="rounded-lg bg-amber-500/10 p-3">
            <Eye className="h-6 w-6 text-amber-500" />
          </div>
          <div>
            <p className="text-2xl font-bold">{loading ? "--" : unreadCount}</p>
            <p className="text-sm text-zinc-400">Unread</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="rounded-lg bg-green-500/10 p-3">
            <Clock className="h-6 w-6 text-green-500" />
          </div>
          <div>
            <p className="text-2xl font-bold">
              {loading ? "--" : reviewCount}
            </p>
            <p className="text-sm text-zinc-400">Due for Review</p>
          </div>
        </div>
      </div>

      {/* Quick Save */}
      <div className="card">
        <h2 className="mb-3 text-lg font-semibold">Quick Save</h2>
        <form onSubmit={handleSave} className="flex gap-3">
          <input
            type="url"
            placeholder="Paste a URL to save..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="input flex-1"
            required
          />
          <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
            <Plus className="h-4 w-4" />
            {saving ? "Saving..." : "Save"}
          </button>
        </form>
      </div>

      {/* Recent Resources */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Recent Resources</h2>
        {loading ? (
          <div className="text-sm text-zinc-400">Loading...</div>
        ) : resources.length === 0 ? (
          <div className="card text-center text-sm text-zinc-400">
            No resources saved yet. Use the quick save above to add your first
            resource.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {resources.map((r) => (
              <ResourceCard key={r.id} resource={r} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
