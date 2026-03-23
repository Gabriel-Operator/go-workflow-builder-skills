#!/usr/bin/env npx tsx
/**
 * Validates a single navigate step object.
 * Usage: npx tsx server/skills/workflow-builder/actions/action-navigate/scripts/validate.ts <step.json>
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const errors: string[] = [];
function err(path: string, msg: string): void { errors.push(`${path}: ${msg}`); }
function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

const STEP_ID_PATTERN = /^step-[a-f0-9]{5}$/;

const LOGIN_VERIFICATION_QUERY_TYPES = ["llm", "selector"] as const;
const LOGIN_VERIFICATION_CONDITIONS = [
  "element_exists",
  "element_absent",
  "element_visible",
  "element_hidden",
  "text_contains",
] as const;

function validateStep(step: unknown): void {
  const p = "step";
  if (!isObject(step)) { err(p, "must be an object"); return; }

  // Universal guard: "arguments" wrapper is the most common LLM hallucination.
  if ('arguments' in (step as Record<string, unknown>)) {
    err(p, 'INVALID — has an "arguments" wrapper key. All step fields (selectors, value, url, userPrompt, etc.) must be at the ROOT level, never nested under "arguments".');
  }

  if (typeof step.url !== 'string' || !(step.url as string).trim()) {
    if (!step.disableBrowser) {
      err(p, 'warning: no url — browser will not navigate anywhere (set disableBrowser: true if intentional)');
    }
  }

  if (typeof step.step_number !== "number") err(`${p}.step_number`, "must be a number");
  if (step.action_type !== "navigate") err(`${p}.action_type`, 'must be "navigate"');
  if (typeof step.stepId !== "string") err(`${p}.stepId`, "must be a string");
  else if (!STEP_ID_PATTERN.test(step.stepId as string)) err(`${p}.stepId`, "must match /^step-[a-f0-9]{5}$/");

  // Optional fields with important constraints
  if (step.loginVerificationQueryType !== undefined) {
    if (!LOGIN_VERIFICATION_QUERY_TYPES.includes(step.loginVerificationQueryType as never)) {
      err(`${p}.loginVerificationQueryType`, `must be one of: ${LOGIN_VERIFICATION_QUERY_TYPES.join(", ")}`);
    }
  }
  if (step.loginVerificationSelectorCondition !== undefined) {
    if (!LOGIN_VERIFICATION_CONDITIONS.includes(step.loginVerificationSelectorCondition as never)) {
      err(`${p}.loginVerificationSelectorCondition`, `must be one of: ${LOGIN_VERIFICATION_CONDITIONS.join(", ")}`);
    }
  }
  if (step.loginVerificationSelectors !== undefined) {
    if (!Array.isArray(step.loginVerificationSelectors)) {
      err(`${p}.loginVerificationSelectors`, "must be an array of strings");
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
