# ActionStepsStructure JSON Schema Reference

Source of truth: `server/src/config/database/interfaces/automation.interfaces.ts`

## Top-Level: ActionStepsStructure

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Internal workflow label |
| `actionName` | string | Yes | Human-readable display title |
| `baseUrl` | string | Yes | Base URL prefix (empty string for absolute URLs) |
| `actionIndex` | number | No | Position index of this action |
| `screenshotEnabled` | boolean | No | Capture screenshots per step (default: true) |
| `steps` | Step[] | Yes | Array of step objects |
| `parameters` | Parameters | Yes | Parameterized execution config |
| `groups` | Group[] | Yes | Repeat/conditional group definitions |
| `explainer` | object | No | `{ enabled, draftStatus: 'pending'|'ready'|'failed', updatedAt }` |

## Step Object (Common Fields)

Every step has these base fields:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `step_number` | number | Yes | Sequential step number starting from 1 |
| `action_type` | string | Yes | One of the 37 supported action types |
| `stepId` | string | Yes | Unique ID (format: `step-XXXXX`, hex chars) |
| `timestamp` | number | No | Unix timestamp in milliseconds |
| `url` | string | No | URL for navigate steps |
| `label` | string | No | Human-readable step label |
| `intent` | string | No | Rich purpose description: what the step achieves, documentation of all `{{stepId.var}}` template variables used, and acceptance criteria |
| `readOnly` | boolean | No | Mark step as non-editable in UI |
| `skipStep` | boolean | No | Skip this step during execution |
| `value` | string | No | Input value (for fill, type, keypress, upload) |
| `selectors` | string[] | No | CSS/XPath selector chain for element targeting |
| `userPrompt` | string | No | User-facing prompt text for LLM/goal steps |
| `systemPrompt` | string | No | System prompt for LLM steps |
| `llmModel` | string | No | LLM model ID |
| `llmActionType` | string | No | LLM action sub-type |
| `flowType` | string | No | Flow type (e.g., "linear") |
| `mentorId` | string | No | Mentor overlay ID |
| `localMentorName` | string | No | Local mentor name |
| `groupId` | string | No | Group membership ID |
| `branchPath` | string | No | Conditional branch path |
| `parentConditionalStep` | number | No | Parent conditional step number |

## Coordinates Object

Used by click, fill, type, hover, scroll steps:

```json
{
  "coordinates": {
    "viewport": {
      "x": 500,
      "y": 300,
      "percentages": { "x": 0.5, "y": 0.3 },
      "dimensions": { "width": 1920, "height": 1080 }
    },
    "relative": { "x": 0.5, "y": 0.3 },
    "percentages": { "x": 50, "y": 30 }
  }
}
```

## Selector Prompts Array

AI-powered selector fallback. Used by click, type steps:

```json
{
  "selectorPrompts": [
    {
      "queryType": "manual | prompt",
      "value": "#css-selector",
      "backupType": "task | goal",
      "llmModel": "model-id",
      "mentorId": "mentor-id",
      "localMentorName": "MyMentor",
      "systemPrompt": "System prompt for AI backup",
      "userPrompt": "Find and click the submit button",
      "computerUseModel": "model-id"
    }
  ]
}
```

## Screenshot Object

Captured screenshot metadata:

```json
{
  "screenshot": {
    "path": "/path/to/screenshot.png",
    "step_number": 1,
    "storage": "filesystem | gcs",
    "bucket": "bucket-name",
    "objectKey": "key",
    "capturedAt": "ISO date"
  }
}
```

## Input Constraints

For fill steps with validation:

```json
{
  "constraints": {
    "maxLength": 255,
    "pattern": "^[^@]+@[^@]+$",
    "required": true,
    "type": "email"
  }
}
```

## REST API Config

Full REST client config for `rest_api` steps:

```json
{
  "restApiConfig": {
    "method": "GET | POST | PUT | PATCH | DELETE | HEAD | OPTIONS",
    "url": "https://api.example.com/endpoint",
    "queryParams": [{ "key": "page", "value": "1", "enabled": true }],
    "pathParams": [{ "key": "id", "value": "123" }],
    "headers": [{ "key": "Accept", "value": "application/json", "enabled": true }],
    "auth": {
      "type": "none | bearer | basic | apikey",
      "token": "jwt-token",
      "username": "user",
      "password": "pass",
      "apiKeyName": "X-API-Key",
      "apiKeyValue": "key-value",
      "apiKeyLocation": "header | query"
    },
    "bodyType": "none | json | raw | x-www-form-urlencoded | form-data",
    "body": "{\"name\": \"John\"}",
    "rawContentType": "application/xml",
    "formData": [{ "key": "file", "value": "path", "type": "text | file", "enabled": true }],
    "timeout": 30000,
    "responseVariableName": "apiResult"
  }
}
```

## LLM REST API Config

For `llm_rest_api` steps:

```json
{
  "llmRestApiConfig": {
    "modelSource": "existing | custom",
    "existingModelId": "saved-model-id",
    "providerType": "openai | openai_responses | anthropic | google | custom",
    "apiUrl": "https://api.openai.com/v1/chat/completions",
    "apiKey": "sk-...",
    "modelIdentifier": "gpt-4",
    "mentorId": "mentor-id",
    "localMentorName": "MyAssistant",
    "systemPrompt": "You are a helpful assistant",
    "userPrompt": "Summarize: {{step-abc.response}}",
    "responseFormat": "text | json",
    "temperature": 0.7,
    "maxTokens": 4096,
    "customPayloadFields": "{\"top_p\": 0.9}",
    "extractionMode": "auto | custom",
    "customExtractionPath": "choices[0].message.content",
    "timeout": 60000
  }
}
```

## API Call Config (Legacy)

For `api_call` steps:

