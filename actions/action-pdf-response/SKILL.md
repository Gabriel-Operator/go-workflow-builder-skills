---
name: action-pdf-response
description: >
  Define a pdf_response step that captures the current browser page as a PDF document.
  Supports viewport-only or full-page capture. Useful for archiving page content,
  generating printable reports, or saving page state as a document artifact.
metadata:
  author: gabriel-operator
  version: "1.0"
---

# PDF Response

## Action type

- **action_type**: `pdf_response`
- **Requires browser**: Yes

## What it does

The PDF response step renders the current browser page as a PDF document. It uses the browser's built-in print-to-PDF functionality to produce a high-fidelity document capture. The generated PDF is stored as step output and can be referenced by downstream steps or sent via notification.

## Required fields

| Field | Type | Description |
|-------|------|-------------|
| `step_number` | number | Sequential step position (starts at 1) |
| `action_type` | string | Must be `"pdf_response"` |
| `stepId` | string | Unique ID, format `step-XXXXX` (hex) |
| `timestamp` | number | Unix timestamp in milliseconds |

## Optional fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `fullPage` | boolean | true | Capture entire scrollable page (`true`) or viewport only (`false`) |

## Complete JSON example

```json
{
  "step_number": 2,
  "action_type": "pdf_response",
  "stepId": "step-e8d4f",
  "timestamp": 1710000000000,
  "fullPage": true
}
```

## Field details

- **fullPage**: When `true`, the PDF includes the entire page content regardless of viewport size. When `false`, only the visible viewport area is rendered into the PDF.

## Common patterns

### Archive a web page as PDF
```json
[
  { "step_number": 1, "action_type": "navigate", "stepId": "step-00001", "timestamp": 1710000000000, "url": "https://example.com/invoice/12345" },
  { "step_number": 2, "action_type": "pdf_response", "stepId": "step-e8d4f", "timestamp": 1710000000001, "fullPage": true },
  { "step_number": 3, "action_type": "notification", "stepId": "step-00003", "timestamp": 1710000000002 }
]
```

## Gotchas

- Pages with `@media print` CSS rules may render differently in PDF than on screen. Elements hidden in print stylesheets will not appear.
- Dynamically loaded content (e.g., infinite scroll, lazy images) that has not rendered at capture time will be missing from the PDF. Scroll or wait first if needed.
- Some pages block printing via JavaScript. If the PDF comes back blank or incomplete, the page may be actively preventing print capture.
