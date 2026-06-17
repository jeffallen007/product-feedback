import { Check } from "lucide-react"

export function StepIndicator({
  steps,
  current,
}: {
  steps: string[]
  current: number
}) {
  return (
    <nav aria-label="Progress" className="flex items-center justify-center">
      <ol className="flex items-center gap-2 sm:gap-3">
        {steps.map((label, i) => {
          const id = i + 1
          const isComplete = id < current
          const isCurrent = id === current
          return (
            <li key={label} className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-2">
                <span
                  className={`flex size-7 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                    isComplete
                      ? "bg-primary text-primary-foreground"
                      : isCurrent
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground"
                  }`}
                  aria-current={isCurrent ? "step" : undefined}
                >
                  {isComplete ? (
                    <Check className="size-3.5" aria-hidden="true" />
                  ) : (
                    id
                  )}
                </span>
                <span
                  className={`text-sm font-medium ${
                    isCurrent || isComplete
                      ? "text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <span
                  className={`h-px w-6 sm:w-10 ${
                    isComplete ? "bg-primary" : "bg-border"
                  }`}
                  aria-hidden="true"
                />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
