---
name: action-navigate
description: >
  Navigate to a URL and optionally verify login state before proceeding.
  Use this step to open pages, deep-link into apps, or gate a workflow behind
  authentication. Supports LLM-based and selector-based login verification.
  Set disableBrowser on step 1 to skip browser init for API-only workflows.
metadata:
  author: gabriel-operator
  version: "1.0"
---

# action-navigate

## Action overview

| Property | Value |
|----------|-------|
| `action_type` | `navigate` |
| Requires browser | Conditional — yes when a `url` is provided; no when `disableBrowser` is true |

Navigates the browser to a given URL. If `requiresLogin` is set, the step first runs a login verification check (LLM vision or CSS/XPath selector) and pauses for manual login when the check fails. Setting `disableBrowser: true` on the very first step skips browser initialization entirely, which is useful for workflows that only call APIs.

## Required fields

| Field | Type | Description |
|-------|------|-------------|
| `step_number` | number | Sequential step index (starts at 1) |
| `action_type` | string | Must be `"navigate"` |
| `stepId` | string | Unique step identifier (e.g. `step-714da`) |

## Optional fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `url` | string | — | Absolute URL to navigate to. Supports `{{stepId.variable}}` templates. |
| `readOnly` | boolean | `false` | Mark step as view-only (no mutations) |
| `disableBrowser` | boolean | `false` | Skip browser launch entirely (first step only, for API-only flows) |
| `requiresLogin` | boolean | `false` | Pause and prompt for manual login if verification fails |
| `loginVerificationQueryType` | string | — | `"llm"` or `"selector"` — how to verify logged-in state |
| `loginVerificationSelectors` | string[] | — | CSS/XPath selectors to check when queryType is `"selector"` |
| `loginVerificationSelectorCondition` | string | — | One of: `element_exists`, `element_absent`, `element_visible`, `element_hidden`, `text_contains` |
| `loginVerificationExpectation` | string | — | Expected text or state description for verification |
| `loginVerificationSystemPrompt` | string | — | System prompt for LLM-based verification |
| `loginVerificationUserPrompt` | string | — | User prompt for LLM-based verification |
| `loginVerificationMentorId` | string | — | Mentor/model ID for LLM verification |
| `loginVerificationLocalMentorName` | string | — | Local mentor name for LLM verification |
| `label` | string | — | Human-readable step label |
| `timestamp` | number | — | Unix timestamp in milliseconds |

## Complete JSON example

```json
{
  "step_number": 1,
  "action_type": "navigate",
  "stepId": "step-a1b2c",
  "url": "https://app.example.com/dashboard",
  "requiresLogin": true,
  "loginVerificationQueryType": "selector",
  "loginVerificationSelectors": ["#user-avatar", ".profile-menu"],
  "loginVerificationSelectorCondition": "element_exists",
  "loginVerificationExpectation": "User avatar is visible in the top-right corner",
  "label": "Open dashboard (login if needed)",
  "timestamp": 1710000000000
}
```

## Field details

### `disableBrowser`
Only meaningful on the **first step** of a workflow. When `true`, the runtime skips Chromium launch entirely. All subsequent steps must be non-browser actions (e.g. `rest_api`, `data_source_read`). If a later step requires a browser, the workflow will fail.

### `loginVerificationQueryType`
- **`"selector"`** — Checks the DOM for elements matching `loginVerificationSelectors` using the condition in `loginVerificationSelectorCondition`. Fast and deterministic.
- **`"llm"`** — Takes a screenshot and asks the configured LLM whether the page shows a logged-in state. More flexible but slower and costs tokens.

### `loginVerificationSelectorCondition`
| Value | Meaning |
|-------|---------|
| `element_exists` | At least one selector matches a DOM node |
| `element_absent` | No selector matches any DOM node |
| `element_visible` | Matched element is visible in viewport |
| `element_hidden` | Matched element exists but is not visible |
| `text_contains` | Inner text of matched element contains `loginVerificationExpectation` |

## Common patterns

### 1. Simple page navigation
```json
{
  "step_number": 1,
  "action_type": "navigate",
  "stepId": "step-00001",
  "url": "https://example.com/products"
}
```

### 2. API-only workflow (no browser)
```json
{
  "step_number": 1,
  "action_type": "navigate",
  "stepId": "step-00002",
  "disableBrowser": true
}
```

### 3. LLM-based login verification
```json
{
  "step_number": 1,
  "action_type": "navigate",
  "stepId": "step-00003",
  "url": "https://crm.example.com",
  "requiresLogin": true,
  "loginVerificationQueryType": "llm",
  "loginVerificationSystemPrompt": "You are checking if the user is logged in.",
  "loginVerificationUserPrompt": "Is there a visible user profile or dashboard? Answer YES or NO.",
  "loginVerificationMentorId": "mentor-gpt4o"
}
```

## Gotchas and edge cases

- **`disableBrowser` on step > 1 is ignored.** Only the first step controls whether the browser is launched.
- **`requiresLogin` without a verification method** will always assume the user is not logged in and immediately pause for manual login.
- **Relative URLs** are resolved against `structure.baseUrl`. If `baseUrl` is empty, always use absolute URLs.
- **Template variables in `url`** (e.g. `{{step-abc12.redirectUrl}}`) are resolved at runtime; the step will fail if the referenced variable does not exist.
- **Login pause is blocking** — the workflow halts until the user confirms login via WebSocket. There is no timeout; the workflow stays paused indefinitely.
