#!/usr/bin/env npx tsx
/**
 * Outputs a minimal valid image_response step.
 * Usage: npx tsx server/skills/workflow-builder/actions/action-image-response/scripts/generate-example.ts
 */
const NOW = Date.now();
const example = {
  step_number: 2,
  action_type: "image_response",
  stepId: "step-a1b2c",
  label: "Capture full page images",
  timestamp: NOW,
  fullPage: true,
  maxImages: 5,
};
console.log(JSON.stringify(example, null, 2));
process.exit(0);
