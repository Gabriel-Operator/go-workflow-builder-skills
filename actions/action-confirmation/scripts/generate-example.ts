#!/usr/bin/env npx tsx
/**
 * Outputs a minimal valid confirmation step.
 * Usage: npx tsx server/skills/workflow-builder/actions/action-confirmation/scripts/generate-example.ts
 */
const NOW = Date.now();
const example = {
  step_number: 5,
  action_type: "confirmation",
  stepId: "step-a1b2c",
  label: "Review before submit",
  timestamp: NOW,
  userPrompt: "All fields are filled. Click confirm to submit the form, or cancel to abort.",
};
console.log(JSON.stringify(example, null, 2));
process.exit(0);
