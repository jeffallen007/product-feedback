import type { SourceTag } from "@/lib/types/workflow"
import { Database, Search, ClipboardList, Upload } from "lucide-react"

const STYLES: Record<SourceTag, string> = {
  "Google Play": "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  "Demo Dataset": "bg-chart-1/10 text-chart-1 border-chart-1/20",
  "X Search": "bg-foreground/8 text-foreground border-border",
  "Pasted Feedback": "bg-chart-3/10 text-chart-3 border-chart-3/25",
  "CSV Upload": "bg-chart-2/10 text-chart-2 border-chart-2/25",
}

const ICONS = {
  "Google Play": Database,
  "Demo Dataset": Database,
  "X Search": Search,
  "Pasted Feedback": ClipboardList,
  "CSV Upload": Upload,
}

export function toSourceTag(value: string): SourceTag {
  if (value in STYLES) {
    return value as SourceTag
  }

  const normalized = value.toLowerCase()

  if (normalized.includes("google_play") || normalized.includes("google play"))
    return "Google Play"
  if (normalized.includes("demo")) return "Demo Dataset"
  if (normalized.includes("csv")) return "CSV Upload"
  if (normalized.includes("paste")) return "Pasted Feedback"
  return "X Search"
}

export function SourceBadge({
  source,
  showIcon = true,
  className = "",
}: {
  source: SourceTag | string
  showIcon?: boolean
  className?: string
}) {
  const sourceTag = toSourceTag(source)
  const Icon = ICONS[sourceTag]
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium ${STYLES[sourceTag]} ${className}`}
    >
      {showIcon && <Icon className="size-3" aria-hidden="true" />}
      {sourceTag}
    </span>
  )
}
