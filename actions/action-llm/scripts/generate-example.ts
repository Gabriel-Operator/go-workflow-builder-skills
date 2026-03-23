#!/usr/bin/env npx tsx
/**
 * Outputs a minimal valid llm step.
 * Usage: npx tsx server/skills/workflow-builder/actions/action-llm/scripts/generate-example.ts
 */
const NOW = Date.now();
const example = {
  step_number: 2,
  action_type: "llm",
  stepId: "step-a1b2c",
  label: "Extract product details",
  timestamp: NOW,
  llmActionType: "extract",
  userPrompt: "Extract the product name, price, and availability from the page. Return as JSON.",
  llmModel: "gpt-4o",
};
console.log(JSON.stringify(example, null, 2));
process.exit(0);
