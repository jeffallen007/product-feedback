import {
  Client,
  StreamableHTTPClientTransport,
} from "@modelcontextprotocol/client"

import {
  callMcpTool,
  getMcpServerUrl,
  listMcpTools,
} from "@/lib/services/mcp-demo-client"
import {
  MCP_DEMO_PRODUCT,
  type McpDemoDiscoveredTool,
  type McpDemoEvidenceItem,
  type McpDemoResponse,
  type McpDemoStep,
} from "@/lib/types/mcp-demo"

const OPENAI_CHAT_COMPLETIONS_URL = "https://api.openai.com/v1/chat/completions"
const DEFAULT_AGENT_MODEL = "gpt-4.1-mini"
const MAX_TOOL_STEPS = 8
const REQUIRED_WORKFLOW_TOOLS = [
  "create_feedback_set",
  "add_pasted_feedback",
  "run_synthesis",
  "get_analysis_bundle",
  "ask_analysis_question",
] as const

type OpenAiMessage = {
  role: "system" | "user" | "assistant" | "tool"
  content: string | null
  tool_call_id?: string
  tool_calls?: OpenAiToolCall[]
}

type OpenAiToolCall = {
  id: string
  type: "function"
  function: {
    name: string
    arguments: string
  }
}

type OpenAiChatResponse = {
  choices?: Array<{
    message?: OpenAiMessage
  }>
}

type AgentMcpToolRequest = {
  toolName: string
  arguments: Record<string, unknown>
  agentDecision: string
  usedNextFor?: string
}

type AgentFinalRequest = {
  analysisRunId?: string
  synthesisMethod?: string
  chatMethod?: string
  executiveSummary?: string
  topThemes?: Record<string, unknown>[]
  recommendation?: string
  evidence?: McpDemoEvidenceItem[]
}

type SynthesisOutput = {
  analysis_run_id: string
  feedback_set_id?: string
  status?: string
  synthesis_method?: string
}

type BundleOutput = {
  analysis_run_id: string
  executive_summary?: string
  top_themes?: Record<string, unknown>[]
  representative_quotes?: Record<string, unknown>[]
}

type AnswerOutput = {
  analysis_run_id: string
  answer?: string
  chat_method?: string
  evidence?: Record<string, unknown>[]
}

