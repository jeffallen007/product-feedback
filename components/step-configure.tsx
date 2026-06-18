"use client"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { PrivacyNotice } from "@/components/privacy-notice"
import { ProductContextForm } from "@/components/product-context-form"
import { ArrowRight, ArrowLeft, Upload } from "lucide-react"
import { SEARCH_CHIPS } from "@/lib/config/workflow"
import type {
  ProductContext,
  WorkflowSourceId,
} from "@/lib/types/workflow"

function PanelHeader({
  title,
  badge,
}: {
  title: string
  badge: string
}) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground">
        {badge}
      </span>
    </div>
  )
}

export function StepConfigure({
  product,
  onProductChange,
  selected,
  searchQuery,
  onSearchQueryChange,
  pasteValue,
  onPasteChange,
  onBack,
  onReview,
}: {
  product: ProductContext
  onProductChange: (next: ProductContext) => void
  selected: WorkflowSourceId[]
  searchQuery: string
  onSearchQueryChange: (q: string) => void
  pasteValue: string
  onPasteChange: (v: string) => void
  onBack: () => void
  onReview: () => void
}) {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          Configure your sources
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          Confirm your product context and set up each source you selected.
        </p>
      </div>

      <div className="grid gap-5">
        <Card className="p-5">
          <ProductContextForm value={product} onChange={onProductChange} />
        </Card>

        {selected.includes("csv") && (
          <Card className="p-5">
            <PanelHeader title="Upload CSV" badge="File" />
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-secondary/40 px-6 py-10 text-center transition-colors hover:border-primary/50 hover:bg-accent/30">
              <div className="flex size-11 items-center justify-center rounded-full bg-card">
                <Upload className="size-5 text-primary" aria-hidden="true" />
              </div>
              <span className="mt-3 text-sm font-medium text-foreground">
                Drop a CSV here or browse files
              </span>
              <span className="mt-1 max-w-md text-xs leading-relaxed text-muted-foreground">
                Supported columns: comment, feedback, review, rating, source,
                date, user_segment, product_area.
              </span>
              <input type="file" accept=".csv" className="sr-only" />
            </label>
            <PrivacyNotice className="mt-4">
              Do not upload sensitive or confidential information. Uploaded data
              may be processed by AI services.
            </PrivacyNotice>
          </Card>
        )}

        {selected.includes("paste") && (
          <Card className="p-5">
            <PanelHeader title="Paste Feedback" badge="Text" />
            <Textarea
              value={pasteValue}
              onChange={(e) => onPasteChange(e.target.value)}
              placeholder="Paste customer reviews, support notes, survey responses, or interview notes…"
              className="min-h-36 resize-none"
            />
            <PrivacyNotice className="mt-4">
              Do not upload sensitive or confidential information. Uploaded data
              may be processed by AI services.
            </PrivacyNotice>
          </Card>
        )}

        {selected.includes("search") && (
          <Card className="p-5">
            <PanelHeader title="Search X" badge="Live posts" />
            <Input
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              placeholder="Search product, company, handle, or keyword"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              {SEARCH_CHIPS.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => onSearchQueryChange(chip)}
                  className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                >
                  {chip}
                </button>
              ))}
            </div>
          </Card>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between gap-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back
        </Button>
        <Button onClick={onReview}>
          Review Feedback Set
          <ArrowRight className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  )
}
