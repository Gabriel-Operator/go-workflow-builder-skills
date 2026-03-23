---
name: action-screenshot
description: >
  Capture a screenshot of the current browser page state. Use this action to record
  visual evidence of page content, verify UI state, or capture results for review.
  The screenshot is saved to the session and can be referenced by later steps.
  Requires an active browser session.
metadata:
  author: gabriel-operator
  version: "1.0"
compatibility: Requires an active browser session.
---

# Action: Screenshot

## Action type and browser requirement

| Property | Value |
|----------|-------|
| `action_type` | `screenshot` |
| Requires browser | Yes |

## What it does

Captures a full screenshot of the current browser viewport and saves it to the session. This is useful for recording visual state, debugging workflow execution, generating visual reports, or capturing evidence of completed actions. The screenshot is stored in the session and can be referenced in subsequent steps.

## Required fields

| Field | Type | Description |
|-------|------|-------------|
| `step_number` | number | Sequential step position starting from 1 |
| `action_type` | string | Must be `"screenshot"` |
| `stepId` | string | Unique step identifier (format: `step-XXXXX`, hex chars) |
| `timestamp` | number | Unix timestamp in milliseconds |

## Optional fields

No action-specific optional fields. Standard cross-cutting fields (guards, hooks, evals, narration) may be applied as with any step.

## Complete JSON example

```json
{
  "step_number": 6,
  "action_type": "screenshot",
  "stepId": "step-b28f4",
  "timestamp": 1710000000000
}
```

## Field details

This action has no additional fields beyond the required step fields. It captures whatever is currently visible in the browser viewport at the time the step executes.

## Common patterns

### Navigate to a page and capture the result
```json
[
  {
    "step_number": 1,
    "action_type": "navigate",
    "stepId": "step-a1b2c",
    "timestamp": 1710000000000,
    "url": "https://dashboard.example.com/analytics"
  },
  {
    "step_number": 2,
    "action_type": "wait",
    "stepId": "step-d3e4f",
    "timestamp": 1710000001000,
    "value": "2000"
  },
  {
    "step_number": 3,
    "action_type": "screenshot",
    "stepId": "step-g5h6i",
    "timestamp": 1710000002000
  }
]
```

### Capture state after form submission
```json
[
  {
    "step_number": 3,
    "action_type": "click",
    "stepId": "step-j7k8l",
    "timestamp": 1710000002000,
    "selectors": ["button[type='submit']"]
  },
  {
    "step_number": 4,
    "action_type": "wait",
    "stepId": "step-m9n0o",
    "timestamp": 1710000003000,
    "value": "1500"
  },
  {
    "step_number": 5,
    "action_type": "screenshot",
    "stepId": "step-p1q2r",
    "timestamp": 1710000004000
  }
]
```

## Gotchas and edge cases

- **Viewport only**: The screenshot captures the visible viewport, not the full scrollable page. If you need to capture content below the fold, scroll first with `scroll` or `manual_scroll`, then take the screenshot.
- **Timing**: If the page has animations, lazy-loaded images, or pending AJAX requests, add a `wait` step before the screenshot to ensure the page has fully rendered.
- **Dynamic content**: Content that changes on each load (e.g., timestamps, ads, live data) will differ between runs. This is expected and does not indicate a failure.
- **Overlays and modals**: If a modal or overlay is open, it will appear in the screenshot. Dismiss it first with `keypress` (Escape) or `click` if you want to capture the underlying page.
