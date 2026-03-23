# Cross-Cutting Features Reference

These features can be applied to any step regardless of action type.

## Step Guards (Conditional Execution)

A guard evaluates a condition before the step runs. Based on the strategy, the step is executed or skipped.

```json
{
  "guard": {
    "enabled": true,
    "queryType": "selector | llm",
    "selectors": [".logged-in-badge"],
    "selectorCondition": "element_exists | element_absent | element_visible | element_hidden | text_contains",
    "expectation": "Expected text (for text_contains)",
    "llmType": "task | goal",
    "mentorId": "mentor-id",
    "localMentorName": "MyMentor",
    "systemPrompt": "Check if user is on the right page",
    "userPrompt": "Is the shopping cart visible?",
    "llmModel": "model-id",
    "computerUseModel": "model-id (for goal type)",
    "conditionStrategy": "run_if_true | run_if_false | skip_if_true | skip_if_false"
  }
}
```

### Guard query types
- **`selector`** — checks DOM elements using CSS/XPath selectors
- **`llm`** — uses AI vision to evaluate a condition

### Condition strategies
- `run_if_true` — execute step only if condition is true
- `run_if_false` — execute step only if condition is false
- `skip_if_true` — skip step if condition is true
- `skip_if_false` — skip step if condition is false

---

## Pre/Post Step Hooks

Hooks run connector automations before or after any step. Each connector can have its own condition.

```json
{
  "preStepHooks": {
    "enabled": true,
    "connectors": [
      {
        "id": "connector-uuid",
        "name": "Fetch Auth Token",
        "conditionConfig": {
          "enabled": true,
          "queryType": "selector | llm | json | always",
          "selectors": [".needs-auth"],
          "mentorId": "mentor-id",
          "localMentorName": "MyMentor",
          "systemPrompt": "Check condition",
          "userPrompt": "Should we refresh the token?",
          "llmModel": "model-id",
          "conditionStrategy": "run_if_true | run_if_false | skip_if_true | skip_if_false"
        }
      }
    ]
  },
  "postStepHooks": {
    "enabled": true,
    "connectors": [
      { "id": "connector-uuid", "name": "Log Result" }
    ]
  }
}
```

### Legacy format (single connector)
Older workflows may use `preStepHook` / `postStepHook` (string, single connector ID).

### Connector results
Connector outputs are accessible in downstream steps via `{{connectorId.variable}}` templates.

---

## LLM Evaluations (Testing/Reinforcement)

Evaluations assert conditions on step results. Use for quality checks, testing, or reinforcement learning.

```json
{
  "_llm_evals": [
    {
      "name": "Price Check",
      "type": "selector | llm",
      "selector": ".total-price",
      "expectation": "Price should be under $100",
      "retrySeconds": 5,
      "queryType": "selector | llm",
      "mentorId": "mentor-id",
      "localMentorName": "MyMentor",
      "systemPrompt": "Evaluate if the condition is met",
      "userPrompt": "Is the price displayed under $100?",
      "llmModel": "model-id"
    }
  ],
  "evalMode": "reinforcement | test",
  "evalFailureAction": "abort | continue",
  "evalRetryStepNumber": 3
}
```

### Eval modes
- **`reinforcement`** — logs failures; optionally retries from `evalRetryStepNumber`
- **`test`** — treats step as a test assertion; `abort` stops the run, `continue` marks failed but proceeds

---

## Narration (Text-to-Speech)

Add TTS narration to any step for voice-guided workflows.

```json
{
  "narrationPrompt": "The user navigates to the shopping cart",
  "narrationTtsProviderConfigId": "provider-config-id",
  "narrationTtsModel": "tts-model",
  "narrationTtsVoice": "alloy",
  "narrationTtsVoiceCustom": "custom-voice-id",
  "narrationTtsLanguage": "en-US"
}
```

---

## Parameterized Execution (Data-Driven Runs)

Run a subset of steps multiple times with different values.

```json
{
  "parameters": {
    "execute": [
      {
        "name": "Product Search Variants",
        "from": 3,
        "to": 5,
        "execute": true,
        "isDefault": true,
        "values": [
          { "step3": "jeans", "step4": "blue", "step5": "large" },
          { "step3": "sneakers", "step4": "white", "step5": "medium" }
        ]
      }
    ],
    "storedPrompts": [
      {
        "prompt": "Search for trending items",
        "context": "e-commerce",
        "groupId": "group-uuid",
        "timestamp": "ISO date",
        "recordingName": "Product Search",
        "values": [{ "query": "jeans" }]
      }
    ]
  }
}
```

