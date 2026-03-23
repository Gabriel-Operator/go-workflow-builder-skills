---
name: action-llm-rest-api
description: >
  Define an llm_rest_api step that calls any LLM provider API (OpenAI, Anthropic,
  Google, or custom endpoints). Supports model selection, prompt configuration,
  response format control, and custom extraction paths. Use for AI text generation,
  classification, summarization, or any LLM inference within a workflow.
metadata:
  author: gabriel-operator
  version: "1.0"
---

# LLM REST API

## Action type

- **action_type**: `llm_rest_api`
- **Requires browser**: No

## What it does

The LLM REST API step calls any LLM provider's API — OpenAI, Anthropic, Google, or a custom endpoint. It handles prompt assembly, authentication, and response extraction so you can integrate AI inference into any workflow without writing code. The response is persisted as step variables for downstream use.

## Required fields

| Field | Type | Description |
|-------|------|-------------|
| `step_number` | number | Sequential step position (starts at 1) |
| `action_type` | string | Must be `"llm_rest_api"` |
| `stepId` | string | Unique ID, format `step-XXXXX` (hex) |
| `timestamp` | number | Unix timestamp in milliseconds |

## Optional fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `llmRestApiConfig` | object | — | LLM provider configuration (see below) |
| `llmRestApiConfig.modelSource` | string | — | `"existing"` (platform model) or `"custom"` (bring your own) |
| `llmRestApiConfig.existingModelId` | string | — | Platform model ID (when `modelSource` is `"existing"`) |
| `llmRestApiConfig.providerType` | string | — | Provider: `openai`, `openai_responses`, `anthropic`, `google`, `custom` |
| `llmRestApiConfig.apiUrl` | string | — | Custom API endpoint URL |
| `llmRestApiConfig.apiKey` | string | — | API key for the provider |
| `llmRestApiConfig.modelIdentifier` | string | — | Model name (e.g., `"gpt-4o"`, `"claude-sonnet-4-20250514"`) |
| `llmRestApiConfig.mentorId` | string | — | Platform mentor/agent ID to use |
| `llmRestApiConfig.localMentorName` | string | — | Local mentor name reference |
| `llmRestApiConfig.systemPrompt` | string | — | System prompt for the LLM |
| `llmRestApiConfig.userPrompt` | string | — | User prompt for the LLM |
| `llmRestApiConfig.responseFormat` | string | `"text"` | Response format: `"text"` or `"json"` |
| `llmRestApiConfig.temperature` | number | — | Sampling temperature (0.0–2.0) |
| `llmRestApiConfig.maxTokens` | number | — | Maximum tokens in response |
| `llmRestApiConfig.customPayloadFields` | string | — | Additional API payload fields as a JSON string |
| `llmRestApiConfig.extractionMode` | string | `"auto"` | `"auto"` or `"custom"` for response extraction |
| `llmRestApiConfig.customExtractionPath` | string | — | JSONPath or dot-notation path to extract from response |
| `llmRestApiConfig.timeout` | number | — | Request timeout in milliseconds |

## Complete JSON example

```json
{
  "step_number": 3,
  "action_type": "llm_rest_api",
  "stepId": "step-e5f7a",
  "timestamp": 1710000000000,
  "llmRestApiConfig": {
    "modelSource": "custom",
    "providerType": "openai",
    "apiUrl": "https://api.openai.com/v1/chat/completions",
    "apiKey": "sk-abc123",
    "modelIdentifier": "gpt-4o",
    "systemPrompt": "You are a data classifier. Respond with a JSON object containing a 'category' field.",
    "userPrompt": "Classify this text: {{step-00002.extractedText}}",
    "responseFormat": "json",
    "temperature": 0.3,
    "maxTokens": 500,
    "extractionMode": "auto",
    "timeout": 30000
  }
}
```

## Field details

- **modelSource**: Use `"existing"` to reference a model already configured in the platform (set `existingModelId`). Use `"custom"` to specify provider details directly (`providerType`, `apiUrl`, `apiKey`, `modelIdentifier`).
- **providerType**: Determines the request format. `openai` uses Chat Completions API format. `openai_responses` uses the Responses API. `anthropic` uses Messages API. `google` uses Gemini API. `custom` sends a raw request to `apiUrl`.
- **customPayloadFields**: A JSON string (not object) containing extra fields to merge into the API request payload. Example: `"{\"top_p\": 0.9, \"frequency_penalty\": 0.5}"`.
- **extractionMode**: `"auto"` extracts the main text content from the response automatically. `"custom"` uses `customExtractionPath` to extract a specific field (e.g., `"choices[0].message.content"` or `"candidates[0].content.parts[0].text"`).
- **mentorId**: References a pre-configured AI mentor/agent on the platform that includes system prompts, tools, and knowledge base configuration.

## Common patterns

### Classify and route
Use LLM to classify extracted data, then branch based on result:
```json
[
  { "step_number": 1, "action_type": "manual_extract", "stepId": "step-00001", "timestamp": 1710000000000, "userPrompt": "Extract the support ticket text." },
  { "step_number": 2, "action_type": "llm_rest_api", "stepId": "step-e5f7a", "timestamp": 1710000000001, "llmRestApiConfig": { "modelSource": "existing", "existingModelId": "model-xyz", "systemPrompt": "Classify the ticket as billing, technical, or general.", "userPrompt": "{{step-00001.ticketText}}", "responseFormat": "json" } }
]
```

### Use with Anthropic
```json
{
  "llmRestApiConfig": {
    "modelSource": "custom",
    "providerType": "anthropic",
    "apiUrl": "https://api.anthropic.com/v1/messages",
    "apiKey": "sk-ant-abc123",
    "modelIdentifier": "claude-sonnet-4-20250514",
    "systemPrompt": "Summarize the following content.",
    "userPrompt": "{{step-00001.pageContent}}",
    "maxTokens": 1024
  }
}
```

## Gotchas

- `customPayloadFields` must be a JSON **string**, not an object. The platform parses it at runtime and merges it into the request payload.
- When using `extractionMode: "custom"`, the `customExtractionPath` must match the actual response structure of the chosen provider. OpenAI uses `choices[0].message.content`, Anthropic uses `content[0].text`, etc.
- `responseFormat: "json"` tells the LLM to return JSON, but does not guarantee valid JSON. Always handle parsing errors in downstream steps.
- The `timeout` value applies to the HTTP request, not to LLM generation time. Very long generations on slow models may still time out even with a generous timeout value.
