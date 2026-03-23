---
name: action-keyboard-type
description: >
  Type text character-by-character via the keyboard API. Unlike the fill action which
  sets a field's value directly, keyboard_type dispatches individual key events for each
  character. Use this when the target input relies on keystroke-level events (e.g.,
  autocomplete, live search, real-time validation). Requires an active browser session.
metadata:
  author: gabriel-operator
  version: "1.0"
compatibility: Requires an active browser session.
---

# Action: Keyboard Type

## Action type and browser requirement

| Property | Value |
|----------|-------|
| `action_type` | `keyboard_type` |
| Requires browser | Yes |

## What it does

Types text into the currently focused element by dispatching individual keyboard events for each character. This is a lower-level typing method compared to `fill` (which sets the value programmatically) or `type` (which types into a targeted element). Use `keyboard_type` when the input depends on per-keystroke events, such as autocomplete dropdowns, live search suggestions, or character-by-character validation.

## Required fields

| Field | Type | Description |
|-------|------|-------------|
| `step_number` | number | Sequential step position starting from 1 |
| `action_type` | string | Must be `"keyboard_type"` |
| `stepId` | string | Unique step identifier (format: `step-XXXXX`, hex chars) |
| `timestamp` | number | Unix timestamp in milliseconds |

## Optional fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `value` | string | `""` | The text to type character by character. |

## Complete JSON example

```json
{
  "step_number": 3,
  "action_type": "keyboard_type",
  "stepId": "step-4b7e2",
  "timestamp": 1710000000000,
  "value": "San Francisco, CA"
}
```

## Field details

### `value`
The string to type. Each character is dispatched as a separate keydown/keypress/keyup event sequence with a small inter-key delay. This triggers any JavaScript listeners bound to `input`, `keydown`, `keyup`, or `keypress` events.

Template variables are supported: `"{{step-abc12.extractedName}}"`.

## Common patterns

### Trigger autocomplete by typing then selecting a suggestion
```json
[
  {
    "step_number": 1,
    "action_type": "click",
    "stepId": "step-a1b2c",
    "timestamp": 1710000000000,
    "selectors": ["input#location-search"]
  },
  {
    "step_number": 2,
    "action_type": "keyboard_type",
    "stepId": "step-d3e4f",
    "timestamp": 1710000001000,
    "value": "New York"
  },
  {
    "step_number": 3,
    "action_type": "click",
    "stepId": "step-g5h6i",
    "timestamp": 1710000002000,
    "selectors": [".autocomplete-suggestion:first-child"]
  }
]
```

### Type into a live search field
```json
[
  {
    "step_number": 1,
    "action_type": "click",
    "stepId": "step-j7k8l",
    "timestamp": 1710000000000,
    "selectors": ["[data-testid='search-input']"]
  },
  {
    "step_number": 2,
    "action_type": "keyboard_type",
    "stepId": "step-m9n0o",
    "timestamp": 1710000001000,
    "value": "quarterly report 2024"
  }
]
```

## Gotchas and edge cases

- **Focus the element first**: `keyboard_type` sends events to whatever element currently has focus. Always precede it with a `click` on the target input field to ensure correct focus.
- **Use `fill` for simple inputs**: If the input does not need keystroke-level events (e.g., a plain text field), prefer `fill` which is faster and more reliable. Use `keyboard_type` only when per-character events matter.
- **Special characters**: Special characters are typed as literal characters, not key names. To press special keys like Enter or Tab, use the `keypress` action instead.
- **Existing field content**: `keyboard_type` appends to whatever text is already in the field. To replace existing content, precede with a `keypress` of `"Control+a"` (or `"Meta+a"` on macOS) followed by `"Backspace"`, or use `fill` which clears the field first.
