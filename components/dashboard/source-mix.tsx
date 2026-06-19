"use client"

import { Card } from "@/components/ui/card"
import { SourceBadge, toSourceTag } from "@/components/dashboard/source-badge"
import type { DashboardSourceMixItem } from "@/lib/types/contracts"
import type { SourceTag } from "@/lib/types/workflow"

const BAR_COLOR: Record<SourceTag, string> = {
  "Demo Dataset": "var(--chart-1)",
  "X Search": "var(--chart-2)",
  "Pasted Feedback": "var(--chart-3)",
  "CSV Upload": "var(--chart-2)",
}

export function SourceMix({
  items,
  totalFeedbackItems,
}: {
  items: DashboardSourceMixItem[]
  totalFeedbackItems: number
}) {
  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold text-foreground">Source Mix</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        How the {totalFeedbackItems} feedback items break down by source
      </p>

      {/* Stacked proportion bar */}
      <div className="mt-4 flex h-2.5 w-full overflow-hidden rounded-full">
        {items.map((s) => (
          <div
            key={s.sourceId}
            style={{
              width: `${s.percent}%`,
              backgroundColor: BAR_COLOR[toSourceTag(s.label) as SourceTag],
            }}
            aria-hidden="true"
          />
        ))}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {items.map((s) => (
          <div
            key={s.sourceId}
            className="rounded-lg border border-border bg-secondary/40 p-3"
          >
            <SourceBadge source={s.label} />
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              {s.label}
            </p>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-lg font-semibold tabular-nums text-foreground">
                {s.count}
              </span>
              <span className="text-xs text-muted-foreground">{s.unit}</span>
            </div>
            <span className="text-xs font-medium text-muted-foreground">
              {s.percent}% of total
            </span>
          </div>
        ))}
      </div>
    </Card>
  )
}
