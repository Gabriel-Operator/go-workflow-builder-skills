---
name: action-rest-api
description: >
  Full-featured REST client (Postman-like) for making HTTP requests without a
  browser. Supports all methods, auth types (bearer, basic, API key), body
  formats (JSON, form-data, raw, x-www-form-urlencoded), query/path params,
  custom headers, and response variable capture for downstream steps.
metadata:
  author: gabriel-operator
  version: "1.0"
---

# action-rest-api

## Action overview

| Property | Value |
|----------|-------|
| `action_type` | `rest_api` |
| Requires browser | No |

Makes an HTTP request to any endpoint with full control over method, headers, authentication, body, and parameters. The response can be stored in a named variable for use by downstream steps via `{{stepId.variable}}` templates. This is the go-to action for API integrations, webhooks, and data fetching.

## Required fields

| Field | Type | Description |
|-------|------|-------------|
| `step_number` | number | Sequential step index (starts at 1) |
| `action_type` | string | Must be `"rest_api"` |
| `stepId` | string | Unique step identifier (e.g. `step-a7b8c`) |
| `restApiConfig.method` | string | HTTP method: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `HEAD`, `OPTIONS` |
| `restApiConfig.url` | string | Request URL. Supports `{{stepId.variable}}` templates. |

## Optional fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `restApiConfig.queryParams` | object[] | `[]` | Array of `{ key, value, enabled }` query parameters |
| `restApiConfig.pathParams` | object[] | `[]` | Array of `{ key, value }` path parameters (replaces `:key` in URL) |
| `restApiConfig.headers` | object[] | `[]` | Array of `{ key, value, enabled }` custom headers |
| `restApiConfig.auth` | object | `{ type: "none" }` | Authentication config (see field details) |
| `restApiConfig.bodyType` | string | `"none"` | One of: `none`, `json`, `raw`, `x-www-form-urlencoded`, `form-data` |
| `restApiConfig.body` | string | — | Request body (for `json`, `raw`, `x-www-form-urlencoded`) |
| `restApiConfig.rawContentType` | string | — | Content-Type for `raw` body (e.g. `text/xml`) |
| `restApiConfig.formData` | object[] | `[]` | Array of `{ key, value, type, enabled }` for `form-data` body |
| `restApiConfig.timeout` | number | — | Request timeout in milliseconds |
| `restApiConfig.responseVariableName` | string | — | Name to store the response under for downstream access |
| `label` | string | — | Human-readable step label |
| `readOnly` | boolean | `false` | Mark step as view-only |
| `timestamp` | number | — | Unix timestamp in milliseconds |

## Complete JSON example

```json
{
  "step_number": 3,
  "action_type": "rest_api",
  "stepId": "step-a7b8c",
  "restApiConfig": {
    "method": "POST",
    "url": "https://api.example.com/v2/users",
    "queryParams": [
      { "key": "notify", "value": "true", "enabled": true }
    ],
    "headers": [
      { "key": "X-Request-Id", "value": "{{step-a1b2c.requestId}}", "enabled": true },
      { "key": "Accept", "value": "application/json", "enabled": true }
    ],
    "auth": {
      "type": "bearer",
      "token": "{{step-714da.accessToken}}"
    },
    "bodyType": "json",
    "body": "{\"name\": \"Jane Doe\", \"email\": \"jane@example.com\", \"role\": \"admin\"}",
    "timeout": 30000,
    "responseVariableName": "createUserResponse"
  },
  "label": "Create new user via API",
  "timestamp": 1710000003000
}
```

## Field details

### `restApiConfig.auth`
Authentication configuration object. The `type` field determines which other fields are required.

| `type` | Additional fields | Description |
|--------|-------------------|-------------|
| `none` | — | No authentication |
| `bearer` | `token` | Bearer token in Authorization header |
| `basic` | `username`, `password` | HTTP Basic auth |
| `apikey` | `apiKeyName`, `apiKeyValue`, `apiKeyLocation` | API key sent as header or query param |

**API key location:**
- `"header"` — sent as a custom header with name `apiKeyName`
- `"query"` — appended as a query parameter

### `restApiConfig.bodyType`
| Value | `body` field contains | Notes |
|-------|----------------------|-------|
| `none` | — | No request body |
| `json` | JSON string | Auto-sets `Content-Type: application/json` |
| `raw` | Raw string | Set `rawContentType` for the Content-Type |
| `x-www-form-urlencoded` | URL-encoded string | Auto-sets `Content-Type: application/x-www-form-urlencoded` |
| `form-data` | — | Use `formData` array instead of `body` |

### `restApiConfig.formData`
Each entry in the array:

| Sub-field | Type | Description |
|-----------|------|-------------|
| `key` | string | Form field name |
| `value` | string | Form field value (or file path for file type) |
| `type` | string | `"text"` or `"file"` |
| `enabled` | boolean | Whether this field is included |

### `restApiConfig.responseVariableName`
Stores the full response (status, headers, body) under this name. Access in downstream steps:
- `{{step-a7b8c.createUserResponse}}` — the full response body
- Works in URL, headers, body, and prompt fields of subsequent steps

### Template interpolation
All string values in `restApiConfig` support `{{stepId.variable}}` templates, including `url`, `body`, header values, query param values, and auth tokens.

## Common patterns

### 1. Simple GET request
```json
{
  "step_number": 2,
  "action_type": "rest_api",
  "stepId": "step-r0001",
  "restApiConfig": {
    "method": "GET",
    "url": "https://api.example.com/products",
    "responseVariableName": "products"
  }
}
```

### 2. POST with Basic auth and form data
```json
{
  "step_number": 4,
  "action_type": "rest_api",
  "stepId": "step-r0002",
  "restApiConfig": {
    "method": "POST",
    "url": "https://api.example.com/upload",
    "auth": {
      "type": "basic",
      "username": "admin",
      "password": "{{step-714da.dbPassword}}"
    },
    "bodyType": "form-data",
    "formData": [
      { "key": "file", "value": "/tmp/report.csv", "type": "file", "enabled": true },
      { "key": "description", "value": "Monthly report", "type": "text", "enabled": true }
    ]
  }
}
```

### 3. Chained API calls with variable passing
```json
{
  "step_number": 5,
  "action_type": "rest_api",
  "stepId": "step-r0003",
  "restApiConfig": {
    "method": "GET",
    "url": "https://api.example.com/users/{{step-r0001.userId}}/orders",
    "auth": {
      "type": "bearer",
      "token": "{{step-r0001.token}}"
    },
    "responseVariableName": "userOrders"
  }
}
```

## Gotchas and edge cases

- **`body` must be a string** — even for JSON payloads, the value is a JSON string (escaped), not a raw object. Wrap your JSON in quotes: `"{\"key\": \"value\"}"`.
- **`enabled: false`** on headers, query params, or form data entries excludes them from the request. Useful for toggling params without removing them.
- **Template resolution failures** — if a `{{stepId.variable}}` reference points to a non-existent step or variable, the raw template string is sent as-is, which usually causes a 400 error.
- **No automatic retries** — if the request fails (network error, timeout), the step fails. Use guards or groups for retry logic.
- **File uploads** — `form-data` with `type: "file"` expects a server-side file path. Files from browser downloads (via `action-download`) are stored in a temp directory; reference that path.
- **Response size** — very large responses are stored in full. Be mindful of memory when storing multi-MB responses as variables.
- **`timeout`** — if omitted, the default server timeout applies (typically 30 seconds). Set explicitly for slow APIs.
