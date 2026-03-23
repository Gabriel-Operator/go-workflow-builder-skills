#!/usr/bin/env npx tsx
/**
 * Outputs a minimal valid keyboard_type step.
 * Usage: npx tsx server/skills/workflow-builder/actions/action-keyboard-type/scripts/generate-example.ts
 */
const NOW = Date.now();
const example = {
  step_number: 2,
  action_type: "keyboard_type",
  stepId: "step-a1b2c",
  label: "Type location into autocomplete",
  timestamp: NOW,
  value: "San Francisco, CA",
};
console.log(JSON.stringify(example, null, 2));
process.exit(0);
