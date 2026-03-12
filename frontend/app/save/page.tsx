"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Check, Inbox, Loader2 } from "lucide-react";
import Link from "next/link";

export default function SavePage() {
  const searchParams = useSearchParams();

  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const fromShare = searchParams.has("url") || searchParams.has("text");

  useEffect(() => {
    const paramUrl = searchParams.get("url") || "";
    const paramTitle = searchParams.get("title") || "";
    const paramText = searchParams.get("text") || "";

    // Sometimes share sheets put the URL in the text param
    if (paramUrl) {
      setUrl(paramUrl);
    } else if (paramText && paramText.startsWith("http")) {
      setUrl(paramText.split(/\s/)[0]);
    }

    setTitle(paramTitle);
    if (paramText && paramText !== paramUrl) {
      setNotes(paramText);
    }
  }, [searchParams]);

  const handleSave = async () => {
    if (!url.trim()) {
      setError("URL is required");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await api.createResource(url.trim(), title.trim() || undefined, notes.trim() || undefined);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (saved) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <div className="flex size-16 items-center justify-center rounded-full bg-green-500/10">
          <Check className="size-8 text-green-500" />
        </div>
        <p className="text-lg font-medium">Saved to Inbox</p>
        <div className="flex gap-3">
          <Link href="/inbox">
            <Button variant="outline" size="sm">
              <Inbox className="mr-2 size-4" />
              View Inbox
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSaved(false);
              setUrl("");
              setTitle("");
              setNotes("");
            }}
          >
            Save Another
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6 pt-4">
      <div>
        <h1 className="text-lg font-semibold">Save to Inbox</h1>
        <p className="text-sm text-muted-foreground">
          {fromShare ? "Shared from another app" : "Save a URL for later"}
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">URL</label>
          <Input
            type="url"
            placeholder="https://..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            readOnly={fromShare && !!url}
            className={fromShare && url ? "bg-muted" : ""}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Title</label>
          <Input
            type="text"
            placeholder="Optional title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Notes</label>
          <Textarea
            placeholder="Add notes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </div>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Inbox className="mr-2 size-4" />
              Save to Inbox
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
