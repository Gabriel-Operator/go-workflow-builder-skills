#!/usr/bin/env npx tsx
/**
 * Outputs a minimal valid upload step.
 * Usage: npx tsx server/skills/workflow-builder/actions/action-upload/scripts/generate-example.ts
 */
const NOW = Date.now();
const example = {
  step_number: 2,
  action_type: "upload",
  stepId: "step-a1b2c",
  label: "Upload document",
  timestamp: NOW,
  selectors: ["input[type='file']"],
  value: "invoice-2024.pdf",
  uploadType: "file",
};
console.log(JSON.stringify(example, null, 2));
process.exit(0);
