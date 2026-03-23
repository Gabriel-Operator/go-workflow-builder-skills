#!/usr/bin/env npx tsx
/**
 * Outputs a minimal valid stitch_videos step.
 * Usage: npx tsx server/skills/workflow-builder/actions/action-stitch-videos/scripts/generate-example.ts
 */
const NOW = Date.now();
const example = {
  step_number: 4,
  action_type: "stitch_videos",
  stepId: "step-a1b2c",
  label: "Stitch intro and main clips",
  timestamp: NOW,
  videoStitchConfig: {
    sourceMode: "manual",
    clips: [
      {
        id: "clip-1",
        sourceStepId: "step-vid01",
        sourceStepNumber: 1,
        sourceIndex: 0,
        sourceLabel: "Intro",
        trimStartSec: 0,
        trimEndSec: 3,
      },
      {
        id: "clip-2",
        sourceStepId: "step-vid02",
        sourceStepNumber: 2,
        sourceIndex: 0,
        sourceLabel: "Main content",
      },
    ],
    output: {
      audioPolicy: "keep",
      outputProfile: "force_1080p_30",
    },
  },
};
console.log(JSON.stringify(example, null, 2));
process.exit(0);
