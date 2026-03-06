"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, Loader2 } from "lucide-react";

interface NewCardSectionProps {
  defaultAction?: boolean;
  onCreated?: () => void;
  className?: string;
}

export function NewCardSection({ defaultAction = false, onCreated, className }: NewCardSectionProps) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [isAction, setIsAction] = useState(defaultAction);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setSaving(true);
    setError("");
    try {
      if (isAction) {
        await api.createAction(url.trim(), title.trim() || undefined, notes.trim() || undefined);
      } else {
        await api.createResource(url.trim(), title.trim() || undefined, notes.trim() || undefined);
      }
      setUrl("");
      setTitle("");
      setNotes("");
      setIsAction(defaultAction);
      onCreated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          <p className="text-base font-bold text-center">Add Resource</p>
          <Input
            placeholder="Paste a URL to save..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            autoFocus
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              placeholder="Title (optional)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <Textarea
              placeholder="Notes (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={1}
              className="min-h-[36px] resize-none"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Switch
                id="action-toggle"
                checked={isAction}
                onCheckedChange={setIsAction}
              />
              <Label htmlFor="action-toggle" className="text-sm cursor-pointer">
                Action
              </Label>
            </div>
            <Button type="submit" disabled={saving || !url.trim()}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              Save
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