### How it works
- Steps 1 to `from - 1` run once (setup)
- Steps `from` to `to` run once per value set (parameterized loop)
- Steps after `to` run once (cleanup)
- Values map step numbers to replacement values for fill/type steps

---

## Repeat Groups

Loop a set of steps with configurable termination conditions.

```json
{
  "groups": [
    {
      "id": "group-uuid",
      "name": "Paginate Results",
      "stepNumbers": [4, 5, 6],
      "repeatConfig": {
        "enabled": true,
        "queryType": "selector | llm | json",
        "selectors": [".next-page:not([disabled])"],
        "systemPrompt": "Check if there are more pages",
        "userPrompt": "Are there more results to load?",
        "llmModel": "model-id",
        "maxIterations": 10,
        "navigationStrategy": "back_to_start | continue_sequence",
        "iterationStrategy": "fixed | until_selector_visible | until_llm_true",
        "untilSelector": ".no-more-results",
        "untilLlmPrompt": "Are all results loaded?",
        "untilLlmModel": "model-id"
      }
    }
  ]
}
```

### Navigation strategies
- `back_to_start` — after each iteration, navigate back to the starting URL
- `continue_sequence` — continue from where the last iteration ended

### Iteration strategies
- `fixed` — run exactly `maxIterations` times
- `until_selector_visible` — stop when `untilSelector` becomes visible
- `until_llm_true` — stop when LLM evaluates `untilLlmPrompt` as true

---

## Conditional Groups

Execute or skip a set of steps based on a condition.

```json
{
  "groups": [
    {
      "id": "group-uuid",
      "name": "Login Required Section",
      "stepNumbers": [7, 8, 9],
      "conditionalConfig": {
        "enabled": true,
        "queryType": "selector | llm | json",
        "selectors": [".login-form"],
        "selectorCondition": "element_exists | element_absent | element_visible | element_hidden | text_contains",
        "expectation": "Expected text",
        "systemPrompt": "Check condition",
        "userPrompt": "Is login required?",
        "llmModel": "model-id",
        "conditionStrategy": "run_if_true | run_if_false | skip_if_true | skip_if_false",
        "requiresLogin": true,
        "loginVerificationQueryType": "llm | selector",
        "loginVerificationSelectors": [".user-avatar"],
        "loginVerificationSelectorCondition": "element_exists",
        "loginVerificationExpectation": "Welcome",
        "loginVerificationSystemPrompt": "Verify login",
        "loginVerificationUserPrompt": "Is the user logged in?"
      }
    }
  ]
}
```

---

## Connector Overrides

Inject dynamic values at runtime from the API caller.

```json
{
  "parameters": {
    "connectorOverrides": [
      {
        "connectorId": "connector-uuid",
        "stepNumber": 3,
        "stepId": "step-abc12",
        "value": "dynamic-value-at-runtime"
      }
    ]
  }
}
```

Overrides replace the `value` field of fill/type steps or URL fields of navigate/rest_api steps at execution time.

---

## Template Variable Syntax

Any string field in a step can reference outputs from previous steps:

```
{{stepId.variable}}
```

Examples:
- `{{step-714da.response}}` — the response text from a previous LLM/goal/API step
- `{{step-abc12.userId}}` — a specific extracted variable
- `{{env.API_TOKEN}}` — environment variable

This works in: `url`, `value`, `userPrompt`, `systemPrompt`, `body`, headers, query params, and more.

---

## Prompt History

Steps with prompts can store version history:

```json
{
  "userPromptHistory": [
    {
      "id": "unique-id",
      "text": "The generated prompt text",
      "description": "User's brief description",
      "createdAt": "ISO date"
    }
  ],
  "systemPromptHistory": [
    {
      "id": "unique-id",
      "text": "The system prompt text",
      "description": "Description",
      "createdAt": "ISO date"
    }
  ]
}
```

---

## Agentic Config

For steps that can dynamically choose sub-workflows:

```json
{
  "agenticConfig": {
    "availableGroups": [
      {
        "id": "group-id",
        "name": "Search Flow",
        "stepIds": [3, 4, 5]
      }
    ]
  }
}
```

---

## Hyper Metadata

Runtime metadata populated during goal/computer-use execution:

```json
{
  "hyperMetadata": {
    "stepIndex": 0,
    "agentOutput": {
      "memory": "Previous context",
      "thoughts": "Agent reasoning",
      "nextGoal": "What to do next",
      "actions": [{ "type": "click", "selector": "#btn" }]
    },
    "actionOutputs": [
      { "message": "Clicked button", "success": true }
    ]
  }
}
```

This is read-only — populated by the runtime, not set by the workflow author.
