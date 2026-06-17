"use client"

import { useState } from "react"
import { BrandMark } from "@/components/brand-mark"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SourceBadge } from "@/components/dashboard/source-badge"
import { SourceMix } from "@/components/dashboard/source-mix"
import { SentimentOverview } from "@/components/dashboard/sentiment-overview"
import { TopThemes } from "@/components/dashboard/top-themes"
import { PainPointCards } from "@/components/dashboard/pain-point-cards"
import { FeatureRequests } from "@/components/dashboard/feature-requests"
import { RoadmapRecommendations } from "@/components/dashboard/roadmap-recommendations"
import {
  RepresentativeQuotes,
  ModelSignals,
} from "@/components/dashboard/quotes-and-signals"
import { ChatPanel } from "@/components/dashboard/chat-panel"
import {
  ANALYSIS_META,
  KPIS,
  EXECUTIVE_SUMMARY,
  SOURCE_TABS,
  type AnalysisSourceKey,
} from "@/lib/analysis-data"
import {
  Plus,
  Sparkles,
  X as XIcon,
  MessageSquare,
  Target,
  Layers,
  ListChecks,
  Clock,
  Cpu,
  AlertTriangle,
} from "lucide-react"

const CONTEXT_ITEMS = [
  { icon: Target, label: "Analysis Target", value: ANALYSIS_META.productName },
  { icon: Layers, label: "Sources Included", value: "3" },
  { icon: ListChecks, label: "Feedback Items", value: "592" },
  { icon: Clock, label: "Last Run", value: ANALYSIS_META.lastRun },
]

export function Dashboard({ onNewAnalysis }: { onNewAnalysis: () => void }) {
  const [activeSource, setActiveSource] = useState<AnalysisSourceKey>("all")
  const [chatOpen, setChatOpen] = useState(false)

  const noData = activeSource === "csv"

  return (
    <div className="min-h-svh bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-6 py-3">
          <BrandMark />
          <Button variant="outline" size="sm" onClick={onNewAnalysis}>
            <Plus className="size-4" aria-hidden="true" />
            New Analysis
          </Button>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1400px]">
        {/* Main scroll column */}
        <div className="min-w-0 flex-1 px-6 py-6 lg:pr-4">
          {/* Page title + badges */}
          <div className="mb-6">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground text-balance">
              {ANALYSIS_META.productName} Feedback Analysis
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {ANALYSIS_META.productDescription}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <SourceBadge source="Demo Dataset" />
              <SourceBadge source="X Search" />
              <SourceBadge source="Pasted Feedback" />
              <span className="inline-flex items-center gap-1.5 rounded-md border border-primary/25 bg-accent/40 px-2 py-0.5 text-xs font-medium text-primary">
                <Sparkles className="size-3" aria-hidden="true" />
                {ANALYSIS_META.goal}
              </span>
            </div>
          </div>

          {/* Analysis Context panel */}
          <Card className="mb-6 p-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {CONTEXT_ITEMS.map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.label} className="flex items-center gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">
                        {item.label}
                      </p>
                      <p className="truncate text-sm font-semibold text-foreground">
                        {item.value}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="mt-4 flex items-center gap-2 border-t border-border pt-3">
              <Cpu
                className="size-3.5 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
              <p className="text-xs text-muted-foreground">
                <span className="text-muted-foreground/70">
                  Processing Method:
                </span>{" "}
                {ANALYSIS_META.processingMethod}
              </p>
            </div>
          </Card>

          {/* KPI cards */}
          <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
            {KPIS.map((kpi) => (
              <Card key={kpi.label} className="p-4">
                <p className="text-2xl font-semibold tabular-nums text-foreground">
                  {kpi.value}
                </p>
                <p className="mt-1 text-xs leading-snug text-muted-foreground">
                  {kpi.label}
                </p>
              </Card>
            ))}
          </div>

          {/* Source mix */}
          <div className="mb-6">
            <SourceMix />
          </div>

          {/* Source filter tabs */}
          <div className="mb-5">
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              Filter analysis by source
            </p>
            <Tabs
              value={activeSource}
              onValueChange={(v) => setActiveSource(v as AnalysisSourceKey)}
            >
              <TabsList className="flex h-auto flex-wrap justify-start gap-1 bg-secondary/60">
                {SOURCE_TABS.map((tab) => (
                  <TabsTrigger
                    key={tab.key}
                    value={tab.key}
                    className="text-xs data-[state=active]:bg-card"
                  >
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          {noData ? (
            <Card className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <span className="flex size-11 items-center justify-center rounded-xl border border-border bg-secondary">
                <Layers
                  className="size-5 text-muted-foreground"
                  aria-hidden="true"
                />
              </span>
              <p className="mt-3 text-sm font-medium text-foreground">
                No feedback from CSV Upload
              </p>
              <p className="mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
                This feedback set does not include a CSV Upload source. Add one
                from a new analysis, or switch back to a source with data.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => setActiveSource("all")}
              >
                View all sources
              </Button>
            </Card>
          ) : (
            <div className="space-y-6">
              {activeSource === "x" && (
                <Card className="flex items-start gap-3 border-chart-4/30 bg-chart-4/8 p-4">
                  <AlertTriangle
                    className="mt-0.5 size-4 shrink-0 text-chart-4"
                    aria-hidden="true"
                  />
                  <p className="text-xs leading-relaxed text-foreground">
                    <span className="font-semibold">Heads up:</span> the X
                    Search source was recently rate limited. Results reflect the
                    last successful pull of 86 posts.
                  </p>
                </Card>
              )}

              {/* Executive summary */}
              <Card className="p-5">
                <div className="flex items-center gap-2">
                  <Sparkles
                    className="size-4 text-primary"
                    aria-hidden="true"
                  />
                  <h3 className="text-sm font-semibold text-foreground">
                    Executive Summary
                  </h3>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-foreground text-pretty">
                  {EXECUTIVE_SUMMARY}
                </p>
              </Card>

              <SentimentOverview />
              <TopThemes />
              <PainPointCards />
              <FeatureRequests />
              <RoadmapRecommendations />
              <RepresentativeQuotes />
              <ModelSignals />
            </div>
          )}
        </div>

        {/* Desktop chat panel */}
        <aside className="sticky top-[57px] hidden h-[calc(100svh-57px)] w-[380px] shrink-0 border-l border-border bg-card lg:block">
          <ChatPanel />
        </aside>
      </div>

      {/* Mobile chat trigger */}
      <Button
        onClick={() => setChatOpen(true)}
        className="fixed bottom-5 right-5 z-30 h-12 rounded-full px-5 shadow-lg lg:hidden"
        aria-label="Open analysis chat"
      >
        <MessageSquare className="size-4" aria-hidden="true" />
        Ask
      </Button>

      {/* Mobile chat drawer */}
      {chatOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-foreground/30 backdrop-blur-sm"
            onClick={() => setChatOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute inset-x-0 bottom-0 flex h-[85svh] flex-col rounded-t-2xl border-t border-border bg-card">
            <div className="flex items-center justify-end px-3 pt-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setChatOpen(false)}
                aria-label="Close chat"
              >
                <XIcon className="size-4" aria-hidden="true" />
              </Button>
            </div>
            <div className="min-h-0 flex-1">
              <ChatPanel />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
