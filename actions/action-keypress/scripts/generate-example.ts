#!/usr/bin/env npx tsx
/**
 * Outputs a minimal valid keypress step.
 * Usage: npx tsx server/skills/workflow-builder/actions/action-keypress/scripts/generate-example.ts
 */
const NOW = Date.now();
const example = {
  step_number: 2,
  action_type: "keypress",
  stepId: "step-a1b2c",
  label: "Press Enter to submit",
  timestamp: NOW,
  value: "Enter",
};
console.log(JSON.stringify(example, null, 2));
process.exit(0);
