---
name: action-api-output
description: >
  Build an api_output step for Gabriel Operator workflows that maps step results
  into a named structured output for Page Builder or API consumers. Use this
  when a workflow should return deliberate fields instead of a raw prior-step
  response, and follow the executor's outputFields mapping behavior for strings,
  objects, and arrays.
metadata:
  author: gabriel-operator
  version: "1.0"
---

# action-api-output

## Action overview

| Property | Value |
|----------|-------|
| `action_type` | `api_output` |
| Requires browser | No |

The `api_output` action turns prior step responses into a named structured result. In [`step-executor.ts`](/Users/vipin/work/axio-operator-marketplace/server/src/runner/execute-step/step-executor.ts), it routes to [`api-output.ts`](/Users/vipin/work/axio-operator-marketplace/server/src/runner/execute-step/api-output.ts), which resolves `outputFields`, builds the final JSON object, and returns it for downstream binding and clipboard/output use.

## Required fields

| Field | Type | Description |
|-------|------|-------------|
| `step_number` | number | Sequential step index (starts at 1) |
| `action_type` | string | Must be `"api_output"` |
| `stepId` | string | Unique step identifier (for example `step-5f7a9`) |

## Optional fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `outputName` | string | `"output"` | Name used for the structured result |
| `outputSchema` | string | Empty object schema | JSON schema string for the returned payload |
| `outputFields` | object[] | `[]` | Explicit field mappings `{ key, value, type? }` |
| `label` | string | — | Human-readable step label |
| `timestamp` | number | — | Unix timestamp in milliseconds |

## Complete JSON example

```json
{
  "step_number": 3,
  "action_type": "api_output",
  "stepId": "step-5f7a9",
  "outputName": "productResults",
  "outputSchema": "{\"type\":\"object\",\"properties\":{\"products\":{\"type\":\"array\"},\"source\":{\"type\":\"string\"}}}",
  "outputFields": [
    {
      "key": "products",
      "value": "{{step-4a7c2.response}}",
      "type": "array"
    },
    {
      "key": "source",
      "value": "aboutyou.nl",
      "type": "string"
    }
  ],
  "label": "Return structured product results",
  "timestamp": 1710000003000
}
```

## Field details

### `outputFields`
Each entry maps one output key to a literal value or a resolved template expression:

| Sub-field | Type | Description |
|-----------|------|-------------|
| `key` | string | Output property name |
| `value` | string | Literal text or `{{stepId.variable}}` template |
| `type` | string | Optional hint such as `string`, `number`, `object`, or `array` |

The executor resolves variables through the parameter resolver. When `type` is `object` or `array`, [`api-output.ts`](/Users/vipin/work/axio-operator-marketplace/server/src/runner/execute-step/api-output.ts) attempts to parse JSON, including JSON wrapped in markdown code fences.

### `outputSchema`
This is stored alongside the output as schema metadata. If omitted, the executor falls back to a minimal object schema. It is useful for consumers like Page Builder, but it does not itself generate fields; `outputFields` controls the actual output mapping.

### Missing `outputFields`
If `outputFields` is unexpectedly missing at runtime, the executor performs a best-effort DB reload of the canonical step config using `actionId`. That is a recovery path, not the primary contract, so define `outputFields` explicitly in the workflow JSON.

## Common patterns

### 1. Return a cleaned object from an LLM or goal step
```json
{
  "step_number": 4,
  "action_type": "api_output",
  "stepId": "step-7bc31",
  "outputName": "summary",
  "outputFields": [
    { "key": "result", "value": "{{step-123ab.response}}", "type": "object" }
  ]
}
```

### 2. Compose a mixed payload from multiple earlier steps
```json
{
  "step_number": 5,
  "action_type": "api_output",
  "stepId": "step-8cd42",
  "outputName": "report",
  "outputFields": [
    { "key": "title", "value": "{{step-111aa.response}}", "type": "string" },
    { "key": "rows", "value": "{{step-222bb.records}}", "type": "array" }
  ]
}
```

## Gotchas and edge cases

- `outputSchema` is metadata, not a validator for `outputFields`. Bad mappings still produce bad output.
- If a field is marked as `object` or `array` but the resolved value is not valid JSON, the executor keeps the original string instead of crashing.
- Template references that do not resolve stay literal, so `{{step-xxxx.response}}` can leak into the final output if the upstream variable was never created.
- This step is most useful after `goal`, `llm`, `manual_extract`, `rest_api`, `llm_rest_api`, or datasource steps that already persist structured variables.
