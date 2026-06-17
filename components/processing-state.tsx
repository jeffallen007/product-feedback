"use client"

import { useEffect, useState } from "react"
import { Check, Loader2 } from "lucide-react"
import { BrandMark } from "@/components/brand-mark"
import { ArchitectureStrip } from "@/components/architecture-strip"
import {
  MOCK_DASHBOARD_PAYLOAD,
  PROCESSING_STEPS,
} from "@/lib/mocks/dashboard"

export function ProcessingState({ onComplete }: { onComplete: () => void }) {
  const [activeStep, setActiveStep] = useState(0)

  useEffect(() => {
    if (activeStep >= PROCESSING_STEPS.length) {
      const done = setTimeout(onComplete, 600)
      return () => clearTimeout(done)
    }
    const t = setTimeout(() => setActiveStep((s) => s + 1), 520)
    return () => clearTimeout(t)
  }, [activeStep, onComplete])

  const progress = Math.min(
    100,
    Math.round((activeStep / PROCESSING_STEPS.length) * 100),
  )

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
            <Loader2
              className="size-6 animate-spin text-primary"
              aria-hidden="true"
            />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground text-balance">
            Synthesizing your feedback set
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground text-pretty">
            Running {MOCK_DASHBOARD_PAYLOAD.analysisContext.feedbackItemCount}{" "}
            feedback items from {MOCK_DASHBOARD_PAYLOAD.analysisContext.sourceCount}{" "}
            sources through the analysis pipeline.
          </p>
        </div>

        {/* Progress bar */}
        <div className="mt-8">
          <div className="mb-2 flex items-center justify-between text-xs font-medium text-muted-foreground">
            <span>Processing</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Steps */}
        <ol className="mt-8 space-y-1">
          {PROCESSING_STEPS.map((step, i) => {
            const isDone = i < activeStep
            const isActive = i === activeStep
            return (
              <li
                key={step}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${
                  isActive ? "bg-accent/50" : ""
                }`}
              >
                <span
                  className={`flex size-5 shrink-0 items-center justify-center rounded-full ${
                    isDone
                      ? "bg-success text-success-foreground"
                      : isActive
                        ? "bg-primary text-primary-foreground"
                        : "border border-border bg-card"
                  }`}
                >
                  {isDone ? (
                    <Check className="size-3" aria-hidden="true" />
                  ) : isActive ? (
                    <Loader2 className="size-3 animate-spin" aria-hidden="true" />
                  ) : (
                    <span className="size-1.5 rounded-full bg-muted-foreground/40" />
                  )}
                </span>
                <span
                  className={`text-sm ${
                    isDone || isActive
                      ? "font-medium text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {step}
                </span>
              </li>
            )
          })}
        </ol>

        <div className="mt-8">
          <ArchitectureStrip />
        </div>
      </div>
    </main>
  )
}
