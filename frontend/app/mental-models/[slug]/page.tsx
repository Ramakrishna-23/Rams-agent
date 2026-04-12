"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Brain,
  BookOpen,
  Building2,
  User,
  Clock,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Link2,
} from "lucide-react";
import {
  MENTAL_MODELS,
  getModelBySlug,
  getRelatedModels,
  type MentalModel,
  type FieldOfOrigin,
  type DomainOfApplication,
} from "@/lib/mental-models-data";
import { api } from "@/lib/api";
import type { MentalModelRecord } from "@/lib/types";

const FIELD_COLORS: Record<string, string> = {
  Logic: "bg-violet-500/20 text-violet-700 dark:text-violet-300",
  "Mathematics / Statistics": "bg-blue-500/20 text-blue-300",
  "Psychology / Cognitive Science": "bg-rose-500/20 text-rose-700 dark:text-rose-300",
  Economics: "bg-emerald-500/20 text-emerald-300",
  "Systems Thinking": "bg-amber-500/20 text-amber-700 dark:text-amber-300",
  "Engineering / Finance": "bg-cyan-500/20 text-cyan-300",
  Philosophy: "bg-purple-500/20 text-purple-300",
  "Evolutionary Biology": "bg-lime-500/20 text-lime-300",
  Physics: "bg-orange-500/20 text-orange-300",
};

const RELATIONSHIP_STYLES: Record<string, string> = {
  combines_with: "bg-teal-500/20 text-teal-700 dark:text-teal-300",
  contrasts_with: "bg-rose-500/20 text-rose-700 dark:text-rose-300",
  prerequisite_for: "bg-amber-500/20 text-amber-700 dark:text-amber-300",
};

const RELATIONSHIP_LABELS: Record<string, string> = {
  combines_with: "Combines with",
  contrasts_with: "Contrasts with",
  prerequisite_for: "Prerequisite for",
};

const EXAMPLE_ICONS: Record<string, typeof Building2> = {
  business: Building2,
  personal: User,
  historical: Clock,
};

function dbRecordToModel(r: MentalModelRecord): MentalModel {
  return {
    slug: r.slug,
    name: r.name,
    tagline: r.tagline,
    author: r.author,
    era: r.era,
    sourceBook: r.source_book,
    field: r.field as FieldOfOrigin[],
    domain: r.domain as DomainOfApplication[],
    theory: r.theory,
    metaphor: r.metaphor,
    keyQuestion: r.key_question,
    realExamples: r.real_examples,
    selfCheckQuestions: r.self_check_questions,
    relatedModels: r.related_models,
    scenarios: r.scenarios,
  };
}

