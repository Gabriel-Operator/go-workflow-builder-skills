---
name: action-notification
description: >
  Define a notification step that sends notifications via multiple channels including
  email, Slack, SendGrid, webhook, WhatsApp, WhatsApp Web, and Telegram. Routing is
  handled by the backend based on the connector configuration. Simple step with
  minimal configuration required.
metadata:
  author: gabriel-operator
  version: "1.0"
---

# Notification

## Action type

- **action_type**: `notification`
- **Requires browser**: No

## What it does

The notification step sends a notification through one or more channels. Supported channels include email, Slack, SendGrid, webhook, WhatsApp, WhatsApp Web, and Telegram. The actual routing and delivery is handled by the backend based on the connector configuration attached to the workflow. This is a simple step — you define it and the backend takes care of the rest.

## Required fields

| Field | Type | Description |
|-------|------|-------------|
| `step_number` | number | Sequential step position (starts at 1) |
| `action_type` | string | Must be `"notification"` |
| `stepId` | string | Unique ID, format `step-XXXXX` (hex) |
| `timestamp` | number | Unix timestamp in milliseconds |

## Optional fields

The notification step relies primarily on the connector configuration. Step-level fields are minimal:

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `label` | string | — | Human-readable label for this step |
| `userPrompt` | string | — | Message content or template for the notification |

## Complete JSON example

```json
{
  "step_number": 4,
  "action_type": "notification",
  "stepId": "step-n1f8e",
  "timestamp": 1710000000000,
  "userPrompt": "New order received: {{step-00002.productName}} for {{step-00002.price}} from customer {{step-00001.customerName}}."
}
```

## Field details

- **userPrompt**: The message content sent through the notification channel. Supports template variables to include data from previous steps. The backend may format this differently depending on the channel (e.g., Slack markdown vs. plain text email).

## Common patterns

### Notify after workflow completion
```json
[
  { "step_number": 1, "action_type": "navigate", "stepId": "step-00001", "timestamp": 1710000000000, "url": "https://example.com/report" },
  { "step_number": 2, "action_type": "manual_extract", "stepId": "step-00002", "timestamp": 1710000000001, "userPrompt": "Extract the report summary." },
  { "step_number": 3, "action_type": "notification", "stepId": "step-n1f8e", "timestamp": 1710000000002, "userPrompt": "Daily report summary: {{step-00002.summary}}" }
]
```

### Alert on condition
Pair with a guard condition to send notifications only when something important happens:
```json
{
  "step_number": 3,
  "action_type": "notification",
  "stepId": "step-n1f8f",
  "timestamp": 1710000000000,
  "userPrompt": "Alert: Price dropped below threshold. Current price: {{step-00002.price}}"
}
```

## Gotchas

- The notification channel (email, Slack, webhook, etc.) is determined by the connector configured at the workflow level, not by this step's fields. If notifications are not being delivered, check the workflow's connector configuration.
- Template variables in `userPrompt` are resolved at runtime. If a referenced step has not executed or produced the expected variable, the template placeholder will appear literally in the notification.
- Different channels have different formatting capabilities. Rich formatting (HTML, markdown) may not render on all channels. Keep messages simple for cross-channel compatibility.
