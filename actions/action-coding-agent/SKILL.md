---
name: action-coding-agent
description: >
  Define a coding_agent step that executes code in a sandboxed environment. Supports
  Claude Code, Codex, Amp, Open Code, and custom coding models. Runs in an E2B
  sandbox with optional Git repo mounting and skill runtime integration. Use for code
  generation, script execution, data transformation, or any programmatic task.
metadata:
  author: gabriel-operator
  version: "1.0"
---

# Coding Agent

## Action type

- **action_type**: `coding_agent`
- **Requires browser**: No

## What it does

The coding agent step runs a coding AI agent in a sandboxed environment. The agent can write, execute, and iterate on code to accomplish a task described in the user prompt. It supports multiple coding models and runs inside an E2B sandbox with optional Git repository access and skill runtime integration for accessing platform mentors.

## Required fields

| Field | Type | Description |
|-------|------|-------------|
| `step_number` | number | Sequential step position (starts at 1) |
| `action_type` | string | Must be `"coding_agent"` |
| `stepId` | string | Unique ID, format `step-XXXXX` (hex) |
| `timestamp` | number | Unix timestamp in milliseconds |

## Optional fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `userPrompt` | string | — | Task description for the coding agent |
| `sandboxAgentConfig` | object | — | Sandbox and agent configuration (see below) |
| `sandboxAgentConfig.agentType` | string | — | Must be `"coding"` |
| `sandboxAgentConfig.codingModel` | string | — | Model: `"claude_code"`, `"codex"`, `"amp"`, `"open_code"`, `"custom"` |
| `sandboxAgentConfig.visionModel` | string | — | Vision model for screenshot analysis |
| `sandboxAgentConfig.gitRepoUrl` | string | — | Git repository URL to clone into sandbox |
| `sandboxAgentConfig.gitBranch` | string | — | Git branch to checkout |
| `sandboxAgentConfig.sandboxProvider` | string | — | Sandbox provider (currently `"e2b"`) |
| `sandboxAgentConfig.sandboxProviderId` | string | No | Optional saved E2B credential to use instead of the server default |
| `sandboxAgentConfig.e2bTemplate` | string | — | E2B sandbox template ID |
| `sandboxAgentConfig.skillRuntime` | object | — | Skill runtime configuration |
| `sandboxAgentConfig.skillRuntime.enabled` | boolean | — | Enable skill runtime access |
| `sandboxAgentConfig.skillRuntime.mentorIds` | array | — | Array of mentor IDs to make available |
| `sandboxAgentConfig.skillRuntime.mountPath` | string | — | Path where skills are mounted in the sandbox |

## Complete JSON example

```json
{
  "step_number": 2,
  "action_type": "coding_agent",
  "stepId": "step-ca91d",
  "timestamp": 1710000000000,
  "userPrompt": "Read the CSV file at /data/input.csv, clean the data by removing duplicates and null values, then write the result to /data/output.csv. Also generate a summary statistics JSON file.",
  "sandboxAgentConfig": {
    "agentType": "coding",
    "codingModel": "claude_code",
    "gitRepoUrl": "https://github.com/example/data-pipeline.git",
    "gitBranch": "main",
    "sandboxProvider": "e2b",
    "sandboxProviderId": "sandbox-provider-123",
    "e2bTemplate": "python-data-science",
    "skillRuntime": {
      "enabled": false
    }
  }
}
```

## Field details

- **sandboxAgentConfig.agentType**: Must be `"coding"` for the coding agent. This distinguishes it from `"computer_use"` which is a separate action type.
- **codingModel**: Determines which coding AI is used. `"claude_code"` uses Anthropic's Claude Code. `"codex"` uses OpenAI Codex. `"amp"` uses Amp coding agent. `"open_code"` uses open-source coding models. `"custom"` allows specifying a custom model.
- **e2bTemplate**: The E2B sandbox template defines the pre-installed languages, libraries, and tools. Common templates include base images for Python, Node.js, or multi-language environments. Check E2B documentation for available templates.
- **sandboxProviderId**: Optional. When provided, the run uses that saved E2B credential. When omitted, the backend falls back to `E2B_API_KEY`.
- **gitRepoUrl / gitBranch**: When provided, the repository is cloned into the sandbox before the agent starts. The agent can then read, modify, and commit code.
- **skillRuntime**: When enabled, the coding agent can call platform mentors/agents during execution. `mentorIds` specifies which mentors are available. `mountPath` is where mentor skill files are accessible in the sandbox filesystem.
- **visionModel**: Some coding tasks require analyzing screenshots or images. This model handles visual input when the coding agent needs to see something.

## Common patterns

### Data transformation pipeline
```json
[
  { "step_number": 1, "action_type": "data_source_read", "stepId": "step-00001", "timestamp": 1710000000000 },
  { "step_number": 2, "action_type": "coding_agent", "stepId": "step-ca91d", "timestamp": 1710000000001, "userPrompt": "Transform the JSON data from the previous step: normalize all dates to ISO format, calculate running totals, and output as CSV.", "sandboxAgentConfig": { "agentType": "coding", "codingModel": "claude_code", "sandboxProvider": "e2b", "sandboxProviderId": "sandbox-provider-123" } }
]
```

### Code generation with Git
```json
{
  "step_number": 1,
  "action_type": "coding_agent",
  "stepId": "step-ca92e",
  "timestamp": 1710000000000,
  "userPrompt": "Add unit tests for the UserService class. Follow existing test patterns in the repo.",
  "sandboxAgentConfig": {
    "agentType": "coding",
    "codingModel": "claude_code",
    "gitRepoUrl": "https://github.com/example/backend.git",
    "gitBranch": "feature/user-service",
    "sandboxProvider": "e2b",
    "sandboxProviderId": "sandbox-provider-123"
  }
}
```

## Gotchas

- The sandbox is ephemeral. All files and state are destroyed when the step completes. If you need to persist output, the agent must write results to a location that the platform can capture (typically stdout or designated output paths).
- Git credentials for private repositories must be configured at the platform level. The `gitRepoUrl` alone is not sufficient for private repos.
- The coding agent may run for several minutes depending on task complexity. Ensure workflow timeouts accommodate this.
- `agentType` must be `"coding"` — using `"computer_use"` here will not work. Use the `computer_use_agent` action type for desktop-level computer use.
