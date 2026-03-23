#!/usr/bin/env npx tsx
/**
 * Outputs a minimal valid scroll step.
 * Usage: npx tsx server/skills/workflow-builder/actions/action-scroll/scripts/generate-example.ts
 */
const NOW = Date.now();
const example = {
  step_number: 1,
  action_type: "scroll",
  stepId: "step-a1b2c",
  label: "Scroll to pricing section",
  timestamp: NOW,
  selectors: ["#pricing-section"],
  data: { x: 0, y: 500 },
};
console.log(JSON.stringify(example, null, 2));
process.exit(0);
