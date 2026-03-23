---
name: action-continuous-screenshots
description: >
  Define a continuous_screenshots step that captures browser screenshots at regular
  intervals over a specified duration. Optionally runs LLM analysis on each captured
  frame. Useful for monitoring dynamic pages, tracking visual changes, or recording
  time-based page behavior.
metadata:
  author: gabriel-operator
  version: "1.0"
---

# Continuous Screenshots

## Action type

- **action_type**: `continuous_screenshots`
- **Requires browser**: Yes

## What it does

The continuous screenshots step captures the browser viewport at regular intervals for a specified duration. This is useful for monitoring pages that update dynamically (dashboards, live feeds, animations) or for creating a visual timeline of page state. When `enablePrompt` is true, each captured screenshot is analyzed by an LLM using the provided prompt.

## Required fields

| Field | Type | Description |
|-------|------|-------------|
| `step_number` | number | Sequential step position (starts at 1) |
| `action_type` | string | Must be `"continuous_screenshots"` |
| `stepId` | string | Unique ID, format `step-XXXXX` (hex) |
| `timestamp` | number | Unix timestamp in milliseconds |

## Optional fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `enablePrompt` | boolean | false | Whether to run LLM analysis on each screenshot |
| `data` | object | — | Configuration for capture timing |
| `data.interval` | number | — | Milliseconds between each screenshot capture |
| `data.duration` | number | — | Total duration in milliseconds to keep capturing |
| `userPrompt` | string | — | Prompt sent to LLM for each screenshot (used when `enablePrompt` is true) |

## Complete JSON example

```json
{
  "step_number": 2,
  "action_type": "continuous_screenshots",
  "stepId": "step-c7b3e",
  "timestamp": 1710000000000,
  "enablePrompt": true,
  "data": {
    "interval": 5000,
    "duration": 60000
  },
  "userPrompt": "Describe any changes in the stock price chart since the last screenshot."
}
```

## Field details

- **data.interval**: Time in milliseconds between consecutive screenshots. A value of `5000` means one screenshot every 5 seconds. Keep this reasonable — very low intervals (< 1000ms) may cause performance issues.
- **data.duration**: Total capture window in milliseconds. A value of `60000` means capture for 1 minute. The step blocks until the duration elapses.
- **enablePrompt**: When `true`, each screenshot is sent to the LLM with the `userPrompt` for analysis. The analysis results are persisted as step variables.

## Common patterns

### Monitor a dashboard for changes
```json
[
  { "step_number": 1, "action_type": "navigate", "stepId": "step-00001", "timestamp": 1710000000000, "url": "https://dashboard.example.com/live" },
  { "step_number": 2, "action_type": "continuous_screenshots", "stepId": "step-c7b3e", "timestamp": 1710000000001, "enablePrompt": true, "data": { "interval": 10000, "duration": 120000 }, "userPrompt": "Report any alert banners or status changes visible on the dashboard." }
]
```

## Gotchas

- This step blocks execution for the entire `duration`. Long durations will significantly increase workflow run time. Plan accordingly.
- If `enablePrompt` is true but `userPrompt` is empty, the LLM receives the screenshot without context, which may produce generic descriptions. Always pair `enablePrompt: true` with a meaningful `userPrompt`.
- Screenshots capture only the current viewport. If the relevant content is below the fold, scroll to it first.
