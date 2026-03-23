#!/usr/bin/env npx tsx
/**
 * Outputs a minimal valid data_source_read step.
 * Usage: npx tsx server/skills/workflow-builder/actions/action-data-source-read/scripts/generate-example.ts
 */
const NOW = Date.now();
const example = {
  step_number: 1,
  action_type: "data_source_read",
  stepId: "step-a1b2c",
  label: "Read top customers",
  timestamp: NOW,
  dataSourceReadConfig: {
    connectorId: "conn-postgres-analytics",
    kind: "postgres",
    operation: "query",
    query: "SELECT id, email, total_spend FROM customers ORDER BY total_spend DESC LIMIT 25",
  },
};
console.log(JSON.stringify(example, null, 2));
process.exit(0);
