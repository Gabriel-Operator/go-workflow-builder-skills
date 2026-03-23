#!/usr/bin/env npx tsx
/**
 * Outputs a minimal valid click step.
 * Usage: npx tsx server/skills/workflow-builder/actions/action-click/scripts/generate-example.ts
 */
const NOW = Date.now();
const example = {
  step_number: 2,
  action_type: "click",
  stepId: "step-a1b2c",
  label: "Click submit button",
  timestamp: NOW,
  selectors: ["#submit-btn", "button[type='submit']"],
};
console.log(JSON.stringify(example, null, 2));
process.exit(0);
