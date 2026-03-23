#!/usr/bin/env npx tsx
/**
 * Outputs a minimal valid coding_agent step.
 * Usage: npx tsx server/skills/workflow-builder/actions/action-coding-agent/scripts/generate-example.ts
 */
const NOW = Date.now();
const example = {
  step_number: 2,
  action_type: "coding_agent",
  stepId: "step-a1b2c",
  label: "Clean and transform data",
  timestamp: NOW,
  userPrompt: "Read the CSV file at /data/input.csv, remove duplicate rows, normalize all dates to ISO format, and write the result to /data/output.csv.",
  sandboxAgentConfig: {
    agentType: "coding",
    codingModel: "claude_code",
    sandboxProvider: "e2b",
    e2bTemplate: "python-data-science",
  },
};
console.log(JSON.stringify(example, null, 2));
process.exit(0);
