"use client";

import { useState, useEffect, useRef } from "react";
import { api } from "@/lib/api";
import { Tag } from "@/lib/types";

interface TagAutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (tagName: string) => void;
  excludeTags?: string[];
  placeholder?: string;
  className?: string;
}

let tagsCache: Tag[] | null = null;
let fetchPromise: Promise<Tag[]> | null = null;

async function fetchAllTags(): Promise<Tag[]> {
  if (tagsCache) return tagsCache;
  if (!fetchPromise) {
    fetchPromise = api.getTags().then((tags) => {
      tagsCache = tags;
      return tags;
    });
  }
  return fetchPromise;
}

export function TagAutocompleteInput({
  value,
  onChange,
  onSelect,
  excludeTags = [],
  placeholder,
  className,
}: TagAutocompleteInputProps) {
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [focused, setFocused] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchAllTags().then(setAllTags);
  }, []);

  const suggestions = value.length > 0
    ? allTags
        .filter(
          (t) =>
            t.name.toLowerCase().startsWith(value.toLowerCase()) &&
            !excludeTags.includes(t.name)
        )
        .slice(0, 8)
    : [];

  const open = focused && suggestions.length > 0;

  // Reset highlight when suggestions change
  useEffect(() => {
    setHighlighted(0);
  }, [suggestions.length, value]);

  // Close on outside click
  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, []);

  const confirmHighlighted = () => {
    if (open) {
      onSelect(suggestions[highlighted].name);
    } else if (value.trim()) {
      onSelect(value.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (open) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlighted((h) => (h + 1) % suggestions.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlighted((h) => (h - 1 + suggestions.length) % suggestions.length);
        return;
      }
      if (e.key === "Tab" && !e.shiftKey) {
        e.preventDefault();
        onSelect(suggestions[highlighted].name);
        return;
      }
      if (e.key === "Tab" && e.shiftKey) {
        e.preventDefault();
        setHighlighted((h) => (h - 1 + suggestions.length) % suggestions.length);
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        onSelect(suggestions[highlighted].name);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setFocused(false);
        return;
      }
      if (e.key === ",") {
        e.preventDefault();
        onSelect(suggestions[highlighted].name);
        return;
      }
    } else {
      if (e.key === "Enter" || e.key === ",") {
        e.preventDefault();
        if (value.trim()) onSelect(value.trim());
        return;
      }
    }
  };

  return (
    <div ref={wrapperRef} style={{ position: "relative", display: "inline-block" }} className={className}>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
        autoComplete="off"
      />
      {open && (
        <div className="absolute top-full left-0 z-50 mt-1 min-w-[160px] rounded-md border border-border bg-popover shadow-md">
          {suggestions.map((tag, i) => {
            const prefix = tag.name.slice(0, value.length);
            const rest = tag.name.slice(value.length);
            return (
              <div
                key={tag.name}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onSelect(tag.name);
                }}
                onMouseEnter={() => setHighlighted(i)}
                className={`cursor-pointer px-3 py-1.5 text-sm ${
                  i === highlighted ? "bg-accent text-accent-foreground" : ""
                }`}
              >
                <strong>{prefix}</strong>{rest}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
