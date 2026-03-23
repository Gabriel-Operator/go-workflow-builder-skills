---
name: action-hover
description: >
  Hover over an element on the page without clicking it. Use this action to trigger
  dropdowns, tooltips, menus, or any UI that appears on mouse-over. Targets elements
  via CSS selectors or page coordinates. Requires an active browser session.
metadata:
  author: gabriel-operator
  version: "1.0"
compatibility: Requires an active browser session.
---

# Action: Hover

## Action type and browser requirement

| Property | Value |
|----------|-------|
| `action_type` | `hover` |
| Requires browser | Yes |

## What it does

Moves the mouse pointer over a target element on the page without clicking. This is useful for triggering hover-dependent UI such as dropdown menus, tooltips, popovers, and preview cards. The hover persists until the next action moves the pointer elsewhere.

## Required fields

| Field | Type | Description |
|-------|------|-------------|
| `step_number` | number | Sequential step position starting from 1 |
| `action_type` | string | Must be `"hover"` |
| `stepId` | string | Unique step identifier (format: `step-XXXXX`, hex chars) |
| `timestamp` | number | Unix timestamp in milliseconds |

## Optional fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `selectors` | string[] | `[]` | CSS selectors to locate the target element. Tried in order until one matches. |
| `coordinates` | object | — | `{ "x": number, "y": number }` — page coordinates to hover over if no selector matches or none provided. |

## Complete JSON example

```json
{
  "step_number": 3,
  "action_type": "hover",
  "stepId": "step-a3f1b",
  "timestamp": 1710000000000,
  "selectors": [
    "#main-nav > .dropdown-toggle",
    "button[aria-haspopup='true']"
  ],
  "coordinates": {
    "x": 450,
    "y": 120
  }
}
```

## Field details

### `selectors`
An ordered list of CSS selectors. The runtime tries each selector in sequence and hovers over the first element that matches. If none match and `coordinates` is provided, falls back to coordinate-based hover.

### `coordinates`
Absolute page coordinates (pixels from top-left of the viewport). Used as a fallback when selectors are absent or fail to match. Can also be used as the primary targeting method by omitting `selectors`.

## Common patterns

### Trigger a dropdown menu then click an item
```json
[
  {
    "step_number": 1,
    "action_type": "hover",
    "stepId": "step-b12cd",
    "timestamp": 1710000000000,
    "selectors": [".nav-item.has-dropdown"]
  },
  {
    "step_number": 2,
    "action_type": "click",
    "stepId": "step-c23de",
    "timestamp": 1710000001000,
    "selectors": [".dropdown-menu a[href='/settings']"]
  }
]
```

### Hover to reveal a tooltip and take a screenshot
```json
[
  {
    "step_number": 1,
    "action_type": "hover",
    "stepId": "step-d34ef",
    "timestamp": 1710000000000,
    "selectors": ["[data-tooltip='Help']"]
  },
  {
    "step_number": 2,
    "action_type": "screenshot",
    "stepId": "step-e45fa",
    "timestamp": 1710000001000
  }
]
```

## Gotchas and edge cases

- **Hover-only menus may close instantly**: Some menus require the pointer to remain within a specific region. If the next action moves the pointer away (e.g., a `click` outside the menu), the menu may close before the click lands. Add a short `wait` step if needed.
- **Coordinates are viewport-relative**: If the page has been scrolled, coordinates refer to the current viewport position, not the full document. Scroll to the right position first if targeting off-screen elements.
- **No visible effect on touch-only pages**: Some responsive sites disable hover effects on mobile viewports. Ensure the browser viewport is set to a desktop size if hover effects are required.
