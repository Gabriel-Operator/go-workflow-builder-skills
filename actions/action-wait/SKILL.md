---
name: action-wait
description: >
  Build a 'wait' step for Gabriel Operator workflows — adds a delay or pause
  between steps. Use when timing is important, such as waiting for page loads,
  animations, or rate limiting between API calls.
metadata:
  author: gabriel-operator
  version: "1.0"
---

# action-wait

## Action overview

| Property | Value |
|----------|-------|
| `action_type` | `wait` |
| Requires browser | No |

Introduces a pause in workflow execution. Use this step to add deliberate delays between actions, such as waiting for page transitions, animations to complete, rate-limit cooldowns between API calls, or allowing asynchronous processes to finish.

## Required fields

| Field | Type | Description |
|-------|------|-------------|
| `step_number` | number | Sequential step index (starts at 1) |
| `action_type` | string | Must be `"wait"` |
| `stepId` | string | Unique step identifier (e.g. `step-714da`) |

## Optional fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `value` | string | `"1"` | **Duration in seconds** (parsed as a float). E.g. `"2"` waits 2 s, `"0.5"` waits 500 ms. Defaults to 1 s when omitted. |
| `label` | string | — | Human-readable step label |
| `timestamp` | number | — | Unix timestamp in milliseconds |
| `readOnly` | boolean | `false` | Mark step as view-only (no mutations) |
| `skipStep` | boolean | `false` | Skip this step during execution |
| `groupId` | string | — | Group membership ID |

## Complete JSON example

```json
{
  "step_number": 4,
  "action_type": "wait",
  "stepId": "step-d5e6f",
  "label": "Wait 2 seconds for page load",
  "timestamp": 1710000000000,
  "value": "2"
}
```

## Common patterns

### 1. Wait after page navigation
```json
{
  "step_number": 2,
  "action_type": "wait",
  "stepId": "step-00001",
  "label": "Wait for dashboard to load",
  "value": "2"
}
```

### 2. Rate-limit cooldown between API calls
```json
{
  "step_number": 5,
  "action_type": "wait",
  "stepId": "step-00002",
  "label": "Rate limit cooldown",
  "value": "3"
}
```

### 3. Short animation pause (500 ms)
```json
{
  "step_number": 3,
  "action_type": "wait",
  "stepId": "step-00003",
  "label": "Wait for modal animation",
  "value": "0.5"
}
```

## Gotchas and edge cases

- **Does not require a browser.** The `wait` step is a simple delay and works in both browser-based and API-only workflows.
- **Duration is set via `value`** as a string of seconds (e.g. `"2"` = 2 s, `"0.5"` = 500 ms). Omitting `value` defaults to 1 second.
- **Prefer `goal` for conditional waits.** If you need to wait until a specific condition is met (e.g., an element appears), use a `goal` step with an appropriate prompt instead of a fixed `wait`.
- **Use sparingly.** Excessive wait steps slow down workflows. Only add them when timing issues cause failures without them.
