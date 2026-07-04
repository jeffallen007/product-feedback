import {
  Client,
  type CallToolResult,
} from "@modelcontextprotocol/client"

import {
  DEFAULT_MCP_SERVER_URL,
  type McpDemoDiscoveredTool,
} from "@/lib/types/mcp-demo"

export function getMcpServerUrl(): string {
  return process.env.MCP_SERVER_URL?.trim() || DEFAULT_MCP_SERVER_URL
}

export async function listMcpTools(
  client: Client,
): Promise<McpDemoDiscoveredTool[]> {
  const result = await client.listTools()

  return result.tools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    inputSchema: isRecord(tool.inputSchema) ? tool.inputSchema : {},
  }))
}

export async function callMcpTool<TOutput extends Record<string, unknown>>(
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
