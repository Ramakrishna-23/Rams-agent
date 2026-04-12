"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  Brain,
  Sparkles,
  Network,
  Filter,
  BookOpen,
  ArrowRight,
  Plus,
} from "lucide-react";
import {
  MENTAL_MODELS,
  ALL_FIELDS,
  ALL_DOMAINS,
  type MentalModel,
  type FieldOfOrigin,
  type DomainOfApplication,
} from "@/lib/mental-models-data";
import { api } from "@/lib/api";
import type { MentalModelRecord } from "@/lib/types";

const FIELD_COLORS: Record<string, string> = {
  Logic: "bg-violet-500/20 text-violet-700 dark:text-violet-300",
  "Mathematics / Statistics": "bg-blue-500/20 text-blue-700 dark:text-blue-300",
  "Psychology / Cognitive Science": "bg-rose-500/20 text-rose-700 dark:text-rose-300",
  Economics: "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300",
  "Systems Thinking": "bg-amber-500/20 text-amber-700 dark:text-amber-300",
  "Engineering / Finance": "bg-cyan-500/20 text-cyan-700 dark:text-cyan-300",
  Philosophy: "bg-purple-500/20 text-purple-700 dark:text-purple-300",
  "Evolutionary Biology": "bg-lime-500/20 text-lime-700 dark:text-lime-300",
  Physics: "bg-orange-500/20 text-orange-700 dark:text-orange-300",
};

const CARD_GRADIENTS = [
  "from-violet-500/10 to-indigo-500/10",
  "from-blue-500/10 to-cyan-500/10",
  "from-purple-500/10 to-fuchsia-500/10",
  "from-amber-500/10 to-orange-500/10",
  "from-sky-500/10 to-blue-500/10",
  "from-rose-500/10 to-pink-500/10",
  "from-cyan-500/10 to-teal-500/10",
  "from-pink-500/10 to-rose-500/10",
  "from-teal-500/10 to-emerald-500/10",
  "from-emerald-500/10 to-green-500/10",
];

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

