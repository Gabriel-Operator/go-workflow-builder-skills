#!/usr/bin/env npx tsx
/**
 * Outputs a minimal valid notification step.
 * Usage: npx tsx server/skills/workflow-builder/actions/action-notification/scripts/generate-example.ts
 */
const NOW = Date.now();
const example = {
  step_number: 4,
  action_type: "notification",
  stepId: "step-a1b2c",
  label: "Send completion alert",
  timestamp: NOW,
  userPrompt: "Workflow complete. Summary: {{step-00002.summary}}",
};
console.log(JSON.stringify(example, null, 2));
process.exit(0);
