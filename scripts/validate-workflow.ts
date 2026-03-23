#!/usr/bin/env npx tsx

/**
 * Validates a Gabriel Operator workflow JSON file.
 *
 * Usage:
 *   npx tsx server/skills/workflow-builder/scripts/validate-workflow.ts <file.json>
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const VALID_ACTION_TYPES = [
  "navigate",
  "click",
  "fill",
  "type",
  "hover",
  "select",
  "scroll",
  "manual_scroll",
  "keypress",
  "keyboard_type",
  "wait",
  "upload",
  "download",
  "screenshot",
  "switch_tab",
  "blank_step",
  "take_control",
  "llm",
  "llm_command",
  "goal",
  "confirmation",
  "manual_extract",
  "continuous_screenshots",
  "image_response",
  "pdf_response",
  "api_call",
  "rest_api",
  "llm_rest_api",
  "mcp_tool",
  "data_source_read",
  "data_source_write",
  "api_output",
  "notification",
  "generate_media",
  "stitch_videos",
  "coding_agent",
  "computer_use_agent",
] as const;

const VALID_HTTP_METHODS = [
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "HEAD",
  "OPTIONS",
] as const;

const STEP_ID_PATTERN = /^step-[a-f0-9]{5}$/;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const errors: string[] = [];

function err(path: string, message: string): void {
  errors.push(`${path}: ${message}`);
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function requireString(
  obj: Record<string, unknown>,
  key: string,
  path: string,
): void {
  if (typeof obj[key] !== "string") {
    err(`${path}.${key}`, `must be a string`);
  }
}

function requireNumber(
  obj: Record<string, unknown>,
  key: string,
  path: string,
): void {
  if (typeof obj[key] !== "number") {
    err(`${path}.${key}`, `must be a number`);
  }
}

function requireArray(
  obj: Record<string, unknown>,
  key: string,
  path: string,
): boolean {
  if (!Array.isArray(obj[key])) {
    err(`${path}.${key}`, `must be an array`);
    return false;
  }
  return true;
}

function requireObject(
  obj: Record<string, unknown>,
  key: string,
  path: string,
): boolean {
  if (!isObject(obj[key])) {
    err(`${path}.${key}`, `must be an object`);
    return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Validators
// ---------------------------------------------------------------------------

function validateStep(
  step: unknown,
  index: number,
  expectedStepNumber: number,
): void {
  const p = `steps[${index}]`;

  if (!isObject(step)) {
    err(p, "must be an object");
    return;
  }

  // step_number
  if (typeof step.step_number !== "number") {
    err(`${p}.step_number`, "must be a number");
  } else if (step.step_number !== expectedStepNumber) {
    err(
      `${p}.step_number`,
      `expected ${expectedStepNumber} but got ${step.step_number} (must be sequential starting from 1)`,
    );
  }

  // action_type
  if (typeof step.action_type !== "string") {
    err(`${p}.action_type`, "must be a string");
  } else if (
    !(VALID_ACTION_TYPES as readonly string[]).includes(step.action_type)
  ) {
    err(
      `${p}.action_type`,
      `invalid value "${step.action_type}", must be one of [${VALID_ACTION_TYPES.join(", ")}]`,
    );
  }

  // stepId
  if (typeof step.stepId !== "string") {
    err(`${p}.stepId`, "must be a string");
  } else if (!STEP_ID_PATTERN.test(step.stepId)) {
    err(
      `${p}.stepId`,
      `invalid format "${step.stepId}", must match /^step-[a-f0-9]{5}$/`,
    );
  }

  // --- Action-specific validations ---

  const actionType = step.action_type as string;

  // rest_api
  if (actionType === "rest_api") {
    if (!isObject(step.restApiConfig)) {
      err(`${p}.restApiConfig`, "must be an object for rest_api steps");
    } else {
      const cfg = step.restApiConfig as Record<string, unknown>;
      if (typeof cfg.method !== "string") {
        err(`${p}.restApiConfig.method`, "must be a string");
      } else if (
        !(VALID_HTTP_METHODS as readonly string[]).includes(cfg.method)
      ) {
        err(
          `${p}.restApiConfig.method`,
          `invalid value "${cfg.method}", must be one of [${VALID_HTTP_METHODS.join(", ")}]`,
        );
      }
      if (typeof cfg.url !== "string" || cfg.url.length === 0) {
        err(`${p}.restApiConfig.url`, "must be a non-empty string");
      }
    }
  }

  // data_source_read
  if (actionType === "data_source_read") {
    if (!isObject(step.dataSourceReadConfig)) {
      err(
        `${p}.dataSourceReadConfig`,
        "must be an object for data_source_read steps",
      );
    } else {
      const cfg = step.dataSourceReadConfig as Record<string, unknown>;
      for (const key of ["connectorId", "kind", "operation"]) {
        if (typeof cfg[key] !== "string" || (cfg[key] as string).length === 0) {
          err(
            `${p}.dataSourceReadConfig.${key}`,
            "must be a non-empty string",
          );
        }
      }
    }
  }

  // data_source_write
  if (actionType === "data_source_write") {
    if (!isObject(step.dataSourceWriteConfig)) {
      err(
        `${p}.dataSourceWriteConfig`,
        "must be an object for data_source_write steps",
      );
    } else {
      const cfg = step.dataSourceWriteConfig as Record<string, unknown>;
      for (const key of ["connectorId", "kind", "operation"]) {
        if (typeof cfg[key] !== "string" || (cfg[key] as string).length === 0) {
          err(
            `${p}.dataSourceWriteConfig.${key}`,
            "must be a non-empty string",
          );
        }
      }
    }
  }

  // goal
  if (actionType === "goal") {
    if (typeof step.userPrompt !== "string" || step.userPrompt.length === 0) {
      err(`${p}.userPrompt`, "must be a non-empty string for goal steps");
    }
  }
}

function validateGroups(
  groups: unknown[],
  validStepNumbers: Set<number>,
): void {
  for (let i = 0; i < groups.length; i++) {
    const g = groups[i];
    const p = `groups[${i}]`;

    if (!isObject(g)) {
      err(p, "must be an object");
      continue;
    }

    if (typeof g.id !== "string") {
      err(`${p}.id`, "must be a string");
    }
    if (typeof g.name !== "string") {
      err(`${p}.name`, "must be a string");
    }

    if (!Array.isArray(g.stepNumbers)) {
      err(`${p}.stepNumbers`, "must be an array of numbers");
    } else {
      for (let j = 0; j < g.stepNumbers.length; j++) {
        const sn = g.stepNumbers[j];
        if (typeof sn !== "number") {
          err(`${p}.stepNumbers[${j}]`, "must be a number");
        } else if (!validStepNumbers.has(sn)) {
          err(
            `${p}.stepNumbers[${j}]`,
            `references step_number ${sn} which does not exist`,
          );
        }
      }
    }
  }
}

function validateWorkflow(data: unknown): void {
  if (!isObject(data)) {
    err("(root)", "must be an object");
    return;
  }

  // Top-level keys
  if (!isObject(data.structure)) {
    err("structure", "must be an object");
    return;
  }
  if (typeof data.commitMessage !== "string") {
    err("commitMessage", "must be a string");
  }

  const s = data.structure as Record<string, unknown>;

  // structure fields
  requireString(s, "name", "structure");
  requireString(s, "actionName", "structure");
  if (typeof s.baseUrl !== "string") {
    err("structure.baseUrl", "must be a string");
  }

  // parameters
  if (!requireObject(s, "parameters", "structure")) {
    // skip
  } else {
    const params = s.parameters as Record<string, unknown>;
    if (!Array.isArray(params.execute)) {
      err("structure.parameters.execute", "must be an array");
    }
  }

  // steps
  const hasSteps = requireArray(s, "steps", "structure");
  const validStepNumbers = new Set<number>();

  if (hasSteps) {
    const steps = s.steps as unknown[];
    for (let i = 0; i < steps.length; i++) {
      validateStep(steps[i], i, i + 1);
      const step = steps[i];
      if (isObject(step) && typeof step.step_number === "number") {
        validStepNumbers.add(step.step_number);
      }
    }
  }

  // groups
  if (!requireArray(s, "groups", "structure")) {
    // skip
  } else {
    validateGroups(s.groups as unknown[], validStepNumbers);
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main(): void {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error(
      "Usage: npx tsx validate-workflow.ts <file.json>",
    );
    process.exit(1);
  }

  const absPath = resolve(filePath);
  let raw: string;
  try {
    raw = readFileSync(absPath, "utf-8");
  } catch (e) {
    console.error(`Error reading file: ${(e as Error).message}`);
    process.exit(1);
  }

  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    console.error(`Invalid JSON: ${(e as Error).message}`);
    process.exit(1);
  }

  validateWorkflow(data);

  if (errors.length > 0) {
    console.error(`Validation failed with ${errors.length} error(s):\n`);
    for (const e of errors) {
      console.error(`  - ${e}`);
    }
    process.exit(1);
  }

  console.log("Workflow is valid.");
  process.exit(0);
}

main();
