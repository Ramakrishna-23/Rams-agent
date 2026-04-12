"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import { ZoomIn, ZoomOut, Brain, Sparkles } from "lucide-react";
import {
  MENTAL_MODELS,
  MODEL_CONNECTIONS,
  getModelBySlug,
  getRelatedModels,
} from "@/lib/mental-models-data";

// Node positions — arranged in clusters
const NODE_POSITIONS: Record<string, { x: number; y: number }> = {
  inversion: { x: 200, y: 150 },
  "first-principles": { x: 380, y: 100 },
  "circle-of-competence": { x: 550, y: 180 },
  "second-order-thinking": { x: 150, y: 320 },
  "probabilistic-thinking": { x: 450, y: 320 },
  incentives: { x: 300, y: 430 },
  "margin-of-safety": { x: 600, y: 400 },
  "availability-bias": { x: 100, y: 480 },
  "lollapalooza-effect": { x: 250, y: 250 },
  "opportunity-cost": { x: 550, y: 520 },
};

const CLUSTER_COLORS: Record<string, string> = {
  inversion: "#8b5cf6",
  "first-principles": "#6366f1",
  "circle-of-competence": "#a855f7",
  "second-order-thinking": "#f59e0b",
  "probabilistic-thinking": "#3b82f6",
  incentives: "#f43f5e",
  "margin-of-safety": "#06b6d4",
  "availability-bias": "#ec4899",
  "lollapalooza-effect": "#f97316",
  "opportunity-cost": "#10b981",
};

const CONNECTION_STYLES: Record<
  string,
  { color: string; dash: string; label: string }
> = {
  combines_with: { color: "#8b5cf6", dash: "", label: "Combines with" },
  contrasts_with: { color: "#f43f5e", dash: "6,4", label: "Contrasts with" },
  prerequisite_for: { color: "#f59e0b", dash: "", label: "Prerequisite for" },
};

interface MentalModelsMapProps {
  /** Fixed height for the SVG canvas. Defaults to "100%" (fill parent). */
  height?: string;
  /** Show the legend overlay. */
  showLegend?: boolean;
  /** Show side panel when a node is selected. */
  showSidePanel?: boolean;
}

