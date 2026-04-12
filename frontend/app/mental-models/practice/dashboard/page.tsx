"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Flame,
  Trophy,
  BookOpen,
  Brain,
  ClipboardList,
  Clock,
  Sparkles,
  Network,
  Trash2,
  Plus,
} from "lucide-react";
import { api } from "@/lib/api";
import { MENTAL_MODELS, getModelBySlug } from "@/lib/mental-models-data";
import MentalModelsMap from "@/components/mental-models-map";
import type { DashboardStats, DecisionLog } from "@/lib/types";

const STAT_ICONS = [Flame, Trophy, BookOpen, Brain, ClipboardList, Clock];
const STAT_COLORS = [
  "text-orange-600 dark:text-orange-400",
  "text-amber-600 dark:text-amber-400",
  "text-violet-600 dark:text-violet-400",
  "text-teal-600 dark:text-teal-400",
  "text-blue-600 dark:text-blue-400",
  "text-rose-600 dark:text-rose-400",
];

const VERDICT_STYLES: Record<string, string> = {
  yes: "bg-teal-500/20 text-teal-700 dark:text-teal-300",
  no: "bg-rose-500/20 text-rose-700 dark:text-rose-300",
  wait: "bg-amber-500/20 text-amber-700 dark:text-amber-300",
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [logEntries, setLogEntries] = useState<DecisionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredEntry, setHoveredEntry] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [dashboardStats, entries] = await Promise.all([
        api.getDashboardStats(),
        api.getDecisionLog({ limit: 20 }),
      ]);
      setStats(dashboardStats);
      setLogEntries(entries);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleDelete(id: string) {
    try {
      await api.deleteDecisionLog(id);
      setLogEntries((prev) => prev.filter((e) => e.id !== id));
    } catch {
      // silent
    }
  }

  // Build calendar heatmap data (last 35 days)
  const calendarDays = Array.from({ length: 35 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (34 - i));
    const dateStr = d.toISOString().split("T")[0];
    const count = stats?.sessions_by_date[dateStr] || 0;
    const isToday = i === 34;
    return { dateStr, count, isToday };
  });

  // Model usage sorted
  const modelUsage = stats
    ? Object.entries(stats.model_usage)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 8)
    : [];
  const maxUsage = modelUsage.length > 0 ? modelUsage[0][1] : 1;

  // Unused models
  const usedSlugs = new Set(Object.keys(stats?.model_usage || {}));
  const unusedModels = MENTAL_MODELS.filter((m) => !usedSlugs.has(m.slug));

  // Streak message
  function streakMessage(streak: number): string {
    if (streak === 0) return "Start your streak today.";
    if (streak < 3) return "Building momentum!";
    if (streak < 7) return "Strong consistency.";
    if (streak < 14) return "You are on fire!";
    return "Legendary streak. Keep it alive.";
  }

  const statCards = stats
    ? [
        { label: "Current Streak", value: stats.current_streak, suffix: " days" },
        { label: "Best Streak", value: stats.best_streak, suffix: " days" },
        { label: "Total Sessions", value: stats.total_sessions, suffix: "" },
        {
          label: "Models Used",
          value: stats.models_used,
          suffix: ` of ${MENTAL_MODELS.length}`,
        },
        { label: "Decisions Logged", value: stats.decisions_logged, suffix: "" },
        { label: "Revisits Due", value: stats.revisits_due, suffix: "" },
      ]
    : [];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Brain className="h-8 w-8 animate-pulse text-violet-600 dark:text-violet-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-4xl px-4 py-10">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <Link
            href="/mental-models"
            className="inline-flex items-center gap-2 text-sm text-foreground/40 transition hover:text-foreground/70"
          >
            <ArrowLeft className="h-4 w-4" />
            Library
          </Link>
          <h1 className="text-lg font-semibold">Dashboard</h1>
          <div className="w-16" />
        </div>

        {/* Streak message */}
        {stats && (
          <div className="mb-6 text-center">
            <p className="text-sm text-foreground/40">
              {streakMessage(stats.current_streak)}
            </p>
          </div>
        )}

        {/* Stat cards */}
        <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {statCards.map((stat, i) => {
            const Icon = STAT_ICONS[i];
            return (
              <div
                key={stat.label}
                className="rounded-xl border border-border/5 bg-foreground/[0.02] p-4 text-center"
              >
                <Icon className={`mx-auto mb-2 h-5 w-5 ${STAT_COLORS[i]}`} />
                <p className="text-2xl font-bold">
                  {stat.value}
                  <span className="text-sm font-normal text-foreground/30">
                    {stat.suffix}
                  </span>
                </p>
                <p className="text-xs text-foreground/40">{stat.label}</p>
              </div>
            );
          })}
        </div>

        {/* Calendar Heatmap */}
        <div className="mb-8">
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-foreground/40">
            Last 35 Days
          </h2>
          <div className="grid grid-cols-7 gap-1.5">
            {calendarDays.map((day) => (
              <div
                key={day.dateStr}
                title={`${day.dateStr}: ${day.count} session${day.count !== 1 ? "s" : ""}`}
                className={`aspect-square rounded-md ${
                  day.isToday
                    ? "border border-violet-500/50 " +
                      (day.count > 0 ? "bg-teal-500/40" : "bg-violet-500/20")
                    : day.count > 0
                      ? day.count >= 3
                        ? "bg-teal-500/60"
                        : "bg-teal-500/30"
                      : "bg-foreground/[0.03]"
                }`}
              />
            ))}
          </div>
          <div className="mt-2 flex items-center justify-end gap-2 text-xs text-foreground/30">
            <div className="flex items-center gap-1">
              <div className="h-2.5 w-2.5 rounded-sm bg-foreground/[0.03]" />
              None
            </div>
            <div className="flex items-center gap-1">
              <div className="h-2.5 w-2.5 rounded-sm bg-teal-500/30" />
              1-2
            </div>
            <div className="flex items-center gap-1">
              <div className="h-2.5 w-2.5 rounded-sm bg-teal-500/60" />
              3+
            </div>
            <div className="flex items-center gap-1">
              <div className="h-2.5 w-2.5 rounded-sm border border-violet-500/50 bg-violet-500/20" />
              Today
            </div>
          </div>
        </div>

        {/* Model Usage */}
        {modelUsage.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-foreground/40">
              Model Usage
            </h2>
            <div className="space-y-2">
              {modelUsage.map(([slug, count]) => {
                const m = getModelBySlug(slug);
                return (
                  <div key={slug} className="flex items-center gap-3">
                    <span className="w-40 truncate text-sm text-foreground/70">
                      {m?.name || slug}
                    </span>
                    <div className="flex-1">
                      <div
                        className="h-5 rounded-md bg-violet-500/30"
                        style={{
                          width: `${(count / maxUsage) * 100}%`,
                          minWidth: "8px",
                        }}
                      />
                    </div>
                    <span className="w-8 text-right text-xs text-foreground/40">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Unused Models */}
        {unusedModels.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-foreground/40">
              Not Yet Practiced
            </h2>
            <div className="flex flex-wrap gap-2">
              {unusedModels.map((m) => (
                <Link
                  key={m.slug}
                  href={`/mental-models/practice?model=${m.slug}`}
                  className="rounded-full border border-border/5 bg-foreground/[0.02] px-3 py-1.5 text-xs text-foreground/50 transition hover:border-violet-500/30 hover:text-violet-700 dark:text-violet-300"
                >
                  {m.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Decision Log */}
        <div className="mb-8">
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-foreground/40">
            Decision Log
          </h2>
          {logEntries.length === 0 ? (
            <div className="rounded-xl border border-border/5 bg-foreground/[0.02] p-8 text-center text-sm text-foreground/30">
              No entries yet. Complete a practice session to start logging.
            </div>
          ) : (
            <div className="space-y-2">
              {logEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="group relative rounded-xl border border-border/5 bg-foreground/[0.02] px-4 py-3"
                  onMouseEnter={() => setHoveredEntry(entry.id)}
                  onMouseLeave={() => setHoveredEntry(null)}
                >
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="rounded bg-foreground/5 px-1.5 py-0.5 text-[10px] text-foreground/40">
                          {entry.entry_type}
                        </span>
                        {entry.verdict && (
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] ${
                              VERDICT_STYLES[entry.verdict] ||
                              "bg-foreground/5 text-foreground/40"
                            }`}
                          >
                            {entry.verdict}
                          </span>
                        )}
                        {entry.domain && (
                          <span className="text-[10px] text-foreground/30">
                            {entry.domain}
                          </span>
                        )}
                        {entry.revisit_at &&
                          !entry.outcome &&
                          new Date(entry.revisit_at) <= new Date() && (
                            <span className="rounded bg-rose-500/20 px-1.5 py-0.5 text-[10px] text-rose-700 dark:text-rose-300">
                              Revisit due
                            </span>
                          )}
                      </div>
                      {entry.summary && (
                        <p className="mb-1 truncate text-sm text-foreground/60">
                          {entry.summary}
                        </p>
                      )}
                      <div className="flex items-center gap-2">
                        {entry.model_slugs.map((slug) => (
                          <span
                            key={slug}
                            className="text-[10px] text-violet-700 dark:text-violet-300/60"
                          >
                            {getModelBySlug(slug)?.name || slug}
                          </span>
                        ))}
                        <span className="text-[10px] text-foreground/20">
                          {new Date(entry.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    {hoveredEntry === entry.id && (
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="ml-2 rounded p-1 text-foreground/20 transition hover:bg-red-500/10 hover:text-red-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Model Connection Map */}
        <div className="mb-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium uppercase tracking-wider text-foreground/40">
              Model Connection Map
            </h2>
            <Link
              href="/mental-models/map"
              className="text-xs text-foreground/30 transition hover:text-foreground/60"
            >
              Full screen
            </Link>
          </div>
          <div className="overflow-hidden rounded-xl border border-border/5 bg-foreground/[0.02]"
               style={{ height: 400 }}>
            <MentalModelsMap height="100%" showLegend={false} showSidePanel={false} />
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Link
            href="/mental-models/practice"
            className="flex items-center gap-3 rounded-xl border border-border/5 bg-foreground/[0.02] p-4 transition hover:border-violet-500/20"
          >
            <Sparkles className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            <div>
              <p className="text-sm font-medium">Daily Practice</p>
              <p className="text-xs text-foreground/40">
                Practice a model with a scenario
              </p>
            </div>
          </Link>
          <Link
            href="/mental-models/map"
            className="flex items-center gap-3 rounded-xl border border-border/5 bg-foreground/[0.02] p-4 transition hover:border-teal-500/20"
          >
            <Network className="h-5 w-5 text-teal-600 dark:text-teal-400" />
            <div>
              <p className="text-sm font-medium">Model Map</p>
              <p className="text-xs text-foreground/40">
                Explore model connections
              </p>
            </div>
          </Link>
          <Link
            href="/mental-models/new"
            className="flex items-center gap-3 rounded-xl border border-border/5 bg-foreground/[0.02] p-4 transition hover:border-emerald-500/20"
          >
            <Plus className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <div>
              <p className="text-sm font-medium">Add Model</p>
              <p className="text-xs text-foreground/40">
                Add to your latticework
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
