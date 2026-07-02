"use client"

import { useState } from "react"
import { BrandMark } from "@/components/brand-mark"
import { StepIndicator } from "@/components/step-indicator"
import { HeroEntry } from "@/components/hero-entry"
import { StepDemoProduct } from "@/components/step-demo-product"
import { StepSources } from "@/components/step-sources"
import { StepConfigure } from "@/components/step-configure"
import { StepReview } from "@/components/step-review"
import { ProcessingState } from "@/components/processing-state"
import { Dashboard } from "@/components/dashboard/dashboard"
import type {
  ConfiguredSource,
  DemoProductId,
  ProductContext,
  WorkflowSourceId,
} from "@/lib/types/workflow"
import { EMPTY_PRODUCT_CONTEXT } from "@/lib/types/workflow"
import type { AnalysisGoal } from "@/lib/types/contracts"
import {
  addCsvSource,
  addDemoSource,
  addPastedSource,
  buildCustomReviewState,
  buildDemoReviewState,
  createFeedbackSet,
  runDemoAnalysis,
  synthesizeFeedbackSet,
} from "@/lib/services/analysis-service"
import { parseCsvUpload } from "@/lib/services/csv-upload"

type Path = "demo" | "custom"
type Screen =
  | "entry"
  | "demo-product"
  | "sources"
  | "configure"
  | "review"
  | "processing"
  | "dashboard"

const DEMO_STEPS = ["Product", "Review"]
const CUSTOM_STEPS = ["Sources", "Configure", "Review"]

