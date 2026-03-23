#!/usr/bin/env npx tsx
/**
 * Validates a single api_call step object.
 * Usage: npx tsx server/skills/workflow-builder/actions/action-api-call/scripts/validate.ts <step.json>
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const errors: string[] = [];
function err(path: string, msg: string): void { errors.push(`${path}: ${msg}`); }
function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

const STEP_ID_PATTERN = /^step-[a-f0-9]{5}$/;
const AUTH_TYPES = ["none", "basic", "bearer", "apiKey"] as const;

function validateStep(step: unknown): void {
  const p = "step";
  if (!isObject(step)) { err(p, "must be an object"); return; }

  // Universal guard: "arguments" wrapper is the most common LLM hallucination.
  if ('arguments' in (step as Record<string, unknown>)) {
    err(p, 'INVALID — has an "arguments" wrapper key. All step fields (selectors, value, url, userPrompt, etc.) must be at the ROOT level, never nested under "arguments".');
  }

  if (typeof step.step_number !== "number") err(`${p}.step_number`, "must be a number");
  if (step.action_type !== "api_call") err(`${p}.action_type`, 'must be "api_call"');
  if (typeof step.stepId !== "string") err(`${p}.stepId`, "must be a string");
  else if (!STEP_ID_PATTERN.test(step.stepId as string)) err(`${p}.stepId`, "must match /^step-[a-f0-9]{5}$/");
  if (typeof step.timestamp !== "number") err(`${p}.timestamp`, "must be a number");

  // Optional api_config validation
  if (step.api_config !== undefined) {
    if (!isObject(step.api_config)) {
      err(`${p}.api_config`, "must be an object");
    } else {
      const cfg = step.api_config as Record<string, unknown>;
      if (cfg.endpoint !== undefined && typeof cfg.endpoint !== "string") {
        err(`${p}.api_config.endpoint`, "must be a string URL");
      }
      if (cfg.method !== undefined && typeof cfg.method !== "string") {
        err(`${p}.api_config.method`, "must be a string HTTP method");
      }
      if (cfg.auth !== undefined && isObject(cfg.auth)) {
        const auth = cfg.auth as Record<string, unknown>;
        if (auth.type !== undefined && !AUTH_TYPES.includes(auth.type as never)) {
          err(`${p}.api_config.auth.type`, `must be one of: ${AUTH_TYPES.join(", ")}`);
        }
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