export default function MentalModelsLibrary() {
  const [dbModels, setDbModels] = useState<MentalModel[]>([]);
  const [selectedFields, setSelectedFields] = useState<Set<FieldOfOrigin>>(
    new Set()
  );
  const [selectedDomains, setSelectedDomains] = useState<
    Set<DomainOfApplication>
  >(new Set());
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    api.listMentalModels().then((records) => {
      const staticSlugs = new Set(MENTAL_MODELS.map((m) => m.slug));
      const newModels = records
        .filter((r) => !staticSlugs.has(r.slug))
        .map(dbRecordToModel);
      setDbModels(newModels);
    }).catch(() => {});
  }, []);

  const allModels = useMemo(
    () => [...MENTAL_MODELS, ...dbModels],
    [dbModels]
  );

  const filteredModels = useMemo(() => {
    return allModels.filter((model) => {
      if (
        selectedFields.size > 0 &&
        !model.field.some((f) => selectedFields.has(f))
      )
        return false;
      if (
        selectedDomains.size > 0 &&
        !model.domain.some((d) => selectedDomains.has(d))
      )
        return false;
      return true;
    });
  }, [allModels, selectedFields, selectedDomains]);

  function toggleField(field: FieldOfOrigin) {
    setSelectedFields((prev) => {
      const next = new Set(prev);
      if (next.has(field)) next.delete(field);
      else next.add(field);
      return next;
    });
  }

  function toggleDomain(domain: DomainOfApplication) {
    setSelectedDomains((prev) => {
      const next = new Set(prev);
      if (next.has(domain)) next.delete(domain);
      else next.add(domain);
      return next;
    });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-12">
        {/* Hero */}
        <div className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-violet-500/10 px-4 py-2 text-sm text-violet-700 dark:text-violet-300">
            <Brain className="h-4 w-4" />
            Mental Models
          </div>
          <h1 className="mb-3 text-4xl font-bold tracking-tight">
            The Latticework
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-foreground/50">
            {allModels.length} mental models from the world&apos;s best
            thinkers. Learn the theory, practice with real scenarios, build the
            latticework.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link
              href="/mental-models/practice"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-500/15 text-blue-700 dark:text-blue-300 px-5 py-2.5 text-sm font-medium transition hover:bg-blue-500/25"
            >
              <Sparkles className="h-4 w-4" />
              Daily Practice
            </Link>
            <Link
              href="/mental-models/map"
              className="inline-flex items-center gap-2 rounded-lg border border-border/10 px-5 py-2.5 text-sm font-medium text-foreground/70 transition hover:border-border/20 hover:text-foreground"
            >
              <Network className="h-4 w-4" />
              View Map
            </Link>
            <Link
              href="/mental-models/new"
              className="inline-flex items-center gap-2 rounded-lg border border-border/10 px-5 py-2.5 text-sm font-medium text-foreground/70 transition hover:border-emerald-500/30 hover:text-foreground"
            >
              <Plus className="h-4 w-4" />
              Add Model
            </Link>
          </div>
        </div>

        {/* Filter toggle */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-foreground/40">
            {filteredModels.length} of {allModels.length} models
          </p>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center gap-2 rounded-lg border border-border/10 px-3 py-1.5 text-sm text-foreground/60 transition hover:border-border/20 hover:text-foreground"
          >
            <Filter className="h-3.5 w-3.5" />
            {showFilters ? "Hide Filters" : "Filter"}
            {(selectedFields.size > 0 || selectedDomains.size > 0) && (
              <span className="rounded-full bg-violet-500/30 px-1.5 text-xs text-violet-700 dark:text-violet-300">
                {selectedFields.size + selectedDomains.size}
              </span>
            )}
          </button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mb-8 rounded-xl border border-border/5 bg-foreground/[0.02] p-5">
            <div className="mb-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-foreground/40">
                Field of Origin
              </p>
              <div className="flex flex-wrap gap-2">
                {ALL_FIELDS.map((field) => (
                  <button
                    key={field}
                    onClick={() => toggleField(field)}
                    className={`rounded-full px-3 py-1 text-xs transition ${
                      selectedFields.has(field)
                        ? FIELD_COLORS[field]
                        : "bg-foreground/5 text-foreground/40 hover:bg-foreground/10 hover:text-foreground/60"
                    }`}
                  >
                    {field}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-foreground/40">
                Domain of Application
              </p>
              <div className="flex flex-wrap gap-2">
                {ALL_DOMAINS.map((domain) => (
                  <button
                    key={domain}
                    onClick={() => toggleDomain(domain)}
                    className={`rounded-full px-3 py-1 text-xs transition ${
                      selectedDomains.has(domain)
                        ? "bg-teal-500/20 text-teal-700 dark:text-teal-300"
                        : "bg-foreground/5 text-foreground/40 hover:bg-foreground/10 hover:text-foreground/60"
                    }`}
                  >
                    {domain}
                  </button>
                ))}
              </div>
            </div>
            {(selectedFields.size > 0 || selectedDomains.size > 0) && (
              <button
                onClick={() => {
                  setSelectedFields(new Set());
                  setSelectedDomains(new Set());
                }}
                className="mt-3 text-xs text-foreground/40 underline hover:text-foreground/60"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}

        {/* Model Grid */}
        {filteredModels.length === 0 ? (
          <div className="py-20 text-center text-foreground/30">
            <BookOpen className="mx-auto mb-3 h-8 w-8" />
            <p>No models match your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredModels.map((model, idx) => {
              const globalIdx = allModels.indexOf(model);
              const displayIdx = globalIdx >= 0 ? globalIdx : idx;
              return (
                <Link
                  key={model.slug}
                  href={`/mental-models/${model.slug}`}
                  className={`group rounded-xl border border-border/5 bg-gradient-to-br ${CARD_GRADIENTS[displayIdx % CARD_GRADIENTS.length]} p-5 transition hover:border-border/15`}
                >
                  <div className="mb-3 flex items-start justify-between">
                    <span className="text-xs font-mono text-foreground/30">
                      {String(displayIdx + 1).padStart(2, "0")}
                    </span>
                    <ArrowRight className="h-4 w-4 text-foreground/20 transition group-hover:text-foreground/50" />
                  </div>
                  <h3 className="mb-1 text-lg font-semibold">{model.name}</h3>
                  <p className="mb-4 text-sm text-foreground/50">{model.tagline}</p>
                  <div className="mb-3 flex flex-wrap gap-1.5">
                    {model.field.map((f) => (
                      <span
                        key={f}
                        className={`rounded-full px-2 py-0.5 text-[10px] ${FIELD_COLORS[f]}`}
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-xs text-foreground/30">
                    <span>{model.author}</span>
                    <span>{model.scenarios.length} scenarios</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
