import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { DashboardPayload } from "@/lib/types/contracts"

export function TopThemes({
  themes,
}: {
  themes: DashboardPayload["topThemes"]
}) {
  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold text-foreground">Top Themes</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Ranked by feedback volume across all sources
      </p>

      <div className="mt-4 space-y-2.5">
        {themes.map((theme) => (
          <div
            key={theme.id}
            className="rounded-lg border border-border bg-card p-4 transition-colors hover:border-foreground/20"
          >
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-secondary text-xs font-semibold text-foreground tabular-nums">
                {theme.rank}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-foreground">
                    {theme.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium tabular-nums text-muted-foreground">
                      {theme.count} items
                    </span>
                    <Badge
                      className={
                        theme.priority === "High"
                          ? "bg-chart-5/12 text-chart-5 hover:bg-chart-5/12"
                          : "bg-chart-4/15 text-chart-4 hover:bg-chart-4/15"
                      }
                    >
                      {theme.priority}
                    </Badge>
                  </div>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {theme.description}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span>
                    <span className="text-muted-foreground/70">Sources:</span>{" "}
                    {theme.sourceCoverage}
                  </span>
                  <span>
                    <span className="text-muted-foreground/70">Sentiment:</span>{" "}
                    {theme.sentiment}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
