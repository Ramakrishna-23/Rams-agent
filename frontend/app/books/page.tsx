"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { api } from "@/lib/api";
import { Book, Tag } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Library, Plus, Star, Trash2, Pencil, X } from "lucide-react";

type BookStatus = "want_to_read" | "reading" | "finished";

const STATUS_TABS: { id: BookStatus | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "want_to_read", label: "Want to Read" },
  { id: "reading", label: "Reading" },
  { id: "finished", label: "Finished" },
];

const STATUS_COLORS: Record<BookStatus, string> = {
  want_to_read: "bg-slate-500",
  reading: "bg-blue-500",
  finished: "bg-emerald-500",
};

const COVER_PLACEHOLDER_COLORS = [
  "bg-red-400", "bg-orange-400", "bg-amber-400", "bg-lime-500",
  "bg-teal-500", "bg-cyan-500", "bg-sky-500", "bg-violet-500", "bg-pink-500",
];

function placeholderColor(title: string) {
  let hash = 0;
  for (const ch of title) hash = (hash * 31 + ch.charCodeAt(0)) & 0xffff;
  return COVER_PLACEHOLDER_COLORS[hash % COVER_PLACEHOLDER_COLORS.length];
}

interface BookFormState {
  title: string;
  author: string;
  isbn: string;
  genre: string;
  status: BookStatus;
  total_chapters: string;
  current_chapter: string;
  rating: number | null;
  notes: string;
  tagInput: string;
  tags: Tag[];
}

const DEFAULT_FORM: BookFormState = {
  title: "", author: "", isbn: "", genre: "",
  status: "want_to_read",
  total_chapters: "", current_chapter: "",
  rating: null, notes: "", tagInput: "", tags: [],
};

function StarRating({ value, onChange }: { value: number | null; onChange: (v: number | null) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(value === n ? null : n)}
          className={n <= (value ?? 0) ? "text-amber-400" : "text-muted-foreground/30"}
        >
          <Star className="size-4 fill-current" />
        </button>
      ))}
    </div>
  );
}

