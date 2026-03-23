#!/usr/bin/env npx tsx
/**
 * Outputs a minimal valid screenshot step.
 * Usage: npx tsx server/skills/workflow-builder/actions/action-screenshot/scripts/generate-example.ts
 */
const NOW = Date.now();
const example = {
  step_number: 1,
  action_type: "screenshot",
  stepId: "step-a1b2c",
  label: "Capture page state",
  timestamp: NOW,
};
console.log(JSON.stringify(example, null, 2));
process.exit(0);
