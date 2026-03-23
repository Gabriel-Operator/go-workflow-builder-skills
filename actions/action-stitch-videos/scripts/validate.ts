#!/usr/bin/env npx tsx
/**
 * Validates a single stitch_videos step object.
 * Usage: npx tsx server/skills/workflow-builder/actions/action-stitch-videos/scripts/validate.ts <step.json>
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const errors: string[] = [];
function err(path: string, msg: string): void { errors.push(`${path}: ${msg}`); }
function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

const STEP_ID_PATTERN = /^step-[a-f0-9]{5}$/;
const SOURCE_MODES = ["auto", "manual", "hybrid"] as const;
const AUDIO_POLICIES = ["keep", "mute"] as const;
const OUTPUT_PROFILES = ["match_first_clip", "force_1080p_30", "force_720p_30"] as const;

function validateStep(step: unknown): void {
  const p = "step";
  if (!isObject(step)) { err(p, "must be an object"); return; }

  // Universal guard: "arguments" wrapper is the most common LLM hallucination.
  if ('arguments' in (step as Record<string, unknown>)) {
    err(p, 'INVALID — has an "arguments" wrapper key. All step fields (selectors, value, url, userPrompt, etc.) must be at the ROOT level, never nested under "arguments".');
  }

  if (typeof step.step_number !== "number") err(`${p}.step_number`, "must be a number");
  if (step.action_type !== "stitch_videos") err(`${p}.action_type`, 'must be "stitch_videos"');
  if (typeof step.stepId !== "string") err(`${p}.stepId`, "must be a string");
  else if (!STEP_ID_PATTERN.test(step.stepId as string)) err(`${p}.stepId`, "must match /^step-[a-f0-9]{5}$/");
  if (typeof step.timestamp !== "number") err(`${p}.timestamp`, "must be a number");

  // Optional videoStitchConfig validation
  if (step.videoStitchConfig !== undefined) {
    if (!isObject(step.videoStitchConfig)) {
      err(`${p}.videoStitchConfig`, "must be an object");
    } else {
      const cfg = step.videoStitchConfig as Record<string, unknown>;
      if (cfg.sourceMode !== undefined && !SOURCE_MODES.includes(cfg.sourceMode as never)) {
        err(`${p}.videoStitchConfig.sourceMode`, `must be one of: ${SOURCE_MODES.join(", ")}`);
      }
      if (cfg.clips !== undefined && !Array.isArray(cfg.clips)) {
        err(`${p}.videoStitchConfig.clips`, "must be an array");
      }
      if (cfg.output !== undefined && isObject(cfg.output)) {
        const output = cfg.output as Record<string, unknown>;
        if (output.audioPolicy !== undefined && !AUDIO_POLICIES.includes(output.audioPolicy as never)) {
          err(`${p}.videoStitchConfig.output.audioPolicy`, `must be one of: ${AUDIO_POLICIES.join(", ")}`);
        }
        if (output.outputProfile !== undefined && !OUTPUT_PROFILES.includes(output.outputProfile as never)) {
          err(`${p}.videoStitchConfig.output.outputProfile`, `must be one of: ${OUTPUT_PROFILES.join(", ")}`);
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
