"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  X,
  Save,
  Brain,
  Loader2,
} from "lucide-react";
import { api } from "@/lib/api";
import {
  ALL_FIELDS,
  ALL_DOMAINS,
  type FieldOfOrigin,
  type DomainOfApplication,
} from "@/lib/mental-models-data";

type ExampleType = "business" | "personal" | "historical";
type ConnectionType = "combines_with" | "contrasts_with" | "prerequisite_for";

interface RealExample {
  type: ExampleType;
  title: string;
  description: string;
}

interface Scenario {
  prompt: string;
  question: string;
  insight: string;
  category: ExampleType;
}

interface RelatedModelRef {
  slug: string;
  type: ConnectionType;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const SECTION =
  "mb-8 rounded-xl border border-border/5 bg-foreground/[0.02] p-5";
const LABEL = "mb-1.5 block text-xs font-medium text-foreground/50";
const INPUT =
  "w-full rounded-lg border border-border/10 bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground/25 focus:border-violet-500/50 focus:outline-none";
const TEXTAREA = `${INPUT} min-h-[80px] resize-y`;
const CHIP_ACTIVE =
  "rounded-full px-3 py-1 text-xs transition bg-violet-500/20 text-violet-700 dark:text-violet-300";
const CHIP_INACTIVE =
  "rounded-full px-3 py-1 text-xs transition bg-foreground/5 text-foreground/40 hover:bg-foreground/10 hover:text-foreground/60";
const BTN_ADD =
  "inline-flex items-center gap-1.5 rounded-lg border border-dashed border-border/10 px-3 py-1.5 text-xs text-foreground/40 transition hover:border-violet-500/30 hover:text-violet-600";
const BTN_REMOVE =
  "shrink-0 rounded p-1 text-foreground/20 transition hover:bg-red-500/10 hover:text-red-400";

export default function NewMentalModelPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Core fields
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [autoSlug, setAutoSlug] = useState(true);
  const [tagline, setTagline] = useState("");
  const [author, setAuthor] = useState("");
  const [era, setEra] = useState("");
  const [sourceBook, setSourceBook] = useState("");
  const [theory, setTheory] = useState("");
  const [metaphor, setMetaphor] = useState("");
  const [keyQuestion, setKeyQuestion] = useState("");

  // Taxonomy
  const [selectedFields, setSelectedFields] = useState<Set<FieldOfOrigin>>(
    new Set()
  );
  const [selectedDomains, setSelectedDomains] = useState<
    Set<DomainOfApplication>
  >(new Set());

  // Dynamic lists
  const [selfCheckQuestions, setSelfCheckQuestions] = useState<string[]>([""]);
  const [realExamples, setRealExamples] = useState<RealExample[]>([
    { type: "business", title: "", description: "" },
  ]);
  const [scenarios, setScenarios] = useState<Scenario[]>([
    { prompt: "", question: "", insight: "", category: "business" },
  ]);
  const [relatedModels, setRelatedModels] = useState<RelatedModelRef[]>([]);

  function handleNameChange(v: string) {
    setName(v);
    if (autoSlug) setSlug(slugify(v));
  }

  function toggleField(f: FieldOfOrigin) {
    setSelectedFields((prev) => {
      const next = new Set(prev);
      if (next.has(f)) next.delete(f);
      else next.add(f);
      return next;
    });
  }

  function toggleDomain(d: DomainOfApplication) {
    setSelectedDomains((prev) => {
      const next = new Set(prev);
      if (next.has(d)) next.delete(d);
      else next.add(d);
      return next;
    });
  }

  // ── List helpers ──

  function updateQuestion(idx: number, val: string) {
    setSelfCheckQuestions((prev) => prev.map((q, i) => (i === idx ? val : q)));
  }

  function updateExample(idx: number, patch: Partial<RealExample>) {
    setRealExamples((prev) =>
      prev.map((ex, i) => (i === idx ? { ...ex, ...patch } : ex))
    );
  }

