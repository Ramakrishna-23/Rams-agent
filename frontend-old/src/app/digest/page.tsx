"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { DigestItem } from "@/lib/types";
import { CheckCircle, CalendarCheck, ExternalLink } from "lucide-react";

export default function DigestPage() {
  const [items, setItems] = useState<DigestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getDigest();
        setItems(data);
      } catch (err) {
        console.error("Failed to load digest:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleReview = async (resourceId: number) => {
    setReviewingId(resourceId);
    try {
      await api.reviewResource(resourceId);
      setItems((prev) => prev.filter((item) => item.resource.id !== resourceId));
    } catch (err) {
      console.error("Failed to review resource:", err);
    } finally {
      setReviewingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <CalendarCheck className="h-7 w-7 text-blue-500" />
        <div>
          <h1 className="text-2xl font-bold">Daily Digest</h1>
          <p className="text-sm text-zinc-400">
            Resources due for review today
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-zinc-400">
          Loading digest...
        </div>
      ) : items.length === 0 ? (
        <div className="card py-12 text-center">
          <CalendarCheck className="mx-auto mb-3 h-12 w-12 text-zinc-600" />
          <p className="text-lg font-medium text-zinc-400">
            All caught up!
          </p>
          <p className="mt-1 text-sm text-zinc-500">
            No resources are due for review today. Check back later.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.resource.id} className="card">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-medium text-zinc-100">
                    {item.resource.title || "Untitled"}
                  </h3>
                  <a
                    href={item.resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
                  >
                    <ExternalLink className="h-3 w-3" />
                    {item.resource.url}
                  </a>
                  {item.resource.summary && (
                    <p className="mt-2 text-sm text-zinc-400">
                      {item.resource.summary.length > 200
                        ? item.resource.summary.slice(0, 200) + "..."
                        : item.resource.summary}
                    </p>
                  )}
                  {item.reason && (
                    <p className="mt-1 text-xs text-zinc-500">{item.reason}</p>
                  )}
                </div>
                <button
                  onClick={() => handleReview(item.resource.id)}
                  disabled={reviewingId === item.resource.id}
                  className="btn-primary flex shrink-0 items-center gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  {reviewingId === item.resource.id
                    ? "Reviewing..."
                    : "Mark Reviewed"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
