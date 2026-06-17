"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Play, Layers } from "lucide-react"
import { CapabilityPreview } from "@/components/capability-preview"
import { ArchitectureStrip } from "@/components/architecture-strip"

export function HeroEntry({
  onDemo,
  onCustom,
}: {
  onDemo: () => void
  onCustom: () => void
}) {
  return (
    <div className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
      {/* Hero */}
      <div className="mx-auto max-w-3xl text-center">
        <Badge
          variant="secondary"
          className="mb-5 gap-1.5 border border-border bg-accent text-accent-foreground"
        >
          <span className="relative flex size-1.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60" />
            <span className="relative inline-flex size-1.5 rounded-full bg-primary" />
          </span>
          Powered by AI agents &amp; MCP
        </Badge>
        <h1 className="text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          Turn fragmented customer feedback into roadmap intelligence.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
          Let AI synthesize your customer feedback. Start from a demo product
          or your own, then combine uploads, pasted reviews, and recent X posts
          into one feedback set. Synthesize themes, sentiment, pain points, and
          roadmap recommendations.
        </p>
      </div>

      {/* Entry choice */}
      <div className="mx-auto mt-10 grid max-w-3xl gap-4 sm:grid-cols-2">
        <button
          onClick={onDemo}
          className="group flex flex-col rounded-xl border border-primary/30 bg-card p-6 text-left ring-offset-background transition-all hover:border-primary/60 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <div className="flex items-center justify-between">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Play className="size-5" aria-hidden="true" />
            </div>
            <Badge className="bg-primary/10 text-primary hover:bg-primary/10">
              Fastest
            </Badge>
          </div>
          <h3 className="mt-4 flex items-center gap-1.5 text-base font-semibold text-foreground">
            Try Demo Dataset
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            Use realistic sample feedback and see the product in action
            immediately.
          </p>
        </button>

        <button
          onClick={onCustom}
          className="group flex flex-col rounded-xl border border-border bg-card p-6 text-left ring-offset-background transition-all hover:border-foreground/20 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <div className="flex size-10 items-center justify-center rounded-lg bg-secondary text-foreground">
            <Layers className="size-5" aria-hidden="true" />
          </div>
          <h3 className="mt-4 flex items-center gap-1.5 text-base font-semibold text-foreground">
            Build Custom Feedback Set
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            Tell us about your product, then combine uploads, pasted reviews,
            and recent X posts into one analysis.
          </p>
        </button>
      </div>

      <p className="mt-5 text-center text-sm text-muted-foreground">
        No account required. Start with demo data or bring your own feedback.
      </p>

      {/* Capabilities */}
      <div className="mx-auto mt-14 max-w-3xl">
        <CapabilityPreview />
      </div>

      {/* Architecture strip */}
      <div className="mx-auto mt-10 max-w-3xl">
        <ArchitectureStrip />
      </div>
    </div>
  )
}
