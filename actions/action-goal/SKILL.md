---
name: action-goal
description: >
  Autonomous AI browser agent that plans and executes multi-step tasks from a
  natural-language prompt. The most powerful action type — it observes the page,
  decides what to do, and loops until the goal is met or the step limit is
  reached. Supports persisting discovered actions for deterministic replay and
  sending notifications on completion.
metadata:
  author: gabriel-operator
  version: "1.0"
---

# action-goal

## Action overview

| Property | Value |
|----------|-------|
| `action_type` | `goal` |
| Requires browser | Yes |

The goal action is the most powerful step type. Given a natural-language prompt, an AI agent takes screenshots, plans actions, and executes them in a loop until the goal is achieved or `goalMaxSteps` is reached. It can click, fill, scroll, navigate, and extract data autonomously. Use this when the exact sequence of browser interactions is unknown or varies by page state.

## Required fields

| Field | Type | Description |
|-------|------|-------------|
| `step_number` | number | Sequential step index (starts at 1) |
| `action_type` | string | Must be `"goal"` |
| `stepId` | string | Unique step identifier (e.g. `step-e5f6a`) |
| `userPrompt` | string | Natural-language description of what the agent should accomplish |

## Optional fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `systemPrompt` | string | — | System-level context for the AI agent |
| `llmModel` | string | — | Model identifier (e.g. `"gpt-4o"`, `"claude-sonnet"`) |
| `llmActionType` | string | `"goal"` | Must be `"goal"` for this action type |
| `flowType` | string | `"linear"` | Execution flow type |
| `goalMaxSteps` | number | `20` | Maximum iterations before the agent stops |
| `persistGoalActions` | boolean | `false` | Save discovered browser actions for deterministic replay |
| `autoContinueGoal` | boolean | `false` | Skip confirmation pause between iterations |
| `notifyOnComplete` | boolean | `false` | Send a notification when the goal finishes |
| `goalNotificationChannel` | string | — | One of: `email`, `slack`, `sendgrid`, `webhook`, `whatsapp`, `whatsapp-web`, `telegram` |
| `goalNotificationSubject` | string | — | Notification subject line |
| `goalNotificationMessage` | string | — | Notification body. Supports `{{goalResult}}` placeholder. |
| `goalNotificationConfig` | object | — | Channel-specific config (webhook URL, Slack channel, etc.) |
| `mentorId` | string | — | Mentor/model configuration ID |
| `localMentorName` | string | — | Local mentor name |
| `computerUseModel` | string | — | Model for computer-use interactions |
| `selectors` | string[] | `[]` | Pre-populated selectors from a previous persisted run |
| `label` | string | — | Human-readable step label |
| `readOnly` | boolean | `false` | Mark step as view-only |
| `timestamp` | number | — | Unix timestamp in milliseconds |

## Complete JSON example

```json
{
  "step_number": 2,
  "action_type": "goal",
  "stepId": "step-e5f6a",
  "userPrompt": "Log into the CRM, navigate to the Contacts page, search for 'Acme Corp', and export the contact list as CSV.",
  "systemPrompt": "You are an expert browser automation agent. Complete the task efficiently and report what you did.",
  "llmModel": "gpt-4o",
  "llmActionType": "goal",
  "flowType": "linear",
  "goalMaxSteps": 30,
  "persistGoalActions": true,
  "autoContinueGoal": true,
  "notifyOnComplete": true,
  "goalNotificationChannel": "slack",
  "goalNotificationSubject": "CRM Export Complete",
  "goalNotificationMessage": "Goal finished. Result: {{goalResult}}",
  "goalNotificationConfig": {
    "slackChannel": "#automation-alerts",
    "slackWebhookUrl": "https://hooks.slack.com/services/T00/B00/xxx"
  },
  "label": "AI agent: export CRM contacts",
  "timestamp": 1710000002000
}
```

## Field details

### `goalMaxSteps`
The maximum number of action iterations the agent will perform. Each iteration consists of: screenshot, LLM reasoning, action execution. Default is 20. Set higher for complex multi-page tasks, lower for simple single-page goals. The agent may finish early if it determines the goal is met.

### `persistGoalActions`
When `true`, the runtime records every browser action the agent takes (clicks, fills, navigations) and saves them as explicit step definitions. On subsequent runs of the same workflow, these persisted actions are replayed deterministically without LLM calls, making execution faster and cheaper. The persisted actions populate the `selectors` field.

### `goalNotificationChannel`
| Channel | Config required |
|---------|-----------------|
| `email` | Recipient email in config |
| `slack` | `slackChannel` and/or `slackWebhookUrl` |
| `sendgrid` | SendGrid API key and template in config |
| `webhook` | `webhookUrl` in config |
| `whatsapp` | Phone number in config |
| `whatsapp-web` | Phone number in config |
| `telegram` | Chat ID and bot token in config |

### `{{goalResult}}` placeholder
Available in `goalNotificationMessage`. Replaced at runtime with a summary of what the agent accomplished (final status, extracted data, error messages).

## Common patterns

### 1. Simple autonomous browsing task
```json
{
  "step_number": 2,
  "action_type": "goal",
  "stepId": "step-g0001",
  "userPrompt": "Find the pricing page and extract the price of the Pro plan",
  "goalMaxSteps": 10
}
```

### 2. Persist actions for future replay
```json
{
  "step_number": 3,
  "action_type": "goal",
  "stepId": "step-g0002",
  "userPrompt": "Fill out the registration form with the provided user details",
  "persistGoalActions": true,
  "autoContinueGoal": true,
  "goalMaxSteps": 15
}
```

### 3. Goal with Slack notification
```json
{
  "step_number": 4,
  "action_type": "goal",
  "stepId": "step-g0003",
  "userPrompt": "Download the monthly report PDF from the analytics dashboard",
  "notifyOnComplete": true,
  "goalNotificationChannel": "slack",
  "goalNotificationMessage": "Report download complete: {{goalResult}}",
  "goalNotificationConfig": {
    "slackWebhookUrl": "https://hooks.slack.com/services/T00/B00/xxx"
  }
}
```

## Gotchas and edge cases

- **Token cost** — each iteration takes a screenshot and calls the LLM. A 20-step goal can consume significant tokens. Set `goalMaxSteps` conservatively.
- **`autoContinueGoal: false`** (default) pauses after each iteration for user confirmation via WebSocket. Set to `true` for unattended runs.
- **`persistGoalActions`** only works after a successful run. If the goal fails partway, partial actions may be saved and could produce incorrect replays. Review persisted actions before relying on them.
- **Page changes between runs** — persisted selectors may become stale if the target app updates its DOM. The agent falls back to LLM-based execution when persisted selectors fail.
- **`goalMaxSteps` exhausted** — when the agent hits the limit, it stops and reports partial progress. The step does not fail; downstream steps still execute. Check the goal result to determine if the task was fully completed.
- **Login walls** — if the goal encounters a login page, it cannot enter credentials unless they are in the prompt. Use a `navigate` step with `requiresLogin` before the goal step.
