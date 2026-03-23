---
name: action-llm-command
description: >
  Define an llm_command step that uses an LLM to analyze the current browser page
  and generate browser commands (click, fill, extract). The LLM inspects the page
  state and autonomously decides which actions to perform. Response is persisted
  as step variables for downstream use via template syntax.
metadata:
  author: gabriel-operator
  version: "1.0"
---

# LLM Command

## Action type

- **action_type**: `llm_command`
- **Requires browser**: Yes

## What it does

The LLM command step sends the current page state (DOM, screenshot) to an LLM, which analyzes it and generates one or more browser commands such as click, fill, or extract. This is useful when the exact selectors or actions are not known ahead of time and the AI must decide at runtime. The response is persisted as step variables that downstream steps can reference via `{{stepId.variable}}` template syntax.

## Required fields

| Field | Type | Description |
|-------|------|-------------|
| `step_number` | number | Sequential step position (starts at 1) |
| `action_type` | string | Must be `"llm_command"` |
| `stepId` | string | Unique ID, format `step-XXXXX` (hex) |
| `timestamp` | number | Unix timestamp in milliseconds |

## Optional fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `userPrompt` | string | — | Instruction telling the LLM what to do on the page |
| `systemPrompt` | string | — | System-level prompt to guide LLM behavior |
| `llmModel` | string | — | Override default LLM model identifier |

## Complete JSON example

```json
{
  "step_number": 3,
  "action_type": "llm_command",
  "stepId": "step-a3f1b",
  "timestamp": 1710000000000,
  "userPrompt": "Find the search bar, type 'automation tools', and click the first result link.",
  "systemPrompt": "You are a browser automation assistant. Return commands in the expected format.",
  "llmModel": "gpt-4o"
}
```

## Field details

- **userPrompt**: Describes the task the LLM should accomplish on the current page. Be specific about what elements to interact with and what data to extract. The LLM will see the page state alongside this prompt.
- **systemPrompt**: Sets the persona or constraints for the LLM. Useful for enforcing output format or limiting which actions the LLM may perform.
- **llmModel**: When omitted, the platform default model is used. Specify to override (e.g., `"gpt-4o"`, `"claude-sonnet-4-20250514"`).

## Common patterns

### Navigate-then-command
Use after a `navigate` step to let the LLM figure out how to interact with an unfamiliar page:
```json
[
  { "step_number": 1, "action_type": "navigate", "stepId": "step-00001", "timestamp": 1710000000000, "url": "https://example.com/dashboard" },
  { "step_number": 2, "action_type": "llm_command", "stepId": "step-00002", "timestamp": 1710000000001, "userPrompt": "Click the 'Export CSV' button and wait for the download to start." }
]
```

### Extract and reuse
Use the persisted step variables in a downstream step:
```json
{
  "step_number": 4,
  "action_type": "rest_api",
  "stepId": "step-b22cc",
  "timestamp": 1710000000002,
  "url": "https://api.example.com/items/{{step-a3f1b.extractedId}}"
}
```

## Gotchas

- The LLM sees only the current page state at execution time. If the page has not finished loading or has dynamic content behind scroll, the LLM may miss elements. Add a `wait` step before if needed.
- The generated commands execute sequentially in the same step. If the LLM generates a click that triggers a navigation, subsequent commands in the same response may fail because the page changed. Split complex flows into multiple `llm_command` steps.
- `userPrompt` is not strictly required by the schema, but omitting it gives the LLM no task direction — always provide one in practice.
