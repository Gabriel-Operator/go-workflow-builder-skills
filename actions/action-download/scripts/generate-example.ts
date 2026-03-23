#!/usr/bin/env npx tsx
/**
 * Outputs a minimal valid download step.
 * Usage: npx tsx server/skills/workflow-builder/actions/action-download/scripts/generate-example.ts
 */
const NOW = Date.now();
const example = {
  step_number: 3,
  action_type: "download",
  stepId: "step-a1b2c",
  label: "Download CSV export",
  timestamp: NOW,
  selectors: ["a.export-csv", "[data-testid='download-report']"],
};
console.log(JSON.stringify(example, null, 2));
process.exit(0);
