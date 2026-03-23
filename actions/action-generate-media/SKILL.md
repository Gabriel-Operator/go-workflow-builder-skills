---
name: action-generate-media
description: >
  Define a generate_media step that creates images, video, or audio using AI providers.
  Supports text-to-image, image-to-video, text-to-audio, and other generation modes.
  Offers extensive media options for aspect ratio, resolution, duration, voice, style,
  and more. Output is stored as step artifacts.
metadata:
  author: gabriel-operator
  version: "1.0"
---

# Generate Media

## Action type

- **action_type**: `generate_media`
- **Requires browser**: No

## What it does

The generate media step creates images, video, or audio content using AI generation providers. It supports multiple generation modes including text-to-image, image-to-video (with first/last frame control), text-to-audio, and text-to-music. Generated media files are stored as step artifacts and can be referenced by downstream steps for stitching, notification, or further processing.

## Required fields

| Field | Type | Description |
|-------|------|-------------|
| `step_number` | number | Sequential step position (starts at 1) |
| `action_type` | string | Must be `"generate_media"` |
| `stepId` | string | Unique ID, format `step-XXXXX` (hex) |
| `timestamp` | number | Unix timestamp in milliseconds |

## Optional fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `mediaType` | string | — | Type of media to generate: `"image"`, `"video"`, `"audio"` |
| `userPrompt` | string | — | Text prompt describing the desired media |
| `multimodalProvider` | string | — | AI provider to use for generation |
| `imageUrl` | string | — | Input image URL for image-to-video or style reference |
| `imageRole` | string | — | Role of `imageUrl`: `"first_frame"`, `"last_frame"`, `"reference"` |
| `firstFrameImageUrl` | string | — | Explicit first frame image URL for video generation |
| `lastFrameImageUrl` | string | — | Explicit last frame image URL for video generation |
| `referenceImageUrls` | array | — | Array of reference image URLs for style guidance |
| `mediaOptions` | object | — | Detailed generation options (see below) |

### mediaOptions fields

| Field | Type | Description |
|-------|------|-------------|
| `aspectRatio` | string | Aspect ratio (e.g., `"16:9"`, `"1:1"`, `"9:16"`) |
| `imageSize` | string | Image dimensions (e.g., `"1024x1024"`) |
| `numberOfImages` | number | Number of images to generate |
| `duration` | number | Video duration in seconds |
| `fps` | number | Video frames per second |
| `resolution` | string | Video resolution (e.g., `"1080p"`) |
| `audioDuration` | number | Audio duration in seconds |
| `format` | string | Output format (e.g., `"mp3"`, `"wav"`, `"mp4"`) |
| `audioModel` | string | Audio generation model |
| `voiceId` | string | Voice identifier for text-to-speech |
| `language` | string | Language code (e.g., `"en"`, `"es"`) |
| `model` | string | Specific model name to use |
| `customMode` | string | Custom generation mode |
| `instrumental` | boolean | Generate instrumental music (no vocals) |
| `style` | string | Style descriptor (e.g., `"cinematic"`, `"anime"`) |
| `title` | string | Title for generated music/audio |
| `personaId` | string | Persona ID for voice/style personas |
| `personaModel` | string | Persona type: `"style_persona"` or `"voice_persona"` |
| `negativeTags` | string | Tags for content to avoid |
| `vocalGender` | string | Vocal gender: `"m"` or `"f"` |
| `styleWeight` | number | Weight for style influence |
| `weirdnessConstraint` | number | Controls generation creativity/randomness |
| `audioWeight` | number | Weight for audio influence |
| `seed` | number | Random seed for reproducible generation |
| `negativePrompt` | string | Description of what to avoid in the output |

## Complete JSON example

```json
{
  "step_number": 2,
  "action_type": "generate_media",
  "stepId": "step-g3m7b",
  "timestamp": 1710000000000,
  "mediaType": "video",
  "userPrompt": "A drone shot flying over a tropical coastline at sunset, cinematic lighting",
  "multimodalProvider": "runway",
  "firstFrameImageUrl": "{{step-00001.capturedImageUrl}}",
  "mediaOptions": {
    "aspectRatio": "16:9",
    "duration": 5,
    "fps": 24,
    "resolution": "1080p"
  }
}
```

## Field details

- **mediaType**: Determines which generation pipeline is used. `"image"` for still images, `"video"` for video clips, `"audio"` for speech, music, or sound effects.
- **imageRole**: When providing a single `imageUrl`, this field tells the provider how to use it. `"first_frame"` uses it as the starting frame of a video. `"last_frame"` uses it as the ending frame. `"reference"` uses it as a style or content reference.
- **firstFrameImageUrl** / **lastFrameImageUrl**: For video generation, specify start and end frames explicitly. These take precedence over `imageUrl` + `imageRole`.
- **referenceImageUrls**: Array of URLs for style transfer or content guidance. The provider blends these references into the output.
- **personaModel**: `"style_persona"` applies a visual style. `"voice_persona"` applies a voice profile for audio generation.
- **negativePrompt**: Tells the model what to avoid (e.g., `"blurry, low quality, text, watermark"`). Not all providers support this.
- **seed**: For reproducible results. Same prompt + same seed = same output (when the provider supports deterministic generation).

## Common patterns

### Generate image and send as notification
```json
[
  { "step_number": 1, "action_type": "generate_media", "stepId": "step-g3m7b", "timestamp": 1710000000000, "mediaType": "image", "userPrompt": "A professional product photo of a smartwatch on a marble surface", "mediaOptions": { "aspectRatio": "1:1", "imageSize": "1024x1024", "numberOfImages": 1 } },
  { "step_number": 2, "action_type": "notification", "stepId": "step-00002", "timestamp": 1710000000001 }
]
```

### Image-to-video pipeline
```json
[
  { "step_number": 1, "action_type": "generate_media", "stepId": "step-img01", "timestamp": 1710000000000, "mediaType": "image", "userPrompt": "A serene mountain lake at dawn" },
  { "step_number": 2, "action_type": "generate_media", "stepId": "step-vid01", "timestamp": 1710000000001, "mediaType": "video", "userPrompt": "Gentle ripples on the lake with birds flying across", "firstFrameImageUrl": "{{step-img01.imageUrl}}", "mediaOptions": { "duration": 5, "aspectRatio": "16:9" } }
]
```

## Gotchas

- Generation times vary significantly by provider and media type. Video generation can take minutes. Set appropriate timeouts in the workflow.
- Not all `mediaOptions` apply to all media types. For example, `voiceId` is only relevant for audio, and `fps` is only relevant for video. Irrelevant fields are silently ignored.
- The `multimodalProvider` determines which options are actually supported. Providers have different capabilities — check provider documentation for supported aspect ratios, resolutions, and features.
- Template variables in `userPrompt` are resolved at runtime. If the referenced step output is very long, it may exceed the provider's prompt length limit.
