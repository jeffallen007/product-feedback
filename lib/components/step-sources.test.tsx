import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import { StepSources } from "@/components/step-sources"

describe("StepSources", () => {
  it("renders X Search as a visible disabled future feature", () => {
    const markup = renderToStaticMarkup(
      <StepSources
        product={{
          name: "Acme PM",
          description: "Project planning tool",
        }}
        selected={[]}
        onProductChange={() => {}}
        onToggle={vi.fn()}
        onContinue={() => {}}
        onBack={() => {}}
      />,
    )

    expect(markup).toContain("Search X")
    expect(markup).toContain("Future Feature")
    expect(markup).toContain("disabled")
  })
})
