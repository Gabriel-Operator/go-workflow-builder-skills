---
name: action-click
description: >
  Click an element on the page by CSS/XPath selector, viewport coordinates, or
  AI-powered fallback. Supports a selector fallback chain and selectorPrompts
  for AI backup when manual selectors fail. Use for buttons, links, checkboxes,
  or any clickable target.
metadata:
  author: gabriel-operator
  version: "1.0"
---

# action-click

## Action overview

| Property | Value |
|----------|-------|
| `action_type` | `click` |
| Requires browser | Yes |

Clicks an element on the current page. The runtime tries each selector in order; if all fail and `selectorPrompts` are configured, it falls back to an AI-powered click using a screenshot. Coordinates can be used as a direct alternative or final fallback.

## Required fields

| Field | Type | Description |
|-------|------|-------------|
| `step_number` | number | Sequential step index (starts at 1) |
| `action_type` | string | Must be `"click"` |
| `stepId` | string | Unique step identifier (e.g. `step-3f1a2`) |

## Optional fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `selectors` | string[] | `[]` | Ordered list of CSS or XPath selectors to try |
| `coordinates` | object | — | Viewport coordinates `{ x, y }`, relative coords, or percentages |
| `selectorPrompts` | object[] | `[]` | AI fallback chain (see field details below) |
| `label` | string | — | Human-readable step label |
| `readOnly` | boolean | `false` | Mark step as view-only |
| `timestamp` | number | — | Unix timestamp in milliseconds |

## Complete JSON example

```json
{
  "step_number": 3,
  "action_type": "click",
  "stepId": "step-3f1a2",
  "selectors": [
    "#submit-btn",
    "button[data-testid='submit']",
    "//button[contains(text(),'Submit')]"
  ],
  "selectorPrompts": [
    {
      "queryType": "prompt",
      "backupType": "task",
      "userPrompt": "Click the primary submit button at the bottom of the form",
      "systemPrompt": "You are a browser automation agent. Identify and click the described element.",
      "llmModel": "gpt-4o",
      "computerUseModel": "claude-sonnet"
    }
  ],
  "label": "Click Submit button",
  "timestamp": 1710000003000
}
```

## Field details

### `selectors`
An ordered array of CSS selectors or XPath expressions. The runtime evaluates them top-to-bottom and clicks the first one that matches a visible element. Mix CSS and XPath freely:
```json
["#login-btn", ".btn-primary", "//button[@type='submit']"]
```

### `coordinates`
Direct viewport coordinates for the click. Useful when the target has no stable selector (e.g. canvas elements):
```json
{ "x": 450, "y": 320 }
```
Coordinates can also be expressed as percentages of the viewport: `{ "x": "50%", "y": "75%" }`.

### `selectorPrompts`
An array of AI fallback configurations. Each entry is tried in order when all `selectors` fail.

| Sub-field | Type | Description |
|-----------|------|-------------|
| `queryType` | string | `"manual"` (selector-based) or `"prompt"` (AI vision) |
| `backupType` | string | `"task"` (single action) or `"goal"` (multi-step agent) |
| `userPrompt` | string | Natural-language description of what to click |
| `systemPrompt` | string | System-level instruction for the LLM |
| `llmModel` | string | Model identifier (e.g. `"gpt-4o"`, `"claude-sonnet"`) |
| `mentorId` | string | Mentor configuration ID |
| `localMentorName` | string | Local mentor name |
| `computerUseModel` | string | Model for computer-use based clicking |

## Common patterns

### 1. Simple CSS selector click
```json
{
  "step_number": 2,
  "action_type": "click",
  "stepId": "step-b0001",
  "selectors": ["#next-page-btn"]
}
```

### 2. XPath with AI fallback
```json
{
  "step_number": 4,
  "action_type": "click",
  "stepId": "step-b0002",
  "selectors": ["//a[contains(@class,'nav-link') and text()='Settings']"],
  "selectorPrompts": [
    {
      "queryType": "prompt",
      "backupType": "task",
      "userPrompt": "Click the Settings link in the navigation bar"
    }
  ]
}
```

### 3. Coordinate-based click (canvas or map)
```json
{
  "step_number": 5,
  "action_type": "click",
  "stepId": "step-b0003",
  "coordinates": { "x": 640, "y": 480 }
}
```

## Gotchas and edge cases

- **Empty `selectors` with no `selectorPrompts` or `coordinates`** will cause the step to fail immediately — at least one click target must be provided.
- **Hidden elements** are skipped during selector evaluation. If the target is behind a modal or off-screen, the selector may match in the DOM but the click will fail. Use a `scroll` or `wait` step first.
- **XPath selectors** must start with `//` or `/` to be recognized as XPath; otherwise they are treated as CSS.
- **`selectorPrompts` cost tokens** — each AI fallback takes a screenshot and calls the LLM. Place deterministic selectors first for speed and cost efficiency.
- **Dynamic pages** — if the element appears after an async load, add a `wait` step or use a guard condition before the click.
- **Multiple matches** — when a selector matches multiple elements, the runtime clicks the first visible one in DOM order, which may not be the intended target. Use more specific selectors.
