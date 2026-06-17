"use client"

import { Card } from "@/components/ui/card"
import { SOURCE_MIX } from "@/lib/analysis-data"
import { SourceBadge } from "@/components/dashboard/source-badge"

const BAR_COLOR: Record<string, string> = {
  "Demo Dataset": "var(--chart-1)",
  "X Search": "var(--chart-2)",
  "Pasted Feedback": "var(--chart-3)",
}

export function SourceMix() {
  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold text-foreground">Source Mix</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        How the 592 feedback items break down by source
      </p>

      {/* Stacked proportion bar */}
      <div className="mt-4 flex h-2.5 w-full overflow-hidden rounded-full">
        {SOURCE_MIX.map((s) => (
          <div
            key={s.key}
            style={{
              width: `${s.percent}%`,
              backgroundColor: BAR_COLOR[s.label],
            }}
            aria-hidden="true"
          />
        ))}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {SOURCE_MIX.map((s) => (
          <div
            key={s.key}
            className="rounded-lg border border-border bg-secondary/40 p-3"
          >
            <SourceBadge source={s.label} />
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
