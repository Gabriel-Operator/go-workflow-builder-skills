#!/usr/bin/env npx tsx
/**
 * Outputs a minimal valid goal step.
 * Usage: npx tsx server/skills/workflow-builder/actions/action-goal/scripts/generate-example.ts
 */
const NOW = Date.now();
const example = {
  step_number: 2,
  action_type: "goal",
  stepId: "step-a1b2c",
  label: "AI agent: complete task",
  timestamp: NOW,
  userPrompt: "Navigate to the contacts page, search for Acme Corp, and export the results as CSV.",
  llmModel: "gpt-4o",
  goalMaxSteps: 20,
  autoContinueGoal: true,
};
console.log(JSON.stringify(example, null, 2));
process.exit(0);
