#!/usr/bin/env npx tsx
/**
 * Outputs a minimal valid wait step.
 * Usage: npx tsx server/skills/workflow-builder/actions/action-wait/scripts/generate-example.ts
 */
const NOW = Date.now();
const example = {
  step_number: 1,
  action_type: "wait",
  stepId: "step-a1b2c",
  label: "Wait 2 seconds for page load",
  timestamp: NOW,
  value: "2",  // duration in seconds as a string; omit to default to 1 s
};
console.log(JSON.stringify(example, null, 2));
process.exit(0);
