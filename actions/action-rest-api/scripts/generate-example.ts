#!/usr/bin/env npx tsx
/**
 * Outputs a minimal valid rest_api step.
 * Usage: npx tsx server/skills/workflow-builder/actions/action-rest-api/scripts/generate-example.ts
 */
const NOW = Date.now();
const example = {
  step_number: 2,
  action_type: "rest_api",
  stepId: "step-a1b2c",
  label: "Create user via API",
  timestamp: NOW,
  restApiConfig: {
    method: "POST",
    url: "https://api.example.com/v2/users",
    auth: {
      type: "bearer",
      token: "{{step-00001.accessToken}}",
    },
    bodyType: "json",
    body: "{\"name\": \"Jane Doe\", \"email\": \"jane@example.com\"}",
    responseVariableName: "createUserResponse",
  },
};
console.log(JSON.stringify(example, null, 2));
process.exit(0);
