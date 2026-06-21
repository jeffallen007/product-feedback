import {
  TrendingDown,
  Lightbulb,
  Gauge,
  ListChecks,
  AlertTriangle,
  Quote,
  MessageSquare,
  type LucideIcon,
} from "lucide-react"
import { CAPABILITIES } from "@/lib/config/workflow"

const CAPABILITY_ICONS: Record<(typeof CAPABILITIES)[number], LucideIcon> = {
  "Top pain points": AlertTriangle,
  "Feature requests": Lightbulb,
  "Sentiment overview": Gauge,
  "Roadmap priorities": ListChecks,
  "Churn / retention risks": TrendingDown,
  "Representative quotes": Quote,
  "Follow-up chatbot analysis": MessageSquare,
}

export function CapabilityPreview() {
  return (
    <section aria-labelledby="capabilities-heading">
      <h2
        id="capabilities-heading"
        className="text-center text-sm font-semibold tracking-tight text-foreground"
      >
        What the synthesis can produce
      </h2>
      <p className="mt-1 text-center text-sm text-muted-foreground">
        Every feedback set is distilled into structured roadmap intelligence.
      </p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {CAPABILITIES.map((label) => {
          const Icon = CAPABILITY_ICONS[label]
          return (
          <span
            key={label}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground"
          >
            <Icon className="size-3.5 text-primary" aria-hidden="true" />
            {label}
          </span>
          )
        })}
      </div>
    </section>
  )
}
