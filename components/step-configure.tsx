"use client"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { PrivacyNotice } from "@/components/privacy-notice"
import { ProductContextForm } from "@/components/product-context-form"
import { ArrowRight, ArrowLeft, Upload } from "lucide-react"
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
  csvFileName,
  csvItemCount,
  csvErrorMessage,
  onCsvFileChange,
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
  csvFileName: string | null
  csvItemCount: number
  csvErrorMessage: string | null
  onCsvFileChange: (file: File | null) => void
  pasteValue: string
  onPasteChange: (v: string) => void
  onBack: () => void
  onReview: () => void
}) {
  const hasValidCsvSelection = !selected.includes("csv")
    ? true
    : Boolean(csvFileName) && csvItemCount > 0 && !csvErrorMessage

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
                Required column: feedback_text. Optional: rating, date or
                feedback_date, username or author_handle, source_label,
                product_area, category.
              </span>
              <input
                type="file"
                accept=".csv,text/csv"
                className="sr-only"
                onChange={(event) =>
                  onCsvFileChange(event.target.files?.[0] ?? null)
                }
              />
            </label>
            {(csvFileName || csvErrorMessage) && (
              <div className="mt-4 rounded-lg border border-border bg-secondary/30 px-4 py-3 text-sm">
                {csvFileName && (
                  <p className="font-medium text-foreground">{csvFileName}</p>
                )}
                {!csvErrorMessage && csvFileName && (
                  <p className="text-xs text-muted-foreground">
                    {csvItemCount} valid feedback row
                    {csvItemCount === 1 ? "" : "s"} detected for review.
                  </p>
                )}
                {csvErrorMessage && (
                  <p className="text-xs text-destructive">{csvErrorMessage}</p>
                )}
              </div>
            )}
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

      </div>

      <div className="mt-6 flex items-center justify-between gap-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back
        </Button>
        <Button onClick={onReview} disabled={!hasValidCsvSelection}>
          Review Feedback Set
          <ArrowRight className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  )
}
