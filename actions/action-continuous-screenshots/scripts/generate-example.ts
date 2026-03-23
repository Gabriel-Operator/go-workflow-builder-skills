#!/usr/bin/env npx tsx
/**
 * Outputs a minimal valid continuous_screenshots step.
 * Usage: npx tsx server/skills/workflow-builder/actions/action-continuous-screenshots/scripts/generate-example.ts
 */
const NOW = Date.now();
const example = {
  step_number: 2,
  action_type: "continuous_screenshots",
  stepId: "step-a1b2c",
  label: "Monitor dashboard for changes",
  timestamp: NOW,
  enablePrompt: true,
  data: {
    interval: 5000,
    duration: 60000,
  },
  userPrompt: "Describe any changes visible on the dashboard since the last screenshot.",
};
console.log(JSON.stringify(example, null, 2));
process.exit(0);
