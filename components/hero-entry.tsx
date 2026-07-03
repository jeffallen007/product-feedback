"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Bot, Play, Layers } from "lucide-react"
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
          Let AI synthesize your customer feedback.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
          Turn fragmented customer feedback into roadmap intelligence.
        </p>
      </div>

      {/* Architecture strip */}
      <div className="mx-auto mt-10 max-w-3xl">
        <ArchitectureStrip />
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
            Use pre-loaded sample feedback data and see a real demo of the
            product feedback synthesis in action.
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
            Build Your Product Feedback Synthesis
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

      <div className="mx-auto mt-8 w-full max-w-3xl rounded-xl border border-border bg-card px-6 py-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Bot className="size-4 text-primary" aria-hidden="true" />
              Built for Human Users and AI Agents
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              The standard demo lets product teams synthesize feedback through a
              web UI. The MCP demo shows the same workflow exposed as
              agent-callable tools, so an AI agent can create a feedback set,
              ingest raw feedback, run synthesis, retrieve the analysis bundle,
              and ask grounded follow-up questions without using the web app.
            </p>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              For technical reviewers: this demo calls the deployed MCP service
              over Streamable HTTP.
            </p>
          </div>

          <Button variant="outline" size="lg" render={<Link href="/mcp-demo" />}>
            View MCP Agent Demo
            <ArrowRight className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  )
}
