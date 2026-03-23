---
name: action-fill
description: >
  Clear a form field and set a new value. Targets elements by CSS/XPath selector
  or coordinates. Supports input constraints and connector overrides for dynamic
  values at runtime. Unlike the type action, fill replaces existing content
  atomically rather than typing character-by-character.
metadata:
  author: gabriel-operator
  version: "1.0"
---

# action-fill

## Action overview

| Property | Value |
|----------|-------|
| `action_type` | `fill` |
| Requires browser | Yes |

Clears the current content of a form field and sets a new value in a single operation. This uses the Playwright `fill()` method, which replaces the field value atomically without firing individual keystroke events. Use `action-type` instead when the target app relies on per-keystroke JS event handlers.

## Required fields

| Field | Type | Description |
|-------|------|-------------|
| `step_number` | number | Sequential step index (starts at 1) |
| `action_type` | string | Must be `"fill"` |
| `stepId` | string | Unique step identifier (e.g. `step-c2d3e`) |

## Optional fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `selectors` | string[] | `[]` | Ordered CSS/XPath selectors for the input field |
| `value` | string | `""` | The value to fill. Supports `{{stepId.variable}}` templates. |
| `label` | string | — | Human-readable step label |
| `inputType` | string | — | Hint for input type (e.g. `"text"`, `"email"`, `"password"`, `"date"`) |
| `constraints` | object | — | Validation constraints (see field details) |
| `coordinates` | object | — | Viewport coordinates `{ x, y }` to click before filling |
| `readOnly` | boolean | `false` | Mark step as view-only |
| `timestamp` | number | — | Unix timestamp in milliseconds |

## Complete JSON example

```json
{
  "step_number": 4,
  "action_type": "fill",
  "stepId": "step-c2d3e",
  "selectors": [
    "#email-input",
    "input[name='email']",
    "//input[@placeholder='Enter email']"
  ],
  "value": "{{step-a1b2c.userEmail}}",
  "label": "Fill email address",
  "inputType": "email",
  "constraints": {
    "maxLength": 254,
    "pattern": "^[^@]+@[^@]+\\.[^@]+$",
    "required": true,
    "type": "email"
  },
  "timestamp": 1710000004000
}
```

## Field details

### `value`
The string to place into the field. Supports template interpolation:
- `{{step-abc12.name}}` — reference a variable from a previous step
- Connector overrides can replace this value dynamically at runtime (e.g. from a spreadsheet row or API response)

### `constraints`
Optional validation metadata. The runtime uses these to validate the value before filling.

| Sub-field | Type | Description |
|-----------|------|-------------|
| `maxLength` | number | Maximum character length |
| `pattern` | string | Regex pattern the value must match |
| `required` | boolean | Whether the field is mandatory |
| `type` | string | Semantic type (`"text"`, `"email"`, `"number"`, `"url"`, `"tel"`, `"date"`) |

### `coordinates`
When provided, the runtime clicks the coordinates first to focus the field, then fills the value. Useful for inputs that are not directly selectable (e.g. custom components, contenteditable divs).

## Common patterns

### 1. Simple form field fill
```json
{
  "step_number": 2,
  "action_type": "fill",
  "stepId": "step-f0001",
  "selectors": ["#username"],
  "value": "john.doe"
}
```

### 2. Dynamic value from a previous step
```json
{
  "step_number": 5,
  "action_type": "fill",
  "stepId": "step-f0002",
  "selectors": ["input[name='address']"],
  "value": "{{step-d4e5f.streetAddress}}"
}
```

### 3. Constrained numeric input
```json
{
  "step_number": 3,
  "action_type": "fill",
  "stepId": "step-f0003",
  "selectors": ["#quantity"],
  "value": "10",
  "inputType": "number",
  "constraints": {
    "required": true,
    "type": "number",
    "maxLength": 5
  }
}
```

## Gotchas and edge cases

- **Fill clears first** — unlike `type`, this action wipes the field before inserting the new value. If you need to append text, use `action-type` instead.
- **No keystroke events** — `fill()` sets the value property directly. Apps that rely on `keydown`/`keyup`/`input` events per character (e.g. autocomplete dropdowns, real-time search) will not respond correctly. Use `action-type` for those.
- **Contenteditable elements** may not work with selector-based fill. Use `coordinates` to click into the element first, or switch to `action-type`.
- **Connector overrides** replace the `value` at runtime. The static `value` in the workflow JSON acts as a default/fallback.
- **Date inputs** — some browsers require specific formats (e.g. `YYYY-MM-DD`). Set `inputType: "date"` and ensure the value matches the expected format.
- **Empty value** — setting `value: ""` clears the field, which can be intentional (e.g. resetting a form field).
