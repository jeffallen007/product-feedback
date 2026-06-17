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
import {
  DEMO_PRODUCTS,
  EMPTY_PRODUCT_CONTEXT,
  SOURCE_TAG_BY_TYPE,
  type ConfiguredSource,
  type DemoProductId,
  type ProductContext,
  type WorkflowSourceId,
} from "@/lib/mocks/workflow"
import type { AnalysisGoal } from "@/lib/types/contracts"

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
  const [selected, setSelected] = useState<WorkflowSourceId[]>(["csv"])
  const [searchQuery, setSearchQuery] = useState("")
  const [pasteValue, setPasteValue] = useState("")

  // Review
  const [goal, setGoal] = useState<AnalysisGoal>(
    "Full Product Feedback Synthesis",
  )
  const [reviewProduct, setReviewProduct] = useState<ProductContext>(
    EMPTY_PRODUCT_CONTEXT,
  )
  const [reviewSources, setReviewSources] = useState<ConfiguredSource[]>([])

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
    setSelected(["csv"])
    setScreen("sources")
  }

  function reviewDemo() {
    const dp = DEMO_PRODUCTS.find((p) => p.id === demoProduct)
    setReviewProduct({
      name: dp?.label ?? "Productivity Tool",
      description:
        dp?.description ??
        "Tasks, notifications, and collaboration feedback from teams.",
    })
    setReviewSources([
      {
        id: "demo-" + demoProduct,
        sourceType: "demo_dataset",
        sourceTag: "Demo Dataset",
        sourceLabel: `${dp?.label ?? "Productivity Tool"} Demo Dataset`,
        itemCount: dp?.count ?? 482,
        status: "Ready",
      },
    ])
    setGoal("Full Product Feedback Synthesis")
    setScreen("review")
  }

  function reviewCustom() {
    setReviewProduct(product)
    // Preserve any demo dataset sources already in the set (enrichment flow).
    const result: ConfiguredSource[] = reviewSources.filter(
      (s) => s.sourceType === "demo_dataset",
    )
    if (selected.includes("csv")) {
      result.push({
        id: "csv-upload",
        sourceType: "csv_upload",
        sourceTag: SOURCE_TAG_BY_TYPE.csv_upload,
        sourceLabel: "Uploaded CSV",
        itemCount: 318,
        status: "Ready",
      })
    }
    if (selected.includes("paste")) {
      result.push({
        id: "pasted",
        sourceType: "pasted_text",
        sourceTag: SOURCE_TAG_BY_TYPE.pasted_text,
        sourceLabel: "Pasted Reviews",
        itemCount: 24,
        status: "Ready",
      })
    }
    if (selected.includes("search")) {
      result.push({
        id: "x-search",
        sourceType: "x_search",
        sourceTag: SOURCE_TAG_BY_TYPE.x_search,
        sourceLabel: `X Search: "${searchQuery || "Monday.com notifications"}"`,
        itemCount: 86,
        status: "Ready",
      })
    }
    setReviewSources(result)
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
    setSelected(["csv"])
    setReviewSources([])
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
    return <ProcessingState onComplete={() => setScreen("dashboard")} />
  }

  if (screen === "dashboard") {
    return <Dashboard onNewAnalysis={startNewAnalysis} />
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
              onSynthesize={() => setScreen("processing")}
            />
          )}
        </div>
      )}
    </main>
  )
}
