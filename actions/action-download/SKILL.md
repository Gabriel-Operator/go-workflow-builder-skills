---
name: action-download
description: >
  Download a file by clicking a download link or button on the page. The runtime intercepts
  the browser's download event and saves the file to the session's working directory. Use
  this to capture exported CSVs, PDFs, images, or any file triggered by a click.
  Requires an active browser session.
metadata:
  author: gabriel-operator
  version: "1.0"
compatibility: Requires an active browser session.
---

# Action: Download

## Action type and browser requirement

| Property | Value |
|----------|-------|
| `action_type` | `download` |
| Requires browser | Yes |

## What it does

Clicks a download trigger element (link, button, etc.) and captures the resulting file download. The runtime intercepts the browser's download event, saves the file to the session's working directory, and makes it available for subsequent steps (e.g., `upload` with `uploadType: "session"`).

## Required fields

| Field | Type | Description |
|-------|------|-------------|
| `step_number` | number | Sequential step position starting from 1 |
| `action_type` | string | Must be `"download"` |
| `stepId` | string | Unique step identifier (format: `step-XXXXX`, hex chars) |
| `timestamp` | number | Unix timestamp in milliseconds |

## Optional fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `selectors` | string[] | `[]` | CSS selectors for the element that triggers the download when clicked. Tried in order. |
| `coordinates` | object | — | `{ "x": number, "y": number }` — fallback coordinates for the download trigger element. |

## Complete JSON example

```json
{
  "step_number": 5,
  "action_type": "download",
  "stepId": "step-c4d5e",
  "timestamp": 1710000000000,
  "selectors": [
    "a[href$='.csv']",
    "button.export-btn",
    "[data-testid='download-report']"
  ]
}
```

## Field details

### `selectors`
CSS selectors for the element that initiates the download. This could be:
- An `<a>` tag with a `download` attribute or a direct file URL
- A `<button>` that triggers a JavaScript-initiated download
- Any clickable element that results in a file download

The runtime clicks the first matching element and waits for the download event.

## Common patterns

### Export data and verify with a screenshot
```json
[
  {
    "step_number": 1,
    "action_type": "click",
    "stepId": "step-f1a2b",
    "timestamp": 1710000000000,
    "selectors": ["button#generate-report"]
  },
  {
    "step_number": 2,
    "action_type": "wait",
    "stepId": "step-c3d4e",
    "timestamp": 1710000001000,
    "value": "3000"
  },
  {
    "step_number": 3,
    "action_type": "download",
    "stepId": "step-f5g6h",
    "timestamp": 1710000002000,
    "selectors": ["a.download-link"]
  }
]
```

### Download then upload to another site
```json
[
  {
    "step_number": 1,
    "action_type": "download",
    "stepId": "step-i7j8k",
    "timestamp": 1710000000000,
    "selectors": ["a[download='report.pdf']"]
  },
  {
    "step_number": 2,
    "action_type": "navigate",
    "stepId": "step-l9m0n",
    "timestamp": 1710000001000,
    "url": "https://partner.example.com/upload"
  },
  {
    "step_number": 3,
    "action_type": "upload",
    "stepId": "step-o1p2q",
    "timestamp": 1710000002000,
    "selectors": ["input[type='file']"],
    "value": "report.pdf",
    "uploadType": "session"
  }
]
```

## Gotchas and edge cases

- **JavaScript-triggered downloads**: Some downloads are initiated via JavaScript (e.g., `window.open()` or `Blob` URLs) rather than a direct link. The runtime handles these, but the click must target the element that triggers the JavaScript.
- **Download timing**: Large files may take time to download. The runtime waits for the download to complete, but if a subsequent step depends on the file, consider adding a `wait` step as a safety margin.
- **Popup blockers**: Downloads that open a new window may be blocked. The runtime typically handles this, but if downloads fail, check if the site uses a new-window pattern.
- **Filename availability**: The downloaded file is saved with its original filename. Use this exact name when referencing the file in later `upload` steps with `uploadType: "session"`.
- **Multiple downloads**: Each `download` step captures one file. If a single click triggers multiple downloads, only the first is reliably captured.
