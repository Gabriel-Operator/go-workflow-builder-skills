---
name: action-llm
description: >
  Build an llm step for Gabriel Operator workflows that uses screenshot-based
  reasoning to click, fill, or extract from a browser page when selectors are
  unstable or unknown. Use this when you want vision-guided browser actions,
  and note that saved selectors from earlier successful runs can let the runtime
  shortcut back to native click or fill behavior.
metadata:
  author: gabriel-operator
  version: "1.0"
---

# action-llm

## Action overview

| Property | Value |
|----------|-------|
| `action_type` | `llm` |
| Requires browser | Yes |

The `llm` action uses the current page screenshot plus prompt context to decide how to act. In [`step-executor.ts`](/Users/vipin/work/axio-operator-marketplace/server/src/runner/execute-step/step-executor.ts), the runtime first checks for saved `selectors`; when present, it prefers native execution (`fill` for `llmActionType: "fill"`, otherwise `click`). If no selectors are saved, it falls back to [`llm.ts`](/Users/vipin/work/axio-operator-marketplace/server/src/runner/execute-step/llm.ts) for full vision-guided execution.

## Required fields

| Field | Type | Description |
|-------|------|-------------|
| `step_number` | number | Sequential step index (starts at 1) |
| `action_type` | string | Must be `"llm"` |
| `stepId` | string | Unique step identifier (for example `step-1ab2c`) |

## Optional fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `llmActionType` | string | `"click"` | Common values are `click`, `fill`, or `extract` |
| `userPrompt` | string | Runtime-generated prompt | Natural-language instruction for the model |
| `systemPrompt` | string | Runtime-generated prompt | System guidance for the model |
| `llmModel` | string | Platform default | Model identifier |
| `selectors` | string[] | `[]` | Previously saved selectors for native replay |
| `label` | string | — | Human-readable label used in prompts and UI |
| `_llm_evals` | object[] | `[]` | Optional post-action eval definitions saved with successful selectors |
| `timestamp` | number | — | Unix timestamp in milliseconds |

## Complete JSON example

```json
{
  "step_number": 2,
  "action_type": "llm",
  "stepId": "step-4a7c2",
  "llmActionType": "extract",
  "userPrompt": "Extract the product title, price, rating, and availability from the visible page. Return valid JSON with keys productName, price, rating, availability.",
  "systemPrompt": "You are a precise browser extraction agent. Return only the requested data.",
  "llmModel": "gpt-4o",
  "label": "Extract product details",
  "timestamp": 1710000002000
}
```

## Field details

### `llmActionType`
The runtime defaults this to `"click"` when omitted. In [`step-executor.ts`](/Users/vipin/work/axio-operator-marketplace/server/src/runner/execute-step/step-executor.ts), a saved-selector step with `llmActionType: "fill"` is replayed through the native fill executor; other saved-selector cases are routed through native click behavior. Full extract behavior only happens through the vision executor path in [`llm.ts`](/Users/vipin/work/axio-operator-marketplace/server/src/runner/execute-step/llm.ts).

### `selectors`
Successful non-extract LLM runs can persist a selector back onto the step. On later runs, those selectors let the step skip the expensive vision flow and run deterministically. This makes repeated automations faster and cheaper, but stale selectors can break if the target page changes.

### Extract results and exported variables
For `llmActionType: "extract"`, the executor saves the extracted text response and persists the default `llm` step variable `response` as defined in [`step-variables.ts`](/Users/vipin/work/axio-operator-marketplace/server/src/runner/execute-step/step-variables.ts). Downstream steps can reference it with `{{stepId.response}}`.

## Common patterns

### 1. Vision-guided click when selectors are unreliable
```json
{
  "step_number": 3,
  "action_type": "llm",
  "stepId": "step-8bd31",
  "llmActionType": "click",
  "userPrompt": "Click the primary Continue button in the checkout panel"
}
```

### 2. Screenshot-based extraction for dynamic pages
```json
{
  "step_number": 4,
  "action_type": "llm",
  "stepId": "step-9ce42",
  "llmActionType": "extract",
  "userPrompt": "Extract the current order total and shipping estimate as JSON"
}
```

## Gotchas and edge cases

- Saved selectors only help when the step can be replayed natively. If the page layout changes, the runtime falls back poorly or fails before the LLM path helps.
- `llmActionType: "extract"` does not save reusable selectors the same way click and fill flows do; treat it as a response-producing step, not a selector-training step.
- If you omit `userPrompt`, the executor builds a generic prompt from `label` and `llmActionType`. That works, but specific prompts produce more stable results.
- This action always takes screenshots during the vision path, so it is costlier than deterministic `click` or `fill`.
