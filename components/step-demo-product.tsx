"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, ArrowLeft, Check } from "lucide-react"
import { DEMO_PRODUCTS } from "@/lib/feedback-data"

export function StepDemoProduct({
  selected,
  onSelect,
  onContinue,
  onBack,
}: {
  selected: string
  onSelect: (id: string) => void
  onContinue: () => void
  onBack: () => void
}) {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          Choose demo product
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          Pick a product to analyze. We&apos;ll load a realistic demo dataset of
          feedback for it.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {DEMO_PRODUCTS.map((product) => {
          const isActive = selected === product.id
          const Icon = product.icon
          return (
            <button
              key={product.id}
              type="button"
              onClick={() => onSelect(product.id)}
              aria-pressed={isActive}
              className={`group flex flex-col rounded-xl border p-5 text-left ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                isActive
                  ? "border-primary bg-accent/40 shadow-sm"
                  : "border-border bg-card hover:border-foreground/20"
              }`}
            >
              <div className="flex items-center justify-between">
                <div
                  className={`flex size-10 items-center justify-center rounded-lg transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-foreground"
                  }`}
                >
                  <Icon className="size-5" aria-hidden="true" />
                </div>
                {isActive && (
                  <Check className="size-4 text-primary" aria-hidden="true" />
                )}
              </div>
              <h3 className="mt-4 text-sm font-semibold text-foreground">
                {product.label}
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {product.description}
              </p>
              <span className="mt-3 text-xs font-medium text-muted-foreground">
                {product.count} feedback items
              </span>
            </button>
          )
        })}
      </div>

      <div className="mt-6 flex items-center justify-between gap-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back
        </Button>
        <Button onClick={onContinue} disabled={!selected}>
          Review Feedback Set
          <ArrowRight className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  )
}
