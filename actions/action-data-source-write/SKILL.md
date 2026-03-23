---
name: action-data-source-write
description: >
  Define a data_source_write step that writes data to databases and datasources with
  safety guardrails. Supports postgres, mysql, mongodb, redis, elasticsearch, Google
  Sheets, HTTP endpoints, GraphQL, and more. Includes dry_run mode to preview changes
  before executing.
metadata:
  author: gabriel-operator
  version: "1.0"
---

# Data Source Write

## Action type

- **action_type**: `data_source_write`
- **Requires browser**: No

## What it does

The data source write step writes data to external databases and datasources. It supports a wide range of backends including relational databases, NoSQL stores, search engines, spreadsheets, and HTTP endpoints. Safety guardrails like `dry_run` mode, `maxAffectedRows`, and `allowDelete` flags help prevent accidental data loss.

## Required fields

| Field | Type | Description |
|-------|------|-------------|
| `step_number` | number | Sequential step position (starts at 1) |
| `action_type` | string | Must be `"data_source_write"` |
| `stepId` | string | Unique ID, format `step-XXXXX` (hex) |
| `timestamp` | number | Unix timestamp in milliseconds |

## Optional fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `dataSourceWriteConfig` | object | — | Write configuration (see below) |
| `dataSourceWriteConfig.connectorId` | string | — | Platform connector ID for the datasource |
| `dataSourceWriteConfig.kind` | string | — | Datasource type: `postgres`, `mysql`, `mongodb`, `redis`, `elasticsearch`, `gemini_kb`, `http`, `graphql`, `office` |
| `dataSourceWriteConfig.operation` | string | — | Operation type (e.g., `insert`, `update`, `delete`, `upsert`, `set`, `put`) |
| `dataSourceWriteConfig.provider` | string | — | Provider name (used with `office` kind) |
| `dataSourceWriteConfig.app` | string | — | Application name (used with `office` kind) |
| `dataSourceWriteConfig.query` | string | — | SQL query or equivalent for the datasource |
| `dataSourceWriteConfig.collection` | string | — | Collection/table name (MongoDB, etc.) |
| `dataSourceWriteConfig.key` | string | — | Key name (Redis) |
| `dataSourceWriteConfig.index` | string | — | Index name (Elasticsearch) |
| `dataSourceWriteConfig.fileId` | string | — | File ID (Google Sheets, Office) |
| `dataSourceWriteConfig.fileUrl` | string | — | File URL (Google Sheets, Office) |
| `dataSourceWriteConfig.range` | string | — | Cell range (Google Sheets, e.g., `"Sheet1!A1:C10"`) |
| `dataSourceWriteConfig.sheetName` | string | — | Sheet name (Google Sheets) |
| `dataSourceWriteConfig.slideSelector` | string | — | Slide selector (Google Slides) |
| `dataSourceWriteConfig.body` | string \| object | — | Request body / document to write |
| `dataSourceWriteConfig.values` | array | — | Array of values to write (Sheets) |
| `dataSourceWriteConfig.headers` | array | — | Array of `{key, value, enabled}` objects for HTTP headers |
| `dataSourceWriteConfig.variables` | object | — | Variables for parameterized queries |
| `dataSourceWriteConfig.mode` | string | `"dry_run"` | Execution mode: `"dry_run"` (preview) or `"execute"` (apply) |
| `dataSourceWriteConfig.maxAffectedRows` | number | — | Maximum rows allowed to be affected |
| `dataSourceWriteConfig.maxOperations` | number | — | Maximum operations allowed |
| `dataSourceWriteConfig.allowDelete` | boolean | false | Whether DELETE operations are permitted |
| `dataSourceWriteConfig.allowRawWrite` | boolean | false | Whether raw/unparameterized writes are permitted |

## Complete JSON example

```json
{
  "step_number": 3,
  "action_type": "data_source_write",
  "stepId": "step-w9d3f",
  "timestamp": 1710000000000,
  "dataSourceWriteConfig": {
    "connectorId": "conn-pg-prod",
    "kind": "postgres",
    "operation": "insert",
    "query": "INSERT INTO orders (customer_id, product, amount) VALUES ($1, $2, $3)",
    "variables": {
      "$1": "{{step-00001.customerId}}",
      "$2": "{{step-00002.productName}}",
      "$3": "{{step-00002.price}}"
    },
    "mode": "execute",
    "maxAffectedRows": 1,
    "allowDelete": false,
    "allowRawWrite": false
  }
}
```

## Field details

- **mode**: `"dry_run"` validates the query and returns a preview of what would be changed without applying it. Always start with `dry_run` during development. Switch to `"execute"` for production runs.
- **maxAffectedRows**: A safety limit. If the operation would affect more rows than this number, it is rejected. Prevents accidental mass updates or deletes.
- **allowDelete**: Must be explicitly set to `true` to permit DELETE operations. This is a safety guardrail to prevent accidental data deletion.
- **allowRawWrite**: When `false`, the platform requires parameterized queries. Set to `true` only if you need to send raw SQL or unparameterized writes (less safe).
- **connectorId**: References a pre-configured datasource connector in the platform. The connector stores connection strings, credentials, and access permissions.
- **kind**: Determines which driver and query syntax the backend uses. Must match the actual datasource type of the connector.

## Common patterns

### Safe write with dry_run preview
Run the same step twice — first as dry_run, then as execute:
```json
[
  { "step_number": 1, "action_type": "data_source_write", "stepId": "step-w9d3f", "timestamp": 1710000000000, "dataSourceWriteConfig": { "connectorId": "conn-pg-prod", "kind": "postgres", "query": "UPDATE users SET status = 'active' WHERE signup_date > '2024-01-01'", "mode": "dry_run", "maxAffectedRows": 100 } },
  { "step_number": 2, "action_type": "data_source_write", "stepId": "step-w9d4g", "timestamp": 1710000000001, "dataSourceWriteConfig": { "connectorId": "conn-pg-prod", "kind": "postgres", "query": "UPDATE users SET status = 'active' WHERE signup_date > '2024-01-01'", "mode": "execute", "maxAffectedRows": 100 } }
]
```

### Write to Google Sheets
```json
{
  "dataSourceWriteConfig": {
    "connectorId": "conn-gsheets",
    "kind": "office",
    "provider": "google",
    "app": "sheets",
    "fileId": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms",
    "sheetName": "Sheet1",
    "range": "A1:C1",
    "values": [["{{step-00001.name}}", "{{step-00001.email}}", "{{step-00001.status}}"]]
  }
}
```

## Gotchas

- The default mode is `dry_run`. If your workflow seems to run successfully but data is not being written, check that you set `mode: "execute"`.
- `maxAffectedRows` is enforced at the database level when possible. For datasources that do not support row-count limits natively, the platform may execute and then roll back if the limit is exceeded.
- Template variables in `query` are string-interpolated before execution. Use parameterized queries (`$1`, `$2`) with `variables` to prevent SQL injection.
- The `kind` field must match the connector's actual datasource type. Mismatches (e.g., sending SQL to a MongoDB connector) will produce confusing errors.
