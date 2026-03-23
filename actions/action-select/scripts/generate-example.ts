#!/usr/bin/env npx tsx
/**
 * Outputs a minimal valid select step.
 * Usage: npx tsx server/skills/workflow-builder/actions/action-select/scripts/generate-example.ts
 */
const NOW = Date.now();
const example = {
  step_number: 2,
  action_type: "select",
  stepId: "step-a1b2c",
  label: "Select country",
  timestamp: NOW,
  selectors: ["select#country", "select[name='country']"],
  value: "US",
};
console.log(JSON.stringify(example, null, 2));
process.exit(0);
