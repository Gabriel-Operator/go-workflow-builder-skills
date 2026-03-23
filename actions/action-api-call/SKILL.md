---
name: action-api-call
description: >
  Define an api_call step that makes a simple HTTP API request. This is the legacy
  format for API calls — use rest_api for full-featured requests. Supports GET, POST,
  PUT, DELETE with basic auth, bearer token, or API key authentication. Response is
  persisted as step variables.
metadata:
  author: gabriel-operator
  version: "1.0"
---

# API Call

## Action type

- **action_type**: `api_call`
- **Requires browser**: No

## What it does

The API call step makes a simple HTTP request to an external endpoint. It supports common HTTP methods and authentication schemes. This is the legacy, simplified format for API calls. For full-featured API requests with advanced headers, query params, and request body options, use the `rest_api` action type instead.

## Required fields

| Field | Type | Description |
|-------|------|-------------|
| `step_number` | number | Sequential step position (starts at 1) |
| `action_type` | string | Must be `"api_call"` |
| `stepId` | string | Unique ID, format `step-XXXXX` (hex) |
| `timestamp` | number | Unix timestamp in milliseconds |

## Optional fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `api_config` | object | — | API request configuration (see below) |
| `api_config.endpoint` | string | — | Full URL to call |
| `api_config.method` | string | — | HTTP method (`GET`, `POST`, `PUT`, `DELETE`, etc.) |
| `api_config.headers` | Record<string, string> | — | Key-value pairs for request headers |
| `api_config.body` | string \| object | — | Request body (string or JSON object) |
| `api_config.auth` | object | — | Authentication configuration |
| `api_config.auth.type` | string | `"none"` | Auth type: `none`, `basic`, `bearer`, `apiKey` |
| `api_config.auth.username` | string | — | Username for `basic` auth |
| `api_config.auth.password` | string | — | Password for `basic` auth |
| `api_config.auth.token` | string | — | Token for `bearer` auth |
| `api_config.auth.apiKeyName` | string | — | Header name for `apiKey` auth |

## Complete JSON example

```json
{
  "step_number": 2,
  "action_type": "api_call",
  "stepId": "step-b7c2d",
  "timestamp": 1710000000000,
  "api_config": {
    "endpoint": "https://api.example.com/users",
    "method": "POST",
    "headers": {
      "Content-Type": "application/json",
      "X-Custom-Header": "value"
    },
    "body": {
      "name": "{{step-00001.userName}}",
      "email": "{{step-00001.userEmail}}"
    },
    "auth": {
      "type": "bearer",
      "token": "sk-abc123"
    }
  }
}
```

## Field details

- **api_config.auth.type**: Determines which auth fields are used. `basic` requires `username` + `password`. `bearer` requires `token`. `apiKey` requires `token` + `apiKeyName` (the token value is sent in a header named by `apiKeyName`).
- **api_config.body**: Can be a JSON object or a string. When an object, it is serialized as JSON. When a string, it is sent as-is (useful for form-encoded or XML payloads).
- **api_config.headers**: A flat key-value record. Template variables are supported in both keys and values.

## Common patterns

### Simple GET with bearer auth
```json
{
  "step_number": 1,
  "action_type": "api_call",
  "stepId": "step-a1111",
  "timestamp": 1710000000000,
  "api_config": {
    "endpoint": "https://api.example.com/me",
    "method": "GET",
    "auth": {
      "type": "bearer",
      "token": "sk-my-token"
    }
  }
}
```

## Gotchas

- This is the legacy API call format. For new workflows, prefer `rest_api` which supports query parameters, multiple body formats, response extraction, and more.
- The `api_config.auth.apiKeyName` field specifies the HTTP header name (e.g., `"X-API-Key"`), not the key value itself. The actual key value goes in `token`.
- Template variables in `body` are string-interpolated. If the interpolated value needs to be a number in JSON, wrap the template in a string and handle parsing downstream.