export async function runMcpDemoAgentWorkflow(): Promise<McpDemoResponse> {
  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is required for the MCP agent demo. The demo will not fall back to a scripted workflow because that would not demonstrate LLM-driven orchestration.",
    )
  }

  const mcpServerUrl = getMcpServerUrl()
  const model = process.env.OPENAI_MODEL_AGENT?.trim() || DEFAULT_AGENT_MODEL
  const client = new Client({
    name: "product-feedback-mcp-demo-agent",
    version: "1.0.0",
  })
  const transport = new StreamableHTTPClientTransport(new URL(mcpServerUrl))

  try {
    await client.connect(transport)

    const discoveredTools = await listMcpTools(client)
    const toolByName = new Map(discoveredTools.map((tool) => [tool.name, tool]))
    const messages = buildInitialMessages(discoveredTools)
    const steps: McpDemoStep[] = []
    const outputsByTool = new Map<string, Record<string, unknown>>()
    let finalFromAgent: AgentFinalRequest | null = null

    for (let stepIndex = 0; stepIndex < MAX_TOOL_STEPS; stepIndex += 1) {
      const assistantMessage = await requestAgentDecision({
        apiKey,
        model,
        messages,
      })
      messages.push(assistantMessage)

      const toolCall = assistantMessage.tool_calls?.[0]
      if (!toolCall) {
        finalFromAgent = parseFinalFromContent(assistantMessage.content)
        break
      }

      if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 1) {
        throw new Error(
          "The agent selected multiple actions in one step. The demo expects one MCP action per turn.",
        )
      }

      if (toolCall.function.name === "finish_workflow") {
        const missing = missingRequiredTools(outputsByTool)
        if (missing.length > 0) {
          throw new Error(
            `The agent attempted to finish before completing required MCP tool(s): ${missing.join(", ")}.`,
          )
        }
        finalFromAgent = parseToolArguments<AgentFinalRequest>(toolCall)
        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify({ status: "accepted" }),
        })
        break
      }

      if (toolCall.function.name !== "call_mcp_tool") {
        throw new Error(
          `The agent selected unsupported control tool '${toolCall.function.name}'.`,
        )
      }

      const request = parseToolArguments<AgentMcpToolRequest>(toolCall)
      validateMcpToolRequest(request, toolByName)
      const selectedTool = toolByName.get(request.toolName)
      if (!selectedTool) {
        throw new Error(`The agent selected unknown MCP tool '${request.toolName}'.`)
      }
      validateRequiredArgs(selectedTool, request.arguments)

      const output = await callMcpTool(client, request.toolName, request.arguments)
      outputsByTool.set(request.toolName, output)

      steps.push({
        id: `${stepIndex + 1}-${request.toolName}`,
        label: labelForTool(request.toolName),
        toolName: request.toolName,
        status: "completed",
        summary: summaryForTool(request.toolName, output),
        agentDecision: request.agentDecision,
        inputPreview: previewInput(request.toolName, request.arguments),
        outputPreview: previewOutput(request.toolName, output),
        output,
        usedNextFor:
          request.usedNextFor || defaultUsedNextFor(request.toolName),
        technicalNote: technicalNoteForTool(request.toolName),
        llmInvolved: true,
      })

      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: JSON.stringify({
          mcpToolName: request.toolName,
          mcpOutput: output,
        }),
      })
    }

    if (!finalFromAgent) {
      finalFromAgent = deriveFinalResult(outputsByTool)
    }

    const synthesis = outputsByTool.get("run_synthesis") as
      | SynthesisOutput
      | undefined
    const bundle = outputsByTool.get("get_analysis_bundle") as
      | BundleOutput
      | undefined
    const answer = outputsByTool.get("ask_analysis_question") as
      | AnswerOutput
      | undefined

    const result = {
      analysisRunId:
        finalFromAgent.analysisRunId ||
        synthesis?.analysis_run_id ||
        bundle?.analysis_run_id ||
        answer?.analysis_run_id ||
        "",
      synthesisMethod:
        finalFromAgent.synthesisMethod || synthesis?.synthesis_method || "unknown",
      chatMethod: finalFromAgent.chatMethod || answer?.chat_method || "unknown",
      executiveSummary:
        finalFromAgent.executiveSummary || bundle?.executive_summary || "",
      topThemes: finalFromAgent.topThemes || bundle?.top_themes || [],
      recommendation:
        finalFromAgent.recommendation || answer?.answer || "No recommendation returned.",
      evidence:
        finalFromAgent.evidence ||
        selectEvidence(answer?.evidence || [], bundle?.representative_quotes || []),
    }

    const missing = missingRequiredTools(outputsByTool)
    if (missing.length > 0) {
      throw new Error(
        `The agent ended before completing required MCP tool(s): ${missing.join(", ")}.`,
      )
    }

    if (!result.analysisRunId) {
      throw new Error(
        "The agent ended before producing an analysis run. Inspect the trace to see which MCP step was skipped.",
      )
    }

    return {
      status: "completed",
      mode: "llm_agent_mcp",
      mcpServerUrl,
      discoveredTools,
      steps,
      result,
    }
  } finally {
    try {
      await transport.terminateSession()
    } catch {
      // Best effort close. The route should still return the agent result.
    }
    await client.close()
  }
}

function buildInitialMessages(tools: McpDemoDiscoveredTool[]): OpenAiMessage[] {
  return [
    {
      role: "system",
      content:
        "You are an AI product operations agent. You must use the discovered MCP tools to complete the product feedback synthesis workflow. Select one MCP tool at a time with call_mcp_tool, observe the result, then decide the next action. Do not invent IDs. Use IDs returned by prior MCP tool results. Finish only after you have created a feedback set, ingested pasted feedback, run synthesis, retrieved the analysis bundle, and asked the follow-up question. The expected happy path is guidance, not a hardcoded server sequence: create_feedback_set, add_pasted_feedback, run_synthesis, get_analysis_bundle, ask_analysis_question.",
    },
    {
      role: "user",
      content: JSON.stringify(
        {
          objective:
            "Complete the product feedback synthesis workflow and return a grounded recommendation.",
          productProfile: {
            name: MCP_DEMO_PRODUCT.name,
            description: MCP_DEMO_PRODUCT.description,
          },
          analysisGoal: MCP_DEMO_PRODUCT.analysisGoal,
          feedbackText: MCP_DEMO_PRODUCT.feedback,
          followUpQuestion: MCP_DEMO_PRODUCT.question,
          availableMcpTools: tools,
          finalResultInstructions:
            "When the workflow is complete, call finish_workflow with the analysis run id, backend synthesis method, backend chat method, executive summary, top themes, recommendation, and evidence. Preserve deterministic_fallback if the backend reports it.",
        },
        null,
        2,
      ),
    },
  ]
}

