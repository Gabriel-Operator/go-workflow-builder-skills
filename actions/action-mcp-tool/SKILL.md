---
name: action-mcp-tool
description: >
  Define an mcp_tool step that calls external Model Context Protocol (MCP) servers.
  MCP provides a standardized interface for AI tools and data sources. Use this step
  to invoke any MCP-compatible tool by specifying the server URL and optional
  authentication. Results are persisted as step variables.
metadata:
  author: gabriel-operator
  version: "1.0"
---

# MCP Tool

## Action type

- **action_type**: `mcp_tool`
- **Requires browser**: No

## What it does

The MCP tool step calls an external Model Context Protocol (MCP) server to invoke a tool. MCP is a standardized protocol for connecting AI models to external tools and data sources. This step lets workflows tap into any MCP-compatible service — databases, file systems, APIs, or custom tools — using a consistent interface. The response is persisted as step variables for downstream use.

## Required fields

| Field | Type | Description |
|-------|------|-------------|
| `step_number` | number | Sequential step position (starts at 1) |
| `action_type` | string | Must be `"mcp_tool"` |
| `stepId` | string | Unique ID, format `step-XXXXX` (hex) |
| `timestamp` | number | Unix timestamp in milliseconds |

## Optional fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `mcpServerId` | string | — | ID of a pre-configured MCP server on the platform |
| `mcpServerUrl` | string | — | Direct URL of the MCP server endpoint |
| `mcpApiKey` | string | — | API key for authenticating with the MCP server |
| `userPrompt` | string | — | Instruction describing what tool to call and with what arguments |

## Complete JSON example

```json
{
  "step_number": 2,
  "action_type": "mcp_tool",
  "stepId": "step-m4c7a",
  "timestamp": 1710000000000,
  "mcpServerId": "mcp-server-abc123",
  "userPrompt": "Search the knowledge base for documents related to '{{step-00001.query}}' and return the top 3 results."
}
```

## Field details

- **mcpServerId**: References a pre-configured MCP server in the platform. When set, you do not need to provide `mcpServerUrl` or `mcpApiKey` — the platform resolves these from the server configuration.
- **mcpServerUrl**: Direct URL to an MCP server. Use this when calling an MCP server not pre-configured in the platform. Takes precedence over `mcpServerId` if both are set.
- **mcpApiKey**: Authentication key for the MCP server. Required when using `mcpServerUrl` with a server that requires authentication.
- **userPrompt**: Describes the tool invocation in natural language. The platform's LLM layer interprets this to select the appropriate MCP tool and construct the arguments.

## Common patterns

### Call a pre-configured MCP server
```json
[
  { "step_number": 1, "action_type": "rest_api", "stepId": "step-00001", "timestamp": 1710000000000 },
  { "step_number": 2, "action_type": "mcp_tool", "stepId": "step-m4c7a", "timestamp": 1710000000001, "mcpServerId": "mcp-server-abc123", "userPrompt": "Use the file_search tool to find files matching '*.csv' in the project directory." }
]
```

### Call a custom MCP server URL
```json
{
  "step_number": 1,
  "action_type": "mcp_tool",
  "stepId": "step-m4c7b",
  "timestamp": 1710000000000,
  "mcpServerUrl": "https://mcp.example.com/v1",
  "mcpApiKey": "key-abc123",
  "userPrompt": "Query the database for all orders placed in the last 24 hours."
}
```

## Gotchas

- The `userPrompt` is interpreted by an LLM to decide which MCP tool to invoke and what arguments to pass. Vague prompts may lead to incorrect tool selection. Be specific about the tool name and parameters when possible.
- MCP servers must be reachable from the platform's execution environment. Private or localhost MCP servers will not work unless properly tunneled or exposed.
- If both `mcpServerId` and `mcpServerUrl` are provided, behavior may be unpredictable. Use one or the other.
