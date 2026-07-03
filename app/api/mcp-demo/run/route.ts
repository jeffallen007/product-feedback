import { NextResponse } from "next/server"

import {
  getMcpServerUrl,
  runMcpDemoWorkflow,
} from "@/lib/services/mcp-demo-client"
import type { McpDemoErrorResponse } from "@/lib/types/mcp-demo"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST() {
  try {
    const result = await runMcpDemoWorkflow()
    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    const payload: McpDemoErrorResponse = {
      status: "failed",
      error:
        error instanceof Error
          ? error.message
          : "The MCP demo workflow failed.",
      mcpServerUrl: getMcpServerUrl(),
    }

    return NextResponse.json(payload, { status: 500 })
  }
}
