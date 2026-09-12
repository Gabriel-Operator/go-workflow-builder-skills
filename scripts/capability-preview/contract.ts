/** Declarative package contract. Neither packages nor model output execute code. */
import type { PreviewInstructionOperation, DOMAIN_PREVIEW_OPERATIONS } from '../workflow-git/workflow-preview-package';
export const CAPABILITY_HANDLERS = {
  'image-evidence': { asynchronous: true, approvals: [] },
  'instagram-evidence': { asynchronous: true, approvals: [] },
  'public-document': { asynchronous: true, approvals: [] },
  'structured-analysis': { asynchronous: true, approvals: [] },
  'text-draft': { asynchronous: true, approvals: [] },
  'campaign-images': { asynchronous: true, approvals: ['source_permission', 'generation_confirmation'] },
  'grocery-normalization': { asynchronous: false, approvals: [] },
  'grocery-calculation': { asynchronous: false, approvals: [] },
  'form-normalization': { asynchronous: false, approvals: [] },
} as const;
export type CapabilityHandler = keyof typeof CAPABILITY_HANDLERS;
export type ApprovalKind = 'source_permission' | 'generation_confirmation' | 'content_approval' | 'input_confirmation';
export type JsonSchema = {
  type?: string; properties?: Record<string, JsonSchema>; required?: string[];
  items?: JsonSchema; additionalProperties?: false; maxItems?: number; minItems?: number;
  maxLength?: number; minLength?: number; minimum?: number; maximum?: number;
  enum?: unknown[]; const?: unknown; title?: string; description?: string;
  [key: string]: unknown;
};
export type CapabilityLiteral = string | number | boolean | null | CapabilityLiteral[] | { [key: string]: CapabilityLiteral };
export type CapabilityBinding = { field: string } | { literal: CapabilityLiteral };
export type CapabilityCondition =
  | { field: string; test: 'exists' | 'missing-fields' }
  | { field: string; test: 'equals'; value: string | number | boolean | null }
  | { field: string; test: 'in'; value: Array<string | number | boolean | null> };
export type CapabilityOperation = {
  id: string;
  handler: CapabilityHandler;
  inputSchema: string;
  outputSchema: string;
  template?: string;
  variables?: string[];
  /** Installed instruction consumer. Uses the embedded immutable Phase 1 contract. */
  instructionOperation?: 'analyze-instagram-brand' | 'prepare-event-brief' | 'build-campaign-image-prompts';
};
export const CAPABILITY_BLOCKS = ['message', 'notice', 'progress', 'input', 'questionnaire', 'upload', 'media-selection', 'record', 'table', 'evidence', 'permission', 'images', 'draft', 'metrics', 'downloads', 'login'] as const;
export type CapabilityBlock = {
  id: string;
  kind: typeof CAPABILITY_BLOCKS[number];
  label: string;
  /** Single-pass substitutions in copy, for example an account-specific permission question. */
  labelValues?: Record<string, CapabilityBinding>;
  field?: string;
  /** Field-name → canonical copy key; no rendered schema labels in TypeScript. */
  labels?: Record<string, string>;
  /** Relative field paths (/* for array items) to copy keys in enum order. */
  enumLabels?: Record<string, string[]>;
  /** Public evidence object containing images; selection never accepts URLs. */
  optionsField?: string;
};
export type CapabilityAction = {
  id: string;
  label: string;
  target: string;
  when?: CapabilityCondition;
  approval?: { kind: ApprovalKind; fields: string[] };
};
export type CapabilityNode = {
  id: string;
  kind: 'input' | 'operation' | 'review' | 'complete';
  blocks: CapabilityBlock[];
  actions: CapabilityAction[];
  output?: string;
  operation?: string;
  bindings?: Record<string, CapabilityBinding>;
  /** Initial editable values copied from public state; never grants approval. */
  initial?: Record<string, CapabilityBinding>;
  /** Every revisit, including automated transitions, consumes this bound. */
  maxVisits?: number;
};
export type CapabilityContinuation = {
  adapter: 'archer-images' | 'form-answers' | 'grocery-inventory' | 'lead-launch' | 'private-chat';
  bindings: Record<string, CapabilityBinding>;
  approvalFields: string[];
};
/** Installed adapters accept only these reviewed fields, never launch options. */
export const CAPABILITY_CONTINUATION_INPUTS = {
  'archer-images': { instagram_url: 'string', approved_brand_identity: 'object', event_brief: 'object', selected_image_ids: 'array' },
  'form-answers': { form_fields: 'array', form_answers: 'object', media_ids: 'array' },
  'grocery-inventory': { confirmed_items: 'array', household: 'object', media_ids: 'array' },
  'lead-launch': { source_url: 'string', signal: 'object', selected_role: 'object', draft: 'object' },
} as const;
export type CapabilityManifest = {
  schemaVersion: 2;
  operations: CapabilityOperation[];
  stateSchema: string;
  journey: string;
  copy: string;
  /** Generated catalogues, not a second editable source of journey copy. */
  locales?: Record<string, string>;
  fixtures: string[];
  publicFields: string[];
  continuation?: CapabilityContinuation;
  /** Phase 1 instructions reused by authenticated services at this exact pin. */
  instructions?: { domain?: keyof typeof DOMAIN_PREVIEW_OPERATIONS; operations: PreviewInstructionOperation[] };
  policy?: { maxRevisions?: number; maxImages?: number; protectedTerms?: string[] };
};
export type CapabilityJourney = { start: string; nodes: CapabilityNode[] };
export type CapabilityApproval = { kind: ApprovalKind; fields: string[]; fingerprint: string; createdAt: string };
export type CapabilitySessionState = {
  currentNode: string;
  version: number;
  values: Record<string, unknown>;
  visits: Record<string, number>;
  approvals: CapabilityApproval[];
  status: 'ready' | 'running' | 'complete' | 'cancelled' | 'failed' | 'expired';
};
