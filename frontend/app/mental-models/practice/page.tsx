"use client";

import { Suspense } from "react";
import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Brain,
  ArrowLeft,
  Sparkles,
  Eye,
  BookMarked,
  CheckCircle2,
  RotateCw,
  BarChart3,
} from "lucide-react";
import {
  MENTAL_MODELS,
  getModelBySlug,
  getModelOfTheDay,
  type MentalModel,
} from "@/lib/mental-models-data";
import { api } from "@/lib/api";

type Stage = "write" | "reveal" | "log" | "done";

function PracticeInner() {
  const searchParams = useSearchParams();
  const modelParam = searchParams.get("model");

  const [model, setModel] = useState<MentalModel>(() => {
    if (modelParam) {
      return getModelBySlug(modelParam) || getModelOfTheDay();
    }
    return getModelOfTheDay();
  });

  const [scenario, setScenario] = useState(() => {
    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    return model.scenarios[dayOfYear % model.scenarios.length];
  });

  const [stage, setStage] = useState<Stage>("write");
  const [response, setResponse] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);

  const wordCount = response.trim().split(/\s+/).filter(Boolean).length;

  useEffect(() => {
    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    setScenario(model.scenarios[dayOfYear % model.scenarios.length]);
    setStage("write");
    setResponse("");
    setSessionId(null);
  }, [model]);

  const handleReveal = useCallback(async () => {
    setStage("reveal");
    try {
      const session = await api.createPracticeSession({
        model_slug: model.slug,
        scenario_type: "curated",
        user_response: response,
      });
      setSessionId(session.id);
    } catch {
      // continue without session
    }
  }, [model.slug, response]);

  const handleLog = useCallback(async () => {
    try {
      await api.createDecisionLog({
        practice_session_id: sessionId || undefined,
        model_slugs: [model.slug],
        entry_type: "curated",
        summary: scenario.prompt,
        note: response,
      });
    } catch {
      // continue
    }
    setStage("done");
  }, [sessionId, model.slug, scenario.prompt, response]);

  function pickDifferentModel() {
    const currentIdx = MENTAL_MODELS.indexOf(model);
    const nextIdx = (currentIdx + 1) % MENTAL_MODELS.length;
    setModel(MENTAL_MODELS[nextIdx]);
  }

  const stages: { key: Stage; label: string }[] = [
    { key: "write", label: "Write" },
    { key: "reveal", label: "Reveal" },
    { key: "log", label: "Log" },
    { key: "done", label: "Done" },
  ];
  const stageIdx = stages.findIndex((s) => s.key === stage);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-2xl px-4 py-10">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <Link
            href="/mental-models"
            className="inline-flex items-center gap-2 text-sm text-foreground/40 transition hover:text-foreground/70"
          >
            <ArrowLeft className="h-4 w-4" />
            Library
          </Link>
          <Link
            href="/mental-models/practice/dashboard"
            className="inline-flex items-center gap-2 text-sm text-foreground/40 transition hover:text-foreground/70"
          >
            <BarChart3 className="h-4 w-4" />
            Dashboard
          </Link>
        </div>

        {/* Step indicator */}
        <div className="mb-8 flex items-center gap-2">
          {stages.map((s, i) => (
            <div key={s.key} className="flex items-center gap-2">
              <div
                className={`h-2 w-2 rounded-full transition ${
                  i <= stageIdx ? "bg-blue-400/60" : "bg-foreground/10"
                }`}
              />
              {i < stages.length - 1 && (
                <div
                  className={`h-px w-8 ${
                    i < stageIdx ? "bg-blue-400/60/50" : "bg-foreground/5"
                  }`}
                />
              )}
            </div>
          ))}
          <span className="ml-2 text-xs text-foreground/30">
            {stages[stageIdx].label}
          </span>
        </div>

        {/* Model info */}
        <div className="mb-6">
          <div className="mb-2 flex items-center gap-2">
            <Brain className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            <span className="text-sm text-violet-700 dark:text-violet-300">
              {model.name}
            </span>
            <button
              onClick={pickDifferentModel}
              className="ml-auto inline-flex items-center gap-1 text-xs text-foreground/30 transition hover:text-foreground/60"
            >
              <RotateCw className="h-3 w-3" />
              Different model
            </button>
          </div>
          <p className="text-xs text-foreground/40">{model.keyQuestion}</p>
        </div>

        {/* Scenario */}
        <div className="mb-6 rounded-xl border border-border/5 bg-foreground/[0.02] p-5">
          <p className="mb-3 text-sm leading-relaxed text-foreground/70">
            {scenario.prompt}
          </p>
          <p className="font-medium text-foreground/90">{scenario.question}</p>
        </div>

        {/* Stage: Write */}
        {stage === "write" && (
          <>
            <textarea
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder="Write your answer before revealing the insight..."
              rows={6}
              className="mb-3 w-full rounded-xl border border-border/10 bg-foreground/[0.03] px-4 py-3 text-sm text-foreground/80 placeholder:text-foreground/20 focus:border-violet-500/50 focus:outline-none"
              autoFocus
            />
            <div className="flex items-center justify-between">
              <span
                className={`text-xs ${
                  wordCount >= 5 ? "text-teal-600 dark:text-teal-400" : "text-foreground/30"
                }`}
              >
                {wordCount} words
              </span>
              <button
                onClick={handleReveal}
                disabled={wordCount < 5}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-400/60/15 text-blue-700 dark:text-blue-300 px-5 py-2.5 text-sm font-medium transition hover:bg-blue-400/60/25 disabled:cursor-not-allowed disabled:opacity-30"
              >
                <Eye className="h-4 w-4" />
                Reveal Insight
              </button>
            </div>
          </>
        )}

        {/* Stage: Reveal */}
        {stage === "reveal" && (
          <>
            <div className="mb-4 rounded-xl border border-border/5 bg-foreground/[0.02] p-4">
              <p className="mb-1 text-xs font-medium uppercase tracking-wider text-foreground/40">
                Your response
              </p>
              <p className="text-sm text-foreground/60">{response}</p>
            </div>
            <div className="mb-6 rounded-xl border border-teal-500/20 bg-teal-500/5 p-5">
              <div className="mb-2 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                <span className="text-sm font-medium text-teal-700 dark:text-teal-300">
                  Insight
                </span>
              </div>
              <p className="text-sm leading-relaxed text-foreground/70">
                {scenario.insight}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleLog}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-400/60/15 text-blue-700 dark:text-blue-300 px-5 py-2.5 text-sm font-medium transition hover:bg-blue-400/60/25"
              >
                <BookMarked className="h-4 w-4" />
                Log to Decision Journal
              </button>
              <button
                onClick={() => setStage("done")}
                className="rounded-lg border border-border/10 px-5 py-2.5 text-sm text-foreground/50 transition hover:border-border/20 hover:text-foreground/70"
              >
                Skip
              </button>
            </div>
          </>
        )}

        {/* Stage: Log / Done */}
        {(stage === "log" || stage === "done") && (
          <div className="rounded-xl border border-border/5 bg-foreground/[0.02] p-8 text-center">
            <CheckCircle2 className="mx-auto mb-3 h-8 w-8 text-teal-600 dark:text-teal-400" />
            <h3 className="mb-1 font-semibold">Session Complete</h3>
            <p className="mb-6 text-sm text-foreground/50">
              {stage === "done" && sessionId
                ? "Logged to your decision journal."
                : "Great practice! Keep building the latticework."}
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={pickDifferentModel}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-400/60/15 text-blue-700 dark:text-blue-300 px-5 py-2.5 text-sm font-medium transition hover:bg-blue-400/60/25"
              >
                <RotateCw className="h-4 w-4" />
                Practice Another
              </button>
              <Link
                href="/mental-models/practice/dashboard"
                className="rounded-lg border border-border/10 px-5 py-2.5 text-sm text-foreground/50 transition hover:border-border/20 hover:text-foreground/70"
              >
                View Dashboard
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PracticePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <Brain className="h-8 w-8 animate-pulse text-violet-600 dark:text-violet-400" />
        </div>
      }
    >
      <PracticeInner />
    </Suspense>
  );
}
