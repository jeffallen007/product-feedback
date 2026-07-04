export const DEFAULT_MCP_SERVER_URL =
  "https://product-feedback-mcp-production.up.railway.app/mcp"

export const MCP_DEMO_PRODUCT = {
  name: "Acme Analytics",
  description: "A B2B analytics dashboard for revenue teams.",
  analysisGoal:
    "Identify the top customer pain points and recommend what to prioritize next.",
  feedback: `The dashboard is slow.
I need better CSV exports.
The onboarding flow is confusing.
Notifications are overwhelming.
It is hard to find the reports I use every week.
The dashboard takes too long to load on Monday mornings.
I want scheduled reports sent to my inbox.
The setup checklist was unclear.`,
  question: "What should we prioritize next and why?",
} as const

export const MCP_DEMO_STEP_IDS = [
  "create_feedback_set",
  "add_pasted_feedback",
  "run_synthesis",
  "get_analysis_bundle",
  "ask_analysis_question",
] as const

export type McpDemoStepId = (typeof MCP_DEMO_STEP_IDS)[number]

export type McpDemoStepStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"

export interface McpDemoEvidenceItem {
  text: string
  sourceLabel?: string
  themeName?: string | null
  category?: string | null
}

export interface McpDemoDiscoveredTool {
  name: string
  description?: string
  inputSchema: Record<string, unknown>
}

export interface McpDemoStep {
  id: string
  label: string
  toolName: string
  status: McpDemoStepStatus
  summary: string
  agentDecision?: string
  inputPreview?: Record<string, unknown>
  outputPreview?: Record<string, unknown>
  output?: Record<string, unknown>
  usedNextFor?: string
  technicalNote?: string
  llmInvolved?: boolean
}

export interface McpDemoResult {
  analysisRunId: string
  executiveSummary: string
  topThemes: Record<string, unknown>[]
  recommendation: string
  evidence: McpDemoEvidenceItem[]
  synthesisMethod?: string
  chatMethod?: string
}

export interface McpDemoResponse {
  status: "completed"
  mode: "llm_agent_mcp"
  mcpServerUrl: string
  discoveredTools: McpDemoDiscoveredTool[]
  steps: McpDemoStep[]
  result: McpDemoResult
}

export interface McpDemoErrorResponse {
  status: "failed"
  error: string
  mcpServerUrl: string
}
