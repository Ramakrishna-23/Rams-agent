"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Resource } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  ExternalLink,
  RotateCw,
  Trash2,
  Save,
  ChevronDown,
  ChevronUp,
  Clock,
  Hash,
} from "lucide-react";

export default function ResourceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [resource, setResource] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [notesChanged, setNotesChanged] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => {
    const fetchResource = async () => {
      try {
        const data = await api.getResource(id);
        setResource(data);
        setNotes(data.notes || "");
      } catch (err) {
        console.error("Failed to fetch resource:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchResource();
  }, [id]);

  const handleStatusChange = async (newStatus: string) => {
    if (!resource) return;
    try {
      const updated = await api.updateResource(resource.id, { status: newStatus });
      setResource(updated);
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const handleSaveNotes = async () => {
    if (!resource) return;
    setSavingNotes(true);
    try {
      await api.updateResource(resource.id, { notes });
      setNotesChanged(false);
    } catch (err) {
      console.error("Failed to save notes:", err);
    } finally {
      setSavingNotes(false);
    }
  };

  const handleReview = async () => {
    if (!resource) return;
    try {
      const updated = await api.reviewResource(resource.id);
      setResource(updated);
    } catch (err) {
      console.error("Failed to review:", err);
    }
  };

  const handleDelete = async () => {
    if (!resource) return;
    try {
      await api.deleteResource(resource.id);
      router.push("/resources");
    } catch (err) {
      console.error("Failed to delete:", err);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-48 w-full rounded-lg" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
    );
  }

  if (!resource) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        Resource not found
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Button variant="ghost" size="sm" onClick={() => router.push("/resources")}>
        <ArrowLeft className="size-4" />
        Back to Resources
      </Button>

      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <CardTitle className="text-lg">{resource.title || "Untitled"}</CardTitle>
              {resource.url ? (
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  <ExternalLink className="size-3" />
                  {resource.url}
                </a>
              ) : (
                <span className="text-sm text-muted-foreground">Note</span>
              )}
            </div>
            <Select value={resource.status} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unread">Unread</SelectItem>
                <SelectItem value="read">Read</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
                <SelectItem value="favorite">Favorite</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {resource.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {resource.tags.map((tag) => (
                <Badge key={tag.id} variant="secondary">
                  <Hash className="size-3" />
                  {tag.name}
                </Badge>
              ))}
            </div>
          )}
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="size-3" />
              Saved {new Date(resource.created_at).toLocaleDateString()}
            </span>
            <span>Reviews: {resource.review_count}</span>
            {resource.next_review_at && (
              <span>
                Next review: {new Date(resource.next_review_at).toLocaleDateString()}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      {resource.summary && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {resource.summary}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Scraped Content */}
      <Card>
        <CardHeader className="pb-2">
          <button
            onClick={() => setShowContent(!showContent)}
            className="flex items-center gap-2 text-sm font-medium hover:text-primary"
          >
            {showContent ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            Scraped Content
          </button>
        </CardHeader>
        {showContent && (
          <CardContent>
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">
              {(resource as Resource & { content?: string }).content || "No content available"}
            </p>
          </CardContent>
        )}
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Textarea
            placeholder="Add your notes..."
            value={notes}
            onChange={(e) => {
              setNotes(e.target.value);
              setNotesChanged(true);
            }}
            rows={4}
          />
          {notesChanged && (
            <Button size="sm" onClick={handleSaveNotes} disabled={savingNotes}>
              <Save className="size-4" />
              Save Notes
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-2">
        <Button onClick={handleReview}>
          <RotateCw className="size-4" />
          Mark as Reviewed
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">
              <Trash2 className="size-4" />
              Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this resource?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete &quot;{resource.title}&quot;. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
