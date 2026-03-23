#!/usr/bin/env npx tsx

/**
 * Generates example Gabriel Operator workflow JSON for common scenarios.
 *
 * Usage:
 *   npx tsx server/skills/workflow-builder/scripts/generate-example.ts <scenario>
 *
 * Supported scenarios:
 *   web-scraper   — navigate -> goal -> api_output
 *   api-pipeline  — rest_api -> llm_rest_api -> api_output
 *   ai-agent      — navigate -> goal -> confirmation
 *   data-etl      — data_source_read -> llm_rest_api -> data_source_write
 *   media-gen     — generate_media -> notification
 */

interface Step {
  step_number: number;
  action_type: string;
  stepId: string;
  timestamp: number;
  [key: string]: unknown;
}

interface Workflow {
  structure: {
    name: string;
    actionName: string;
    baseUrl: string;
    screenshotEnabled: boolean;
    steps: Step[];
    parameters: { execute: unknown[] };
    groups: unknown[];
  };
  commitMessage: string;
}

const NOW = Date.now();

// ---------------------------------------------------------------------------
// Scenario definitions
// ---------------------------------------------------------------------------

const scenarios: Record<string, () => Workflow> = {
  "web-scraper": () => ({
    structure: {
      name: "web-scraper-example",
      actionName: "Web Scraper — Extract Product Data",
      baseUrl: "",
      screenshotEnabled: true,
      steps: [
        {
          step_number: 1,
          action_type: "navigate",
          stepId: "step-a1b2c",
          url: "https://store.example.com/products",
          readOnly: true,
          requiresLogin: false,
          label: "Open product listing page",
          timestamp: NOW,
        },
        {
          step_number: 2,
          action_type: "goal",
          stepId: "step-d3e4f",
          userPrompt:
            "Extract the name, price, and rating of every product visible on the page. Scroll down if there are more products below the fold.",
          systemPrompt:
            "You are a precise browser agent. Extract structured data from web pages.",
          llmModel: "model-gpt4o",
          llmActionType: "goal",
          flowType: "linear",
          goalMaxSteps: 15,
          persistGoalActions: true,
          autoContinueGoal: false,
          selectors: [],
          label: "Extract product data",
          timestamp: NOW,
        },
        {
          step_number: 3,
          action_type: "api_output",
          stepId: "step-56789",
          outputName: "products",
          outputFields: [
            {
              key: "products",
              value: "{{step-d3e4f.response}}",
              type: "string",
            },
          ],
          label: "Return extracted products",
          timestamp: NOW,
        },
      ],
      parameters: { execute: [] },
      groups: [],
    },
    commitMessage:
      "Add web scraper workflow: navigates to product page, extracts data with AI, returns structured output",
  }),

  "api-pipeline": () => ({
    structure: {
      name: "api-pipeline-example",
      actionName: "API Pipeline — Fetch, Summarize & Output",
      baseUrl: "",
      screenshotEnabled: false,
      steps: [
        {
          step_number: 1,
          action_type: "navigate",
          stepId: "step-00a00",
          disableBrowser: true,
          label: "Skip browser (API-only workflow)",
          timestamp: NOW,
        },
        {
          step_number: 2,
          action_type: "rest_api",
          stepId: "step-ab1c2",
          restApiConfig: {
            method: "GET",
            url: "https://api.example.com/v1/articles?limit=10",
            headers: [
              {
                key: "Accept",
                value: "application/json",
                enabled: true,
              },
            ],
            auth: { type: "bearer", token: "{{parameters.apiToken}}" },
            bodyType: "none",
            timeout: 30000,
            responseVariableName: "articles",
          },
          label: "Fetch latest articles",
          timestamp: NOW,
        },
        {
          step_number: 3,
          action_type: "llm_rest_api",
          stepId: "step-de3f4",
          llmRestApiConfig: {
            modelSource: "existing",
            existingModelId: "model-gpt4o",
            systemPrompt:
              "You are a concise summarizer. Return a JSON array of objects with title and summary keys.",
            userPrompt:
              "Summarize each article in one sentence:\n\n{{step-ab1c2.response}}",
            responseFormat: "json",
            temperature: 0.3,
            maxTokens: 2048,
            timeout: 60000,
          },
          label: "Summarize articles with LLM",
          timestamp: NOW,
        },
        {
          step_number: 4,
          action_type: "api_output",
          stepId: "step-gh5i6",
          outputName: "summaries",
          outputFields: [
            {
              key: "summaries",
              value: "{{step-de3f4.response}}",
              type: "string",
            },
          ],
          label: "Return article summaries",
          timestamp: NOW,
        },
      ],
      parameters: {
        execute: [
          {
            name: "apiToken",
            label: "API Token",
            type: "string",
            required: true,
          },
        ],
      },
      groups: [],
    },
    commitMessage:
      "Add API pipeline workflow: fetches articles, summarizes via LLM, returns structured output",
  }),

  "ai-agent": () => ({
    structure: {
      name: "ai-agent-example",
      actionName: "AI Agent — Search and Confirm",
      baseUrl: "",
      screenshotEnabled: true,
      steps: [
        {
          step_number: 1,
          action_type: "navigate",
          stepId: "step-1a2b3",
          url: "https://flights.example.com",
          readOnly: true,
          requiresLogin: false,
          label: "Open flight search",
          timestamp: NOW,
        },
        {
          step_number: 2,
          action_type: "goal",
          stepId: "step-4c5d6",
          userPrompt:
            "Search for the cheapest round-trip flight from New York (JFK) to London (LHR) departing next Monday and returning the following Sunday. Select the cheapest option.",
          systemPrompt:
            "You are a browser automation agent. Interact with the flight search website to find and select the cheapest option.",
          llmModel: "model-gpt4o",
          llmActionType: "goal",
          flowType: "linear",
          goalMaxSteps: 30,
          persistGoalActions: true,
          autoContinueGoal: false,
          selectors: [],
          label: "Find cheapest flight",
          timestamp: NOW,
        },
        {
          step_number: 3,
          action_type: "confirmation",
          stepId: "step-7e8f9",
          readOnly: true,
          label: "Confirm booking",
          userPrompt:
            "Review the selected flight details. Do you want to proceed with booking?",
          timestamp: NOW,
        },
      ],
      parameters: { execute: [] },
      groups: [],
    },
    commitMessage:
      "Add AI agent workflow: navigates to flight site, uses goal to find cheapest option, asks for confirmation",
  }),

  "data-etl": () => ({
    structure: {
      name: "data-etl-example",
      actionName: "Data ETL — Read, Transform, Write",
      baseUrl: "",
      screenshotEnabled: false,
      steps: [
        {
          step_number: 1,
          action_type: "navigate",
          stepId: "step-00b00",
          disableBrowser: true,
          label: "Skip browser (data pipeline)",
          timestamp: NOW,
        },
        {
          step_number: 2,
          action_type: "data_source_read",
          stepId: "step-aa1bb",
          dataSourceReadConfig: {
            connectorId: "conn-pg-warehouse-001",
            kind: "postgres",
            operation: "query",
            query:
              "SELECT id, email, signup_date, last_login FROM users WHERE last_login < NOW() - INTERVAL '90 days' LIMIT 500",
          },
          label: "Read inactive users from warehouse",
          timestamp: NOW,
        },
        {
          step_number: 3,
          action_type: "llm_rest_api",
          stepId: "step-cc2dd",
          llmRestApiConfig: {
            modelSource: "existing",
            existingModelId: "model-gpt4o",
            systemPrompt:
              "You are a data transformation assistant. Given a list of inactive users, produce a JSON array of objects with fields: id, email, daysSinceLogin, reEngagementTier (hot/warm/cold based on days).",
            userPrompt:
              "Transform these inactive users:\n\n{{step-aa1bb.response}}",
            responseFormat: "json",
            temperature: 0.1,
            maxTokens: 4096,
            timeout: 60000,
          },
          label: "Classify users by re-engagement tier",
          timestamp: NOW,
        },
        {
          step_number: 4,
          action_type: "data_source_write",
          stepId: "step-ee3ff",
          dataSourceWriteConfig: {
            connectorId: "conn-pg-warehouse-001",
            kind: "postgres",
            operation: "upsert",
            query:
              "INSERT INTO re_engagement_queue (user_id, email, tier, queued_at) VALUES ($1, $2, $3, NOW()) ON CONFLICT (user_id) DO UPDATE SET tier = $3, queued_at = NOW()",
            values: "{{step-cc2dd.response}}",
            mode: "execute",
            maxAffectedRows: 500,
            maxOperations: 500,
            allowDelete: false,
            allowRawWrite: false,
          },
          label: "Write classified users to re-engagement queue",
          timestamp: NOW,
        },
      ],
      parameters: { execute: [] },
      groups: [],
    },
    commitMessage:
      "Add data ETL workflow: reads inactive users, classifies with LLM, writes to re-engagement queue",
  }),

  "media-gen": () => ({
    structure: {
      name: "media-gen-example",
      actionName: "Media Generation — Create Image & Notify",
      baseUrl: "",
      screenshotEnabled: false,
      steps: [
        {
          step_number: 1,
          action_type: "navigate",
          stepId: "step-00c00",
          disableBrowser: true,
          label: "Skip browser (media workflow)",
          timestamp: NOW,
        },
        {
          step_number: 2,
          action_type: "generate_media",
          stepId: "step-mg1a2",
          mediaType: "image",
          userPrompt:
            "A photorealistic aerial view of a futuristic city at sunset, with flying vehicles and lush green rooftop gardens, cinematic lighting",
          multimodalProvider: "dall-e-3",
          mediaOptions: {
            aspectRatio: "16:9",
            imageSize: "1024x1024",
            numberOfImages: 4,
            style: "cinematic",
          },
          label: "Generate concept art images",
          timestamp: NOW,
        },
        {
          step_number: 3,
          action_type: "notification",
          stepId: "step-nt3b4",
          label: "Notify team that images are ready",
          timestamp: NOW,
        },
      ],
      parameters: { execute: [] },
      groups: [],
    },
    commitMessage:
      "Add media generation workflow: creates concept art images and sends notification",
  }),
};

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main(): void {
  const scenario = process.argv[2];

  if (!scenario || !scenarios[scenario]) {
    const available = Object.keys(scenarios).join(", ");
    console.error(
      scenario
        ? `Unknown scenario: "${scenario}"`
        : "No scenario specified.",
    );
    console.error(`\nAvailable scenarios: ${available}`);
    console.error(
      "\nUsage: npx tsx generate-example.ts <scenario>",
    );
    process.exit(1);
  }

  const workflow = scenarios[scenario]();
  console.log(JSON.stringify(workflow, null, 2));
  process.exit(0);
}

main();
