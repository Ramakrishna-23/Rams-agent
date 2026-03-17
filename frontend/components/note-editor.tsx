"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { api } from "@/lib/api";
import { Note, Tag } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TagAutocompleteInput } from "@/components/tag-autocomplete-input";
import { Eye, Pencil, X } from "lucide-react";

interface NoteEditorProps {
  note: Note | null;
  onSaved: (note: Note) => void;
}

// Parse inline markdown (bold, italic, code) into React elements using matchAll
function InlineText({ text }: { text: string }) {
  const pattern = /(\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
  const parts: React.ReactNode[] = [];
  let last = 0;
  let key = 0;
  for (const match of text.matchAll(pattern)) {
    const idx = match.index ?? 0;
    if (idx > last) parts.push(text.slice(last, idx));
    const [, , bold_italic, bold, italic, code] = match;
    if (bold_italic) parts.push(<strong key={key++}><em>{bold_italic}</em></strong>);
    else if (bold) parts.push(<strong key={key++}>{bold}</strong>);
    else if (italic) parts.push(<em key={key++}>{italic}</em>);
    else if (code) parts.push(<code key={key++} className="bg-muted px-1 rounded text-xs font-mono">{code}</code>);
    last = idx + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}

function MarkdownPreview({ content }: { content: string }) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith("### ")) {
      elements.push(<h3 key={i} className="text-base font-semibold mt-3 mb-1"><InlineText text={line.slice(4)} /></h3>);
    } else if (line.startsWith("## ")) {
      elements.push(<h2 key={i} className="text-lg font-semibold mt-4 mb-1"><InlineText text={line.slice(3)} /></h2>);
    } else if (line.startsWith("# ")) {
      elements.push(<h1 key={i} className="text-xl font-bold mt-4 mb-2"><InlineText text={line.slice(2)} /></h1>);
    } else if (line.startsWith("> ")) {
      elements.push(
        <blockquote key={i} className="border-l-2 border-muted-foreground pl-3 text-muted-foreground italic my-1">
          <InlineText text={line.slice(2)} />
        </blockquote>
      );
    } else if (/^[-*] /.test(line)) {
      elements.push(<li key={i} className="ml-4 list-disc text-sm"><InlineText text={line.slice(2)} /></li>);
    } else if (/^\d+\. /.test(line)) {
      elements.push(<li key={i} className="ml-4 list-decimal text-sm"><InlineText text={line.replace(/^\d+\. /, "")} /></li>);
    } else if (line === "---") {
      elements.push(<hr key={i} className="my-3 border-border" />);
    } else if (line === "") {
      elements.push(<br key={i} />);
    } else {
      elements.push(<p key={i} className="text-sm my-0.5"><InlineText text={line} /></p>);
    }
  }
  return <div className="p-4 space-y-0.5">{elements}</div>;
}

export function NoteEditor({ note, onSaved }: NoteEditorProps) {
  const [title, setTitle] = useState(note?.title ?? "Untitled");
  const [content, setContent] = useState(note?.content ?? "");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<Tag[]>(note?.tags ?? []);
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const noteIdRef = useRef<string | null>(note?.id ?? null);

  useEffect(() => {
    setTitle(note?.title ?? "Untitled");
    setContent(note?.content ?? "");
    setTags(note?.tags ?? []);
    noteIdRef.current = note?.id ?? null;
    setLastSaved(null);
  }, [note?.id]);

  const save = useCallback(
    async (t: string, c: string, tgs: Tag[]) => {
      setSaving(true);
      try {
        const tagNames = tgs.map((tag) => tag.name);
        let saved: Note;
        if (noteIdRef.current) {
          saved = await api.updateNote(noteIdRef.current, { title: t, content: c, tag_names: tagNames });
        } else {
          saved = await api.createNote({ title: t, content: c, tag_names: tagNames });
          noteIdRef.current = saved.id;
        }
        setLastSaved(new Date());
        onSaved(saved);
      } catch (err) {
        console.error("Failed to save note:", err);
      } finally {
        setSaving(false);
      }
    },
    [onSaved]
  );

  const scheduleAutosave = useCallback(
    (t: string, c: string, tgs: Tag[]) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => save(t, c, tgs), 800);
    },
    [save]
  );

  const handleContentChange = (val: string) => {
    setContent(val);
    scheduleAutosave(title, val, tags);
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    scheduleAutosave(val, content, tags);
  };

  const addTag = (name: string) => {
    const trimmed = name.trim().toLowerCase();
    if (!trimmed || tags.some((t) => t.name === trimmed)) return;
    const newTags = [...tags, { id: 0, name: trimmed }];
    setTags(newTags);
    scheduleAutosave(title, content, newTags);
  };

  const removeTag = (name: string) => {
    const newTags = tags.filter((t) => t.name !== name);
    setTags(newTags);
    scheduleAutosave(title, content, newTags);
  };

  return (
    <div className="flex flex-col h-full">
      <Input
        value={title}
        onChange={(e) => handleTitleChange(e.target.value)}
        placeholder="Untitled"
        className="text-lg font-semibold border-0 border-b rounded-none px-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-auto py-3"
      />

      <div className="flex flex-wrap items-center gap-1.5 py-2 border-b min-h-[36px]">
        {tags.map((tag) => (
          <span
            key={tag.name}
            className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary text-xs px-2 py-0.5"
          >
            {tag.name}
            <button onClick={() => removeTag(tag.name)} className="hover:text-destructive">
              <X className="size-3" />
            </button>
          </span>
        ))}
        <TagAutocompleteInput
          value={tagInput}
          onChange={setTagInput}
          onSelect={(name) => { addTag(name); setTagInput(""); }}
          excludeTags={tags.map((t) => t.name)}
          placeholder="Add tag..."
          className="text-xs bg-transparent outline-none placeholder:text-muted-foreground min-w-[80px]"
        />
      </div>

      <div className="flex items-center justify-between py-1.5 border-b">
        <div className="flex items-center gap-1">
          <Button
            variant={!preview ? "secondary" : "ghost"}
            size="sm"
            className="h-7 gap-1 text-xs"
            onClick={() => setPreview(false)}
          >
            <Pencil className="size-3" />
            Edit
          </Button>
          <Button
            variant={preview ? "secondary" : "ghost"}
            size="sm"
            className="h-7 gap-1 text-xs"
            onClick={() => setPreview(true)}
          >
            <Eye className="size-3" />
            Preview
          </Button>
        </div>
        <span className="text-[10px] text-muted-foreground">
          {saving ? "Saving..." : lastSaved ? `Saved ${lastSaved.toLocaleTimeString()}` : ""}
        </span>
      </div>

      <div className="flex-1 overflow-auto">
        {preview ? (
          <MarkdownPreview content={content} />
        ) : (
          <textarea
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder="Start writing in Markdown..."
            className="w-full h-full min-h-[400px] resize-none bg-transparent p-4 text-sm font-mono outline-none placeholder:text-muted-foreground"
          />
        )}
      </div>
    </div>
  );
}
