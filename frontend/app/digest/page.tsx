"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Resource } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CalendarCheck,
  ExternalLink,
  CheckCircle2,
  Loader2,
  Inbox,
} from "lucide-react";

export default function DigestPage() {
  const [items, setItems] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState<number | null>(null);

  useEffect(() => {
    const fetchDigest = async () => {
      try {
        const data = await api.getDigest();
        setItems(data);
      } catch (err) {
        console.error("Failed to fetch digest:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDigest();
  }, []);

  const handleReview = async (resourceId: number) => {
    setReviewing(resourceId);
    try {
      await api.reviewResource(resourceId);
      setItems((prev) => prev.filter((item) => item.id !== resourceId));
    } catch (err) {
      console.error("Failed to review:", err);
    } finally {
      setReviewing(null);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-2">
        <CalendarCheck className="size-5 text-primary" />
        <h1 className="text-xl font-semibold">Daily Digest</h1>
        {!loading && (
          <Badge variant="secondary" className="ml-auto">
            {items.length} due
          </Badge>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-lg" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Inbox className="mb-2 size-10 opacity-30" />
            <p className="text-sm font-medium">All caught up!</p>
            <p className="text-xs">No resources due for review today.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Card key={item.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 space-y-1">
                    <CardTitle className="text-sm leading-snug">
                      {item.title || "Untitled"}
                    </CardTitle>
                    {item.url ? (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        <ExternalLink className="size-3" />
                        {item.url}
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground">Note</span>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleReview(item.id)}
                    disabled={reviewing === item.id}
                  >
                    {reviewing === item.id ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="size-4" />
                    )}
                    Reviewed
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {item.summary && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {item.summary}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
