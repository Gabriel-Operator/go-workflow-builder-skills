#!/usr/bin/env npx tsx
/**
 * Validates a single llm_rest_api step object.
 * Usage: npx tsx server/skills/workflow-builder/actions/action-llm-rest-api/scripts/validate.ts <step.json>
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const errors: string[] = [];
function err(path: string, msg: string): void { errors.push(`${path}: ${msg}`); }
function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

const STEP_ID_PATTERN = /^step-[a-f0-9]{5}$/;
const MODEL_SOURCES = ["existing", "custom"] as const;
const PROVIDER_TYPES = ["openai", "openai_responses", "anthropic", "google", "custom"] as const;
const RESPONSE_FORMATS = ["text", "json"] as const;
const EXTRACTION_MODES = ["auto", "custom"] as const;

function validateStep(step: unknown): void {
  const p = "step";
  if (!isObject(step)) { err(p, "must be an object"); return; }

  // Universal guard: "arguments" wrapper is the most common LLM hallucination.
  if ('arguments' in (step as Record<string, unknown>)) {
    err(p, 'INVALID — has an "arguments" wrapper key. All step fields (selectors, value, url, userPrompt, etc.) must be at the ROOT level, never nested under "arguments".');
  }

  if (typeof step.step_number !== "number") err(`${p}.step_number`, "must be a number");
  if (step.action_type !== "llm_rest_api") err(`${p}.action_type`, 'must be "llm_rest_api"');
  if (typeof step.stepId !== "string") err(`${p}.stepId`, "must be a string");
  else if (!STEP_ID_PATTERN.test(step.stepId as string)) err(`${p}.stepId`, "must match /^step-[a-f0-9]{5}$/");
  if (typeof step.timestamp !== "number") err(`${p}.timestamp`, "must be a number");

  // Optional llmRestApiConfig validation
  if (step.llmRestApiConfig !== undefined) {
    if (!isObject(step.llmRestApiConfig)) {
      err(`${p}.llmRestApiConfig`, "must be an object");
    } else {
      const cfg = step.llmRestApiConfig as Record<string, unknown>;
      if (cfg.modelSource !== undefined && !MODEL_SOURCES.includes(cfg.modelSource as never)) {
        err(`${p}.llmRestApiConfig.modelSource`, `must be one of: ${MODEL_SOURCES.join(", ")}`);
      }
      if (cfg.providerType !== undefined && !PROVIDER_TYPES.includes(cfg.providerType as never)) {
        err(`${p}.llmRestApiConfig.providerType`, `must be one of: ${PROVIDER_TYPES.join(", ")}`);
      }
      if (cfg.responseFormat !== undefined && !RESPONSE_FORMATS.includes(cfg.responseFormat as never)) {
        err(`${p}.llmRestApiConfig.responseFormat`, `must be one of: ${RESPONSE_FORMATS.join(", ")}`);
      }
      if (cfg.extractionMode !== undefined && !EXTRACTION_MODES.includes(cfg.extractionMode as never)) {
        err(`${p}.llmRestApiConfig.extractionMode`, `must be one of: ${EXTRACTION_MODES.join(", ")}`);
      }
      if (cfg.temperature !== undefined && typeof cfg.temperature !== "number") {
        err(`${p}.llmRestApiConfig.temperature`, "must be a number");
      }
      if (cfg.maxTokens !== undefined && typeof cfg.maxTokens !== "number") {
        err(`${p}.llmRestApiConfig.maxTokens`, "must be a number");
      }
    }
  }
}

function main(): void {
  const filePath = process.argv[2];
  if (!filePath) { console.error("Usage: npx tsx validate.ts <step.json>"); process.exit(1); }
  const absPath = resolve(filePath);
  let raw: string;
  try { raw = readFileSync(absPath, "utf-8"); } catch (e) { console.error(`Error reading file: ${(e as Error).message}`); process.exit(1); }
  let data: unknown;
  try { data = JSON.parse(raw); } catch (e) { console.error(`Invalid JSON: ${(e as Error).message}`); process.exit(1); }
  validateStep(data);
  if (errors.length > 0) {
    console.error(`Validation failed with ${errors.length} error(s):\n`);
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }
  console.log("Step is valid.");
  process.exit(0);
}
main();
