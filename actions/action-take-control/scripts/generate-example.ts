#!/usr/bin/env npx tsx
/**
 * Outputs a minimal valid take_control step.
 * Usage: npx tsx server/skills/workflow-builder/actions/action-take-control/scripts/generate-example.ts
 */
const NOW = Date.now();
const example = {
  step_number: 3,
  action_type: "take_control",
  stepId: "step-a1b2c",
  label: "Solve CAPTCHA",
  timestamp: NOW,
  userPrompt: "Please solve the CAPTCHA on the page, then click Continue in the workflow panel.",
};
console.log(JSON.stringify(example, null, 2));
process.exit(0);
