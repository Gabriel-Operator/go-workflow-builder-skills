#!/usr/bin/env npx tsx
/**
 * Outputs a minimal valid mcp_tool step.
 * Usage: npx tsx server/skills/workflow-builder/actions/action-mcp-tool/scripts/generate-example.ts
 */
const NOW = Date.now();
const example = {
  step_number: 2,
  action_type: "mcp_tool",
  stepId: "step-a1b2c",
  label: "Search knowledge base",
  timestamp: NOW,
  mcpServerId: "mcp-server-abc123",
  userPrompt: "Search the knowledge base for documents related to '{{step-00001.query}}' and return the top 3 results.",
};
console.log(JSON.stringify(example, null, 2));
process.exit(0);
