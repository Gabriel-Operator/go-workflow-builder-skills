---
name: action-data-source-read
description: >
  Build a data_source_read step for Gabriel Operator workflows that reads from
  databases, search indexes, HTTP or GraphQL connectors, office providers, and
  Gemini knowledge bases. Use this when a workflow needs structured data without
  browser automation, and align the config with the connector-backed execution in
  the datasource read runtime.
metadata:
  author: gabriel-operator
  version: "1.0"
---

# action-data-source-read

## Action overview

| Property | Value |
|----------|-------|
| `action_type` | `data_source_read` |
| Requires browser | No |

The `data_source_read` action reads data through a configured platform connector instead of through the browser. In [`step-executor.ts`](/Users/vipin/work/axio-operator-marketplace/server/src/runner/execute-step/step-executor.ts), this routes to [`data-source-read.ts`](/Users/vipin/work/axio-operator-marketplace/server/src/runner/execute-step/data-source-read.ts), which resolves the connector, executes the read client, and persists a structured response for downstream steps.

## Required fields

| Field | Type | Description |
|-------|------|-------------|
| `step_number` | number | Sequential step index (starts at 1) |
| `action_type` | string | Must be `"data_source_read"` |
| `stepId` | string | Unique step identifier (for example `step-2d4e6`) |
| `dataSourceReadConfig.connectorId` | string | Connector ID to execute against |
| `dataSourceReadConfig.kind` | string | Datasource type hint such as `postgres` or `office` |
| `dataSourceReadConfig.operation` | string | Read operation such as `query`, `find`, `get`, `search`, or `read` |

## Optional fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `dataSourceReadConfig.provider` | string | Connector default | Provider for office connectors, for example `google` or `microsoft` |
| `dataSourceReadConfig.app` | string | Connector default | App name such as `sheets`, `docs`, `excel`, or `powerpoint` |
| `dataSourceReadConfig.query` | string | — | SQL or datasource-specific query text |
| `dataSourceReadConfig.collection` | string | — | Collection or table-like resource name |
| `dataSourceReadConfig.key` | string | — | Key for key-value stores like Redis |
| `dataSourceReadConfig.index` | string | — | Index name for search backends |
| `dataSourceReadConfig.fileId` | string | — | File identifier for office or document reads |
| `dataSourceReadConfig.fileUrl` | string | — | File URL for office or document reads |
| `dataSourceReadConfig.range` | string | — | Spreadsheet range such as `Sheet1!A1:D10` |
| `dataSourceReadConfig.sheetName` | string | — | Sheet/tab name |
| `dataSourceReadConfig.slideSelector` | string | — | Slide selector for slide-based providers |
| `dataSourceReadConfig.body` | string | — | Request payload for HTTP or GraphQL style reads |
| `dataSourceReadConfig.variables` | string | — | Serialized variables for parameterized reads |
| `dataSourceReadConfig.headers` | object[] | `[]` | Header entries `{ key, value, enabled }` |
| `dataSourceReadConfig.scope` | string | Connector default | Knowledge-base scope such as `agent` or `global_user` |
| `dataSourceReadConfig.knowledgeBaseFileIds` | string[] | — | Explicit KB file IDs for Gemini KB reads |
| `dataSourceReadConfig.geminiProviderId` | string | Connector default | Gemini provider override |
| `label` | string | — | Human-readable step label |
| `timestamp` | number | — | Unix timestamp in milliseconds |

## Complete JSON example

```json
{
  "step_number": 1,
  "action_type": "data_source_read",
  "stepId": "step-2d4e6",
  "dataSourceReadConfig": {
    "connectorId": "conn-postgres-analytics",
    "kind": "postgres",
    "operation": "query",
    "query": "SELECT id, email, total_spend FROM customers WHERE country = $1 ORDER BY total_spend DESC LIMIT 25",
    "variables": "{\"$1\":\"NL\"}"
  },
  "label": "Read top NL customers",
  "timestamp": 1710000001000
}
```

## Field details

### Connector-backed execution
The executor requires `connectorId` and `operation`, then resolves the connector and may refine `kind` from connector metadata in [`data-source-read.ts`](/Users/vipin/work/axio-operator-marketplace/server/src/runner/execute-step/data-source-read.ts). Keep `kind` accurate so the step remains understandable and matches the intended client.

### Template resolution
`dataSourceReadConfig` string fields are resolved by the parameter resolver before execution. That means fields like `query`, `body`, `headers`, `fileId`, and `knowledgeBaseFileIds` can safely use `{{stepId.variable}}` templates.

### Exported variables
By default, successful reads persist the variables defined in [`step-variables.ts`](/Users/vipin/work/axio-operator-marketplace/server/src/runner/execute-step/step-variables.ts): `response`, `data`, `records`, `count`, `connectorId`, `connectorKind`, `operation`, `provider`, and `resourceType`.

## Common patterns

### 1. Query a relational database, then summarize with an LLM
```json
{
  "step_number": 2,
  "action_type": "data_source_read",
  "stepId": "step-7ab31",
  "dataSourceReadConfig": {
    "connectorId": "conn-sales-db",
    "kind": "postgres",
    "operation": "query",
    "query": "SELECT * FROM orders WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'"
  }
}
```

### 2. Read from a Gemini knowledge base
```json
{
  "step_number": 3,
  "action_type": "data_source_read",
  "stepId": "step-8bc42",
  "dataSourceReadConfig": {
    "connectorId": "conn-gemini-kb",
    "kind": "gemini_kb",
    "operation": "search",
    "scope": "agent",
    "knowledgeBaseFileIds": ["kb-file-1", "kb-file-2"]
  }
}
```

## Gotchas and edge cases

- `connectorId` is mandatory at runtime. The executor throws immediately when it is missing.
- `operation` must match the connector kind. A SQL-style `query` on a non-SQL connector will fail in the datasource client layer.
- Large results are persisted as JSON response payloads; be careful when chaining huge reads into prompts or output mappers.
- `variables` is stored as a string in the step interface, so if you want structured parameter input, serialize it consistently.
