#!/usr/bin/env npx tsx
/**
 * Outputs a minimal valid fill step.
 * Usage: npx tsx server/skills/workflow-builder/actions/action-fill/scripts/generate-example.ts
 */
const NOW = Date.now();
const example = {
  step_number: 2,
  action_type: "fill",
  stepId: "step-a1b2c",
  label: "Fill email address",
  timestamp: NOW,
  selectors: ["#email-input", "input[name='email']"],
  value: "user@example.com",
};
console.log(JSON.stringify(example, null, 2));
process.exit(0);
