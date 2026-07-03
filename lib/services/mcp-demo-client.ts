import {
  Client,
  StreamableHTTPClientTransport,
  type CallToolResult,
} from "@modelcontextprotocol/client"

import {
  DEFAULT_MCP_SERVER_URL,
  MCP_DEMO_PRODUCT,
  type McpDemoEvidenceItem,
  type McpDemoResponse,
  type McpDemoStep,
} from "@/lib/types/mcp-demo"

type CreateFeedbackSetOutput = {
  feedback_set_id: string
  status: string
}

type AddPastedFeedbackOutput = {
  feedback_set_id: string
  source_type: string
  items_created: number
  status: string
}

type RunSynthesisOutput = {
  analysis_run_id: string
  feedback_set_id: string
  status: string
  synthesis_method: string
}

type AnalysisBundleOutput = {
  analysis_run_id: string
  product_name: string
  executive_summary: string
  top_themes: Array<Record<string, unknown>>
  pain_points: Array<Record<string, unknown>>
  feature_requests: Array<Record<string, unknown>>
  roadmap_recommendations: Array<Record<string, unknown>>
  source_mix: Array<Record<string, unknown>>
  representative_quotes: Array<Record<string, unknown>>
}

type AskAnalysisQuestionOutput = {
  analysis_run_id: string
  answer: string
  chat_method: string
  evidence: Array<Record<string, unknown>>
}

export function getMcpServerUrl(): string {
  return process.env.MCP_SERVER_URL?.trim() || DEFAULT_MCP_SERVER_URL
}

export async function runMcpDemoWorkflow(): Promise<McpDemoResponse> {
  const mcpServerUrl = getMcpServerUrl()
  const client = new Client({
    name: "product-feedback-mcp-demo",
    version: "1.0.0",
  })
  const transport = new StreamableHTTPClientTransport(new URL(mcpServerUrl))

  const steps: McpDemoStep[] = []

  try {
    await client.connect(transport)

    const created = await callTool<CreateFeedbackSetOutput>(
      client,
      "create_feedback_set",
      {
        product_name: MCP_DEMO_PRODUCT.name,
        product_description: MCP_DEMO_PRODUCT.description,
        analysis_goal: MCP_DEMO_PRODUCT.analysisGoal,
      },
    )
    steps.push({
      label: "create_feedback_set",
      status: "completed",
      summary: `Created feedback set ${created.feedback_set_id}.`,
      output: created,
    })

    const ingested = await callTool<AddPastedFeedbackOutput>(
      client,
      "add_pasted_feedback",
      {
        feedback_set_id: created.feedback_set_id,
        text: MCP_DEMO_PRODUCT.feedback,
      },
    )
    steps.push({
      label: "add_pasted_feedback",
      status: "completed",
      summary: `Ingested ${ingested.items_created} pasted feedback items.`,
      output: ingested,
    })

    const synthesis = await callTool<RunSynthesisOutput>(client, "run_synthesis", {
      feedback_set_id: created.feedback_set_id,
    })
    steps.push({
      label: "run_synthesis",
      status: "completed",
      summary: `Completed synthesis run ${synthesis.analysis_run_id} via ${synthesis.synthesis_method}.`,
      output: synthesis,
    })

    const bundle = await callTool<AnalysisBundleOutput>(
      client,
      "get_analysis_bundle",
      {
        analysis_run_id: synthesis.analysis_run_id,
      },
    )
    steps.push({
      label: "get_analysis_bundle",
      status: "completed",
      summary: buildBundleSummary(bundle),
      output: bundle,
    })

    const answer = await callTool<AskAnalysisQuestionOutput>(
      client,
      "ask_analysis_question",
      {
        analysis_run_id: synthesis.analysis_run_id,
        question: MCP_DEMO_PRODUCT.question,
      },
    )
    steps.push({
      label: "ask_analysis_question",
      status: "completed",
      summary: truncateSummary(answer.answer),
      output: answer,
    })

    return {
      status: "completed",
      mcpServerUrl,
      steps,
      result: {
        analysisRunId: synthesis.analysis_run_id,
        executiveSummary: bundle.executive_summary,
        topThemes: bundle.top_themes,
        recommendation: answer.answer,
        evidence: selectEvidence(answer.evidence, bundle.representative_quotes),
      },
    }
  } finally {
    try {
      await transport.terminateSession()
    } catch {
      // Best effort close. The route should still return the workflow result.
    }
    await client.close()
  }
}

async function callTool<TOutput extends Record<string, unknown>>(
  client: Client,
  name: string,
  args: Record<string, unknown>,
): Promise<TOutput> {
  const result = await client.callTool({
    name,
    arguments: args,
  })

  if (result.isError) {
    throw new Error(`MCP tool '${name}' failed: ${readToolText(result)}`)
  }

  const structured = result.structuredContent
  if (isRecord(structured)) {
    return structured as TOutput
  }

  const content = readToolText(result)
  if (!content) {
    throw new Error(`MCP tool '${name}' returned no structured output.`)
  }

  try {
    const parsed = JSON.parse(content)
    if (isRecord(parsed)) {
      return parsed as TOutput
    }
  } catch {
    // Fall through to the final error below.
  }

  throw new Error(`MCP tool '${name}' returned an unexpected payload.`)
}

function readToolText(result: CallToolResult): string {
  return result.content
    .map((item) => {
      if ("text" in item && typeof item.text === "string") {
        return item.text
      }
      return ""
    })
    .filter(Boolean)
    .join("\n")
}

function buildBundleSummary(bundle: AnalysisBundleOutput): string {
  const topTheme = bundle.top_themes.find(isRecord)
  const topThemeName =
    topTheme && typeof topTheme.name === "string" ? topTheme.name : "top themes"

  return `Retrieved analysis bundle for ${bundle.product_name}, including ${topThemeName}.`
}

function truncateSummary(value: string): string {
  const summary = value.replace(/\s+/g, " ").trim()
  if (summary.length <= 160) {
    return summary
  }
  return `${summary.slice(0, 157)}...`
}

function selectEvidence(
  primary: Array<Record<string, unknown>>,
  fallback: Array<Record<string, unknown>>,
): McpDemoEvidenceItem[] {
  const preferred = primary
    .map(mapEvidenceItem)
    .filter((item): item is McpDemoEvidenceItem => item !== null)

  if (preferred.length >= 3) {
    return preferred.slice(0, 3)
  }

  const backup = fallback
    .map(mapEvidenceItem)
    .filter((item): item is McpDemoEvidenceItem => item !== null)

  const combined = [...preferred]
  for (const item of backup) {
    if (combined.some((candidate) => candidate.text === item.text)) {
      continue
    }
    combined.push(item)
    if (combined.length >= 3) {
      break
    }
  }

  return combined
}

function mapEvidenceItem(value: Record<string, unknown>): McpDemoEvidenceItem | null {
  if (typeof value.text !== "string" || !value.text.trim()) {
    return null
  }

  return {
    text: value.text,
    sourceLabel:
      typeof value.sourceLabel === "string"
        ? value.sourceLabel
        : typeof value.source_label === "string"
          ? value.source_label
          : undefined,
    themeName:
      typeof value.themeName === "string"
        ? value.themeName
        : typeof value.theme_name === "string"
          ? value.theme_name
          : null,
    category: typeof value.category === "string" ? value.category : null,
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
