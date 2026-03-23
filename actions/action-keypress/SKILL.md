---
name: action-keypress
description: >
  Press a single keyboard key such as Enter, Tab, Escape, Backspace, or any named key.
  Use this action to submit forms, dismiss modals, navigate between fields, or trigger
  keyboard shortcuts. Requires an active browser session.
metadata:
  author: gabriel-operator
  version: "1.0"
compatibility: Requires an active browser session.
---

# Action: Keypress

## Action type and browser requirement

| Property | Value |
|----------|-------|
| `action_type` | `keypress` |
| Requires browser | Yes |

## What it does

Simulates pressing a single keyboard key on the currently focused element in the browser. This dispatches the full key event sequence (keydown, keypress, keyup). Use it to press special keys like Enter, Tab, Escape, arrow keys, or modifier combinations.

## Required fields

| Field | Type | Description |
|-------|------|-------------|
| `step_number` | number | Sequential step position starting from 1 |
| `action_type` | string | Must be `"keypress"` |
| `stepId` | string | Unique step identifier (format: `step-XXXXX`, hex chars) |
| `timestamp` | number | Unix timestamp in milliseconds |

## Optional fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `value` | string | `""` | The key name to press. Uses Playwright/CDP key names (e.g., `"Enter"`, `"Tab"`, `"Escape"`, `"Backspace"`, `"ArrowDown"`, `"Space"`). |

## Complete JSON example

```json
{
  "step_number": 3,
  "action_type": "keypress",
  "stepId": "step-9ab12",
  "timestamp": 1710000000000,
  "value": "Enter"
}
```

## Field details

### `value`
The key identifier string. Common values include:

| Key | Value |
|-----|-------|
| Enter / Return | `"Enter"` |
| Tab | `"Tab"` |
| Escape | `"Escape"` |
| Backspace | `"Backspace"` |
| Delete | `"Delete"` |
| Space | `"Space"` |
| Arrow Down | `"ArrowDown"` |
| Arrow Up | `"ArrowUp"` |
| Arrow Left | `"ArrowLeft"` |
| Arrow Right | `"ArrowRight"` |
| Home | `"Home"` |
| End | `"End"` |
| Page Down | `"PageDown"` |
| Page Up | `"PageUp"` |

For modifier combinations, use `+` syntax: `"Control+a"`, `"Meta+c"`, `"Shift+Tab"`.

## Common patterns

### Fill a search field and press Enter to submit
```json
[
  {
    "step_number": 1,
    "action_type": "fill",
    "stepId": "step-c1d2e",
    "timestamp": 1710000000000,
    "selectors": ["input[name='search']"],
    "value": "Gabriel Operator"
  },
  {
    "step_number": 2,
    "action_type": "keypress",
    "stepId": "step-f3g4h",
    "timestamp": 1710000001000,
    "value": "Enter"
  }
]
```

### Dismiss a modal with Escape
```json
{
  "step_number": 4,
  "action_type": "keypress",
  "stepId": "step-i5j6k",
  "timestamp": 1710000003000,
  "value": "Escape"
}
```

## Gotchas and edge cases

- **Focus matters**: The keypress is sent to the currently focused element. If no element is focused, the event goes to the document body. Use a `click` action first to focus the correct element if needed.
- **Single key only**: This action presses one key per step. To type multiple characters, use `keyboard_type` or `type` instead.
- **Modifier keys**: Use `+` syntax for combinations (`"Control+a"`, `"Meta+v"`). The modifier is held down during the keypress and released after.
- **Platform differences**: `"Meta"` maps to Cmd on macOS and the Windows key on Windows. Use `"Control"` for Ctrl-based shortcuts that work cross-platform.
