#!/usr/bin/env npx tsx
/**
 * Outputs a minimal valid type step.
 * Usage: npx tsx server/skills/workflow-builder/actions/action-type/scripts/generate-example.ts
 */
const NOW = Date.now();
const example = {
  step_number: 2,
  action_type: "type",
  stepId: "step-a1b2c",
  label: "Type search query",
  timestamp: NOW,
  selectors: ["#search-box", "input[aria-label='Search']"],
  value: "example search term",
};
console.log(JSON.stringify(example, null, 2));
process.exit(0);
