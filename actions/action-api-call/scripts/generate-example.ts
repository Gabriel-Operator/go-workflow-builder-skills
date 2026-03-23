#!/usr/bin/env npx tsx
/**
 * Outputs a minimal valid api_call step.
 * Usage: npx tsx server/skills/workflow-builder/actions/action-api-call/scripts/generate-example.ts
 */
const NOW = Date.now();
const example = {
  step_number: 2,
  action_type: "api_call",
  stepId: "step-a1b2c",
  label: "Fetch user data",
  timestamp: NOW,
  api_config: {
    endpoint: "https://api.example.com/users/me",
    method: "GET",
    auth: {
      type: "bearer",
      token: "sk-my-api-token",
    },
  },
};
console.log(JSON.stringify(example, null, 2));
process.exit(0);
