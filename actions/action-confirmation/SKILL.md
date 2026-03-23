---
name: action-confirmation
description: >
  Pause workflow execution and wait for explicit user confirmation via WebSocket
  before proceeding. Use as a checkpoint before destructive or irreversible
  actions, or to let a human review the current page state. Does not interact
  with the page.
metadata:
  author: gabriel-operator
  version: "1.0"
---

# action-confirmation

## Action overview

| Property | Value |
|----------|-------|
| `action_type` | `confirmation` |
| Requires browser | Yes (but does not interact with the page) |

Pauses workflow execution and sends a confirmation request to the user via WebSocket. The workflow remains paused until the user explicitly confirms or cancels. The browser stays open and the page is visible, but no actions are taken. Use this as a safety checkpoint before destructive operations or to allow human review of intermediate results.

## Required fields

| Field | Type | Description |
|-------|------|-------------|
| `step_number` | number | Sequential step index (starts at 1) |
| `action_type` | string | Must be `"confirmation"` |
| `stepId` | string | Unique step identifier (e.g. `step-f6a7b`) |

## Optional fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `label` | string | — | Human-readable label shown in the confirmation dialog |
| `userPrompt` | string | — | Message displayed to the user explaining what they are confirming |
| `readOnly` | boolean | `false` | Mark step as view-only |
| `timestamp` | number | — | Unix timestamp in milliseconds |

## Complete JSON example

```json
{
  "step_number": 6,
  "action_type": "confirmation",
  "stepId": "step-f6a7b",
  "label": "Review before submit",
  "userPrompt": "The form is filled out. Please review the data on screen and confirm to submit, or cancel to abort.",
  "timestamp": 1710000006000
}
```

## Field details

### `userPrompt`
A human-readable message sent to the client UI via WebSocket. Should clearly explain what happens if the user confirms and what happens if they cancel. Keep it concise but informative.

### `label`
A short label displayed as the step name in the workflow UI. If omitted, the step shows as "Confirmation" by default.

## Common patterns

### 1. Pre-submit review checkpoint
```json
{
  "step_number": 5,
  "action_type": "confirmation",
  "stepId": "step-cf001",
  "userPrompt": "All fields are filled. Click confirm to submit the form."
}
```

### 2. Mid-workflow human review
```json
{
  "step_number": 3,
  "action_type": "confirmation",
  "stepId": "step-cf002",
  "label": "Verify extracted data",
  "userPrompt": "The AI has extracted the following data from the page. Please verify it is correct before we proceed to the API call."
}
```

### 3. Safety gate before deletion
```json
{
  "step_number": 8,
  "action_type": "confirmation",
  "stepId": "step-cf003",
  "label": "Confirm deletion",
  "userPrompt": "WARNING: The next step will permanently delete all selected records. Confirm to proceed or cancel to abort."
}
```

## Gotchas and edge cases

- **No timeout** — the workflow stays paused indefinitely until the user responds. There is no automatic timeout or expiry.
- **Cancel aborts the workflow** — if the user cancels, the entire workflow run stops. Downstream steps are not executed.
- **Browser stays open** — the page is visible and interactive in the live view, but the automation does not touch it. The user can manually inspect the page during the pause.
- **WebSocket required** — confirmation relies on an active WebSocket connection. If the client disconnects, the workflow remains paused and resumes when the client reconnects and confirms.
- **No data capture** — this step does not capture or return any data. It is purely a flow-control checkpoint. Use `action-manual-extract` or `action-llm` if you need to capture information during a pause.
