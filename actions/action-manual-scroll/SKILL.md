---
name: action-manual-scroll
description: >
  Perform a directional scroll on the page — up, down, left, or right. Use this action
  when you need simple directional scrolling without targeting a specific element or
  coordinate. Ideal for paginating through content or scrolling within focused containers.
  Requires an active browser session.
metadata:
  author: gabriel-operator
  version: "1.0"
compatibility: Requires an active browser session.
---

# Action: Manual Scroll

## Action type and browser requirement

| Property | Value |
|----------|-------|
| `action_type` | `manual_scroll` |
| Requires browser | Yes |

## What it does

Scrolls the page in a specified direction (up, down, left, or right) by a standard increment. Unlike the `scroll` action which targets elements or coordinates, `manual_scroll` simulates a user scrolling in a direction. This is useful for paginating through content, scrolling within the currently focused scrollable container, or navigating horizontally.

## Required fields

| Field | Type | Description |
|-------|------|-------------|
| `step_number` | number | Sequential step position starting from 1 |
| `action_type` | string | Must be `"manual_scroll"` |
| `stepId` | string | Unique step identifier (format: `step-XXXXX`, hex chars) |
| `timestamp` | number | Unix timestamp in milliseconds |

## Optional fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `scrollDirection` | string | `"down"` | Direction to scroll. One of: `"down"`, `"up"`, `"left"`, `"right"`. |
| `coordinates` | object | — | `{ "x": number, "y": number }` — viewport coordinates where the scroll event is dispatched. Useful for scrolling within a specific container at that position. |

## Complete JSON example

```json
{
  "step_number": 5,
  "action_type": "manual_scroll",
  "stepId": "step-3dc8a",
  "timestamp": 1710000000000,
  "scrollDirection": "down",
  "coordinates": {
    "x": 640,
    "y": 400
  }
}
```

## Field details

### `scrollDirection`
Accepts one of four string values:
- `"down"` — scroll the page downward (default)
- `"up"` — scroll the page upward
- `"left"` — scroll the page to the left
- `"right"` — scroll the page to the right

### `coordinates`
When provided, the scroll event is dispatched at these viewport coordinates. This allows you to scroll a specific scrollable container (e.g., a sidebar, modal, or embedded panel) by targeting a point inside it. If omitted, the scroll applies to the main page viewport.

## Common patterns

### Scroll through a feed or list
```json
[
  {
    "step_number": 1,
    "action_type": "manual_scroll",
    "stepId": "step-a1b2c",
    "timestamp": 1710000000000,
    "scrollDirection": "down"
  },
  {
    "step_number": 2,
    "action_type": "screenshot",
    "stepId": "step-d3e4f",
    "timestamp": 1710000001000
  }
]
```

### Scroll inside a specific container (e.g., a chat panel)
```json
{
  "step_number": 3,
  "action_type": "manual_scroll",
  "stepId": "step-g5h6i",
  "timestamp": 1710000002000,
  "scrollDirection": "up",
  "coordinates": {
    "x": 300,
    "y": 500
  }
}
```

## Gotchas and edge cases

- **Scroll increment is fixed**: The runtime uses a standard scroll increment per direction. If you need to scroll a large distance, chain multiple `manual_scroll` steps or use the `scroll` action with explicit pixel offsets.
- **Container targeting via coordinates**: To scroll within a nested scrollable element (e.g., a sidebar), provide `coordinates` that land inside that container. Without coordinates, the scroll applies to whatever element is currently focused or the main viewport.
- **Horizontal scroll**: `"left"` and `"right"` only work if the page or container has horizontal overflow. On pages with no horizontal scrollbar, these directions have no effect.
- **Infinite scroll pages**: Pair `manual_scroll` with a `wait` step to allow lazy-loaded content to render before interacting with it.
