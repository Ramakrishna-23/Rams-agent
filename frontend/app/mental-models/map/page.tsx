"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import MentalModelsMap from "@/components/mental-models-map";

export default function ConnectionMapPage() {
  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3">
        <Link
          href="/mental-models"
          className="inline-flex items-center gap-2 rounded-lg border border-border/10 bg-background/80 px-3 py-1.5 text-sm text-foreground/60 backdrop-blur transition hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Library
        </Link>
      </div>

      {/* Map fills remaining space */}
      <div className="flex-1">
        <MentalModelsMap height="100%" showLegend showSidePanel />
      </div>
    </div>
  );
}
