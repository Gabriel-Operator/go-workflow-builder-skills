---
name: action-computer-use-agent
description: >
  Define a computer_use_agent step that performs computer use in a sandboxed desktop
  environment. An AI agent sees the screen and controls mouse and keyboard to
  accomplish tasks. Runs in an E2B sandbox with configurable timeout and vision model.
  Use for GUI automation, desktop app interaction, or visual tasks.
metadata:
  author: gabriel-operator
  version: "1.0"
---

# Computer Use Agent

## Action type

- **action_type**: `computer_use_agent`
- **Requires browser**: No

## What it does

The computer use agent step runs an AI agent in a sandboxed desktop environment. The agent uses vision to see the screen and controls mouse and keyboard to interact with the desktop, applications, and GUI elements. This is useful for automating desktop applications, interacting with software that has no API, or performing visual tasks that require a full desktop environment.

## Required fields

| Field | Type | Description |
|-------|------|-------------|
| `step_number` | number | Sequential step position (starts at 1) |
| `action_type` | string | Must be `"computer_use_agent"` |
| `stepId` | string | Unique ID, format `step-XXXXX` (hex) |
| `timestamp` | number | Unix timestamp in milliseconds |

## Optional fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `userPrompt` | string | — | Task description for the computer use agent |
| `sandboxAgentConfig` | object | — | Sandbox and agent configuration (see below) |
| `sandboxAgentConfig.agentType` | string | — | Must be `"computer_use"` |
| `sandboxAgentConfig.visionModel` | string | — | Vision model for screen analysis |
| `sandboxAgentConfig.sandboxProvider` | string | — | Sandbox provider (currently `"e2b"`) |
| `sandboxAgentConfig.sandboxProviderId` | string | No | Optional saved E2B credential to use instead of the server default |
| `sandboxAgentConfig.sandboxTimeout` | number | — | Timeout in milliseconds for the sandbox session |

## Complete JSON example

```json
{
  "step_number": 1,
  "action_type": "computer_use_agent",
  "stepId": "step-cu47f",
  "timestamp": 1710000000000,
  "userPrompt": "Open the LibreOffice Calc application, create a new spreadsheet with headers Name, Email, and Status in row 1, then save the file as /home/user/contacts.xlsx.",
  "sandboxAgentConfig": {
    "agentType": "computer_use",
    "visionModel": "claude-sonnet-4-20250514",
    "sandboxProvider": "e2b",
    "sandboxProviderId": "sandbox-provider-123",
    "sandboxTimeout": 300000
  }
}
```

## Field details

- **sandboxAgentConfig.agentType**: Must be `"computer_use"` for the computer use agent. This configures the sandbox with a virtual display, mouse, and keyboard.
- **visionModel**: The AI model that analyzes screenshots of the desktop to decide actions. Models with strong vision capabilities (e.g., Claude with computer use support) work best.
- **sandboxProvider**: Currently only `"e2b"` is supported. The E2B sandbox provides a full Linux desktop environment.
- **sandboxProviderId**: Optional. When provided, the step uses that saved E2B credential. When omitted, the backend falls back to `E2B_API_KEY`.
- **sandboxTimeout**: Maximum time in milliseconds the sandbox stays alive. The agent must complete its task within this window. Default varies by platform configuration.
- **userPrompt**: Describes the task in natural language. Be specific about what applications to use, what actions to take, and what the expected end state is.

## Common patterns

### Desktop application automation
```json
{
  "step_number": 1,
  "action_type": "computer_use_agent",
  "stepId": "step-cu47f",
  "timestamp": 1710000000000,
  "userPrompt": "Open Firefox, navigate to https://example.com/login, fill in username 'admin' and password 'test123', click Login, then take a screenshot of the dashboard.",
  "sandboxAgentConfig": {
    "agentType": "computer_use",
    "visionModel": "claude-sonnet-4-20250514",
    "sandboxProvider": "e2b",
    "sandboxProviderId": "sandbox-provider-123",
    "sandboxTimeout": 120000
  }
}
```

### Multi-step with data from previous steps
```json
[
  { "step_number": 1, "action_type": "rest_api", "stepId": "step-00001", "timestamp": 1710000000000 },
  { "step_number": 2, "action_type": "computer_use_agent", "stepId": "step-cu48g", "timestamp": 1710000000001, "userPrompt": "Open the terminal, run the command: curl -o /tmp/data.json '{{step-00001.downloadUrl}}'. Then open the JSON file in the text editor and verify it contains valid data.", "sandboxAgentConfig": { "agentType": "computer_use", "visionModel": "claude-sonnet-4-20250514", "sandboxProvider": "e2b", "sandboxTimeout": 180000 } }
]
```

## Gotchas

- Computer use is significantly slower than direct API or browser automation. Each action requires a screenshot, vision analysis, and mouse/keyboard input. Use this only when no programmatic alternative exists.
- The sandbox desktop environment is Linux-based. Windows or macOS-specific applications are not available. Plan for Linux-compatible tools (LibreOffice instead of Microsoft Office, etc.).
- The sandbox is ephemeral — all files and state are destroyed when the step completes or the timeout is reached. Ensure any output is captured before the sandbox terminates.
- `sandboxTimeout` is a hard limit. If the agent is mid-task when the timeout hits, the sandbox is terminated immediately with no cleanup. Set generous timeouts for complex tasks.
- Vision model quality directly impacts reliability. Weaker vision models may misidentify UI elements, click wrong buttons, or get stuck in loops.
