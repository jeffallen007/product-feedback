import { Sparkles } from "lucide-react"

export function BrandMark({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className ?? ""}`}>
      <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Sparkles className="size-4" aria-hidden="true" />
      </div>
      <span className="text-sm font-semibold tracking-tight text-foreground">
        Product Feedback Synthesizer
      </span>
    </div>
  )
}
