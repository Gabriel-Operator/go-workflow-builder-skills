---
name: action-select
description: >
  Select an option from a dropdown or <select> element by its value. Use this action
  when you need to choose a specific option from a native HTML select input. Targets
  the select element via CSS selectors or coordinates. Requires an active browser session.
metadata:
  author: gabriel-operator
  version: "1.0"
compatibility: Requires an active browser session.
---

# Action: Select

## Action type and browser requirement

| Property | Value |
|----------|-------|
| `action_type` | `select` |
| Requires browser | Yes |

## What it does

Selects a specific option from a native HTML `<select>` dropdown element by matching the option's `value` attribute. The runtime locates the select element via CSS selectors or coordinates, then programmatically sets the selected option and dispatches change events.

## Required fields

| Field | Type | Description |
|-------|------|-------------|
| `step_number` | number | Sequential step position starting from 1 |
| `action_type` | string | Must be `"select"` |
| `stepId` | string | Unique step identifier (format: `step-XXXXX`, hex chars) |
| `timestamp` | number | Unix timestamp in milliseconds |

## Optional fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `selectors` | string[] | `[]` | CSS selectors to locate the `<select>` element. Tried in order. |
| `value` | string | `""` | The `value` attribute of the `<option>` to select. |
| `coordinates` | object | — | `{ "x": number, "y": number }` — fallback page coordinates for the select element. |

## Complete JSON example

```json
{
  "step_number": 4,
  "action_type": "select",
  "stepId": "step-7f2a1",
  "timestamp": 1710000000000,
  "selectors": [
    "select#country",
    "select[name='country']"
  ],
  "value": "US",
  "coordinates": {
    "x": 320,
    "y": 280
  }
}
```

## Field details

### `value`
Must match the `value` attribute of one of the `<option>` elements inside the target `<select>`. This is the option's programmatic value, not necessarily the visible display text. For example, `<option value="US">United States</option>` requires `"value": "US"`.

### `selectors`
An ordered list of CSS selectors pointing to the `<select>` element (not the individual `<option>`). The runtime tries each in order and uses the first match.

## Common patterns

### Fill a form with a dropdown selection
```json
[
  {
    "step_number": 1,
    "action_type": "fill",
    "stepId": "step-a11b2",
    "timestamp": 1710000000000,
    "selectors": ["input#name"],
    "value": "Jane Doe"
  },
  {
    "step_number": 2,
    "action_type": "select",
    "stepId": "step-b22c3",
    "timestamp": 1710000001000,
    "selectors": ["select#role"],
    "value": "admin"
  }
]
```

### Select with template variable from a previous step
```json
{
  "step_number": 3,
  "action_type": "select",
  "stepId": "step-c33d4",
  "timestamp": 1710000002000,
  "selectors": ["select#category"],
  "value": "{{step-a11b2.extractedCategory}}"
}
```

## Gotchas and edge cases

- **Custom dropdowns are not native selects**: Many modern UI frameworks (Material UI, Ant Design, etc.) render custom dropdown components that are not `<select>` elements. For those, use a `click` action to open the dropdown followed by another `click` on the desired option.
- **Value vs. display text**: The `value` field must match the option's `value` attribute, not its visible text. Inspect the HTML to find the correct value.
- **Change events**: The runtime dispatches `change` and `input` events after selection, but some frameworks listen for other events. If the form does not react, follow up with a `click` on the form or a `keypress` of Tab to trigger validation.
