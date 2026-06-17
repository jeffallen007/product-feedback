import type { SourceTag } from "@/lib/mocks/workflow"
import { Database, Search, ClipboardList, Upload } from "lucide-react"

const STYLES: Record<SourceTag, string> = {
  "Demo Dataset": "bg-chart-1/10 text-chart-1 border-chart-1/20",
  "X Search": "bg-foreground/8 text-foreground border-border",
  "Pasted Feedback": "bg-chart-3/10 text-chart-3 border-chart-3/25",
  "CSV Upload": "bg-chart-2/10 text-chart-2 border-chart-2/25",
}

const ICONS = {
  "Demo Dataset": Database,
  "X Search": Search,
  "Pasted Feedback": ClipboardList,
  "CSV Upload": Upload,
}

export function SourceBadge({
  source,
  showIcon = true,
  className = "",
}: {
  source: SourceTag
  showIcon?: boolean
  className?: string
}) {
  const Icon = ICONS[source]
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium ${STYLES[source]} ${className}`}
    >
      {showIcon && <Icon className="size-3" aria-hidden="true" />}
      {source}
    </span>
  )
}
