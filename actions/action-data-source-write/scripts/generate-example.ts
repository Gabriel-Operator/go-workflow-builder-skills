#!/usr/bin/env npx tsx
/**
 * Outputs a minimal valid data_source_write step.
 * Usage: npx tsx server/skills/workflow-builder/actions/action-data-source-write/scripts/generate-example.ts
 */
const NOW = Date.now();
const example = {
  step_number: 3,
  action_type: "data_source_write",
  stepId: "step-a1b2c",
  label: "Insert order record",
  timestamp: NOW,
  dataSourceWriteConfig: {
    connectorId: "conn-pg-prod",
    kind: "postgres",
    operation: "insert",
    query: "INSERT INTO orders (customer_id, product, amount) VALUES ($1, $2, $3)",
    variables: {
      "$1": "{{step-00001.customerId}}",
      "$2": "{{step-00002.productName}}",
      "$3": "{{step-00002.price}}",
    },
    mode: "execute",
    maxAffectedRows: 1,
    allowDelete: false,
  },
};
console.log(JSON.stringify(example, null, 2));
process.exit(0);
