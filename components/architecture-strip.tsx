import { ArrowRight } from "lucide-react"
import { ARCHITECTURE_STEPS } from "@/lib/feedback-data"

export function ArchitectureStrip() {
  return (
    <div className="rounded-xl border border-border bg-card px-5 py-4">
      <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        How it works
      </p>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
        {ARCHITECTURE_STEPS.map((step, i) => (
          <div key={step} className="flex items-center gap-2">
            <span
              className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                i === 0
                  ? "bg-accent text-accent-foreground"
                  : "bg-secondary text-secondary-foreground"
              }`}
            >
              {step}
            </span>
            {i < ARCHITECTURE_STEPS.length - 1 && (
              <ArrowRight
                className="size-3.5 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
