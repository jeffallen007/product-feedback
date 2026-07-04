"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import {
  ArrowLeft,
  Bot,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  LoaderCircle,
  Server,
  Sparkles,
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
  MCP_DEMO_STEP_IDS,
  type McpDemoErrorResponse,
  type McpDemoResponse,
  type McpDemoStep,
} from "@/lib/types/mcp-demo"

type RunState = "idle" | "running" | "completed" | "failed"

const STEP_COPY: Record<
  (typeof MCP_DEMO_STEP_IDS)[number],
  Pick<McpDemoStep, "label" | "toolName" | "summary" | "usedNextFor"> & {
    inputPreview?: Record<string, unknown>
    outputPreview?: Record<string, unknown>
    technicalNote?: string
    llmInvolved?: boolean
  }
> = {
  create_feedback_set: {
    label: "Agent creates a feedback set",
    toolName: "create_feedback_set",
    summary: "Prepare the product target and workflow metadata.",
    inputPreview: {
      product_name: MCP_DEMO_PRODUCT.name,
      product_description: MCP_DEMO_PRODUCT.description,
      analysis_goal: MCP_DEMO_PRODUCT.analysisGoal,
    },
    outputPreview: {
      feedback_set_id: "...",
      status: "created",
    },
    usedNextFor:
      "The returned feedback_set_id is passed into add_pasted_feedback.",
  },
  add_pasted_feedback: {
    label: "Agent ingests pasted feedback",
    toolName: "add_pasted_feedback",
    summary: "Send the raw feedback block through the deployed MCP tool.",
    inputPreview: {
      feedback_set_id: "...",
      text: "Eight raw feedback lines...",
    },
    outputPreview: {
      items_created: 8,
      status: "ingested",
    },
    usedNextFor:
      "The same feedback_set_id is passed into run_synthesis.",
  },
  run_synthesis: {
    label: "Agent runs synthesis",
    toolName: "run_synthesis",
    summary: "Trigger analysis on the MCP service.",
    inputPreview: {
      feedback_set_id: "...",
    },
    outputPreview: {
      analysis_run_id: "...",
      status: "completed",
      synthesis_method: "llm_openai or deterministic_fallback",
    },
    usedNextFor:
      "The returned analysis_run_id becomes the handle for retrieving the analysis bundle and asking follow-up questions.",
    technicalNote:
      "This is the main synthesis step. The backend may call OpenAI here when configured, with deterministic fallback otherwise.",
    llmInvolved: true,
  },
  get_analysis_bundle: {
    label: "Agent retrieves the analysis bundle",
    toolName: "get_analysis_bundle",
    summary: "Retrieve the dashboard bundle returned by synthesis.",
    inputPreview: {
      analysis_run_id: "...",
    },
    outputPreview: {
      executive_summary: "...",
      top_themes: ["...", "..."],
      representative_quotes: ["...", "..."],
    },
    usedNextFor:
      "The agent uses the structured bundle as context for product reasoning and final display.",
  },
  ask_analysis_question: {
    label: "Agent asks a grounded follow-up question",
    toolName: "ask_analysis_question",
    summary: "Ask a grounded product question against the completed run.",
    inputPreview: {
      analysis_run_id: "...",
      question: MCP_DEMO_PRODUCT.question,
    },
    outputPreview: {
      answer: "...",
      chat_method: "llm_openai or deterministic_fallback",
      evidence: ["...", "..."],
    },
    usedNextFor:
      "The final recommendation is rendered from the answer and supporting evidence.",
    technicalNote:
      "This is the grounded follow-up step. The backend may call OpenAI here when configured, with deterministic fallback otherwise.",
    llmInvolved: true,
  },
}

