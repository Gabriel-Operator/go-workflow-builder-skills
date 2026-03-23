#!/usr/bin/env npx tsx
/**
 * Outputs a minimal valid manual_scroll step.
 * Usage: npx tsx server/skills/workflow-builder/actions/action-manual-scroll/scripts/generate-example.ts
 */
const NOW = Date.now();
const example = {
  step_number: 1,
  action_type: "manual_scroll",
  stepId: "step-a1b2c",
  label: "Scroll down the page",
  timestamp: NOW,
  scrollDirection: "down",
};
console.log(JSON.stringify(example, null, 2));
process.exit(0);
