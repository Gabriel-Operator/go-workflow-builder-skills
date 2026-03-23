#!/usr/bin/env npx tsx
/**
 * Outputs a minimal valid pdf_response step.
 * Usage: npx tsx server/skills/workflow-builder/actions/action-pdf-response/scripts/generate-example.ts
 */
const NOW = Date.now();
const example = {
  step_number: 2,
  action_type: "pdf_response",
  stepId: "step-a1b2c",
  label: "Capture page as PDF",
  timestamp: NOW,
  fullPage: true,
};
console.log(JSON.stringify(example, null, 2));
process.exit(0);
