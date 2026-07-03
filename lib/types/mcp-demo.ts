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

export const MCP_DEMO_STEP_LABELS = [
  "create_feedback_set",
  "add_pasted_feedback",
  "run_synthesis",
  "get_analysis_bundle",
  "ask_analysis_question",
] as const

export type McpDemoStepLabel = (typeof MCP_DEMO_STEP_LABELS)[number]

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

export interface McpDemoStep {
  label: McpDemoStepLabel
  status: McpDemoStepStatus
  summary: string
  output?: Record<string, unknown>
}

export interface McpDemoResult {
  analysisRunId: string
  executiveSummary: string
  topThemes: Record<string, unknown>[]
  recommendation: string
  evidence: McpDemoEvidenceItem[]
}

export interface McpDemoResponse {
  status: "completed"
  mcpServerUrl: string
  steps: McpDemoStep[]
  result: McpDemoResult
}

export interface McpDemoErrorResponse {
  status: "failed"
  error: string
  mcpServerUrl: string
}
