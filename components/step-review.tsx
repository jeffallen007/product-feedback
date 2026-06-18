"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { PrivacyNotice } from "@/components/privacy-notice"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Database,
  Search,
  ClipboardList,
  Upload,
  X,
  Plus,
  Sparkles,
  ArrowLeft,
  Target,
  type LucideIcon,
} from "lucide-react"
import {
  ANALYSIS_GOALS,
  type ConfiguredSource,
  type ProductContext,
} from "@/lib/types/workflow"
import type { AnalysisGoal, SourceType } from "@/lib/types/contracts"

const TYPE_ICON: Record<SourceType, LucideIcon> = {
  demo_dataset: Database,
  x_search: Search,
  pasted_text: ClipboardList,
  csv_upload: Upload,
}

export function StepReview({
  product,
  sources,
  goal,
  onGoalChange,
  onRemove,
  onAddSource,
  onBack,
  onSynthesize,
  isSubmitting = false,
  errorMessage = null,
}: {
  product: ProductContext
  sources: ConfiguredSource[]
  goal: AnalysisGoal
  onGoalChange: (g: AnalysisGoal) => void
  onRemove: (id: string) => void
  onAddSource: () => void
  onBack: () => void
  onSynthesize: () => void
  isSubmitting?: boolean
  errorMessage?: string | null
}) {
  const totalItems = sources.reduce((sum, s) => sum + s.itemCount, 0)

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          Review your feedback set
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          Confirm your analysis target and sources, then choose an analysis goal
          before synthesizing.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Left column: Analysis Target + Sources */}
        <div className="space-y-6">
          {/* A. Analysis Target */}
          <section>
            <div className="mb-3 flex items-center gap-2">
              <Target className="size-4 text-primary" aria-hidden="true" />
              <h3 className="text-sm font-semibold text-foreground">
                Analysis Target
              </h3>
            </div>
            <Card className="border-primary/30 bg-accent/30 p-5">
              <p className="text-base font-semibold text-foreground">
                {product.name}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {product.description}
              </p>
            </Card>
          </section>

          {/* B. Sources in this feedback set */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">
                Sources in this feedback set
              </h3>
              <span className="text-xs text-muted-foreground">
                {sources.length} source{sources.length === 1 ? "" : "s"}
              </span>
            </div>
            <div className="space-y-3">
              {sources.map((source) => {
                const Icon = TYPE_ICON[source.sourceType]
                return (
                  <Card
                    key={source.id}
                    className="flex flex-row items-center gap-4 p-4"
                  >
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-foreground">
                      <Icon className="size-5" aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate text-sm font-semibold text-foreground">
                          {source.sourceLabel}
                        </span>
                        <Badge
                          variant="secondary"
                          className="border border-border text-muted-foreground"
                        >
                          {source.sourceTag}
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {source.itemCount} items
                      </p>
                    </div>
                    <Badge className="gap-1 bg-success/12 text-success hover:bg-success/12">
                      <span className="size-1.5 rounded-full bg-success" />
                      {source.status}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onRemove(source.id)}
                      aria-label={`Remove ${source.sourceLabel}`}
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                    >
                      <X className="size-4" aria-hidden="true" />
                    </Button>
                  </Card>
                )
              })}

              <Button
                variant="outline"
                onClick={onAddSource}
                className="w-full border-dashed"
              >
                <Plus className="size-4" aria-hidden="true" />
                Add another feedback source
              </Button>
            </div>
          </section>
        </div>

        {/* Summary panel */}
        <Card className="h-fit p-5">
          <h3 className="text-sm font-semibold text-foreground">
            Feedback set summary
          </h3>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-secondary/60 p-3">
              <p className="text-2xl font-semibold tracking-tight text-foreground">
                {totalItems.toLocaleString()}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Total feedback items
              </p>
            </div>
            <div className="rounded-lg bg-secondary/60 p-3">
              <p className="text-2xl font-semibold tracking-tight text-foreground">
                {sources.length}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Sources included
              </p>
            </div>
          </div>

          <Separator className="my-5" />

          <label
            htmlFor="analysis-goal"
            className="text-xs font-medium text-foreground"
          >
            Analysis goal
          </label>
          <Select
            value={goal}
            onValueChange={(value) => {
              if (value) onGoalChange(value as AnalysisGoal)
            }}
          >
            <SelectTrigger id="analysis-goal" className="mt-1.5 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ANALYSIS_GOALS.map((g) => (
                <SelectItem key={g} value={g}>
                  {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            onClick={onSynthesize}
            className="mt-5 w-full"
            disabled={sources.length === 0 || isSubmitting}
          >
            <Sparkles className="size-4" aria-hidden="true" />
            {isSubmitting ? "Preparing Feedback Set..." : "Synthesize Feedback Set"}
          </Button>
          <Button variant="ghost" onClick={onBack} className="mt-2 w-full">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to Sources
          </Button>
          {errorMessage && (
            <p className="mt-3 text-xs leading-relaxed text-destructive">
              {errorMessage}
            </p>
          )}

          <PrivacyNotice className="mt-4">
            By synthesizing this feedback set, you acknowledge that uploaded or
            pasted data may be processed by AI services.
          </PrivacyNotice>
        </Card>
      </div>
    </div>
  )
}
