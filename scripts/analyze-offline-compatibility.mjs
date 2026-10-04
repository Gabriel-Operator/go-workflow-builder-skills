#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const localOperations = new Set([
  'prompt.local', 'knowledge.search', 'data.read', 'data.write', 'form.collect',
  'approval.request', 'list.read', 'list.write', 'pipeline.transition',
  'condition', 'loop.bounded', 'wait.durable', 'artifact.write',
  'signal.evaluate', 'task.write', 'schedule.write',
]);
export const desktopOperations = new Set([
  'browser.automate', 'coding.run', 'computer.control',
]);
export const hardwareOperations = new Set([
  'speech.local', 'transcription.local', 'vision.local', 'media.local',
]);
export const networkOperations = new Set([
  'http.request', 'mcp.call', 'notification.send', 'web.search', 'saas.call',
  'database.remote', 'prompt.cloud', 'media.cloud', 'telephony.call',
  'meeting.join',
]);

const nestedKeys = ['steps', 'body', 'then', 'else', 'nodes', 'children'];

export function analyzeOfflinePlaybook(playbook, capabilities = {}) {
  const blockers = [];
  let supportedStepCount = 0;
  const visit = (step, stepPath) => {
    const operation = String(step?.operation || step?.type || 'unknown');
    let requirement = 'unsupported';
    if (localOperations.has(operation)) requirement = 'local';
    else if (desktopOperations.has(operation)) requirement = 'desktop';
    else if (hardwareOperations.has(operation)) requirement = 'hardware';
    else if (networkOperations.has(operation)) requirement = 'network';
    const available = requirement === 'local'
      || (requirement === 'desktop' && capabilities.desktopTools === true)
      || (requirement === 'hardware' && capabilities.localMediaModels === true)
      || (requirement === 'network' && capabilities.network === true);
    if (available) supportedStepCount += 1;
    else blockers.push({ path: stepPath, operation, requirement });
    for (const key of nestedKeys) {
      if (!Array.isArray(step?.[key])) continue;
      step[key].forEach((child, index) => visit(child, `${stepPath}.${key}.${index}`));
    }
  };
  (Array.isArray(playbook?.steps) ? playbook.steps : [])
    .forEach((step, index) => visit(step, `steps.${index}`));
  return {
    contractVersion: 1,
    playbookId: String(playbook?.id || playbook?.workflowId || ''),
    availableOffline: blockers.length === 0,
    supportedStepCount,
    totalStepCount: supportedStepCount + blockers.length,
    blockers,
  };
}

export function analyzeOfflinePlaybooks(playbooks, capabilities = {}) {
  const reports = playbooks.map((playbook) => analyzeOfflinePlaybook(playbook, capabilities));
  return {
    contractVersion: 1,
    total: reports.length,
    availableOffline: reports.filter((report) => report.availableOffline).length,
    reports,
  };
}

function playbooksFrom(value) {
  if (Array.isArray(value)) return value;
  for (const key of ['playbooks', 'workflows', 'definitions']) {
    if (Array.isArray(value?.[key])) return value[key];
  }
  return [value];
}

function main() {
  const inputPath = process.argv[2];
  if (!inputPath) {
    console.error('Usage: analyze-offline-compatibility.mjs <workflow.json> [--desktop-tools] [--local-media]');
    process.exitCode = 2;
    return;
  }
  const absolute = path.resolve(inputPath);
  const value = JSON.parse(fs.readFileSync(absolute, 'utf8'));
  const report = analyzeOfflinePlaybooks(playbooksFrom(value), {
    desktopTools: process.argv.includes('--desktop-tools'),
    localMediaModels: process.argv.includes('--local-media'),
    network: false,
  });
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (report.availableOffline !== report.total) process.exitCode = 1;
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) main();