export default function Page() {
  const [screen, setScreen] = useState<Screen>("entry")
  const [path, setPath] = useState<Path>("demo")

  // Demo path
  const [demoProduct, setDemoProduct] =
    useState<DemoProductId>("productivity")

  // Custom path
  const [product, setProduct] = useState<ProductContext>(EMPTY_PRODUCT_CONTEXT)
  const [selected, setSelected] = useState<WorkflowSourceId[]>(["paste"])
  const [searchQuery, setSearchQuery] = useState("")
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [csvFileName, setCsvFileName] = useState<string | null>(null)
  const [csvItemCount, setCsvItemCount] = useState(0)
  const [csvErrorMessage, setCsvErrorMessage] = useState<string | null>(null)
  const [pasteValue, setPasteValue] = useState("")

  // Review
  const [goal, setGoal] = useState<AnalysisGoal>(
    "Full Product Feedback Synthesis",
  )
  const [reviewProduct, setReviewProduct] = useState<ProductContext>(
    EMPTY_PRODUCT_CONTEXT,
  )
  const [reviewSources, setReviewSources] = useState<ConfiguredSource[]>([])
  const [analysisRunId, setAnalysisRunId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submissionError, setSubmissionError] = useState<string | null>(null)
  const [processingSummary, setProcessingSummary] = useState({
    feedbackItemCount: 592,
    sourceCount: 3,
  })

  function toggleSource(id: WorkflowSourceId) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    )
  }

  function startDemo() {
    setPath("demo")
    setDemoProduct("productivity")
    setScreen("demo-product")
  }

  function startCustom() {
    setPath("custom")
    setProduct(EMPTY_PRODUCT_CONTEXT)
    setSelected(["paste"])
    setSearchQuery("")
    setCsvFile(null)
    setCsvFileName(null)
    setCsvItemCount(0)
    setCsvErrorMessage(null)
    setPasteValue("")
    setScreen("sources")
  }

  function reviewDemo() {
    const reviewState = buildDemoReviewState({
      demoProductId: demoProduct,
    })
    setReviewProduct(reviewState.product)
    setReviewSources(reviewState.sources)
    setGoal("Full Product Feedback Synthesis")
    setScreen("review")
  }

  function reviewCustom() {
    const reviewState = buildCustomReviewState({
      product,
      selectedSourceIds: selected,
      searchQuery,
      pastedText: pasteValue,
      csvFileName: csvFileName ?? undefined,
      csvItemCount,
      existingSources: reviewSources,
    })
    setReviewProduct(reviewState.product)
    setReviewSources(reviewState.sources)
    setScreen("review")
  }

  function removeSource(id: string) {
    setReviewSources((prev) => prev.filter((s) => s.id !== id))
  }

  function handleAddSource() {
    // Enrich the current feedback set with more sources via the custom flow.
    if (!product.name) {
      setProduct(reviewProduct)
    }
    setPath("custom")
    setScreen("sources")
  }

  function startNewAnalysis() {
    setScreen("entry")
    setProduct(EMPTY_PRODUCT_CONTEXT)
    setSelected(["paste"])
    setSearchQuery("")
    setCsvFile(null)
    setCsvFileName(null)
    setCsvItemCount(0)
    setCsvErrorMessage(null)
    setPasteValue("")
    setReviewSources([])
    setAnalysisRunId(null)
    setSubmissionError(null)
  }

  async function handleCsvFileChange(file: File | null) {
    setCsvFile(file)
    setCsvErrorMessage(null)

    if (!file) {
      setCsvFileName(null)
      setCsvItemCount(0)
      return
    }

    try {
      const parsed = await parseCsvUpload(file)
      setCsvFileName(parsed.fileName)
      setCsvItemCount(parsed.itemCount)
      if (parsed.itemCount === 0) {
        setCsvErrorMessage(
          "CSV must include a feedback_text column with at least one non-empty value.",
        )
      }
    } catch (error) {
      setCsvFileName(file.name)
      setCsvItemCount(0)
      setCsvErrorMessage(
        error instanceof Error ? error.message : "Unable to read the CSV file.",
      )
    }
  }

  async function handleSynthesize() {
    setSubmissionError(null)
    setIsSubmitting(true)

    try {
      if (path === "demo") {
        const result = await runDemoAnalysis({
          demoProductId: demoProduct,
          analysisTarget: {
            name: reviewProduct.name,
            description: reviewProduct.description,
          },
          analysisGoal: goal,
        })

        setAnalysisRunId(result.analysisRun.id)
        setProcessingSummary({
          feedbackItemCount:
            result.bundle.feedbackSet.totalFeedbackCount ||
            Number(result.analysisRun.metadata.feedbackItemCount) ||
            592,
          sourceCount:
            result.bundle.sources.length ||
            Number(result.analysisRun.metadata.sourceCount) ||
            1,
        })
        setScreen("processing")
        return
      }

      const { feedbackSet } = await createFeedbackSet({
        analysisTarget: {
          name: reviewProduct.name,
          description: reviewProduct.description,
        },
        analysisGoal: goal,
      })

      for (const source of reviewSources) {
        if (source.sourceType === "demo_dataset") {
          await addDemoSource({
            feedbackSetId: feedbackSet.id,
            demoProductId: source.mockConfig?.demoProductId ?? demoProduct,
          })
          continue
        }

        if (source.sourceType === "csv_upload") {
          if (!csvFile) {
            throw new Error("Select a CSV file before synthesizing.")
          }
          await addCsvSource({
            feedbackSetId: feedbackSet.id,
            sourceLabel: source.sourceLabel,
            file: csvFile,
            fileName: csvFile.name,
            itemCount: source.itemCount,
          })
          continue
        }

        if (source.sourceType === "pasted_text") {
          await addPastedSource({
            feedbackSetId: feedbackSet.id,
            sourceLabel: source.sourceLabel,
            pastedText: pasteValue,
            itemCount: source.itemCount,
          })
          continue
        }

        throw new Error("X Search is a future feature and is not available in this MVP.")
      }

      const analysisRun = await synthesizeFeedbackSet({
        feedbackSetId: feedbackSet.id,
      })

      setAnalysisRunId(analysisRun.analysisRun.id)
      setProcessingSummary({
        feedbackItemCount:
          Number(analysisRun.analysisRun.metadata.feedbackItemCount) || 592,
        sourceCount: Number(analysisRun.analysisRun.metadata.sourceCount) || 3,
      })
      setScreen("processing")
    } catch (error) {
      setSubmissionError(
        error instanceof Error
          ? error.message
          : "Something went wrong while preparing the analysis.",
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const steps = path === "demo" ? DEMO_STEPS : CUSTOM_STEPS
  const currentStep =
    screen === "demo-product"
      ? 1
      : screen === "sources"
        ? 1
        : screen === "configure"
          ? 2
          : path === "demo"
            ? 2
            : 3

  if (screen === "processing") {
    return (
      <ProcessingState
        feedbackItemCount={processingSummary.feedbackItemCount}
        sourceCount={processingSummary.sourceCount}
        onComplete={() => setScreen("dashboard")}
      />
    )
  }

  if (screen === "dashboard" && analysisRunId) {
    return (
      <Dashboard
        analysisRunId={analysisRunId}
        onNewAnalysis={startNewAnalysis}
      />
    )
  }

  return (
    <main className="min-h-svh bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3.5">
          <button onClick={() => setScreen("entry")} className="rounded-md">
            <BrandMark />
          </button>
          {screen !== "entry" && (
            <span className="hidden text-xs font-medium text-muted-foreground sm:block">
              {path === "demo" ? "Demo feedback set" : "Build a feedback set"}
            </span>
          )}
        </div>
      </header>

      {screen === "entry" ? (
        <HeroEntry onDemo={startDemo} onCustom={startCustom} />
      ) : (
        <div className="mx-auto max-w-5xl px-6 py-10">
          <div className="mb-10">
            <StepIndicator steps={steps} current={currentStep} />
          </div>

          {screen === "demo-product" && (
            <StepDemoProduct
              selected={demoProduct}
              onSelect={setDemoProduct}
              onContinue={reviewDemo}
              onBack={() => setScreen("entry")}
            />
          )}

          {screen === "sources" && (
            <StepSources
              product={product}
              onProductChange={setProduct}
              selected={selected}
              onToggle={toggleSource}
              onContinue={() => setScreen("configure")}
              onBack={() => setScreen("entry")}
            />
          )}

          {screen === "configure" && (
            <StepConfigure
              product={product}
              onProductChange={setProduct}
              selected={selected}
              searchQuery={searchQuery}
              onSearchQueryChange={setSearchQuery}
              csvFileName={csvFileName}
              csvItemCount={csvItemCount}
              csvErrorMessage={csvErrorMessage}
              onCsvFileChange={(file) => {
                void handleCsvFileChange(file)
              }}
              pasteValue={pasteValue}
              onPasteChange={setPasteValue}
              onBack={() => setScreen("sources")}
              onReview={reviewCustom}
            />
          )}

          {screen === "review" && (
            <StepReview
              product={reviewProduct}
              sources={reviewSources}
              goal={goal}
              onGoalChange={setGoal}
              onRemove={removeSource}
              onAddSource={handleAddSource}
              onBack={() =>
                setScreen(path === "demo" ? "demo-product" : "configure")
              }
              onSynthesize={handleSynthesize}
              isSubmitting={isSubmitting}
              errorMessage={submissionError}
            />
          )}
        </div>
      )}
    </main>
  )
}
