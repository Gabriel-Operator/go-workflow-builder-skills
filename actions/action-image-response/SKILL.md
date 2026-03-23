---
name: action-image-response
description: >
  Define an image_response step that captures images of the current browser page.
  Supports viewport-only or full-page capture with configurable maximum image count.
  Useful for archiving page visuals, feeding images to downstream LLM analysis,
  or generating visual reports.
metadata:
  author: gabriel-operator
  version: "1.0"
---

# Image Response

## Action type

- **action_type**: `image_response`
- **Requires browser**: Yes

## What it does

The image response step captures one or more images of the current browser page. It can capture just the visible viewport or the entire scrollable page. Captured images are stored as step output and can be referenced by downstream steps. This is useful for visual archiving, generating reports, or feeding page images to LLM analysis steps.

## Required fields

| Field | Type | Description |
|-------|------|-------------|
| `step_number` | number | Sequential step position (starts at 1) |
| `action_type` | string | Must be `"image_response"` |
| `stepId` | string | Unique ID, format `step-XXXXX` (hex) |
| `timestamp` | number | Unix timestamp in milliseconds |

## Optional fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `fullPage` | boolean | true | Capture entire scrollable page (`true`) or viewport only (`false`) |
| `maxImages` | number | 10 | Maximum number of images to capture (max: 100) |

## Complete JSON example

```json
{
  "step_number": 2,
  "action_type": "image_response",
  "stepId": "step-f1a9c",
  "timestamp": 1710000000000,
  "fullPage": true,
  "maxImages": 5
}
```

## Field details

- **fullPage**: When `true`, the browser scrolls through the entire page and stitches the result into full-length captures. When `false`, only the current viewport is captured. Full-page captures on very long pages may produce large images.
- **maxImages**: Caps the number of images stored. For full-page captures of very tall pages, the page may be split into multiple images up to this limit. Maximum allowed value is 100.

## Common patterns

### Capture page for visual report
```json
[
  { "step_number": 1, "action_type": "navigate", "stepId": "step-00001", "timestamp": 1710000000000, "url": "https://analytics.example.com/report" },
  { "step_number": 2, "action_type": "image_response", "stepId": "step-f1a9c", "timestamp": 1710000000001, "fullPage": true, "maxImages": 10 },
  { "step_number": 3, "action_type": "notification", "stepId": "step-00003", "timestamp": 1710000000002 }
]
```

## Gotchas

- Full-page screenshots on pages with lazy-loaded content may miss images or sections that only load on scroll. Consider adding scroll steps beforehand to trigger lazy loading.
- Setting `maxImages` above 100 will be clamped to 100 by the backend.
- Very tall pages with `fullPage: true` produce large image files which may increase storage costs and slow downstream processing.
