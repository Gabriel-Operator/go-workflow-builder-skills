#!/usr/bin/env npx tsx
/**
 * Outputs a minimal valid llm_rest_api step.
 * Usage: npx tsx server/skills/workflow-builder/actions/action-llm-rest-api/scripts/generate-example.ts
 */
const NOW = Date.now();
const example = {
  step_number: 3,
  action_type: "llm_rest_api",
  stepId: "step-a1b2c",
  label: "Classify support ticket",
  timestamp: NOW,
  llmRestApiConfig: {
    modelSource: "custom",
    providerType: "openai",
    apiUrl: "https://api.openai.com/v1/chat/completions",
    apiKey: "sk-abc123",
    modelIdentifier: "gpt-4o",
    systemPrompt: "You are a data classifier. Return only valid JSON.",
    userPrompt: "Classify this text: {{step-00002.extractedText}}",
    responseFormat: "json",
    temperature: 0.3,
    maxTokens: 500,
  },
};
console.log(JSON.stringify(example, null, 2));
process.exit(0);
