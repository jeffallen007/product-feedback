import { ArrowRight } from "lucide-react"
import { ARCHITECTURE_STEPS } from "@/lib/config/workflow"

export function ArchitectureStrip() {
  return (
    <div className="rounded-xl border border-border bg-card px-5 py-4">
      <p className="mb-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
        How it works
      </p>
      <div className="flex flex-wrap items-center justify-center gap-1.5 sm:flex-nowrap sm:gap-1">
        {ARCHITECTURE_STEPS.map((step, i) => (
          <div key={step} className="flex shrink-0 items-center gap-1.5 sm:gap-1">
            <span
              className={`rounded-md px-2 py-1 text-[11px] font-medium sm:px-1.5 ${
                i === 0
                  ? "bg-accent text-accent-foreground"
                  : "bg-secondary text-secondary-foreground"
              }`}
            >
              {step}
            </span>
            {i < ARCHITECTURE_STEPS.length - 1 && (
              <ArrowRight
                className="size-3 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
