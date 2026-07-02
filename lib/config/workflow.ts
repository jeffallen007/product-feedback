import { ClipboardList, Search, Upload } from "lucide-react"
import type { SourceDefinition } from "@/lib/types/workflow"

export const SOURCE_DEFINITIONS: SourceDefinition[] = [
  {
    id: "csv",
    title: "Upload CSV",
    description:
      "Upload customer reviews, support tickets, survey responses, or product feedback.",
    icon: Upload,
    sourceType: "csv_upload",
  },
  {
    id: "paste",
    title: "Paste Feedback",
    description:
      "Paste reviews, comments, interview notes, or survey responses.",
    icon: ClipboardList,
    sourceType: "pasted_text",
  },
  {
    id: "search",
    title: "Search X",
    description:
      "Pull recent public posts mentioning a product, company, handle, or keyword.",
    icon: Search,
    sourceType: "x_search",
    isAvailable: false,
    availabilityLabel: "Future Feature",
  },
]

export const SEARCH_CHIPS = [
  "@asana",
  "Peloton app",
  "Zoho CRM support",
  "Monday.com dashboard",
  "Strava subscription",
] as const

export const CAPABILITIES = [
  "Top pain points",
  "Feature requests",
  "Sentiment overview",
  "Roadmap priorities",
  "Churn / retention risks",
  "Representative quotes",
  "Follow-up chatbot analysis",
] as const

export const ARCHITECTURE_STEPS = [
  "Input Sources",
  "MCP Tools",
  "ML Classification",
  "LLM Synthesis",
  "Dashboard",
  "Chat Follow-up",
] as const