export default function BooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<BookStatus | "all">("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Book | null>(null);
  const [form, setForm] = useState<BookFormState>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);

  const fetchBooks = async () => {
    try {
      const data = await api.getBooks();
      setBooks(data);
    } catch (err) {
      console.error("Failed to fetch books:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBooks(); }, []);

  const openCreate = () => {
    setEditingBook(null);
    setForm(DEFAULT_FORM);
    setDialogOpen(true);
  };

  const openEdit = (e: React.MouseEvent, book: Book) => {
    e.stopPropagation();
    setEditingBook(book);
    setForm({
      title: book.title,
      author: book.author ?? "",
      isbn: book.isbn ?? "",
      genre: book.genre ?? "",
      status: book.status,
      total_chapters: book.total_chapters?.toString() ?? "",
      current_chapter: book.current_chapter?.toString() ?? "",
      rating: book.rating,
      notes: book.notes ?? "",
      tagInput: "",
      tags: book.tags,
    });
    setDialogOpen(true);
  };

  const addTag = (name: string) => {
    const trimmed = name.trim().toLowerCase();
    if (!trimmed || form.tags.some((t) => t.name === trimmed)) return;
    setForm((f) => ({ ...f, tags: [...f.tags, { id: trimmed, name: trimmed }], tagInput: "" }));
  };

  const removeTag = (name: string) => {
    setForm((f) => ({ ...f, tags: f.tags.filter((t) => t.name !== name) }));
  };

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        author: form.author.trim() || undefined,
        isbn: form.isbn.trim() || undefined,
        genre: form.genre.trim() || undefined,
        status: form.status,
        total_chapters: form.total_chapters ? parseInt(form.total_chapters) : undefined,
        current_chapter: form.current_chapter ? parseInt(form.current_chapter) : undefined,
        rating: form.rating ?? undefined,
        notes: form.notes.trim() || undefined,
        tag_names: form.tags.map((t) => t.name),
      };
      if (editingBook) {
        await api.updateBook(editingBook.id, payload);
      } else {
        await api.createBook(payload as Parameters<typeof api.createBook>[0]);
      }
      setDialogOpen(false);
      fetchBooks();
    } catch (err) {
      console.error("Failed to save book:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.deleteBook(deleteTarget.id);
      setDeleteTarget(null);
      fetchBooks();
    } catch (err) {
      console.error("Failed to delete book:", err);
    }
  };

  const filtered = activeTab === "all" ? books : books.filter((b) => b.status === activeTab);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Books</h1>
        <Button size="sm" onClick={openCreate}>
          <Plus className="size-4 mr-1" />
          Add Book
        </Button>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 border-b">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
            <span className="ml-1.5 text-xs text-muted-foreground">
              ({tab.id === "all" ? books.length : books.filter((b) => b.status === tab.id).length})
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="rounded-lg border bg-card animate-pulse h-64" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Library className="size-12 text-muted-foreground/40 mb-4" />
          <p className="text-sm text-muted-foreground">
            {activeTab === "all" ? "No books yet." : `No books with status "${activeTab}".`}
          </p>
          {activeTab === "all" && (
            <Button size="sm" className="mt-4" onClick={openCreate}>
              <Plus className="size-4 mr-1" />
              Add your first book
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filtered.map((book) => {
            const progress =
              book.total_chapters && book.current_chapter
                ? Math.round((book.current_chapter / book.total_chapters) * 100)
                : null;
            return (
              <div
                key={book.id}
                className="group relative rounded-lg border bg-card overflow-hidden hover:border-primary/50 transition-colors cursor-pointer flex flex-col"
                onClick={(e) => openEdit(e, book)}
              >
                {/* Cover */}
                <div className="relative aspect-[2/3] w-full overflow-hidden">
                  {book.cover_url ? (
                    <Image
                      src={book.cover_url}
                      alt={book.title}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className={`w-full h-full flex items-center justify-center ${placeholderColor(book.title)}`}>
                      <span className="text-white text-3xl font-bold">
                        {book.title.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteTarget(book); }}
                      className="p-1 rounded bg-background/80 hover:bg-background"
                    >
                      <Trash2 className="size-3 text-muted-foreground" />
                    </button>
                    <button
                      onClick={(e) => openEdit(e, book)}
                      className="p-1 rounded bg-background/80 hover:bg-background"
                    >
                      <Pencil className="size-3 text-muted-foreground" />
                    </button>
                  </div>
                </div>

                {/* Info */}
                <div className="p-3 flex flex-col gap-1.5 flex-1">
                  <p className="text-xs font-medium line-clamp-2 leading-snug">{book.title}</p>
                  {book.author && (
                    <p className="text-[11px] text-muted-foreground truncate">{book.author}</p>
                  )}

                  <div className="flex items-center justify-between mt-auto pt-1">
                    <span
                      className={`text-[10px] text-white rounded px-1.5 py-0.5 ${STATUS_COLORS[book.status]}`}
                    >
                      {book.status.replace(/_/g, " ")}
                    </span>
                    {book.rating && (
                      <div className="flex">
                        {Array.from({ length: book.rating }).map((_, i) => (
                          <Star key={i} className="size-3 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                    )}
                  </div>

                  {progress !== null && (
                    <div className="space-y-0.5">
                      <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>Ch {book.current_chapter}/{book.total_chapters}</span>
                        <span>{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-1" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingBook ? "Edit Book" : "Add Book"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Title *</label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Book title"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Author</label>
                <Input
                  value={form.author}
                  onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))}
                  placeholder="Author name"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">ISBN</label>
                <Input
                  value={form.isbn}
                  onChange={(e) => setForm((f) => ({ ...f, isbn: e.target.value }))}
                  placeholder="ISBN (for auto cover)"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Genre</label>
                <Input
                  value={form.genre}
                  onChange={(e) => setForm((f) => ({ ...f, genre: e.target.value }))}
                  placeholder="Genre"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as BookStatus }))}
                  className="w-full h-9 rounded-md border bg-background px-3 text-sm"
                >
                  <option value="want_to_read">Want to Read</option>
                  <option value="reading">Reading</option>
                  <option value="finished">Finished</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Total chapters</label>
                <Input
                  type="number"
                  value={form.total_chapters}
                  onChange={(e) => setForm((f) => ({ ...f, total_chapters: e.target.value }))}
                  placeholder="e.g. 20"
                  min={1}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Current chapter</label>
                <Input
                  type="number"
                  value={form.current_chapter}
                  onChange={(e) => setForm((f) => ({ ...f, current_chapter: e.target.value }))}
                  placeholder="e.g. 5"
                  min={0}
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Rating</label>
                <StarRating value={form.rating} onChange={(v) => setForm((f) => ({ ...f, rating: v }))} />
              </div>
              <div className="col-span-2 space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Tags</label>
                <div className="flex flex-wrap items-center gap-1.5 min-h-[36px] rounded-md border px-3 py-2">
                  {form.tags.map((tag) => (
                    <span
                      key={tag.name}
                      className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary text-xs px-2 py-0.5"
                    >
                      {tag.name}
                      <button type="button" onClick={() => removeTag(tag.name)}>
                        <X className="size-3" />
                      </button>
                    </span>
                  ))}
                  <input
                    value={form.tagInput}
                    onChange={(e) => setForm((f) => ({ ...f, tagInput: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === ",") {
                        e.preventDefault();
                        addTag(form.tagInput);
                      }
                    }}
                    placeholder="Add tag..."
                    className="text-xs bg-transparent outline-none placeholder:text-muted-foreground min-w-[80px]"
                  />
                </div>
              </div>
              <div className="col-span-2 space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Notes (Markdown)</label>
                <Textarea
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Your notes about this book..."
                  className="resize-none min-h-[120px] text-sm font-mono"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleSave} disabled={saving || !form.title.trim()}>
              {saving ? "Saving..." : editingBook ? "Save" : "Add Book"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete book?</AlertDialogTitle>
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
