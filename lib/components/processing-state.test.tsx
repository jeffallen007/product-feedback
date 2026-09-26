import { describe, expect, it } from "vitest"
import { renderToStaticMarkup } from "react-dom/server"

import { ProcessingState } from "@/components/processing-state"
import { initialProgressSnapshot } from "@/lib/services/progress-workflow"

describe("processing view", () => {
  it("shows only the active real stage while later stages remain pending", () => {
    const progress = initialProgressSnapshot()
    progress.stages.create_feedback_set = "completed"
    progress.stages.ingest_sources = "running"
    progress.sourceCount = 2
    progress.ingestedSourceCount = 1

    const html = renderToStaticMarkup(
      <ProcessingState progress={progress} errorMessage={null} onStartOver={() => {}} />,
    )

    expect(html).toContain("Ingesting feedback (1 of 2 sources)")
    expect(html).toContain("1 of 7")
    expect(html).toContain("Generating insights")
    expect(html).not.toContain("Running ML classification")
  })

  it("shows a recovery action on failure", () => {
    const progress = initialProgressSnapshot()
    progress.stages.create_feedback_set = "failed"

    const html = renderToStaticMarkup(
      <ProcessingState progress={progress} errorMessage="Unable to create feedback set." onStartOver={() => {}} />,
    )

    expect(html).toContain("Unable to create feedback set.")
    expect(html).toContain("Start over")
  })
})
