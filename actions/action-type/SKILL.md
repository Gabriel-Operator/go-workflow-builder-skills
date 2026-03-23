---
name: action-type
description: >
  Type text keystroke-by-keystroke into a focused element, triggering individual
  JS input events per character. Use when the target app needs keydown/keyup
  events (autocomplete, search-as-you-type). Supports selector chains, AI
  fallback via selectorPrompts, coordinates, and connector overrides.
metadata:
  author: gabriel-operator
  version: "1.0"
---

# action-type

## Action overview

| Property | Value |
|----------|-------|
| `action_type` | `type` |
| Requires browser | Yes |

Types text character-by-character into a form field or editable element. Each keystroke fires the full sequence of `keydown`, `keypress`, `input`, and `keyup` events, making this the correct choice for apps with real-time input handlers (autocomplete, live search, character counters). Use `action-fill` instead when you just need to set a value quickly without per-key events.

## Required fields

| Field | Type | Description |
|-------|------|-------------|
| `step_number` | number | Sequential step index (starts at 1) |
| `action_type` | string | Must be `"type"` |
| `stepId` | string | Unique step identifier (e.g. `step-d4e5f`) |

## Optional fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `value` | string | `""` | Text to type. Supports `{{stepId.variable}}` templates. |
| `selectors` | string[] | `[]` | Ordered CSS/XPath selectors for the target element |
| `selectorPrompts` | object[] | `[]` | AI fallback chain (same schema as `action-click`) |
| `coordinates` | object | — | Viewport coordinates `{ x, y }` to click before typing |
| `label` | string | — | Human-readable step label |
| `readOnly` | boolean | `false` | Mark step as view-only |
| `timestamp` | number | — | Unix timestamp in milliseconds |

## Complete JSON example

```json
{
  "step_number": 5,
  "action_type": "type",
  "stepId": "step-d4e5f",
  "selectors": [
    "#search-box",
    "input[aria-label='Search']"
  ],
  "value": "Gabriel Operator automation",
  "selectorPrompts": [
    {
      "queryType": "prompt",
      "backupType": "task",
      "userPrompt": "Type into the search input field at the top of the page",
      "llmModel": "gpt-4o"
    }
  ],
  "label": "Type search query",
  "timestamp": 1710000005000
}
```

## Field details

### `value`
The text string to type character-by-character. Supports template interpolation (`{{step-abc12.query}}`). Connector overrides can replace this value dynamically at runtime.

### `selectorPrompts`
Same schema as `action-click`. Each entry provides an AI fallback when all `selectors` fail. The AI identifies the target element via screenshot analysis, then the runtime types into it.

| Sub-field | Type | Description |
|-----------|------|-------------|
| `queryType` | string | `"manual"` or `"prompt"` |
| `backupType` | string | `"task"` or `"goal"` |
| `userPrompt` | string | Natural-language description of the target |
| `systemPrompt` | string | System-level instruction for the LLM |
| `llmModel` | string | Model identifier |
| `mentorId` | string | Mentor configuration ID |
| `localMentorName` | string | Local mentor name |
| `computerUseModel` | string | Model for computer-use based interaction |

## Common patterns

### 1. Type into a search box
```json
{
  "step_number": 3,
  "action_type": "type",
  "stepId": "step-t0001",
  "selectors": ["#search"],
  "value": "quarterly report 2024"
}
```

### 2. Dynamic value from previous step
```json
{
  "step_number": 6,
  "action_type": "type",
  "stepId": "step-t0002",
  "selectors": ["textarea.comment-input"],
  "value": "{{step-e5f6a.generatedComment}}"
}
```

### 3. AI fallback for custom component
```json
{
  "step_number": 4,
  "action_type": "type",
  "stepId": "step-t0003",
  "value": "Hello world",
  "selectorPrompts": [
    {
      "queryType": "prompt",
      "backupType": "task",
      "userPrompt": "Type into the message composition area in the chat window"
    }
  ]
}
```

## Gotchas and edge cases

- **Does not clear first** — unlike `fill`, `type` appends to whatever is already in the field. If you need to replace content, add a `fill` step with an empty value first, or use a `keypress` step with `Ctrl+A` followed by this `type` step.
- **Slower than fill** — each character is typed individually with a small delay. For long strings (hundreds of characters), consider `fill` if per-key events are not needed.
- **Autocomplete dropdowns** — typing triggers suggestions. You may need a follow-up `click` step to select from the dropdown.
- **Special characters** — to type special keys (Enter, Tab, etc.), use `action-keypress` instead. The `type` action sends literal characters only.
- **Connector overrides** replace the `value` at runtime, same as `action-fill`.
- **Empty `selectors` with no fallback** — the runtime types into whatever element currently has focus. This can be unpredictable; always provide selectors when possible.
