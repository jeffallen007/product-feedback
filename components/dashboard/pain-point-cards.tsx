import { Card } from "@/components/ui/card"
import { SourceBadge } from "@/components/dashboard/source-badge"
import { Quote, ArrowRight, MessageSquare, Settings2, LayoutDashboard } from "lucide-react"
import type { DashboardPayload } from "@/lib/types/contracts"
import type { SourceTag } from "@/lib/mocks/workflow"

const PAIN_POINT_ICONS = [MessageSquare, Settings2, LayoutDashboard]

export function PainPointCards({
  painPoints,
}: {
  painPoints: DashboardPayload["painPoints"]
}) {
  return (
    <div>
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-foreground">
          Key Pain Points
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          The most impactful friction points detected across the feedback set
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {painPoints.map((pp, index) => {
          const Icon = PAIN_POINT_ICONS[index] ?? MessageSquare
          const quote = pp.representativeQuotes[0]
          return (
            <Card key={pp.title} className="flex flex-col p-5">
              <div className="flex items-center gap-2.5">
                <span className="flex size-9 items-center justify-center rounded-lg bg-chart-5/12 text-chart-5">
                  <Icon className="size-4.5" aria-hidden="true" />
                </span>
                <h4 className="text-sm font-semibold text-foreground text-balance">
                  {pp.title}
                </h4>
              </div>

              <div className="mt-4 space-y-3 text-xs leading-relaxed">
                <div>
                  <p className="font-medium text-muted-foreground/70">
                    What users are saying
                  </p>
                  <p className="mt-0.5 text-foreground">{pp.summary}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground/70">
                    Likely product impact
                  </p>
                  <p className="mt-0.5 text-foreground">{pp.impact}</p>
                </div>
              </div>

              <figure className="mt-3 rounded-lg border border-border bg-secondary/40 p-3">
                <Quote
                  className="size-3.5 text-muted-foreground/50"
                  aria-hidden="true"
                />
                <blockquote className="mt-1 text-xs italic leading-relaxed text-foreground">
                  {quote?.text}
                </blockquote>
                <figcaption className="mt-2">
                  <SourceBadge source={quote?.sourceLabel as SourceTag} />
                </figcaption>
              </figure>

              <div className="mt-auto pt-4">
                <p className="flex items-start gap-1.5 text-xs font-medium text-primary">
                  <ArrowRight
                    className="mt-0.5 size-3.5 shrink-0"
                    aria-hidden="true"
                  />
                  {pp.recommendedAction}
                </p>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
