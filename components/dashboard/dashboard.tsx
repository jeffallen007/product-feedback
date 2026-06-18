"use client"

import { useEffect, useState } from "react"
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
  DASHBOARD_ALERTS,
  DASHBOARD_SOURCE_FILTER_TO_TYPE,
  DASHBOARD_SOURCE_TABS,
  type AnalysisSourceKey,
} from "@/lib/mocks/dashboard"
import type { SourceTag } from "@/lib/mocks/workflow"
import type { DashboardPayload } from "@/lib/types/contracts"
import { getAnalysisRun } from "@/lib/services/analysis-service"
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
  Loader2,
} from "lucide-react"

export function Dashboard({
  analysisRunId,
  onNewAnalysis,
}: {
  analysisRunId: string
  onNewAnalysis: () => void
}) {
  const [activeSource, setActiveSource] = useState<AnalysisSourceKey>("all")
  const [chatOpen, setChatOpen] = useState(false)
  const [dashboard, setDashboard] = useState<DashboardPayload | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadAnalysisRun() {
      setIsLoading(true)
      setErrorMessage(null)

      try {
        const result = await getAnalysisRun({ analysisRunId })
        if (!cancelled) {
          setDashboard(result.dashboard)
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Unable to load the mock analysis run.",
          )
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadAnalysisRun()

    return () => {
      cancelled = true
    }
  }, [analysisRunId])

  if (errorMessage) {
    return (
      <div className="min-h-svh bg-background">
        <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-6 py-3">
            <BrandMark />
            <Button variant="outline" size="sm" onClick={onNewAnalysis}>
              <Plus className="size-4" aria-hidden="true" />
              New Analysis
            </Button>
          </div>
        </header>
        <div className="mx-auto max-w-3xl px-6 py-16">
          <Card className="p-10 text-center">
            <p className="text-sm font-medium text-foreground">
              Unable to load the analysis dashboard
            </p>
            <p className="mt-1 text-xs text-destructive">{errorMessage}</p>
          </Card>
        </div>
      </div>
    )
  }

  if (isLoading || !dashboard) {
    return (
      <div className="min-h-svh bg-background">
        <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-6 py-3">
            <BrandMark />
            <Button variant="outline" size="sm" onClick={onNewAnalysis}>
              <Plus className="size-4" aria-hidden="true" />
              New Analysis
            </Button>
          </div>
        </header>
        <div className="mx-auto max-w-3xl px-6 py-16">
          <Card className="flex flex-col items-center gap-3 p-10 text-center">
            <Loader2 className="size-6 animate-spin text-primary" aria-hidden="true" />
            <div>
              <p className="text-sm font-medium text-foreground">
                Loading analysis dashboard
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Preparing the mock analysis payload.
              </p>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  const sourceTags = dashboard.sourceMix.map((source) => source.label as SourceTag)
  const contextItems = [
    {
      icon: Target,
      label: "Analysis Target",
      value: dashboard.analysisContext.productName,
    },
    {
      icon: Layers,
      label: "Sources Included",
      value: String(dashboard.analysisContext.sourceCount),
    },
    {
      icon: ListChecks,
      label: "Feedback Items",
      value: String(dashboard.analysisContext.feedbackItemCount),
    },
    {
      icon: Clock,
      label: "Last Run",
      value: dashboard.analysisContext.lastRunAt,
    },
  ]

  const noData =
    activeSource !== "all" &&
    !dashboard.sourceMix.some(
      (source) =>
        source.sourceType === DASHBOARD_SOURCE_FILTER_TO_TYPE[activeSource],
    )

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
              {dashboard.analysisContext.productName} Feedback Analysis
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {dashboard.analysisContext.productDescription}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {sourceTags.map((source) => (
                <SourceBadge key={source} source={source} />
              ))}
              <span className="inline-flex items-center gap-1.5 rounded-md border border-primary/25 bg-accent/40 px-2 py-0.5 text-xs font-medium text-primary">
                <Sparkles className="size-3" aria-hidden="true" />
                {dashboard.analysisContext.goal}
              </span>
            </div>
          </div>

          {/* Analysis Context panel */}
          <Card className="mb-6 p-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {contextItems.map((item) => {
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
                {dashboard.analysisContext.processingMethod}
              </p>
            </div>
          </Card>

          {/* KPI cards */}
          <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
            {dashboard.kpis.map((kpi) => (
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
            <SourceMix
              items={dashboard.sourceMix}
              totalFeedbackItems={dashboard.analysisContext.feedbackItemCount}
            />
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
                {DASHBOARD_SOURCE_TABS.map((tab) => (
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
                    <span className="font-semibold">Heads up:</span>{" "}
                    {DASHBOARD_ALERTS.xRateLimited}
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
                  {dashboard.executiveSummary}
                </p>
              </Card>

              <SentimentOverview
                sentimentBreakdown={dashboard.sentimentBreakdown}
              />
              <TopThemes themes={dashboard.topThemes} />
              <PainPointCards painPoints={dashboard.painPoints} />
              <FeatureRequests featureRequests={dashboard.featureRequests} />
              <RoadmapRecommendations
                roadmap={dashboard.roadmapRecommendations}
              />
              <RepresentativeQuotes quotes={dashboard.representativeQuotes} />
              <ModelSignals signals={dashboard.modelSignals} />
            </div>
          )}
        </div>

        {/* Desktop chat panel */}
        <aside className="sticky top-[57px] hidden h-[calc(100svh-57px)] w-[380px] shrink-0 border-l border-border bg-card lg:block">
          <ChatPanel analysisRunId={analysisRunId} />
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
              <ChatPanel analysisRunId={analysisRunId} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