const ARCHITECTURE_FLOW = [
  "Browser page",
  "Next.js server route",
  "MCP TypeScript client",
  "Railway MCP server",
  "MCP tool wrapper",
  "FastAPI backend",
  "Supabase and/or OpenAI",
  "Structured MCP response",
  "Page render",
]

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
        current < MCP_DEMO_STEP_IDS.length - 1 ? current + 1 : current,
      )
    }, 900)

    return () => window.clearInterval(interval)
  }, [runState])

  const visibleSteps = useMemo(() => {
    if (data) {
      return data.steps
    }

    return MCP_DEMO_STEP_IDS.map<McpDemoStep>((id, index) => ({
      id,
      label: STEP_COPY[id].label,
      toolName: STEP_COPY[id].toolName,
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
      summary: STEP_COPY[id].summary,
      inputPreview: STEP_COPY[id].inputPreview,
      outputPreview: STEP_COPY[id].outputPreview,
      usedNextFor: STEP_COPY[id].usedNextFor,
      technicalNote: STEP_COPY[id].technicalNote,
      llmInvolved: STEP_COPY[id].llmInvolved,
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
      setPreviewIndex(MCP_DEMO_STEP_IDS.length - 1)
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
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col overflow-x-hidden px-6 py-10 sm:px-8 sm:py-12">
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

      <section className="mx-auto mt-8 flex w-full max-w-5xl flex-col gap-6">
        <div className="max-w-3xl">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            MCP-Powered Product Feedback Agent
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
            This demo shows an agent calling the Product Feedback Synthesizer
            through MCP tools instead of the web UI. The server route asks an
            OpenAI model to choose each MCP action after discovering the tool
            manifest.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
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
          <div className="inline-flex max-w-full items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm text-muted-foreground">
            <Server className="size-4 shrink-0 text-primary" />
            <span className="break-words">
              Calls the deployed MCP service over Streamable HTTP.
            </span>
          </div>
        </div>

        {error ? (
          <Card className="border border-destructive/30 ring-destructive/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <TriangleAlert className="size-4" />
                MCP demo failed
              </CardTitle>
              <CardDescription>{error.error}</CardDescription>
            </CardHeader>
          </Card>
        ) : null}

        <Card className="min-w-0 overflow-hidden border border-primary/15 bg-card">
          <CardHeader>
            <CardTitle>How the request flows</CardTitle>
            <CardDescription>
              This page does not call the product backend directly. It uses a
              Next.js server route running an MCP client, which calls the
              deployed Railway MCP server. The MCP server then invokes product
              tools that call the existing FastAPI backend.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex min-w-0 flex-wrap gap-2">
              {ARCHITECTURE_FLOW.map((item, index) => (
                <div key={item} className="flex min-w-0 items-center gap-2">
                  <span className="max-w-full rounded-full border border-border bg-muted/40 px-3 py-1.5 text-xs font-medium text-foreground">
                    {item}
                  </span>
                  {index < ARCHITECTURE_FLOW.length - 1 ? (
                    <ChevronRight className="size-3.5 text-muted-foreground" />
                  ) : null}
                </div>
              ))}
            </div>
            <div className="min-w-0 rounded-lg border border-border bg-muted/30 px-3 py-3 text-sm leading-6 text-muted-foreground">
              Orchestration steps are MCP tool calls. The LLM-backed parts are
              explicit in two places: the server-side agent chooses MCP tools,
              and the backend may also use OpenAI inside synthesis or chat tools
              when configured.
            </div>
          </CardContent>
        </Card>

        <Card className="min-w-0 overflow-hidden">
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

        <Card className="min-w-0 overflow-hidden">
          <CardHeader>
            <CardTitle>Agent workflow</CardTitle>
            <CardDescription>
              Each card shows why the LLM agent chose an MCP tool, the
              structured arguments, the MCP response, and how the output feeds
              the next decision.
            </CardDescription>
          </CardHeader>
          <CardContent className="min-w-0 space-y-3">
            <div className="min-w-0 rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-sm font-medium text-foreground">
                0. Agent discovers MCP tools and receives raw feedback
              </p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                The server route connects to the Railway MCP service, lists
                available tools and schemas, then gives that manifest plus the
                product feedback to the model.
              </p>
              {data ? (
                <div className="mt-3">
                  <ToolDiscoveryDisclosure tools={data.discoveredTools} />
                </div>
              ) : null}
            </div>

            {visibleSteps.map((step, index) => (
              <WorkflowStepCard key={step.id} step={step} index={index + 1} />
            ))}
          </CardContent>
        </Card>

        {data ? (
          <Card className="min-w-0 overflow-hidden border border-primary/20 bg-card">
            <CardHeader>
              <CardTitle>Grounded product recommendation</CardTitle>
              <CardDescription>
                Final answer rendered from MCP outputs returned by the server
                route.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Produced from MCP outputs
                </p>
                <div className="mt-3 grid min-w-0 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  <MetadataPill label="agent mode" value={data.mode} />
                  <MetadataPill
                    label="analysis_run_id"
                    value={data.result.analysisRunId}
                  />
                  <MetadataPill
                    label="synthesis method"
                    value={data.result.synthesisMethod ?? "unknown"}
                  />
                  <MetadataPill
                    label="chat method"
                    value={data.result.chatMethod ?? "unknown"}
                  />
                  <MetadataPill
                    label="evidence items"
                    value={String(data.result.evidence.length)}
                  />
                  <MetadataPill
                    label="top themes"
                    value={String(data.result.topThemes.length)}
                  />
                  <MetadataPill
                    label="discovered tools"
                    value={String(data.discoveredTools.length)}
                  />
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-foreground">
                  Executive summary
                </p>
                <p className="mt-2 break-words text-sm leading-6 text-muted-foreground">
                  {data.result.executiveSummary}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-foreground">
                  Recommendation
                </p>
                <p className="mt-2 break-words text-sm leading-6 text-foreground">
                  {data.result.recommendation}
                </p>
              </div>

              <div className="grid min-w-0 gap-4 md:grid-cols-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    Top themes
                  </p>
                  <div className="mt-3 min-w-0 space-y-2">
                    {data.result.topThemes.slice(0, 3).map((theme, index) => (
                      <div
                        key={`${String(theme.name)}-${index}`}
                        className="min-w-0 rounded-lg border border-border bg-muted/40 px-3 py-2"
                      >
                        <div className="break-words text-sm font-medium text-foreground">
                          {typeof theme.name === "string"
                            ? theme.name
                            : `Theme ${index + 1}`}
                        </div>
                        {typeof theme.description === "string" ? (
                          <p className="mt-1 break-words text-xs leading-5 text-muted-foreground">
                            {theme.description}
                          </p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    Evidence
                  </p>
                  <div className="mt-3 min-w-0 space-y-2">
                    {data.result.evidence.slice(0, 3).map((item, index) => (
                      <div
                        key={`${item.text}-${index}`}
                        className="min-w-0 rounded-lg border border-border bg-muted/40 px-3 py-2"
                      >
                        <p className="break-words text-sm leading-5 text-foreground">
                          "{item.text}"
                        </p>
                        <p className="mt-1 break-words text-xs text-muted-foreground">
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
      </section>
    </main>
  )
}

function WorkflowStepCard({
  step,
  index,
}: {
  step: McpDemoStep
  index: number
}) {
  return (
    <div
      className={cn(
        "min-w-0 max-w-full overflow-hidden rounded-lg border px-4 py-4",
        step.status === "completed" && "border-primary/25 bg-primary/5",
        step.status === "running" && "border-primary/35 bg-accent/60",
        step.status === "failed" && "border-destructive/30 bg-destructive/5",
        step.status === "pending" && "border-border bg-card",
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
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
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <p className="min-w-0 break-words text-sm font-medium text-foreground">
              {index}. {step.label}
            </p>
            {step.llmInvolved ? (
              <Badge
                variant="secondary"
                className="gap-1 border border-primary/20 bg-accent text-accent-foreground"
              >
                <Sparkles className="size-3" />
                LLM selected
              </Badge>
            ) : null}
          </div>
          <p className="break-words text-sm leading-6 text-muted-foreground">
            {step.summary}
          </p>

          <div className="rounded-lg border border-primary/15 bg-card/70 px-3 py-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Agent decision
            </p>
            <p className="mt-2 break-words text-sm leading-6 text-foreground">
              {step.agentDecision ??
                "Waiting for the LLM agent to choose the next MCP action."}
            </p>
          </div>

          <div className="grid min-w-0 gap-3">
            <div className="rounded-lg border border-border bg-card/70 px-3 py-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                MCP tool selected
              </p>
              <div className="mt-2 min-w-0 overflow-x-auto">
                <code className="font-mono text-xs text-foreground">
                  {step.toolName}
                </code>
              </div>
            </div>
            <div className="rounded-lg border border-border bg-card/70 px-3 py-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Used next for
              </p>
              <p className="mt-2 break-words text-sm leading-6 text-muted-foreground">
                {step.usedNextFor ?? "Waiting for workflow completion."}
              </p>
            </div>
          </div>

          {step.technicalNote ? (
            <div className="min-w-0 rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs leading-5 text-muted-foreground">
              {step.technicalNote}
            </div>
          ) : null}

          {step.status === "completed" && step.inputPreview ? (
            <JsonDisclosure label="View input JSON" value={step.inputPreview} />
          ) : null}
          {step.status === "completed" && step.output ? (
            <JsonDisclosure label="View response JSON" value={step.output} />
          ) : null}
        </div>
      </div>
    </div>
  )
}

function ToolDiscoveryDisclosure({
  tools,
}: {
  tools: McpDemoResponse["discoveredTools"]
}) {
  return (
    <details className="group min-w-0 max-w-full overflow-hidden rounded-lg border border-border bg-card">
      <summary className="flex min-w-0 cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 text-sm font-medium text-foreground">
        Agent discovered MCP tools
        <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
      </summary>
      <div className="min-w-0 max-w-full space-y-3 overflow-hidden border-t border-border px-3 py-3">
        {tools.map((tool) => (
          <div
            key={tool.name}
            className="min-w-0 rounded-lg border border-border bg-muted/30 px-3 py-3"
          >
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <code className="break-all font-mono text-xs text-foreground">
                {tool.name}
              </code>
              {tool.description ? (
                <span className="break-words text-xs text-muted-foreground">
                  {tool.description}
                </span>
              ) : null}
            </div>
            <JsonDisclosure
              label="View input schema"
              value={tool.inputSchema}
            />
          </div>
        ))}
      </div>
    </details>
  )
}

function JsonDisclosure({
  label,
  value,
}: {
  label: string
  value: Record<string, unknown>
}) {
  return (
    <details className="group min-w-0 max-w-full overflow-hidden rounded-lg border border-border bg-card">
      <summary className="flex min-w-0 cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 text-sm font-medium text-foreground">
        {label}
        <ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-180" />
      </summary>
      <div className="min-w-0 max-w-full overflow-hidden border-t border-border px-3 py-3">
        <pre className="max-w-full overflow-x-auto rounded-lg bg-muted/40 p-3 font-mono text-xs leading-5 text-foreground">
          {formatJson(value)}
        </pre>
      </div>
    </details>
  )
}

function MetadataPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-border bg-card px-3 py-2">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 break-all font-mono text-xs text-foreground">{value}</p>
    </div>
  )
}

function formatJson(value: Record<string, unknown> | undefined): string {
  if (!value) {
    return "{\n  \"status\": \"pending\"\n}"
  }

  return JSON.stringify(value, null, 2)
}
