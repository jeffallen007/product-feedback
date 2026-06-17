import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FEATURE_REQUESTS } from "@/lib/analysis-data"

export function FeatureRequests() {
  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold text-foreground">
        Feature Request Summary
      </h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Synthesized requests mapped to underlying user needs
      </p>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="pb-2 pr-4 text-xs font-medium text-muted-foreground">
                Feature Request
              </th>
              <th className="pb-2 pr-4 text-xs font-medium text-muted-foreground">
                User Need
              </th>
              <th className="pb-2 pr-4 text-xs font-medium text-muted-foreground">
                Source Signal
              </th>
              <th className="pb-2 text-xs font-medium text-muted-foreground">
                Suggested Priority
              </th>
            </tr>
          </thead>
          <tbody>
            {FEATURE_REQUESTS.map((fr) => (
              <tr
                key={fr.request}
                className="border-b border-border/60 last:border-0"
              >
                <td className="py-3 pr-4 font-medium text-foreground">
                  {fr.request}
                </td>
                <td className="py-3 pr-4 text-muted-foreground">{fr.need}</td>
                <td className="py-3 pr-4 text-muted-foreground">{fr.signal}</td>
                <td className="py-3">
                  <Badge
                    className={
                      fr.priority === "High"
                        ? "bg-chart-5/12 text-chart-5 hover:bg-chart-5/12"
                        : "bg-chart-4/15 text-chart-4 hover:bg-chart-4/15"
                    }
                  >
                    {fr.priority}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
