"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { Note } from "@/lib/types";
import { NoteEditor } from "@/components/note-editor";
import { Button } from "@/components/ui/button";
import { StickyNote, Plus, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function preview(content: string | null) {
  if (!content) return "";
  return content.replace(/^#{1,3} /gm, "").replace(/[*`_]/g, "").slice(0, 100);
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Note | null>(null);

  const fetchNotes = useCallback(async () => {
    try {
      const data = await api.getNotes();
      setNotes(data);
    } catch (err) {
      console.error("Failed to fetch notes:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleNew = async () => {
    // Create a blank note and select it
    try {
      const note = await api.createNote({ title: "Untitled", content: "" });
      setNotes((prev) => [note, ...prev]);
      setSelectedId(note.id);
    } catch (err) {
      console.error("Failed to create note:", err);
    }
  };

  const handleSaved = (saved: Note) => {
    setNotes((prev) => {
      const idx = prev.findIndex((n) => n.id === saved.id);
      if (idx === -1) return [saved, ...prev];
      const next = [...prev];
      next[idx] = saved;
      // Move updated note to top
      next.splice(idx, 1);
      return [saved, ...next];
    });
    setSelectedId(saved.id);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.deleteNote(deleteTarget.id);
      setNotes((prev) => prev.filter((n) => n.id !== deleteTarget.id));
      if (selectedId === deleteTarget.id) setSelectedId(null);
      setDeleteTarget(null);
    } catch (err) {
      console.error("Failed to delete note:", err);
    }
  };

  const selectedNote = notes.find((n) => n.id === selectedId) ?? null;

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-0 -m-6 overflow-hidden">
      {/* Left panel — note list */}
      <div className="w-72 shrink-0 flex flex-col border-r bg-card/50 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h1 className="text-sm font-semibold">Notes</h1>
          <Button size="sm" variant="ghost" className="h-7 px-2 gap-1" onClick={handleNew}>
            <Plus className="size-3.5" />
            New
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="space-y-2 p-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          ) : notes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <StickyNote className="size-8 text-muted-foreground/40 mb-2" />
              <p className="text-xs text-muted-foreground">No notes yet</p>
              <Button size="sm" variant="outline" className="mt-3 text-xs h-7" onClick={handleNew}>
                Create first note
              </Button>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {notes.map((note) => (
                <div
                  key={note.id}
                  onClick={() => setSelectedId(note.id)}
                  className={`group relative rounded-lg p-3 cursor-pointer transition-colors ${
                    selectedId === note.id
                      ? "bg-primary/10 border border-primary/20"
                      : "hover:bg-accent/50 border border-transparent"
                  }`}
                >
                  <p className="text-xs font-medium truncate">{note.title || "Untitled"}</p>
                  <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">
                    {preview(note.content) || "Empty note"}
                  </p>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-[10px] text-muted-foreground">{formatDate(note.updated_at)}</span>
                    <div className="flex gap-1">
                      {note.tags.slice(0, 2).map((t) => (
                        <span key={t.name} className="text-[10px] bg-muted rounded px-1">{t.name}</span>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteTarget(note); }}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-muted transition-opacity"
                  >
                    <Trash2 className="size-3 text-muted-foreground" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right panel — editor */}
      <div className="flex-1 overflow-hidden p-6">
        {selectedNote ? (
          <NoteEditor key={selectedNote.id} note={selectedNote} onSaved={handleSaved} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <StickyNote className="size-12 text-muted-foreground/30 mb-4" />
            <p className="text-sm text-muted-foreground">Select a note or create a new one</p>
            <Button size="sm" className="mt-4" onClick={handleNew}>
              <Plus className="size-4 mr-1" />
              New Note
            </Button>
          </div>
        )}
      </div>

      {/* Delete dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete note?</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{deleteTarget?.title}&quot; will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
