#!/usr/bin/env npx tsx
/**
 * Outputs a minimal valid generate_media step.
 * Usage: npx tsx server/skills/workflow-builder/actions/action-generate-media/scripts/generate-example.ts
 */
const NOW = Date.now();
const example = {
  step_number: 2,
  action_type: "generate_media",
  stepId: "step-a1b2c",
  label: "Generate video clip",
  timestamp: NOW,
  mediaType: "video",
  userPrompt: "A drone shot flying over a tropical coastline at sunset, cinematic lighting",
  multimodalProvider: "runway",
  mediaOptions: {
    aspectRatio: "16:9",
    duration: 5,
    fps: 24,
    resolution: "1080p",
  },
};
console.log(JSON.stringify(example, null, 2));
process.exit(0);
