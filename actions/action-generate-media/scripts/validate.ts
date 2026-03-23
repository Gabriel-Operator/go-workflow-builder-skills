#!/usr/bin/env npx tsx
/**
 * Validates a single generate_media step object.
 * Usage: npx tsx server/skills/workflow-builder/actions/action-generate-media/scripts/validate.ts <step.json>
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const errors: string[] = [];
function err(path: string, msg: string): void { errors.push(`${path}: ${msg}`); }
function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

const STEP_ID_PATTERN = /^step-[a-f0-9]{5}$/;
const MEDIA_TYPES = ["image", "video", "audio"] as const;
const IMAGE_ROLES = ["first_frame", "last_frame", "reference"] as const;
const PERSONA_MODELS = ["style_persona", "voice_persona"] as const;

function validateStep(step: unknown): void {
  const p = "step";
  if (!isObject(step)) { err(p, "must be an object"); return; }

  // Universal guard: "arguments" wrapper is the most common LLM hallucination.
  if ('arguments' in (step as Record<string, unknown>)) {
    err(p, 'INVALID — has an "arguments" wrapper key. All step fields (selectors, value, url, userPrompt, etc.) must be at the ROOT level, never nested under "arguments".');
  }

  if (typeof step.step_number !== "number") err(`${p}.step_number`, "must be a number");
  if (step.action_type !== "generate_media") err(`${p}.action_type`, 'must be "generate_media"');
  if (typeof step.stepId !== "string") err(`${p}.stepId`, "must be a string");
  else if (!STEP_ID_PATTERN.test(step.stepId as string)) err(`${p}.stepId`, "must match /^step-[a-f0-9]{5}$/");
  if (typeof step.timestamp !== "number") err(`${p}.timestamp`, "must be a number");

  // Optional fields with constraints
  if (step.mediaType !== undefined && !MEDIA_TYPES.includes(step.mediaType as never)) {
    err(`${p}.mediaType`, `must be one of: ${MEDIA_TYPES.join(", ")}`);
  }
  if (step.userPrompt !== undefined && typeof step.userPrompt !== "string") {
    err(`${p}.userPrompt`, "must be a string");
  }
  if (step.multimodalProvider !== undefined && typeof step.multimodalProvider !== "string") {
    err(`${p}.multimodalProvider`, "must be a string");
  }
  if (step.imageRole !== undefined && !IMAGE_ROLES.includes(step.imageRole as never)) {
    err(`${p}.imageRole`, `must be one of: ${IMAGE_ROLES.join(", ")}`);
  }
  if (step.mediaOptions !== undefined) {
    if (!isObject(step.mediaOptions)) {
      err(`${p}.mediaOptions`, "must be an object");
    } else {
      const opts = step.mediaOptions as Record<string, unknown>;
      if (opts.personaModel !== undefined && !PERSONA_MODELS.includes(opts.personaModel as never)) {
        err(`${p}.mediaOptions.personaModel`, `must be one of: ${PERSONA_MODELS.join(", ")}`);
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