export default function ModelDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const staticModel = getModelBySlug(slug);
  const [model, setModel] = useState<MentalModel | null>(staticModel ?? null);
  const [loading, setLoading] = useState(!staticModel);
  const relatedModels = model ? getRelatedModels(model.slug) : [];

  const [showQuestions, setShowQuestions] = useState(false);
  const [personalNote, setPersonalNote] = useState("");

  const modelIndex = MENTAL_MODELS.findIndex((m) => m.slug === slug);

  useEffect(() => {
    if (!staticModel) {
      api
        .getMentalModelRecord(slug)
        .then((r) => setModel(dbRecordToModel(r)))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [slug, staticModel]);

  useEffect(() => {
    const saved = localStorage.getItem(`mm-note-${slug}`);
    if (saved) setPersonalNote(saved);
  }, [slug]);

  function saveNote(value: string) {
    setPersonalNote(value);
    localStorage.setItem(`mm-note-${slug}`, value);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Brain className="h-8 w-8 animate-pulse text-violet-600 dark:text-violet-400" />
      </div>
    );
  }

  if (!model) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="text-center">
          <Brain className="mx-auto mb-3 h-8 w-8 text-foreground/30" />
          <p className="text-foreground/50">Model not found.</p>
          <Link
            href="/mental-models"
            className="mt-4 inline-block text-sm text-violet-600 dark:text-violet-400 hover:underline"
          >
            Back to Library
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-4 py-10">
        {/* Back nav */}
        <div className="mb-8 flex items-center justify-between">
          <Link
            href="/mental-models"
            className="inline-flex items-center gap-2 text-sm text-foreground/40 transition hover:text-foreground/70"
          >
            <ArrowLeft className="h-4 w-4" />
            Library
          </Link>
          {modelIndex >= 0 && (
            <span className="text-sm font-mono text-foreground/30">
              {String(modelIndex + 1).padStart(2, "0")} / {MENTAL_MODELS.length}
            </span>
          )}
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="mb-3 flex flex-wrap gap-2">
            {model.field.map((f) => (
              <span
                key={f}
                className={`rounded-full px-3 py-1 text-xs ${FIELD_COLORS[f]}`}
              >
                {f}
              </span>
            ))}
          </div>
          <h1 className="mb-2 text-3xl font-bold">{model.name}</h1>
          <p className="text-lg text-foreground/50">{model.tagline}</p>
        </div>

        {/* Origin */}
        <div className="mb-8 rounded-xl border border-border/5 bg-foreground/[0.02] p-5">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-foreground/40">
            <BookOpen className="h-4 w-4" />
            Origin
          </h2>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-foreground/40">Author</p>
              <p className="font-medium">{model.author}</p>
            </div>
            <div>
              <p className="text-foreground/40">Era</p>
              <p className="font-medium">{model.era}</p>
            </div>
            <div>
              <p className="text-foreground/40">Source</p>
              <p className="font-medium">{model.sourceBook}</p>
            </div>
          </div>
        </div>

        {/* Theory */}
        <div className="mb-8">
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-foreground/40">
            Theory
          </h2>
          <p className="mb-4 leading-relaxed text-foreground/70">{model.theory}</p>
          <div className="rounded-lg border-l-2 border-violet-500/50 bg-violet-500/5 px-4 py-3 text-sm italic text-violet-700 dark:text-violet-300/80">
            {model.metaphor}
          </div>
        </div>

        {/* Domains */}
        <div className="mb-8">
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-foreground/40">
            Where to Apply
          </h2>
          <div className="flex flex-wrap gap-2">
            {model.domain.map((d) => (
              <span
                key={d}
                className="rounded-full bg-teal-500/15 px-3 py-1 text-xs text-teal-700 dark:text-teal-300"
              >
                {d}
              </span>
            ))}
          </div>
        </div>

        {/* Real Examples */}
        <div className="mb-8">
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-foreground/40">
            Real Examples
          </h2>
          <div className="space-y-3">
            {model.realExamples.map((example, i) => {
              const Icon = EXAMPLE_ICONS[example.type] || BookOpen;
              return (
                <div
                  key={i}
                  className="rounded-xl border border-border/5 bg-foreground/[0.02] p-4"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <Icon className="h-4 w-4 text-foreground/40" />
                    <span className="text-xs capitalize text-foreground/40">
                      {example.type}
                    </span>
                  </div>
                  <h3 className="mb-1 font-medium">{example.title}</h3>
                  <p className="text-sm leading-relaxed text-foreground/50">
                    {example.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Self-Check Questions */}
        <div className="mb-8">
          <button
            onClick={() => setShowQuestions(!showQuestions)}
            className="flex w-full items-center justify-between rounded-xl border border-border/5 bg-foreground/[0.02] px-5 py-4 text-left transition hover:border-border/10"
          >
            <span className="text-sm font-medium uppercase tracking-wider text-foreground/40">
              Self-Check Questions ({model.selfCheckQuestions.length})
            </span>
            {showQuestions ? (
              <ChevronUp className="h-4 w-4 text-foreground/30" />
            ) : (
              <ChevronDown className="h-4 w-4 text-foreground/30" />
            )}
          </button>
          {showQuestions && (
            <div className="mt-2 space-y-2">
              {model.selfCheckQuestions.map((q, i) => (
                <div
                  key={i}
                  className="flex gap-3 rounded-lg border border-border/5 bg-foreground/[0.02] px-4 py-3"
                >
                  <span className="mt-0.5 text-xs font-mono text-violet-600 dark:text-violet-400">
                    {i + 1}
                  </span>
                  <p className="text-sm text-foreground/70">{q}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Related Models */}
        {relatedModels.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-foreground/40">
              <Link2 className="h-4 w-4" />
              Related Models
            </h2>
            <div className="space-y-2">
              {relatedModels.map(({ model: related, type }) => (
                <Link
                  key={related.slug}
                  href={`/mental-models/${related.slug}`}
                  className="flex items-center justify-between rounded-xl border border-border/5 bg-foreground/[0.02] px-4 py-3 transition hover:border-border/10"
                >
                  <div>
                    <p className="font-medium">{related.name}</p>
                    <p className="text-xs text-foreground/40">{related.tagline}</p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] ${RELATIONSHIP_STYLES[type]}`}
                  >
                    {RELATIONSHIP_LABELS[type]}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Personal Notes */}
        <div className="mb-8">
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-foreground/40">
            Personal Notes
          </h2>
          <textarea
            value={personalNote}
            onChange={(e) => saveNote(e.target.value)}
            placeholder="When did you use this model? What happened? Write your observations here..."
            rows={4}
            className="w-full rounded-xl border border-border/10 bg-foreground/[0.03] px-4 py-3 text-sm text-foreground/80 placeholder:text-foreground/20 focus:border-violet-500/50 focus:outline-none"
          />
          <p className="mt-1 text-xs text-foreground/20">
            Saved to your browser. Private to you.
          </p>
        </div>

        {/* Practice CTA */}
        <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-6 text-center">
          <h3 className="mb-2 font-semibold">Practice this model</h3>
          <p className="mb-4 text-sm text-foreground/50">
            Apply {model.name} to a real scenario and build your intuition.
          </p>
          <Link
            href={`/mental-models/practice?model=${model.slug}`}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-500/15 text-blue-700 dark:text-blue-300 px-5 py-2.5 text-sm font-medium transition hover:bg-blue-500/25"
          >
            <Sparkles className="h-4 w-4" />
            Start Practice
          </Link>
        </div>
      </div>
    </div>
  );
}
