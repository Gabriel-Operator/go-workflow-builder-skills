#!/usr/bin/env npx tsx
/**
 * Validates a single data_source_write step object.
 * Usage: npx tsx server/skills/workflow-builder/actions/action-data-source-write/scripts/validate.ts <step.json>
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const errors: string[] = [];
function err(path: string, msg: string): void { errors.push(`${path}: ${msg}`); }
function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

const STEP_ID_PATTERN = /^step-[a-f0-9]{5}$/;
const WRITE_MODES = ["dry_run", "execute"] as const;

function validateStep(step: unknown): void {
  const p = "step";
  if (!isObject(step)) { err(p, "must be an object"); return; }

  // Universal guard: "arguments" wrapper is the most common LLM hallucination.
  if ('arguments' in (step as Record<string, unknown>)) {
    err(p, 'INVALID — has an "arguments" wrapper key. All step fields (selectors, value, url, userPrompt, etc.) must be at the ROOT level, never nested under "arguments".');
  }

  if (typeof step.step_number !== "number") err(`${p}.step_number`, "must be a number");
  if (step.action_type !== "data_source_write") err(`${p}.action_type`, 'must be "data_source_write"');
  if (typeof step.stepId !== "string") err(`${p}.stepId`, "must be a string");
  else if (!STEP_ID_PATTERN.test(step.stepId as string)) err(`${p}.stepId`, "must match /^step-[a-f0-9]{5}$/");
  if (typeof step.timestamp !== "number") err(`${p}.timestamp`, "must be a number");

  // Optional dataSourceWriteConfig validation with important constraints
  if (step.dataSourceWriteConfig !== undefined) {
    if (!isObject(step.dataSourceWriteConfig)) {
      err(`${p}.dataSourceWriteConfig`, "must be an object");
    } else {
      const cfg = step.dataSourceWriteConfig as Record<string, unknown>;
      if (cfg.connectorId !== undefined && typeof cfg.connectorId !== "string") {
        err(`${p}.dataSourceWriteConfig.connectorId`, "must be a string");
      }
      if (cfg.kind !== undefined && typeof cfg.kind !== "string") {
        err(`${p}.dataSourceWriteConfig.kind`, "must be a string");
      }
      if (cfg.operation !== undefined && typeof cfg.operation !== "string") {
        err(`${p}.dataSourceWriteConfig.operation`, "must be a string");
      }
      if (cfg.mode !== undefined && !WRITE_MODES.includes(cfg.mode as never)) {
        err(`${p}.dataSourceWriteConfig.mode`, `must be one of: ${WRITE_MODES.join(", ")}`);
      }
      if (cfg.maxAffectedRows !== undefined && typeof cfg.maxAffectedRows !== "number") {
        err(`${p}.dataSourceWriteConfig.maxAffectedRows`, "must be a number");
      }
      if (cfg.allowDelete !== undefined && typeof cfg.allowDelete !== "boolean") {
        err(`${p}.dataSourceWriteConfig.allowDelete`, "must be a boolean");
      }
      if (cfg.allowRawWrite !== undefined && typeof cfg.allowRawWrite !== "boolean") {
        err(`${p}.dataSourceWriteConfig.allowRawWrite`, "must be a boolean");
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
