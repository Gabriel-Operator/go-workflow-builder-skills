#!/usr/bin/env npx tsx
/**
 * Outputs a minimal valid switch_tab step.
 * Usage: npx tsx server/skills/workflow-builder/actions/action-switch-tab/scripts/generate-example.ts
 */
const NOW = Date.now();
const example = {
  step_number: 2,
  action_type: "switch_tab",
  stepId: "step-a1b2c",
  label: "Switch to newly opened tab",
  timestamp: NOW,
  data: {
    tabIndex: 1,
  },
};
console.log(JSON.stringify(example, null, 2));
process.exit(0);
