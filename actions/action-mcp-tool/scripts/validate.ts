#!/usr/bin/env npx tsx
/**
 * Validates a single mcp_tool step object.
 * Usage: npx tsx server/skills/workflow-builder/actions/action-mcp-tool/scripts/validate.ts <step.json>
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const errors: string[] = [];
function err(path: string, msg: string): void { errors.push(`${path}: ${msg}`); }
function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

const STEP_ID_PATTERN = /^step-[a-f0-9]{5}$/;

function validateStep(step: unknown): void {
  const p = "step";
  if (!isObject(step)) { err(p, "must be an object"); return; }

  // Universal guard: "arguments" wrapper is the most common LLM hallucination.
  if ('arguments' in (step as Record<string, unknown>)) {
    err(p, 'INVALID — has an "arguments" wrapper key. All step fields (selectors, value, url, userPrompt, etc.) must be at the ROOT level, never nested under "arguments".');
  }

  if (typeof step.step_number !== "number") err(`${p}.step_number`, "must be a number");
  if (step.action_type !== "mcp_tool") err(`${p}.action_type`, 'must be "mcp_tool"');
  if (typeof step.stepId !== "string") err(`${p}.stepId`, "must be a string");
  else if (!STEP_ID_PATTERN.test(step.stepId as string)) err(`${p}.stepId`, "must match /^step-[a-f0-9]{5}$/");
  if (typeof step.timestamp !== "number") err(`${p}.timestamp`, "must be a number");

  // Optional fields with constraints
  if (step.mcpServerId !== undefined && typeof step.mcpServerId !== "string") {
    err(`${p}.mcpServerId`, "must be a string");
  }
  if (step.mcpServerUrl !== undefined && typeof step.mcpServerUrl !== "string") {
    err(`${p}.mcpServerUrl`, "must be a string URL");
  }
  if (step.mcpApiKey !== undefined && typeof step.mcpApiKey !== "string") {
    err(`${p}.mcpApiKey`, "must be a string");
  }
  if (step.userPrompt !== undefined && typeof step.userPrompt !== "string") {
    err(`${p}.userPrompt`, "must be a string");
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
