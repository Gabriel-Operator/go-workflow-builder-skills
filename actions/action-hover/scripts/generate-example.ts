#!/usr/bin/env npx tsx
/**
 * Outputs a minimal valid hover step.
 * Usage: npx tsx server/skills/workflow-builder/actions/action-hover/scripts/generate-example.ts
 */
const NOW = Date.now();
const example = {
  step_number: 1,
  action_type: "hover",
  stepId: "step-a1b2c",
  label: "Hover over navigation dropdown",
  timestamp: NOW,
  selectors: ["#main-nav > .dropdown-toggle"],
};
console.log(JSON.stringify(example, null, 2));
process.exit(0);