  function updateScenario(idx: number, patch: Partial<Scenario>) {
    setScenarios((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, ...patch } : s))
    );
  }

  function updateRelated(idx: number, patch: Partial<RelatedModelRef>) {
    setRelatedModels((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, ...patch } : r))
    );
  }

  // ── Submit ──

  const handleSubmit = useCallback(async () => {
    if (!name.trim() || !slug.trim()) {
      setError("Name and slug are required.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await api.createMentalModel({
        slug: slug.trim(),
        name: name.trim(),
        tagline: tagline.trim(),
        author: author.trim(),
        era: era.trim(),
        source_book: sourceBook.trim(),
        theory: theory.trim(),
        metaphor: metaphor.trim(),
        key_question: keyQuestion.trim(),
        field: Array.from(selectedFields),
        domain: Array.from(selectedDomains),
        real_examples: realExamples.filter((e) => e.title.trim()),
        self_check_questions: selfCheckQuestions.filter((q) => q.trim()),
        related_models: relatedModels.filter((r) => r.slug.trim()),
        scenarios: scenarios.filter((s) => s.prompt.trim()),
      });
      router.push(`/mental-models/${slug.trim()}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  }, [
    name,
    slug,
    tagline,
    author,
    era,
    sourceBook,
    theory,
    metaphor,
    keyQuestion,
    selectedFields,
    selectedDomains,
    realExamples,
    selfCheckQuestions,
    relatedModels,
    scenarios,
    router,
  ]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-4 py-10">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <Link
            href="/mental-models"
            className="inline-flex items-center gap-2 text-sm text-foreground/40 transition hover:text-foreground/70"
          >
            <ArrowLeft className="h-4 w-4" />
            Library
          </Link>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-500/15 text-blue-700 dark:text-blue-300 px-5 py-2 text-sm font-medium transition hover:bg-blue-500/25 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Model
          </button>
        </div>

        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10">
            <Brain className="h-5 w-5 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold">New Mental Model</h1>
            <p className="text-xs text-foreground/40">
              Add a model to your latticework
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {/* ── Identity ── */}
        <div className={SECTION}>
          <h2 className="mb-4 text-sm font-semibold">Identity</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className={LABEL}>Name *</label>
              <input
                className={INPUT}
                placeholder="e.g. Inversion"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
              />
            </div>
            <div>
              <label className={LABEL}>Slug *</label>
              <input
                className={INPUT}
                placeholder="e.g. inversion"
                value={slug}
                onChange={(e) => {
                  setAutoSlug(false);
                  setSlug(e.target.value);
                }}
              />
            </div>
            <div className="md:col-span-2">
              <label className={LABEL}>Tagline</label>
              <input
                className={INPUT}
                placeholder="One-sentence summary"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
              />
            </div>
            <div>
              <label className={LABEL}>Author / Origin</label>
              <input
                className={INPUT}
                placeholder="e.g. Charlie Munger"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
              />
            </div>
            <div>
              <label className={LABEL}>Era</label>
              <input
                className={INPUT}
                placeholder="e.g. 20th century"
                value={era}
                onChange={(e) => setEra(e.target.value)}
              />
            </div>
            <div className="md:col-span-2">
              <label className={LABEL}>Source Book / Paper</label>
              <input
                className={INPUT}
                placeholder="e.g. Poor Charlie's Almanack"
                value={sourceBook}
                onChange={(e) => setSourceBook(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* ── Taxonomy ── */}
        <div className={SECTION}>
          <h2 className="mb-4 text-sm font-semibold">Taxonomy</h2>
          <div className="mb-4">
            <label className={LABEL}>Field of Origin</label>
            <div className="flex flex-wrap gap-2">
              {ALL_FIELDS.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => toggleField(f)}
                  className={selectedFields.has(f) ? CHIP_ACTIVE : CHIP_INACTIVE}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className={LABEL}>Domain of Application</label>
            <div className="flex flex-wrap gap-2">
              {ALL_DOMAINS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggleDomain(d)}
                  className={
                    selectedDomains.has(d)
                      ? "rounded-full px-3 py-1 text-xs transition bg-teal-500/20 text-teal-700 dark:text-teal-300"
                      : CHIP_INACTIVE
                  }
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Theory ── */}
        <div className={SECTION}>
          <h2 className="mb-4 text-sm font-semibold">Theory</h2>
          <div className="mb-4">
            <label className={LABEL}>Theory (plain-language explanation)</label>
            <textarea
              className={TEXTAREA}
              placeholder="Explain the mental model in 1-2 paragraphs..."
              rows={4}
              value={theory}
              onChange={(e) => setTheory(e.target.value)}
            />
          </div>
          <div className="mb-4">
            <label className={LABEL}>Metaphor</label>
            <textarea
              className={TEXTAREA}
              placeholder="A memorable metaphor or analogy..."
              rows={2}
              value={metaphor}
              onChange={(e) => setMetaphor(e.target.value)}
            />
          </div>
          <div>
            <label className={LABEL}>Key Question</label>
            <input
              className={INPUT}
              placeholder="The one question this model asks"
              value={keyQuestion}
              onChange={(e) => setKeyQuestion(e.target.value)}
            />
          </div>
        </div>

        {/* ── Self-Check Questions ── */}
        <div className={SECTION}>
          <h2 className="mb-4 text-sm font-semibold">Self-Check Questions</h2>
          <div className="space-y-2">
            {selfCheckQuestions.map((q, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="shrink-0 text-xs text-foreground/30">
                  {i + 1}.
                </span>
                <input
                  className={INPUT}
                  placeholder="e.g. What would guarantee this fails?"
                  value={q}
                  onChange={(e) => updateQuestion(i, e.target.value)}
                />
                {selfCheckQuestions.length > 1 && (
                  <button
                    type="button"
                    onClick={() =>
                      setSelfCheckQuestions((p) => p.filter((_, j) => j !== i))
                    }
                    className={BTN_REMOVE}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setSelfCheckQuestions((p) => [...p, ""])}
            className={`mt-3 ${BTN_ADD}`}
          >
            <Plus className="h-3.5 w-3.5" />
            Add question
          </button>
        </div>

        {/* ── Real Examples ── */}
        <div className={SECTION}>
          <h2 className="mb-4 text-sm font-semibold">Real Examples</h2>
          <div className="space-y-4">
            {realExamples.map((ex, i) => (
              <div
                key={i}
                className="rounded-lg border border-border/5 bg-background p-4"
              >
                <div className="mb-3 flex items-center justify-between">
                  <select
                    className="rounded border border-border/10 bg-background px-2 py-1 text-xs text-foreground/60"
                    value={ex.type}
                    onChange={(e) =>
                      updateExample(i, {
                        type: e.target.value as ExampleType,
                      })
                    }
                  >
                    <option value="business">Business</option>
                    <option value="personal">Personal</option>
                    <option value="historical">Historical</option>
                  </select>
                  {realExamples.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        setRealExamples((p) => p.filter((_, j) => j !== i))
                      }
                      className={BTN_REMOVE}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <input
                  className={`${INPUT} mb-2`}
                  placeholder="Example title"
                  value={ex.title}
                  onChange={(e) => updateExample(i, { title: e.target.value })}
                />
                <textarea
                  className={TEXTAREA}
                  placeholder="Describe the example..."
                  rows={2}
                  value={ex.description}
                  onChange={(e) =>
                    updateExample(i, { description: e.target.value })
                  }
                />
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() =>
              setRealExamples((p) => [
                ...p,
                { type: "business", title: "", description: "" },
              ])
            }
            className={`mt-3 ${BTN_ADD}`}
          >
            <Plus className="h-3.5 w-3.5" />
            Add example
          </button>
        </div>

        {/* ── Scenarios ── */}
        <div className={SECTION}>
          <h2 className="mb-4 text-sm font-semibold">Practice Scenarios</h2>
          <div className="space-y-4">
            {scenarios.map((s, i) => (
              <div
                key={i}
                className="rounded-lg border border-border/5 bg-background p-4"
              >
                <div className="mb-3 flex items-center justify-between">
                  <select
                    className="rounded border border-border/10 bg-background px-2 py-1 text-xs text-foreground/60"
                    value={s.category}
                    onChange={(e) =>
                      updateScenario(i, {
                        category: e.target.value as ExampleType,
                      })
                    }
                  >
                    <option value="business">Business</option>
                    <option value="personal">Personal</option>
                    <option value="historical">Historical</option>
                  </select>
                  {scenarios.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        setScenarios((p) => p.filter((_, j) => j !== i))
                      }
                      className={BTN_REMOVE}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <textarea
                  className={`${TEXTAREA} mb-2`}
                  placeholder="Scenario prompt — the setup"
                  rows={2}
                  value={s.prompt}
                  onChange={(e) =>
                    updateScenario(i, { prompt: e.target.value })
                  }
                />
                <input
                  className={`${INPUT} mb-2`}
                  placeholder="Question to ask the user"
                  value={s.question}
                  onChange={(e) =>
                    updateScenario(i, { question: e.target.value })
                  }
                />
                <textarea
                  className={TEXTAREA}
                  placeholder="Insight / answer revealed after writing"
                  rows={2}
                  value={s.insight}
                  onChange={(e) =>
                    updateScenario(i, { insight: e.target.value })
                  }
                />
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() =>
              setScenarios((p) => [
                ...p,
                { prompt: "", question: "", insight: "", category: "business" },
              ])
            }
            className={`mt-3 ${BTN_ADD}`}
          >
            <Plus className="h-3.5 w-3.5" />
            Add scenario
          </button>
        </div>

        {/* ── Related Models ── */}
        <div className={SECTION}>
          <h2 className="mb-4 text-sm font-semibold">Related Models</h2>
          <div className="space-y-2">
            {relatedModels.map((r, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  className={INPUT}
                  placeholder="Model slug (e.g. inversion)"
                  value={r.slug}
                  onChange={(e) => updateRelated(i, { slug: e.target.value })}
                />
                <select
                  className="shrink-0 rounded border border-border/10 bg-background px-2 py-2 text-xs text-foreground/60"
                  value={r.type}
                  onChange={(e) =>
                    updateRelated(i, {
                      type: e.target.value as ConnectionType,
                    })
                  }
                >
                  <option value="combines_with">Combines with</option>
                  <option value="contrasts_with">Contrasts with</option>
                  <option value="prerequisite_for">Prerequisite for</option>
                </select>
                <button
                  type="button"
                  onClick={() =>
                    setRelatedModels((p) => p.filter((_, j) => j !== i))
                  }
                  className={BTN_REMOVE}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() =>
              setRelatedModels((p) => [
                ...p,
                { slug: "", type: "combines_with" },
              ])
            }
            className={`mt-3 ${BTN_ADD}`}
          >
            <Plus className="h-3.5 w-3.5" />
            Add related model
          </button>
        </div>

        {/* Bottom save */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <Link
            href="/mental-models"
            className="rounded-lg border border-border/10 px-5 py-2.5 text-sm text-foreground/50 transition hover:text-foreground/70"
          >
            Cancel
          </Link>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-500/15 text-blue-700 dark:text-blue-300 px-5 py-2.5 text-sm font-medium transition hover:bg-blue-500/25 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Model
          </button>
        </div>
      </div>
    </div>
  );
}