export default function MentalModelsMap({
  height = "100%",
  showLegend = true,
  showSidePanel = true,
}: MentalModelsMapProps) {
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  const selectedModel = selectedSlug ? getModelBySlug(selectedSlug) : null;
  const selectedRelated = selectedSlug ? getRelatedModels(selectedSlug) : [];

  const connectedSlugs = new Set<string>();
  if (hoveredSlug || selectedSlug) {
    const target = hoveredSlug || selectedSlug;
    MODEL_CONNECTIONS.forEach((c) => {
      if (c.from === target) connectedSlugs.add(c.to);
      if (c.to === target) connectedSlugs.add(c.from);
    });
    if (target) connectedSlugs.add(target);
  }

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest("[data-node]")) return;
      setDragging(true);
      dragStart.current = {
        x: e.clientX,
        y: e.clientY,
        panX: pan.x,
        panY: pan.y,
      };
    },
    [pan]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragging) return;
      setPan({
        x: dragStart.current.panX + (e.clientX - dragStart.current.x),
        y: dragStart.current.panY + (e.clientY - dragStart.current.y),
      });
    },
    [dragging]
  );

  const handleMouseUp = useCallback(() => {
    setDragging(false);
  }, []);

  return (
    <div className="flex" style={{ height }}>
      {/* Main map area */}
      <div className="relative flex-1">
        {/* Zoom controls */}
        <div className="absolute right-3 top-3 z-10 flex items-center gap-1 rounded-lg border border-border/10 bg-background/80 backdrop-blur">
          <button
            onClick={() => setZoom((z) => Math.min(z + 0.2, 2))}
            className="p-2 text-foreground/50 transition hover:text-foreground"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <span className="px-1 text-xs text-foreground/30">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom((z) => Math.max(z - 0.2, 0.4))}
            className="p-2 text-foreground/50 transition hover:text-foreground"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
        </div>

        {/* SVG Canvas */}
        <svg
          className={`h-full w-full ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            {/* Connections */}
            {MODEL_CONNECTIONS.map((conn, i) => {
              const from = NODE_POSITIONS[conn.from];
              const to = NODE_POSITIONS[conn.to];
              if (!from || !to) return null;
              const style = CONNECTION_STYLES[conn.type];
              const isHighlighted =
                connectedSlugs.size === 0 ||
                (connectedSlugs.has(conn.from) && connectedSlugs.has(conn.to));
              return (
                <line
                  key={i}
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke={style.color}
                  strokeWidth={isHighlighted ? 2 : 1}
                  strokeDasharray={style.dash}
                  opacity={isHighlighted ? 0.6 : 0.1}
                  className="transition-opacity duration-200"
                />
              );
            })}

            {/* Nodes */}
            {MENTAL_MODELS.map((model) => {
              const pos = NODE_POSITIONS[model.slug];
              if (!pos) return null;
              const color = CLUSTER_COLORS[model.slug] || "#8b5cf6";
              const isActive = selectedSlug === model.slug;
              const isHighlighted =
                connectedSlugs.size === 0 || connectedSlugs.has(model.slug);

              return (
                <g
                  key={model.slug}
                  data-node
                  className="cursor-pointer"
                  onClick={() =>
                    setSelectedSlug(
                      selectedSlug === model.slug ? null : model.slug
                    )
                  }
                  onMouseEnter={() => setHoveredSlug(model.slug)}
                  onMouseLeave={() => setHoveredSlug(null)}
                  opacity={isHighlighted ? 1 : 0.2}
                  style={{ transition: "opacity 200ms" }}
                >
                  {isActive && (
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={35}
                      fill={color}
                      opacity={0.15}
                    />
                  )}
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={24}
                    fill={`${color}20`}
                    stroke={color}
                    strokeWidth={isActive ? 2.5 : 1.5}
                  />
                  <text
                    x={pos.x}
                    y={pos.y + 40}
                    textAnchor="middle"
                    fill="currentColor"
                    fontSize={11}
                    opacity={0.7}
                  >
                    {model.name.length > 18
                      ? model.name.slice(0, 16) + "..."
                      : model.name}
                  </text>
                  <text
                    x={pos.x}
                    y={pos.y + 4}
                    textAnchor="middle"
                    fill={color}
                    fontSize={12}
                    fontWeight="bold"
                  >
                    {String(MENTAL_MODELS.indexOf(model) + 1).padStart(2, "0")}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        {/* Legend */}
        {showLegend && (
          <div className="absolute bottom-3 left-3 rounded-lg border border-border/10 bg-background/80 p-3 backdrop-blur">
            <p className="mb-2 text-[10px] uppercase tracking-wider text-foreground/30">
              Connections
            </p>
            <div className="space-y-1.5">
              {Object.entries(CONNECTION_STYLES).map(([type, style]) => (
                <div key={type} className="flex items-center gap-2">
                  <svg width="24" height="8">
                    <line
                      x1="0"
                      y1="4"
                      x2="24"
                      y2="4"
                      stroke={style.color}
                      strokeWidth={2}
                      strokeDasharray={style.dash}
                    />
                  </svg>
                  <span className="text-[10px] text-foreground/50">
                    {style.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Side Panel */}
      {showSidePanel && selectedModel && (
        <div className="w-72 shrink-0 overflow-y-auto border-l border-border/5 bg-foreground/[0.01] p-4">
          <div className="mb-3">
            <h3 className="text-base font-semibold">{selectedModel.name}</h3>
            <p className="text-xs text-foreground/50">{selectedModel.tagline}</p>
          </div>

          <div className="mb-3 rounded-lg border border-border/5 bg-foreground/[0.02] p-2.5">
            <p className="mb-0.5 text-[10px] uppercase tracking-wider text-foreground/30">
              Key Question
            </p>
            <p className="text-xs text-foreground/70">
              {selectedModel.keyQuestion}
            </p>
          </div>

          {selectedRelated.length > 0 && (
            <div className="mb-3">
              <p className="mb-1.5 text-[10px] uppercase tracking-wider text-foreground/30">
                Connected Models
              </p>
              <div className="space-y-1">
                {selectedRelated.map(({ model: rel, type }) => (
                  <button
                    key={rel.slug}
                    onClick={() => setSelectedSlug(rel.slug)}
                    className="flex w-full items-center justify-between rounded-lg border border-border/5 bg-foreground/[0.02] px-2.5 py-1.5 text-left transition hover:border-border/10"
                  >
                    <span className="text-xs">{rel.name}</span>
                    <span
                      className="rounded px-1.5 py-0.5 text-[10px]"
                      style={{
                        backgroundColor: `${CONNECTION_STYLES[type].color}20`,
                        color: CONNECTION_STYLES[type].color,
                      }}
                    >
                      {CONNECTION_STYLES[type].label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Link
              href={`/mental-models/${selectedModel.slug}`}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-border/10 px-3 py-1.5 text-xs text-foreground/60 transition hover:border-border/20 hover:text-foreground"
            >
              <Brain className="h-3.5 w-3.5" />
              View Detail
            </Link>
            <Link
              href={`/mental-models/practice?model=${selectedModel.slug}`}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-500/15 text-blue-700 dark:text-blue-300 px-3 py-1.5 text-xs font-medium transition hover:bg-blue-500/25"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Practice
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
