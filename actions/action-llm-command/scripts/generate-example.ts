#!/usr/bin/env npx tsx
/**
 * Outputs a minimal valid llm_command step.
 * Usage: npx tsx server/skills/workflow-builder/actions/action-llm-command/scripts/generate-example.ts
 */
const NOW = Date.now();
const example = {
  step_number: 2,
  action_type: "llm_command",
  stepId: "step-a1b2c",
  label: "AI browser command",
  timestamp: NOW,
  userPrompt: "Find the Export CSV button and click it.",
  llmModel: "gpt-4o",
};
console.log(JSON.stringify(example, null, 2));
process.exit(0);
