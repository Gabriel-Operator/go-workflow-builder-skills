#!/usr/bin/env npx tsx
/**
 * Outputs a minimal valid computer_use_agent step.
 * Usage: npx tsx server/skills/workflow-builder/actions/action-computer-use-agent/scripts/generate-example.ts
 */
const NOW = Date.now();
const example = {
  step_number: 1,
  action_type: "computer_use_agent",
  stepId: "step-a1b2c",
  label: "Desktop automation task",
  timestamp: NOW,
  userPrompt: "Open Firefox, navigate to https://example.com/login, fill in username 'admin' and password 'test123', click Login, then take a screenshot of the dashboard.",
  sandboxAgentConfig: {
    agentType: "computer_use",
    visionModel: "claude-sonnet-4-20250514",
    sandboxProvider: "e2b",
    sandboxTimeout: 120000,
  },
};
console.log(JSON.stringify(example, null, 2));
process.exit(0);
