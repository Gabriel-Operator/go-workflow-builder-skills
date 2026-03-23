---
name: action-take-control
description: >
  Build a 'take_control' step for Gabriel Operator workflows — pauses automation
  and hands browser control to the user for manual interaction. Use when a step
  requires human judgment, CAPTCHA solving, or manual data entry.
metadata:
  author: gabriel-operator
  version: "1.0"
---

# action-take-control

## Action overview

| Property | Value |
|----------|-------|
| `action_type` | `take_control` |
| Requires browser | Yes |

Pauses the automated workflow and transfers browser control to the user. The workflow remains suspended until the user explicitly signals completion via the UI (WebSocket confirmation). This is the go-to step for anything that cannot be reliably automated: CAPTCHAs, two-factor authentication, complex form interactions, visual verification, or sensitive actions requiring human judgment.

## Required fields

| Field | Type | Description |
|-------|------|-------------|
| `step_number` | number | Sequential step index (starts at 1) |
| `action_type` | string | Must be `"take_control"` |
| `stepId` | string | Unique step identifier (e.g. `step-714da`) |

## Optional fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `label` | string | — | Human-readable step label |
| `timestamp` | number | — | Unix timestamp in milliseconds |
| `readOnly` | boolean | `false` | Mark step as view-only (no mutations) |
| `skipStep` | boolean | `false` | Skip this step during execution |
| `userPrompt` | string | — | Instructions displayed to the user explaining what to do |
| `groupId` | string | — | Group membership ID |

## Complete JSON example

```json
{
  "step_number": 3,
  "action_type": "take_control",
  "stepId": "step-b3c4d",
  "label": "Solve CAPTCHA",
  "userPrompt": "Please solve the CAPTCHA on the page, then click Continue in the workflow panel.",
  "timestamp": 1710000000000
}
```

## Common patterns

### 1. CAPTCHA solving
```json
{
  "step_number": 3,
  "action_type": "take_control",
  "stepId": "step-00001",
  "label": "Solve CAPTCHA",
  "userPrompt": "Complete the CAPTCHA challenge, then resume the workflow."
}
```

### 2. Two-factor authentication
```json
{
  "step_number": 4,
  "action_type": "take_control",
  "stepId": "step-00002",
  "label": "Enter 2FA code",
  "userPrompt": "Enter your two-factor authentication code and click Sign In."
}
```

### 3. Complex form with human judgment
```json
{
  "step_number": 7,
  "action_type": "take_control",
  "stepId": "step-00003",
  "label": "Review and submit order",
  "userPrompt": "Review the order details carefully. Make any corrections needed, then submit the form."
}
```

## Gotchas and edge cases

- **Blocking step.** The workflow halts indefinitely until the user manually signals completion. There is no automatic timeout.
- **Browser must be initialized.** This step requires an active browser session. It will fail if the workflow was started with `disableBrowser: true`.
- **User instructions.** Always set `userPrompt` with clear instructions so the user knows exactly what action is expected. Without it, the user sees only a generic "take control" prompt.
- **Cannot be skipped at runtime.** While `skipStep` is technically supported, skipping a `take_control` step may leave the workflow in an unexpected state if subsequent steps depend on manual input.
- **Pair with `confirmation`.** For critical actions, follow `take_control` with a `confirmation` step to verify the user completed the manual task correctly.
