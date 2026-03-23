---
name: action-scroll
description: >
  Scroll to a specific element or page coordinates. Use this action to bring off-screen
  content into view before interacting with it. Supports element-based scrolling via CSS
  selectors and pixel-offset scrolling via data coordinates. Requires an active browser session.
metadata:
  author: gabriel-operator
  version: "1.0"
compatibility: Requires an active browser session.
---

# Action: Scroll

## Action type and browser requirement

| Property | Value |
|----------|-------|
| `action_type` | `scroll` |
| Requires browser | Yes |

## What it does

Scrolls the page to bring a target element or position into view. When selectors are provided, the runtime scrolls until the matched element is visible in the viewport. When `data` coordinates are provided, the page scrolls by the specified pixel offsets. This is useful for lazy-loaded content or elements below the fold.

## Required fields

| Field | Type | Description |
|-------|------|-------------|
| `step_number` | number | Sequential step position starting from 1 |
| `action_type` | string | Must be `"scroll"` |
| `stepId` | string | Unique step identifier (format: `step-XXXXX`, hex chars) |
| `timestamp` | number | Unix timestamp in milliseconds |

## Optional fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `selectors` | string[] | `[]` | CSS selectors for the target element to scroll into view. Tried in order. |
| `data` | object | — | `{ "x": number, "y": number }` — pixel offsets to scroll. Positive `y` scrolls down, negative scrolls up. Positive `x` scrolls right, negative scrolls left. |
| `coordinates` | object | — | `{ "x": number, "y": number }` — page coordinates of the scroll target. |

## Complete JSON example

```json
{
  "step_number": 2,
  "action_type": "scroll",
  "stepId": "step-e91c4",
  "timestamp": 1710000000000,
  "selectors": [
    "#pricing-section",
    "section[data-testid='pricing']"
  ],
  "data": {
    "x": 0,
    "y": 500
  },
  "coordinates": {
    "x": 0,
    "y": 2400
  }
}
```

## Field details

### `selectors`
When provided, the runtime uses `element.scrollIntoView()` to bring the matched element into the viewport. This is the preferred approach when you know which element you need to reach.

### `data`
Pixel offsets for `window.scrollBy()`. Use this when you need relative scrolling by a specific amount rather than targeting an element. `{ "x": 0, "y": 500 }` scrolls down 500 pixels. `{ "x": 0, "y": -300 }` scrolls up 300 pixels.

### `coordinates`
Absolute page position to scroll to, using `window.scrollTo()`. Use when you know the exact document position you need to reach.

## Common patterns

### Scroll to a section then extract data
```json
[
  {
    "step_number": 1,
    "action_type": "scroll",
    "stepId": "step-f12ab",
    "timestamp": 1710000000000,
    "selectors": ["#reviews-section"]
  },
  {
    "step_number": 2,
    "action_type": "manual_extract",
    "stepId": "step-g23bc",
    "timestamp": 1710000001000
  }
]
```

### Scroll down by fixed increments for infinite scroll pages
```json
{
  "step_number": 3,
  "action_type": "scroll",
  "stepId": "step-h34cd",
  "timestamp": 1710000002000,
  "data": {
    "x": 0,
    "y": 1000
  }
}
```

## Gotchas and edge cases

- **Lazy-loaded content**: After scrolling, elements may take time to load. Add a `wait` step if the next action depends on dynamically loaded content.
- **Selector vs. data priority**: If both `selectors` and `data` are provided, the runtime typically prefers selector-based scrolling. Use `data` alone for purely offset-based scrolling.
- **Scrollable containers**: This action scrolls the main page viewport. If the target element is inside a nested scrollable container (e.g., a modal with overflow), you may need to use a `click` or `hover` on the container first, or use `manual_scroll` for directional scrolling within the focused container.
- **Smooth scroll animations**: Some sites use smooth scrolling which may delay when the element is actually in view. A brief `wait` step after scroll can help.
