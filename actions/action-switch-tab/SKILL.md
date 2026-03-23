---
name: action-switch-tab
description: >
  Switch to a different browser tab by its zero-based index. Use this action when a
  workflow involves multiple tabs — for example, after a link opens in a new tab, or
  when switching between an application and a reference page. Requires an active browser
  session with multiple open tabs.
metadata:
  author: gabriel-operator
  version: "1.0"
compatibility: Requires an active browser session.
---

# Action: Switch Tab

## Action type and browser requirement

| Property | Value |
|----------|-------|
| `action_type` | `switch_tab` |
| Requires browser | Yes |

## What it does

Switches the browser's active context to a different tab identified by its zero-based index. After switching, all subsequent browser actions (click, fill, screenshot, etc.) execute in the context of the newly active tab. Use this when your workflow opens or interacts with multiple browser tabs.

## Required fields

| Field | Type | Description |
|-------|------|-------------|
| `step_number` | number | Sequential step position starting from 1 |
| `action_type` | string | Must be `"switch_tab"` |
| `stepId` | string | Unique step identifier (format: `step-XXXXX`, hex chars) |
| `timestamp` | number | Unix timestamp in milliseconds |

## Optional fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `data` | object | — | `{ "tabIndex": number }` — zero-based index of the tab to switch to. `0` is the first (leftmost) tab. |

## Complete JSON example

```json
{
  "step_number": 4,
  "action_type": "switch_tab",
  "stepId": "step-5fa9d",
  "timestamp": 1710000000000,
  "data": {
    "tabIndex": 1
  }
}
```

## Field details

### `data.tabIndex`
A zero-based integer representing the tab to switch to:
- `0` — the first (original) tab
- `1` — the second tab (typically opened by a `target="_blank"` link or `window.open()`)
- `2` — the third tab, and so on

Tabs are indexed in the order they were opened. The index does not change when you switch between tabs.

## Common patterns

### Click a link that opens in a new tab, then switch to it
```json
[
  {
    "step_number": 1,
    "action_type": "click",
    "stepId": "step-a1b2c",
    "timestamp": 1710000000000,
    "selectors": ["a[target='_blank']"]
  },
  {
    "step_number": 2,
    "action_type": "switch_tab",
    "stepId": "step-d3e4f",
    "timestamp": 1710000001000,
    "data": {
      "tabIndex": 1
    }
  },
  {
    "step_number": 3,
    "action_type": "screenshot",
    "stepId": "step-g5h6i",
    "timestamp": 1710000002000
  }
]
```

### Work in a new tab then switch back to the original
```json
[
  {
    "step_number": 3,
    "action_type": "switch_tab",
    "stepId": "step-j7k8l",
    "timestamp": 1710000002000,
    "data": {
      "tabIndex": 1
    }
  },
  {
    "step_number": 4,
    "action_type": "fill",
    "stepId": "step-m9n0o",
    "timestamp": 1710000003000,
    "selectors": ["input#reference-id"],
    "value": "REF-12345"
  },
  {
    "step_number": 5,
    "action_type": "switch_tab",
    "stepId": "step-p1q2r",
    "timestamp": 1710000004000,
    "data": {
      "tabIndex": 0
    }
  }
]
```

## Gotchas and edge cases

- **Tab must exist**: If you specify a `tabIndex` that doesn't exist (e.g., `tabIndex: 2` when only two tabs are open), the step will fail. Ensure the target tab has been opened before switching to it.
- **New tab timing**: After clicking a link that opens a new tab, the new tab may take a moment to load. Add a `wait` step after `switch_tab` if the next action depends on the new tab's content being fully loaded.
- **Tab order is creation order**: Tabs are indexed by the order they were created, not their visual position. Closing a tab does not renumber the remaining tabs — the indices of other tabs shift down.
- **Pop-up windows**: Some sites open pop-up windows rather than tabs. These are typically treated as separate tabs by the runtime and can be switched to with `switch_tab`.
- **Single-tab workflows**: If your workflow only uses one tab, you never need this action. It's only required when multiple tabs are in play.
