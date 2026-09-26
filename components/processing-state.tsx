"use client"

import { Check, Loader2, RotateCcw } from "lucide-react"
import { BrandMark } from "@/components/brand-mark"
import { Button } from "@/components/ui/button"
import {
  PROGRESS_STAGES,
  type ProgressSnapshot,
} from "@/lib/services/progress-workflow"

export function ProcessingState({
  progress,
  errorMessage,
  onStartOver,
}: {
  progress: ProgressSnapshot
  errorMessage: string | null
  onStartOver: () => void
}) {
  const completed = PROGRESS_STAGES.filter(
    (stage) => progress.stages[stage.name] === "completed",
  ).length
  const percent = Math.round((completed / PROGRESS_STAGES.length) * 100)

  return (
    <main className="min-h-svh bg-background">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-5xl items-center px-6 py-3.5">
          <BrandMark />
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-6 py-16">
        <div className="text-center">
          <div className="mx-auto mb-5 flex size-12 items-center justify-center rounded-xl border border-border bg-card">
            <Loader2 className={`size-6 text-primary ${errorMessage ? "" : "animate-spin"}`} aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {errorMessage ? "Analysis could not be completed" : "Synthesizing your feedback set"}
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
            {progress.feedbackItemCount === null
              ? "Preparing your feedback for analysis."
              : `Analyzing ${progress.feedbackItemCount} feedback items from ${progress.sourceCount} sources.`}
          </p>
          {progress.queued && !errorMessage && (
            <p className="mt-2 text-xs text-muted-foreground">Queued for analysis</p>
          )}
          {progress.notice && !errorMessage && (
            <p className="mt-2 text-xs text-muted-foreground">{progress.notice}</p>
          )}
        </div>

        <div className="mt-8">
          <div className="mb-2 flex items-center justify-between text-xs font-medium text-muted-foreground">
            <span>Stages completed</span>
            <span>{completed} of {PROGRESS_STAGES.length}</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${percent}%` }}
              role="progressbar"
              aria-valuenow={completed}
              aria-valuemin={0}
              aria-valuemax={PROGRESS_STAGES.length}
              aria-label="Completed analysis stages"
            />
          </div>
        </div>

        <ol className="mt-8 space-y-2">
          {PROGRESS_STAGES.map((stage) => {
            const status = progress.stages[stage.name]
            return (
              <li key={stage.name} className="rounded-lg border border-border bg-card px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-secondary">
                    {status === "completed" ? (
                      <Check className="size-3 text-success" aria-hidden="true" />
                    ) : status === "running" ? (
                      <Loader2 className="size-3 animate-spin text-primary" aria-hidden="true" />
                    ) : status === "failed" ? (
                      <span className="text-xs font-bold text-destructive">!</span>
                    ) : (
                      <span className="size-1.5 rounded-full bg-muted-foreground/40" />
                    )}
                  </span>
                  <span className={`text-sm ${status === "pending" ? "text-muted-foreground" : "font-medium text-foreground"}`}>
                    {stage.label}
                    {stage.name === "ingest_sources" && progress.sourceCount !== null && status === "running"
                      ? ` (${progress.ingestedSourceCount} of ${progress.sourceCount} sources)`
                      : ""}
                  </span>
                </div>
                <div className="ml-8 mt-2 h-1 overflow-hidden rounded-full bg-secondary">
                  <div
                    className={`h-full rounded-full bg-primary ${status === "running" ? "animate-pulse w-1/3" : ""}`}
                    style={status === "completed" ? { width: "100%" } : status === "pending" || status === "failed" ? { width: "0%" } : undefined}
                  />
                </div>
              </li>
            )
          })}
        </ol>

        {errorMessage && (
          <div className="mt-8 rounded-lg border border-destructive/30 bg-destructive/5 p-4" role="alert">
            <p className="text-sm text-destructive">{errorMessage}</p>
            <Button variant="outline" onClick={onStartOver} className="mt-4">
              <RotateCcw className="size-4" aria-hidden="true" />
              Start over
            </Button>
          </div>
        )}
      </div>
    </main>
  )
}
