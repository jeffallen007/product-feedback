"use client"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowRight, ArrowLeft } from "lucide-react"
import { ProductContextForm } from "@/components/product-context-form"
import {
  SOURCE_DEFINITIONS,
  type ProductContext,
  type WorkflowSourceId,
} from "@/lib/mocks/workflow"

export function StepSources({
  product,
  onProductChange,
  selected,
  onToggle,
  onContinue,
  onBack,
}: {
  product: ProductContext
  onProductChange: (next: ProductContext) => void
  selected: WorkflowSourceId[]
  onToggle: (id: WorkflowSourceId) => void
  onContinue: () => void
  onBack: () => void
}) {
  const hasProduct = product.name.trim().length > 0

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          Choose feedback sources
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          First tell us about your product, then pick one or more sources to
          build a richer feedback set.
        </p>
      </div>

      <div className="mb-6 rounded-xl border border-border bg-card p-5">
        <ProductContextForm value={product} onChange={onProductChange} />
      </div>

      <h3 className="mb-3 text-sm font-semibold text-foreground">
        Feedback sources
      </h3>
      <div className="grid gap-3 sm:grid-cols-3">
        {SOURCE_DEFINITIONS.map((source) => {
          const isSelected = selected.includes(source.id)
          const Icon = source.icon
          return (
            <button
              key={source.id}
              type="button"
              onClick={() => onToggle(source.id)}
              aria-pressed={isSelected}
              className={`group relative flex flex-col gap-3 rounded-xl border p-5 text-left ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                isSelected
                  ? "border-primary bg-accent/40 shadow-sm"
                  : "border-border bg-card hover:border-foreground/20"
              }`}
            >
              <div className="flex items-center justify-between">
                <div
                  className={`flex size-10 shrink-0 items-center justify-center rounded-lg transition-colors ${
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-foreground"
                  }`}
                >
                  <Icon className="size-5" aria-hidden="true" />
                </div>
                <Checkbox
                  checked={isSelected}
                  className="pointer-events-none"
                  tabIndex={-1}
                  aria-hidden="true"
                />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold text-foreground">
                  {source.title}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {source.description}
                </p>
              </div>
            </button>
          )
        })}
      </div>

      <div className="mt-6 flex items-center justify-between gap-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back
        </Button>
        <div className="flex items-center gap-4">
          <p className="hidden text-sm text-muted-foreground sm:block">
            {!hasProduct
              ? "Add a product name to continue."
              : selected.length === 0
                ? "Select at least one source."
                : `${selected.length} source${selected.length > 1 ? "s" : ""} selected`}
          </p>
          <Button
            onClick={onContinue}
            disabled={selected.length === 0 || !hasProduct}
          >
            Continue
            <ArrowRight className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  )
}
