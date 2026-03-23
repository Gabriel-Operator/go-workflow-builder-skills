#!/usr/bin/env npx tsx
/**
 * Outputs a minimal valid api_output step.
 * Usage: npx tsx server/skills/workflow-builder/actions/action-api-output/scripts/generate-example.ts
 */
const NOW = Date.now();
const example = {
  step_number: 3,
  action_type: "api_output",
  stepId: "step-a1b2c",
  label: "Return structured results",
  timestamp: NOW,
  outputName: "productResults",
  outputFields: [
    { key: "products", value: "{{step-00002.response}}", type: "array" },
    { key: "source", value: "example.com", type: "string" },
  ],
};
console.log(JSON.stringify(example, null, 2));
process.exit(0);