async function requestAgentDecision({
  apiKey,
  model,
  messages,
}: {
  apiKey: string
  model: string
  messages: OpenAiMessage[]
}): Promise<OpenAiMessage> {
  const response = await fetch(OPENAI_CHAT_COMPLETIONS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages,
      tools: CONTROL_TOOLS,
      tool_choice: "auto",
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(
      `OpenAI agent request failed with ${response.status}: ${truncateText(body, 500)}`,
    )
  }

  const payload = (await response.json()) as OpenAiChatResponse
  const message = payload.choices?.[0]?.message
  if (!message) {
    throw new Error("OpenAI agent returned no decision message.")
  }

  return message
}

const CONTROL_TOOLS = [
  {
    type: "function",
    function: {
      name: "call_mcp_tool",
      description:
        "Select one discovered MCP tool to execute next through the server-side MCP client.",
      parameters: {
        type: "object",
        additionalProperties: false,
        required: ["toolName", "arguments", "agentDecision"],
        properties: {
          toolName: {
            type: "string",
            description: "The exact name of a discovered MCP tool.",
          },
          arguments: {
            type: "object",
            description:
              "Arguments matching the selected MCP tool input schema.",
            additionalProperties: true,
          },
          agentDecision: {
            type: "string",
            description: "Concise reason this MCP tool is the correct next action.",
          },
          usedNextFor: {
            type: "string",
            description:
              "How the agent expects this result to inform the next workflow step.",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "finish_workflow",
      description:
        "Finish after all required MCP workflow steps are complete and return the final product recommendation.",
      parameters: {
        type: "object",
        additionalProperties: false,
        required: [
          "analysisRunId",
          "synthesisMethod",
          "chatMethod",
          "executiveSummary",
          "topThemes",
          "recommendation",
          "evidence",
        ],
        properties: {
          analysisRunId: { type: "string" },
          synthesisMethod: { type: "string" },
          chatMethod: { type: "string" },
          executiveSummary: { type: "string" },
          topThemes: {
            type: "array",
            items: { type: "object", additionalProperties: true },
          },
          recommendation: { type: "string" },
          evidence: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["text"],
              properties: {
                text: { type: "string" },
                sourceLabel: { type: "string" },
                themeName: { type: ["string", "null"] },
                category: { type: ["string", "null"] },
              },
            },
          },
        },
      },
    },
  },
] as const

function parseToolArguments<T>(toolCall: OpenAiToolCall): T {
  try {
    const parsed = JSON.parse(toolCall.function.arguments)
    if (isRecord(parsed)) {
      return parsed as T
    }
  } catch {
    // Fall through to the final error.
  }

  throw new Error(
    `The agent returned invalid JSON for ${toolCall.function.name}.`,
  )
}

function parseFinalFromContent(content: string | null): AgentFinalRequest | null {
  if (!content) {
    return null
  }

  try {
    const parsed = JSON.parse(content)
    if (isRecord(parsed)) {
      return parsed as AgentFinalRequest
    }
  } catch {
    return { recommendation: content }
  }

  return null
}

function validateMcpToolRequest(
  request: AgentMcpToolRequest,
  toolByName: Map<string, McpDemoDiscoveredTool>,
) {
  if (!request || typeof request.toolName !== "string") {
    throw new Error("The agent did not select a valid MCP tool name.")
  }
  if (!toolByName.has(request.toolName)) {
    throw new Error(`The agent selected invalid MCP tool '${request.toolName}'.`)
  }
  if (!isRecord(request.arguments)) {
    throw new Error(
      `The agent selected '${request.toolName}' without a valid arguments object.`,
    )
  }
  if (
    typeof request.agentDecision !== "string" ||
    !request.agentDecision.trim()
  ) {
    throw new Error(
      `The agent selected '${request.toolName}' without explaining the decision.`,
    )
  }
}

function validateRequiredArgs(
  tool: McpDemoDiscoveredTool,
  args: Record<string, unknown>,
) {
  const required = Array.isArray(tool.inputSchema.required)
    ? tool.inputSchema.required
    : []
  const missing = required.filter(
    (key): key is string => typeof key === "string" && !(key in args),
  )
  if (missing.length > 0) {
    throw new Error(
      `The agent selected '${tool.name}' but omitted required argument(s): ${missing.join(", ")}.`,
    )
  }
}

function missingRequiredTools(
  outputsByTool: Map<string, Record<string, unknown>>,
): string[] {
  return REQUIRED_WORKFLOW_TOOLS.filter(
    (toolName) => !outputsByTool.has(toolName),
  )
}

function deriveFinalResult(
  outputsByTool: Map<string, Record<string, unknown>>,
): AgentFinalRequest {
  const synthesis = outputsByTool.get("run_synthesis") as
    | SynthesisOutput
    | undefined
  const bundle = outputsByTool.get("get_analysis_bundle") as
    | BundleOutput
    | undefined
  const answer = outputsByTool.get("ask_analysis_question") as
    | AnswerOutput
    | undefined

  return {
    analysisRunId:
      answer?.analysis_run_id ||
      bundle?.analysis_run_id ||
      synthesis?.analysis_run_id,
    synthesisMethod: synthesis?.synthesis_method,
    chatMethod: answer?.chat_method,
    executiveSummary: bundle?.executive_summary,
    topThemes: bundle?.top_themes,
    recommendation: answer?.answer,
    evidence: selectEvidence(answer?.evidence || [], bundle?.representative_quotes || []),
  }
}

function labelForTool(toolName: string): string {
  const labels: Record<string, string> = {
    create_feedback_set: "Agent creates a feedback set",
    add_pasted_feedback: "Agent ingests pasted feedback",
    run_synthesis: "Agent runs synthesis",
    get_analysis_bundle: "Agent retrieves the analysis bundle",
    ask_analysis_question: "Agent asks a grounded follow-up question",
  }

  return labels[toolName] || `Agent calls ${toolName}`
}

function summaryForTool(
  toolName: string,
  output: Record<string, unknown>,
): string {
  if (toolName === "create_feedback_set") {
    return `Created feedback set ${String(output.feedback_set_id || "unknown")}.`
  }
  if (toolName === "add_pasted_feedback") {
    return `Ingested ${String(output.items_created || "unknown")} pasted feedback items.`
  }
  if (toolName === "run_synthesis") {
    return `Completed synthesis run ${String(output.analysis_run_id || "unknown")} via ${String(output.synthesis_method || "unknown")}.`
  }
  if (toolName === "get_analysis_bundle") {
    return `Retrieved the structured analysis bundle for ${String(output.product_name || MCP_DEMO_PRODUCT.name)}.`
  }
  if (toolName === "ask_analysis_question") {
    return truncateText(String(output.answer || "Received grounded answer."), 180)
  }

  return `Executed ${toolName}.`
}

function previewInput(
  toolName: string,
  args: Record<string, unknown>,
): Record<string, unknown> {
  if (toolName === "add_pasted_feedback" && typeof args.text === "string") {
    return {
      ...args,
      text: `${args.text.split("\n").length} raw feedback lines...`,
    }
  }

  return args
}

function previewOutput(
  toolName: string,
  output: Record<string, unknown>,
): Record<string, unknown> {
  if (toolName === "get_analysis_bundle") {
    return {
      analysis_run_id: output.analysis_run_id,
      executive_summary:
        typeof output.executive_summary === "string"
          ? truncateText(output.executive_summary, 180)
          : undefined,
      top_themes: Array.isArray(output.top_themes)
        ? output.top_themes.slice(0, 2)
        : [],
    }
  }
  if (toolName === "ask_analysis_question") {
    return {
      analysis_run_id: output.analysis_run_id,
      answer:
        typeof output.answer === "string"
          ? truncateText(output.answer, 220)
          : undefined,
      chat_method: output.chat_method,
      evidence: Array.isArray(output.evidence) ? output.evidence.slice(0, 2) : [],
    }
  }

  return output
}

function defaultUsedNextFor(toolName: string): string {
  const copy: Record<string, string> = {
    create_feedback_set:
      "The returned feedback_set_id can be used to attach raw feedback.",
    add_pasted_feedback:
      "The ingested feedback set is ready for synthesis.",
    run_synthesis:
      "The returned analysis_run_id can be used to retrieve the bundle and ask follow-up questions.",
    get_analysis_bundle:
      "The structured bundle provides summary, themes, and evidence for the final recommendation.",
    ask_analysis_question:
      "The grounded answer and evidence become the final recommendation.",
  }

  return copy[toolName] || "The result is passed back to the agent for planning."
}

function technicalNoteForTool(toolName: string): string | undefined {
  if (toolName === "run_synthesis") {
    return "This is a backend synthesis step. If the backend returns deterministic_fallback, that is the backend synthesis method, not scripted agent orchestration."
  }
  if (toolName === "ask_analysis_question") {
    return "This is a backend grounded chat step. Its chat_method is reported separately from the LLM agent orchestrating MCP tools."
  }
  return undefined
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

function mapEvidenceItem(
  value: Record<string, unknown>,
): McpDemoEvidenceItem | null {
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

function truncateText(value: string, maxLength: number): string {
  const summary = value.replace(/\s+/g, " ").trim()
  if (summary.length <= maxLength) {
    return summary
  }
  return `${summary.slice(0, maxLength - 3)}...`
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
