---
name: action-stitch-videos
description: >
  Define a stitch_videos step that combines multiple video clips into a single output
  video. Supports auto-sourcing from previous steps, manual clip specification, or
  hybrid mode. Includes per-clip trimming, audio policies, and output profile
  configuration.
metadata:
  author: gabriel-operator
  version: "1.0"
---

# Stitch Videos

## Action type

- **action_type**: `stitch_videos`
- **Requires browser**: No

## What it does

The stitch videos step combines multiple video clips into a single output video. Clips can be automatically sourced from previous steps, manually specified with URLs, or a hybrid of both. Each clip supports trimming with start and end points. The output can be configured with audio policies and resolution profiles.

## Required fields

| Field | Type | Description |
|-------|------|-------------|
| `step_number` | number | Sequential step position (starts at 1) |
| `action_type` | string | Must be `"stitch_videos"` |
| `stepId` | string | Unique ID, format `step-XXXXX` (hex) |
| `timestamp` | number | Unix timestamp in milliseconds |

## Optional fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `videoStitchConfig` | object | — | Video stitching configuration (see below) |
| `videoStitchConfig.sourceMode` | string | — | How to source clips: `"auto"`, `"manual"`, `"hybrid"` |
| `videoStitchConfig.clips` | array | — | Array of clip objects (for manual/hybrid mode) |
| `videoStitchConfig.output` | object | — | Output configuration |

### Clip object fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique clip identifier |
| `sourceStepId` | string | Step ID that produced this clip |
| `sourceStepNumber` | number | Step number that produced this clip |
| `sourceIndex` | number | Index within the source step's outputs (when a step produces multiple clips) |
| `sourceUrl` | string | Direct URL to the video clip |
| `sourceLabel` | string | Human-readable label for the clip |
| `trimStartSec` | number | Start trim point in seconds |
| `trimEndSec` | number | End trim point in seconds |

### Output object fields

| Field | Type | Description |
|-------|------|-------------|
| `audioPolicy` | string | `"keep"` to preserve audio, `"mute"` to strip all audio |
| `outputProfile` | string | `"match_first_clip"`, `"force_1080p_30"`, or `"force_720p_30"` |

## Complete JSON example

```json
{
  "step_number": 4,
  "action_type": "stitch_videos",
  "stepId": "step-sv82c",
  "timestamp": 1710000000000,
  "videoStitchConfig": {
    "sourceMode": "manual",
    "clips": [
      {
        "id": "clip-1",
        "sourceStepId": "step-vid01",
        "sourceStepNumber": 1,
        "sourceIndex": 0,
        "sourceLabel": "Intro",
        "trimStartSec": 0,
        "trimEndSec": 3
      },
      {
        "id": "clip-2",
        "sourceStepId": "step-vid02",
        "sourceStepNumber": 2,
        "sourceIndex": 0,
        "sourceLabel": "Main content",
        "trimStartSec": 0.5,
        "trimEndSec": 4.5
      },
      {
        "id": "clip-3",
        "sourceUrl": "https://storage.example.com/outro.mp4",
        "sourceLabel": "Outro"
      }
    ],
    "output": {
      "audioPolicy": "keep",
      "outputProfile": "force_1080p_30"
    }
  }
}
```

## Field details

- **sourceMode**: `"auto"` collects all video outputs from previous steps in order. `"manual"` uses only the explicitly listed `clips`. `"hybrid"` starts with auto-collected clips and merges in any manually specified ones.
- **trimStartSec / trimEndSec**: Trim points in seconds (supports decimals). Omit both to use the full clip. Omit `trimEndSec` to trim only the beginning.
- **outputProfile**: `"match_first_clip"` uses the resolution and frame rate of the first clip. `"force_1080p_30"` re-encodes all clips to 1920x1080 at 30fps. `"force_720p_30"` re-encodes to 1280x720 at 30fps.
- **audioPolicy**: `"keep"` preserves audio tracks from all clips. `"mute"` strips all audio from the final output.
- **sourceUrl**: Direct URL to a video file. Use this for clips not produced by previous workflow steps (e.g., pre-existing assets).

## Common patterns

### Generate and stitch
```json
[
  { "step_number": 1, "action_type": "generate_media", "stepId": "step-vid01", "timestamp": 1710000000000, "mediaType": "video", "userPrompt": "Intro scene: sunrise over city skyline" },
  { "step_number": 2, "action_type": "generate_media", "stepId": "step-vid02", "timestamp": 1710000000001, "mediaType": "video", "userPrompt": "Main scene: busy office with people working" },
  { "step_number": 3, "action_type": "generate_media", "stepId": "step-vid03", "timestamp": 1710000000002, "mediaType": "video", "userPrompt": "Outro scene: company logo on gradient background" },
  { "step_number": 4, "action_type": "stitch_videos", "stepId": "step-sv82c", "timestamp": 1710000000003, "videoStitchConfig": { "sourceMode": "auto", "output": { "audioPolicy": "mute", "outputProfile": "force_1080p_30" } } }
]
```

## Gotchas

- In `"auto"` mode, the step collects all video outputs from all previous steps. If your workflow has video outputs you do not want stitched (e.g., a test render), use `"manual"` mode instead.
- Clips with different resolutions and frame rates will be re-encoded to match the `outputProfile`. This adds processing time. Use `"match_first_clip"` for fastest processing when all clips have the same format.
- `trimStartSec` and `trimEndSec` that exceed the clip duration will be clamped silently. A `trimStartSec` greater than the clip length results in an empty clip.
- The `sourceIndex` field is zero-based. If a `generate_media` step produces 3 images, they are at indices 0, 1, and 2.
