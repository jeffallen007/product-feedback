"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import {
  ArrowLeft,
  Bot,
  CheckCircle2,
  ChevronRight,
  LoaderCircle,
  Server,
  TriangleAlert,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"
import {
  MCP_DEMO_PRODUCT,
  MCP_DEMO_STEP_LABELS,
  type McpDemoErrorResponse,
  type McpDemoResponse,
  type McpDemoStep,
} from "@/lib/types/mcp-demo"

const WORKFLOW_LABELS: Record<string, string> = {
  create_feedback_set: "1. Agent creates a feedback set",
  add_pasted_feedback: "2. Agent ingests pasted feedback",
  run_synthesis: "3. Agent runs synthesis",
  get_analysis_bundle: "4. Agent retrieves the analysis bundle",
  ask_analysis_question: "5. Agent asks a grounded follow-up question",
}

type RunState = "idle" | "running" | "completed" | "failed"

export default function McpDemoPage() {
  const [runState, setRunState] = useState<RunState>("idle")
  const [data, setData] = useState<McpDemoResponse | null>(null)
  const [error, setError] = useState<McpDemoErrorResponse | null>(null)
  const [previewIndex, setPreviewIndex] = useState(0)

  useEffect(() => {
    if (runState !== "running") {
      return
    }

    const interval = window.setInterval(() => {
      setPreviewIndex((current) =>
        current < MCP_DEMO_STEP_LABELS.length - 1 ? current + 1 : current,
      )
    }, 900)

    return () => window.clearInterval(interval)
  }, [runState])

  const visibleSteps = useMemo(() => {
    if (data) {
      return data.steps
    }

    return MCP_DEMO_STEP_LABELS.map<McpDemoStep>((label, index) => ({
      label,
      status:
        runState === "running"
          ? index < previewIndex
            ? "completed"
            : index === previewIndex
              ? "running"
              : "pending"
          : runState === "failed"
            ? index === previewIndex
              ? "failed"
              : index < previewIndex
                ? "completed"
                : "pending"
            : "pending",
      summary:
        label === "create_feedback_set"
          ? "Prepare the product target and workflow metadata."
          : label === "add_pasted_feedback"
            ? "Send the raw feedback block through the deployed MCP tool."
            : label === "run_synthesis"
              ? "Trigger analysis on the MCP service."
              : label === "get_analysis_bundle"
                ? "Retrieve the dashboard bundle returned by synthesis."
                : "Ask a grounded product question against the completed run.",
    }))
  }, [data, previewIndex, runState])

  async function handleRun() {
    setRunState("running")
    setData(null)
    setError(null)
    setPreviewIndex(0)

    try {
      const response = await fetch("/api/mcp-demo/run", {
        method: "POST",
      })
      const payload = (await response.json()) as
        | McpDemoResponse
        | McpDemoErrorResponse

      if (!response.ok || payload.status === "failed") {
        setError(
          payload.status === "failed"
            ? payload
            : {
                status: "failed",
                error: "The MCP demo workflow failed.",
                mcpServerUrl: "",
              },
        )
        setRunState("failed")
        return
      }

      setData(payload)
      setRunState("completed")
      setPreviewIndex(MCP_DEMO_STEP_LABELS.length - 1)
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "The MCP demo workflow failed."
      setError({
        status: "failed",
        error: message,
        mcpServerUrl: "",
      })
      setRunState("failed")
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-10 sm:px-8 sm:py-12">
      <div className="flex items-center justify-between gap-4">
        <Button variant="ghost" size="sm" render={<Link href="/" />}>
          <ArrowLeft className="size-4" />
          Back to product demo
        </Button>
        <Badge
          variant="secondary"
          className="border border-border bg-accent text-accent-foreground"
        >
          MCP agent workflow
        </Badge>
      </div>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <div className="max-w-2xl">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              MCP-Powered Product Feedback Agent
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
              This demo shows an agent calling the Product Feedback Synthesizer
              through MCP tools instead of the web UI.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button
              size="lg"
              onClick={handleRun}
              disabled={runState === "running"}
            >
              {runState === "running" ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Bot className="size-4" />
              )}
              Run Agent Workflow
            </Button>
            <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm text-muted-foreground">
              <Server className="size-4 text-primary" />
              Calls the deployed MCP service over Streamable HTTP.
            </div>
          </div>

          {error ? (
            <Card className="mt-6 border border-destructive/30 ring-destructive/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <TriangleAlert className="size-4" />
                  MCP demo failed
                </CardTitle>
                <CardDescription>{error.error}</CardDescription>
              </CardHeader>
            </Card>
          ) : null}

          {data ? (
            <Card className="mt-6 border border-primary/20 bg-card">
              <CardHeader>
                <CardTitle>Grounded product recommendation</CardTitle>
                <CardDescription>
                  Analysis run ID:{" "}
                  <span className="font-mono text-xs text-foreground">
                    {data.result.analysisRunId}
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Executive summary
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {data.result.executiveSummary}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-foreground">
                    Recommendation
                  </p>
                  <p className="mt-2 text-sm leading-6 text-foreground">
                    {data.result.recommendation}
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Top themes
                    </p>
                    <div className="mt-3 space-y-2">
                      {data.result.topThemes.slice(0, 3).map((theme, index) => (
                        <div
                          key={`${String(theme.name)}-${index}`}
                          className="rounded-lg border border-border bg-muted/40 px-3 py-2"
                        >
                          <div className="text-sm font-medium text-foreground">
                            {typeof theme.name === "string"
                              ? theme.name
                              : `Theme ${index + 1}`}
                          </div>
                          {typeof theme.description === "string" ? (
                            <p className="mt-1 text-xs leading-5 text-muted-foreground">
                              {theme.description}
                            </p>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Evidence
                    </p>
                    <div className="mt-3 space-y-2">
                      {data.result.evidence.slice(0, 3).map((item, index) => (
                        <div
                          key={`${item.text}-${index}`}
                          className="rounded-lg border border-border bg-muted/40 px-3 py-2"
                        >
                          <p className="text-sm leading-5 text-foreground">
                            "{item.text}"
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {[item.sourceLabel, item.themeName]
                              .filter(Boolean)
                              .join(" • ") || "Feedback evidence"}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Fixed demo input</CardTitle>
              <CardDescription>
                The page uses one product profile and one raw feedback block so
                the workflow is repeatable.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Product
                </p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {MCP_DEMO_PRODUCT.name}
                </p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {MCP_DEMO_PRODUCT.description}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Analysis goal
                </p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {MCP_DEMO_PRODUCT.analysisGoal}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Follow-up question
                </p>
                <p className="mt-1 text-sm leading-6 text-foreground">
                  {MCP_DEMO_PRODUCT.question}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Agent workflow</CardTitle>
              <CardDescription>
                Visible MCP tool calls and outputs from the deployed service.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-sm font-medium text-foreground">
                  0. Agent receives raw product feedback
                </p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Eight lines of raw product feedback are sent to the server
                  route, which then uses MCP to execute the workflow.
                </p>
              </div>

              {visibleSteps.map((step) => (
                <div
                  key={step.label}
                  className={cn(
                    "rounded-lg border px-3 py-3",
                    step.status === "completed" &&
                      "border-primary/25 bg-primary/5",
                    step.status === "running" &&
                      "border-primary/35 bg-accent/60",
                    step.status === "failed" &&
                      "border-destructive/30 bg-destructive/5",
                    step.status === "pending" && "border-border bg-card",
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {step.status === "completed" ? (
                        <CheckCircle2 className="size-4 text-success" />
                      ) : step.status === "running" ? (
                        <LoaderCircle className="size-4 animate-spin text-primary" />
                      ) : step.status === "failed" ? (
                        <TriangleAlert className="size-4 text-destructive" />
                      ) : (
                        <ChevronRight className="size-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {WORKFLOW_LABELS[step.label]}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        {step.summary}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-sm font-medium text-foreground">
                  6. Agent returns grounded product recommendation
                </p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  The page highlights the final recommendation, top themes, and
                  evidence returned by the MCP-backed workflow.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  )
}
