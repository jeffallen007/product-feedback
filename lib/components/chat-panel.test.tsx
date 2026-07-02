import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { ChatPanel } from "@/components/dashboard/chat-panel"

describe("ChatPanel", () => {
  it("renders message history as an internal scroll container", () => {
    const markup = renderToStaticMarkup(
      <ChatPanel
        analysisRunId="run_123"
        initialMessages={[
          {
            role: "assistant",
            content: "Notification controls are the top priority.",
          },
        ]}
      />,
    )

    expect(markup).toContain('data-testid="chat-message-history"')
    expect(markup).toContain("min-h-0 flex-1 overflow-y-auto overscroll-contain")
  })

  it("does not render dynamic assistant follow-up bubbles", () => {
    const markup = renderToStaticMarkup(
      <ChatPanel
        analysisRunId="run_123"
        initialMessages={[
          {
            role: "assistant",
            content: "Dashboard customization is a common request.",
            followUps: [
              "Conduct user interviews to explore specific dashboard customization needs.",
            ],
          },
        ]}
      />,
    )

    expect(markup).toContain("Dashboard customization is a common request.")
    expect(markup).not.toContain(
      "Conduct user interviews to explore specific dashboard customization needs.",
    )
  })

  it("keeps static suggested prompt chips available", () => {
    const markup = renderToStaticMarkup(
      <ChatPanel analysisRunId="run_123" initialMessages={[]} />,
    )

    expect(markup).toContain("Suggested prompts")
    expect(markup).toContain("What should we prioritize first?")
  })
})
