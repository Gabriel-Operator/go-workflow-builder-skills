#!/usr/bin/env npx tsx
/**
 * Outputs a minimal valid blank_step step.
 * Usage: npx tsx server/skills/workflow-builder/actions/action-blank-step/scripts/generate-example.ts
 */
const NOW = Date.now();
const example = {
  step_number: 1,
  action_type: "blank_step",
  stepId: "step-a1b2c",
  label: "Initialize browser",
  timestamp: NOW,
};
console.log(JSON.stringify(example, null, 2));
process.exit(0);
