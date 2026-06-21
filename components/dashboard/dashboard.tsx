"use client"

import { useEffect, useState } from "react"
import { BrandMark } from "@/components/brand-mark"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
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
  type ChatMessage,
} from "@/lib/mocks/dashboard"
import type { ChatScope, DashboardPayload } from "@/lib/types/contracts"
import {
  adaptBackendBundleToDashboard,
  type BackendDashboardViewModel,
} from "@/lib/services/bundle-dashboard-adapter"
import type { SourceTag } from "@/lib/types/workflow"
import { getAnalysisRunBundle } from "@/lib/services/analysis-service"
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
  Loader2,
} from "lucide-react"

function hasSentimentData(dashboard: DashboardPayload): boolean {
  return (
    dashboard.sentimentBreakdown.overall.length > 0 ||
    dashboard.sentimentBreakdown.bySource.length > 0
  )
}

function toScopeLabel(scope: ChatScope): string {
  switch (scope) {
    case "demo_dataset":
      return "Demo Dataset"
    case "csv_upload":
      return "CSV Upload"
    case "pasted_text":
      return "Pasted Feedback"
    case "x_search":
      return "X Search"
    default:
      return "All Sources"
  }
}

export function Dashboard({
  analysisRunId,
  onNewAnalysis,
}: {
  analysisRunId: string
  onNewAnalysis: () => void
}) {
  const [chatOpen, setChatOpen] = useState(false)
  const [backendView, setBackendView] =
    useState<BackendDashboardViewModel | null>(null)
  const [dashboard, setDashboard] = useState<DashboardPayload | null>(null)
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadAnalysisRun() {
      setIsLoading(true)
      setErrorMessage(null)

      try {
        const result = await getAnalysisRunBundle({ analysisRunId })
        if (!cancelled) {
          if (result.meta.dataMode === "backend") {
            const adapted = adaptBackendBundleToDashboard(result)
            setBackendView(adapted)
            setDashboard(adapted.dashboard)
            setChatHistory(adapted.chatHistory)
            return
          }

          setBackendView(null)
          if (!result.dashboard) {
            setDashboard(null)
            setErrorMessage(
              result.placeholderMessage ??
                "The analysis dashboard is not available yet.",
            )
            setChatHistory([])
            return
          }

          setDashboard(result.dashboard)
          setChatHistory(
            result.chatHistory.map((message) =>
              message.role === "user"
                ? {
                    role: "user",
                    content: message.question ?? "",
                    scope: toScopeLabel(message.scope),
                  }
                : {
                    role: "assistant",
                    content: message.answer ?? "",
                    followUps: message.followUpSuggestions,
                  },
            ),
          )
        }
      } catch (error) {
        if (!cancelled) {
          setBackendView(null)
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Unable to load the analysis run.",
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
                Preparing the analysis payload.
              </p>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  const sourceTags =
    backendView?.sourceTags ??
    (dashboard.sourceMix.map((source) => source.label) as SourceTag[])
  const dataMode = backendView?.dataMode ?? "mock"
  const contextItems = [
    {
      icon: Target,
      label: "Analysis Target",
      value: backendView?.analysisTargetName ?? dashboard.analysisContext.productName,
    },
    {
      icon: Layers,
      label: "Sources Included",
      value: String(
        backendView?.sourceCount ?? dashboard.analysisContext.sourceCount,
      ),
    },
    {
      icon: ListChecks,
      label: "Feedback Items",
      value: String(
        backendView?.totalFeedbackCount ?? dashboard.analysisContext.feedbackItemCount,
      ),
    },
    {
      icon: Clock,
      label: "Last Run",
      value: backendView?.runTimestamp ?? dashboard.analysisContext.lastRunAt,
    },
  ]

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
              {backendView?.analysisTargetName ?? dashboard.analysisContext.productName}{" "}
              Feedback Analysis
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {backendView?.analysisTargetDescription ??
                dashboard.analysisContext.productDescription}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {sourceTags.map((source) => (
                <SourceBadge key={source} source={source} />
              ))}
              <span className="inline-flex items-center gap-1.5 rounded-md border border-primary/25 bg-accent/40 px-2 py-0.5 text-xs font-medium text-primary">
                <Sparkles className="size-3" aria-hidden="true" />
                {backendView?.analysisGoal ?? dashboard.analysisContext.goal}
              </span>
            </div>
            {backendView && backendView.sourceLabels.length > 0 && (
              <p className="mt-2 max-w-3xl text-xs leading-relaxed text-muted-foreground">
                {backendView.sourceLabels.join(" • ")}
              </p>
            )}
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
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border pt-3">
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
              <p className="text-xs text-muted-foreground">
                <span className="text-muted-foreground/70">Run Status:</span>{" "}
                {backendView?.runStatus ?? "completed"}
              </p>
              <p className="text-xs text-muted-foreground">
                <span className="text-muted-foreground/70">Data Mode:</span>{" "}
                {dataMode === "backend" ? "Backend demo" : "Mock demo"}
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
              totalFeedbackItems={
                backendView?.totalFeedbackCount ??
                dashboard.analysisContext.feedbackItemCount
              }
            />
          </div>

          <div className="space-y-6">
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

            {hasSentimentData(dashboard) && (
              <SentimentOverview
                sentimentBreakdown={dashboard.sentimentBreakdown}
              />
            )}
            {dashboard.topThemes.length > 0 && (
              <TopThemes themes={dashboard.topThemes} />
            )}
            {dashboard.painPoints.length > 0 && (
              <PainPointCards painPoints={dashboard.painPoints} />
            )}
            {dashboard.featureRequests.length > 0 && (
              <FeatureRequests featureRequests={dashboard.featureRequests} />
            )}
            {dashboard.roadmapRecommendations.length > 0 && (
              <RoadmapRecommendations
                roadmap={dashboard.roadmapRecommendations}
              />
            )}
            {dashboard.representativeQuotes.length > 0 && (
              <RepresentativeQuotes quotes={dashboard.representativeQuotes} />
            )}
            {dashboard.modelSignals.length > 0 && (
              <ModelSignals signals={dashboard.modelSignals} />
            )}
          </div>
        </div>

        {/* Desktop chat panel */}
        <aside className="sticky top-[57px] hidden h-[calc(100svh-57px)] w-[380px] shrink-0 border-l border-border bg-card lg:block">
          <ChatPanel analysisRunId={analysisRunId} initialMessages={chatHistory} />
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
              <ChatPanel analysisRunId={analysisRunId} initialMessages={chatHistory} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
