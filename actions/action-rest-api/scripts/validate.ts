#!/usr/bin/env npx tsx
/**
 * Validates a single rest_api step object.
 * Usage: npx tsx server/skills/workflow-builder/actions/action-rest-api/scripts/validate.ts <step.json>
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const errors: string[] = [];
function err(path: string, msg: string): void { errors.push(`${path}: ${msg}`); }
function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

const STEP_ID_PATTERN = /^step-[a-f0-9]{5}$/;
const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"] as const;
const BODY_TYPES = ["none", "json", "raw", "x-www-form-urlencoded", "form-data"] as const;
const AUTH_TYPES = ["none", "bearer", "basic", "apikey"] as const;

function validateStep(step: unknown): void {
  const p = "step";
  if (!isObject(step)) { err(p, "must be an object"); return; }

  // Universal guard: "arguments" wrapper is the most common LLM hallucination.
  if ('arguments' in (step as Record<string, unknown>)) {
    err(p, 'INVALID — has an "arguments" wrapper key. All step fields (selectors, value, url, userPrompt, etc.) must be at the ROOT level, never nested under "arguments".');
  }

  if (typeof step.step_number !== "number") err(`${p}.step_number`, "must be a number");
  if (step.action_type !== "rest_api") err(`${p}.action_type`, 'must be "rest_api"');
  if (typeof step.stepId !== "string") err(`${p}.stepId`, "must be a string");
  else if (!STEP_ID_PATTERN.test(step.stepId as string)) err(`${p}.stepId`, "must match /^step-[a-f0-9]{5}$/");

  // restApiConfig is required for method and url
  if (!isObject(step.restApiConfig)) {
    err(`${p}.restApiConfig`, "must be an object");
  } else {
    const cfg = step.restApiConfig as Record<string, unknown>;
    if (typeof cfg.method !== "string" || cfg.method.trim() === "") {
      err(`${p}.restApiConfig.method`, "must be a non-empty string");
    } else if (!HTTP_METHODS.includes(cfg.method as never)) {
      err(`${p}.restApiConfig.method`, `must be one of: ${HTTP_METHODS.join(", ")}`);
    }
    if (typeof cfg.url !== "string" || cfg.url.trim() === "") {
      err(`${p}.restApiConfig.url`, "must be a non-empty string");
    }
    // Optional with constraints
    if (cfg.bodyType !== undefined && !BODY_TYPES.includes(cfg.bodyType as never)) {
      err(`${p}.restApiConfig.bodyType`, `must be one of: ${BODY_TYPES.join(", ")}`);
    }
    if (cfg.auth !== undefined && isObject(cfg.auth)) {
      const auth = cfg.auth as Record<string, unknown>;
      if (auth.type !== undefined && !AUTH_TYPES.includes(auth.type as never)) {
        err(`${p}.restApiConfig.auth.type`, `must be one of: ${AUTH_TYPES.join(", ")}`);
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