```json
{
  "api_config": {
    "endpoint": "https://api.example.com/data",
    "method": "POST",
    "headers": { "Content-Type": "application/json" },
    "body": "{\"key\": \"value\"}",
    "auth": {
      "type": "none | basic | bearer | apiKey",
      "username": "user",
      "password": "pass",
      "token": "Bearer token",
      "apiKeyName": "X-API-Key"
    }
  }
}
```

## Data Source Read Config

For `data_source_read` steps:

```json
{
  "dataSourceReadConfig": {
    "connectorId": "connector-uuid",
    "kind": "postgres | mysql | mongodb | redis | elasticsearch | gemini_kb | http | graphql | office",
    "operation": "query | find | get | search | read",
    "provider": "google | microsoft",
    "app": "docs | sheets | slides | word | excel | powerpoint",
    "query": "SELECT * FROM users",
    "collection": "users",
    "key": "user:123",
    "index": "users-index",
    "fileId": "google-doc-id",
    "fileUrl": "https://docs.google.com/...",
    "range": "Sheet1!A1:D10",
    "sheetName": "Data",
    "slideSelector": "slide-1",
    "body": "{\"filter\": {}}",
    "variables": "{\"userId\": \"123\"}",
    "headers": [{ "key": "Authorization", "value": "Bearer ...", "enabled": true }],
    "scope": "agent | global_user",
    "knowledgeBaseFileIds": ["file-id-1"],
    "geminiProviderId": "provider-id"
  }
}
```

## Data Source Write Config

For `data_source_write` steps:

```json
{
  "dataSourceWriteConfig": {
    "connectorId": "connector-uuid",
    "kind": "postgres | mysql | mongodb | redis | elasticsearch | gemini_kb | http | graphql | office",
    "operation": "insert | update | upsert | delete",
    "provider": "google | microsoft",
    "app": "docs | sheets | slides | word | excel | powerpoint",
    "query": "INSERT INTO logs (msg) VALUES ($1)",
    "values": "[\"New entry\"]",
    "mode": "dry_run | execute",
    "maxAffectedRows": 100,
    "maxOperations": 10,
    "allowDelete": false,
    "allowRawWrite": false
  }
}
```

## Media Options

For `generate_media` steps:

```json
{
  "mediaType": "image | video | audio",
  "multimodalProvider": "provider-name",
  "mediaOptions": {
    "aspectRatio": "16:9",
    "imageSize": "1024x1024",
    "numberOfImages": 4,
    "duration": 10,
    "fps": 30,
    "resolution": "1080p",
    "audioDuration": 30,
    "format": "mp4",
    "audioModel": "model-name",
    "voiceId": "voice-id",
    "language": "en",
    "model": "specific-model",
    "customMode": true,
    "instrumental": false,
    "style": "cinematic",
    "title": "My Video",
    "personaId": "persona-id",
    "personaModel": "style_persona | voice_persona",
    "negativeTags": "blurry, low quality",
    "vocalGender": "m | f",
    "styleWeight": 0.8,
    "weirdnessConstraint": 0.2,
    "audioWeight": 0.5,
    "seed": 42,
    "negativePrompt": "ugly, distorted"
  }
}
```

## Video Stitch Config

For `stitch_videos` steps:

```json
{
  "videoStitchConfig": {
    "sourceMode": "auto | manual | hybrid",
    "clips": [
      {
        "id": "clip-1",
        "sourceStepId": "step-abc",
        "sourceStepNumber": 5,
        "sourceIndex": 0,
        "sourceUrl": "https://storage.example.com/video.mp4",
        "sourceLabel": "Intro clip",
        "trimStartSec": 0,
        "trimEndSec": 10
      }
    ],
    "output": {
      "audioPolicy": "keep | mute",
      "outputProfile": "match_first_clip | force_1080p_30 | force_720p_30"
    }
  }
}
```

## Sandbox Agent Config

For `coding_agent` and `computer_use_agent` steps:

```json
{
  "sandboxAgentConfig": {
    "agentType": "coding | computer_use",
    "codingModel": "claude_code | codex | amp | open_code | custom",
    "visionModel": "model-id",
    "gitRepoUrl": "https://github.com/user/repo",
    "gitBranch": "main",
    "sandboxProvider": "e2b",
    "sandboxProviderId": "sandbox-provider-123",
    "sandboxTimeout": 300000,
    "e2bTemplate": "template-id",
    "skillRuntime": {
      "enabled": true,
      "mentorIds": ["mentor-1"],
      "mountPath": "/workspace"
    }
  }
}
```

## API Output Config

For `api_output` steps:

```json
{
  "outputName": "productData",
  "outputSchema": "{\"type\": \"object\", \"properties\": {\"name\": {\"type\": \"string\"}}}",
  "outputFields": [
    { "key": "name", "value": "{{step-abc.response}}", "type": "string" },
    { "key": "price", "value": "{{step-def.response}}", "type": "number" }
  ]
}
```

## Navigate Login Verification Fields

For `navigate` steps with `requiresLogin: true`:

| Field | Type | Description |
|-------|------|-------------|
| `loginVerificationQueryType` | `'llm' \| 'selector'` | Verification method |
| `loginVerificationSelectors` | string[] | CSS/XPath selectors for login check |
| `loginVerificationSelectorCondition` | enum | `element_exists \| element_absent \| element_visible \| element_hidden \| text_contains` |
| `loginVerificationExpectation` | string | Expected text for `text_contains` |
| `loginVerificationMentorId` | string | Mentor ID for LLM check |
| `loginVerificationLocalMentorName` | string | Local mentor name |
| `loginVerificationSystemPrompt` | string | System prompt for LLM check |
| `loginVerificationUserPrompt` | string | User prompt for LLM check |
