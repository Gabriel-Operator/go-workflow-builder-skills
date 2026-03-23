---
name: action-manual-extract
description: >
  Define a manual_extract step that uses an LLM to extract structured data from the
  current browser page. The LLM analyzes the page DOM and/or screenshot and returns
  structured key-value data. Results are persisted as step variables accessible by
  downstream steps via template syntax.
metadata:
  author: gabriel-operator
  version: "1.0"
---

# Manual Extract

## Action type

- **action_type**: `manual_extract`
- **Requires browser**: Yes

## What it does

The manual extract step sends the current page state to an LLM and asks it to pull out structured data — prices, names, tables, status values, or any information visible on the page. The extracted result is persisted as step variables that downstream steps can reference via `{{stepId.variable}}` template syntax. This is ideal when you need to scrape data from pages with unpredictable layouts.

## Required fields

| Field | Type | Description |
|-------|------|-------------|
| `step_number` | number | Sequential step position (starts at 1) |
| `action_type` | string | Must be `"manual_extract"` |
| `stepId` | string | Unique ID, format `step-XXXXX` (hex) |
| `timestamp` | number | Unix timestamp in milliseconds |

## Optional fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `userPrompt` | string | — | Instruction describing what data to extract |
| `llmModel` | string | — | Override default LLM model identifier |
| `systemPrompt` | string | — | System-level prompt to guide extraction behavior |
| `label` | string | — | Human-readable label for this step in the UI |

## Complete JSON example

```json
{
  "step_number": 2,
  "action_type": "manual_extract",
  "stepId": "step-d4e2a",
  "timestamp": 1710000000000,
  "userPrompt": "Extract the product name, price, and availability status from this page. Return as JSON with keys: productName, price, availability.",
  "llmModel": "gpt-4o",
  "systemPrompt": "You are a data extraction assistant. Return only valid JSON.",
  "label": "Extract product details"
}
```

## Field details

- **userPrompt**: Describes exactly what data to extract and the desired output shape. The more specific you are about field names and structure, the more reliable the output. Ask for JSON format explicitly if needed.
- **label**: A display-only label shown in the workflow editor UI. Does not affect execution.
- **llmModel**: When omitted, the platform default model is used. Specify to override (e.g., `"gpt-4o"`, `"claude-sonnet-4-20250514"`).

## Common patterns

### Scrape-then-store
Navigate to a page, extract data, then write to a database:
```json
[
  { "step_number": 1, "action_type": "navigate", "stepId": "step-00001", "timestamp": 1710000000000, "url": "https://example.com/product/123" },
  { "step_number": 2, "action_type": "manual_extract", "stepId": "step-d4e2a", "timestamp": 1710000000001, "userPrompt": "Extract productName, price, and rating." },
  { "step_number": 3, "action_type": "data_source_write", "stepId": "step-00003", "timestamp": 1710000000002, "dataSourceWriteConfig": { "connectorId": "conn-xyz", "kind": "postgres", "operation": "insert", "query": "INSERT INTO products (name, price, rating) VALUES ('{{step-d4e2a.productName}}', '{{step-d4e2a.price}}', '{{step-d4e2a.rating}}')", "mode": "execute" } }
]
```

## Gotchas

- The LLM extracts data from what is currently visible. If content is behind tabs, accordions, or infinite scroll, you must interact with those elements first via click/scroll steps.
- The variable names in the persisted result depend on what the LLM returns. If your downstream steps reference `{{stepId.price}}`, make sure your `userPrompt` explicitly asks the LLM to use `price` as the key name.
- Large pages with heavy DOM may be truncated before being sent to the LLM. For very long pages, scroll to the relevant section first and use `screenshot` or `image_response` to reduce noise.
