import { Card } from "@/components/ui/card"
import { ROADMAP } from "@/lib/analysis-data"

const PHASE_STYLES: Record<string, { dot: string; label: string }> = {
  Now: { dot: "bg-chart-5", label: "text-foreground" },
  Next: { dot: "bg-chart-4", label: "text-foreground" },
  Later: { dot: "bg-muted-foreground/50", label: "text-foreground" },
}

export function RoadmapRecommendations() {
  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold text-foreground">
        Roadmap Recommendations
      </h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Suggested sequencing based on volume, sentiment, and cross-source signal
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {ROADMAP.map((col) => (
          <div
            key={col.phase}
            className="rounded-lg border border-border bg-secondary/40 p-4"
          >
            <div className="flex items-center gap-2">
              <span
                className={`size-2 rounded-full ${PHASE_STYLES[col.phase].dot}`}
                aria-hidden="true"
              />
              <span
                className={`text-xs font-semibold uppercase tracking-wide ${PHASE_STYLES[col.phase].label}`}
              >
                {col.phase}
              </span>
            </div>
            <ul className="mt-3 space-y-2">
              {col.items.map((item) => (
                <li
                  key={item}
                  className="rounded-md border border-border bg-card px-3 py-2 text-xs leading-relaxed text-foreground"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Card>
  )
}
