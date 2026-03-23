#!/usr/bin/env npx tsx
/**
 * Outputs a minimal valid navigate step.
 * Usage: npx tsx server/skills/workflow-builder/actions/action-navigate/scripts/generate-example.ts
 */
const NOW = Date.now();
const example = {
  step_number: 1,
  action_type: "navigate",
  stepId: "step-a1b2c",
  label: "Open dashboard",
  timestamp: NOW,
  url: "https://app.example.com/dashboard",
  requiresLogin: false,
};
console.log(JSON.stringify(example, null, 2));
process.exit(0);
