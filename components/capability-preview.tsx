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

const CAPABILITY_ITEMS: { label: string; icon: LucideIcon }[] = [
  { label: "Top pain points", icon: AlertTriangle },
  { label: "Feature requests", icon: Lightbulb },
  { label: "Sentiment overview", icon: Gauge },
  { label: "Roadmap priorities", icon: ListChecks },
  { label: "Churn / retention risks", icon: TrendingDown },
  { label: "Representative quotes", icon: Quote },
  { label: "Follow-up chatbot analysis", icon: MessageSquare },
]

export function CapabilityPreview() {
  return (
    <section aria-labelledby="capabilities-heading">
      <h2
        id="capabilities-heading"
        className="text-sm font-semibold tracking-tight text-foreground"
      >
        What the synthesis can produce
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Every feedback set is distilled into structured roadmap intelligence.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {CAPABILITY_ITEMS.map(({ label, icon: Icon }) => (
          <span
            key={label}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground"
          >
            <Icon className="size-3.5 text-primary" aria-hidden="true" />
            {label}
          </span>
        ))}
      </div>
    </section>
  )
}
