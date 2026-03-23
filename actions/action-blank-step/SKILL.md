---
name: action-blank-step
description: >
  Build a 'blank_step' step for Gabriel Operator workflows — opens browser to
  about:blank. Use as a placeholder or starting point when no specific URL is needed.
metadata:
  author: gabriel-operator
  version: "1.0"
---

# action-blank-step

## Action overview

| Property | Value |
|----------|-------|
| `action_type` | `blank_step` |
| Requires browser | Yes |

Opens the browser to `about:blank`. This is a lightweight placeholder step useful when you need a browser window ready but have no specific URL to navigate to. Commonly used as a starting point before dynamic navigation or as a no-op step in a workflow.

## Required fields

| Field | Type | Description |
|-------|------|-------------|
| `step_number` | number | Sequential step index (starts at 1) |
| `action_type` | string | Must be `"blank_step"` |
| `stepId` | string | Unique step identifier (e.g. `step-714da`) |

## Optional fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `label` | string | — | Human-readable step label |
| `timestamp` | number | — | Unix timestamp in milliseconds |
| `readOnly` | boolean | `false` | Mark step as view-only (no mutations) |
| `skipStep` | boolean | `false` | Skip this step during execution |
| `groupId` | string | — | Group membership ID |

## Complete JSON example

```json
{
  "step_number": 1,
  "action_type": "blank_step",
  "stepId": "step-a1b2c",
  "label": "Open blank browser tab",
  "timestamp": 1710000000000
}
```

## Common patterns

### 1. Placeholder before dynamic navigation
```json
{
  "step_number": 1,
  "action_type": "blank_step",
  "stepId": "step-00001",
  "label": "Initialize browser"
}
```

### 2. Mid-workflow reset
```json
{
  "step_number": 5,
  "action_type": "blank_step",
  "stepId": "step-00002",
  "label": "Clear page before next section"
}
```

## Gotchas and edge cases

- **No URL field.** Unlike `navigate`, `blank_step` does not accept a `url` — it always opens `about:blank`.
- **Browser must be initialized.** If the first step was `navigate` with `disableBrowser: true`, a later `blank_step` will fail because no browser instance exists.
- **Use as a starting point.** When building workflows interactively, start with `blank_step` and follow it with a `navigate` or `goal` step that determines the actual destination at runtime.
