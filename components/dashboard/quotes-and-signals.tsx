import { Card } from "@/components/ui/card"
import { SourceBadge } from "@/components/dashboard/source-badge"
import { Quote, Search, Users2, Smartphone, MessageSquare } from "lucide-react"
import type { DashboardPayload } from "@/lib/types/contracts"

const MODEL_SIGNAL_ICONS = [Search, Users2, Smartphone, MessageSquare]

export function RepresentativeQuotes({
  quotes,
}: {
  quotes: DashboardPayload["representativeQuotes"]
}) {
  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold text-foreground">
        Representative Quotes
      </h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Evidence retrieved across the source set
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {quotes.map((q) => (
          <figure
            key={q.text}
            className="flex flex-col rounded-lg border border-border bg-secondary/40 p-4"
          >
            <Quote
              className="size-3.5 text-muted-foreground/50"
              aria-hidden="true"
            />
            <blockquote className="mt-1.5 text-xs italic leading-relaxed text-foreground">
              {q.text}
            </blockquote>
            <figcaption className="mt-3 flex flex-wrap items-center gap-2">
              <SourceBadge source={q.sourceLabel} />
              <span className="text-xs text-muted-foreground">{q.sourceLabel}</span>
              <span className="text-xs text-muted-foreground">{q.themeName}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </Card>
  )
}

export function ModelSignals({
  signals,
}: {
  signals: DashboardPayload["modelSignals"]
}) {
  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold text-foreground">
        Model + Agent Signals
      </h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Outputs from the ML classifier and retrieval pipeline
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {signals.map((sig, index) => {
          const Icon = MODEL_SIGNAL_ICONS[index] ?? MessageSquare
          return (
            <div
              key={sig.label}
              className="flex gap-3 rounded-lg border border-border bg-secondary/40 p-3.5"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <Icon className="size-4" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground/70">
                  {sig.label}
                </p>
                <p className="mt-0.5 text-xs font-medium leading-relaxed text-foreground">
                  {sig.value}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
