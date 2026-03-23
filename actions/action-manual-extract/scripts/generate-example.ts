#!/usr/bin/env npx tsx
/**
 * Outputs a minimal valid manual_extract step.
 * Usage: npx tsx server/skills/workflow-builder/actions/action-manual-extract/scripts/generate-example.ts
 */
const NOW = Date.now();
const example = {
  step_number: 2,
  action_type: "manual_extract",
  stepId: "step-a1b2c",
  label: "Extract product details",
  timestamp: NOW,
  userPrompt: "Extract the product name, price, and availability from this page. Return as JSON with keys: productName, price, availability.",
  llmModel: "gpt-4o",
};
console.log(JSON.stringify(example, null, 2));
process.exit(0);
