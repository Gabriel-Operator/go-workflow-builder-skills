/** Declarative package contract. Neither packages nor model output execute code. */
import type { PreviewInstructionOperation, DOMAIN_PREVIEW_OPERATIONS } from '../workflow-git/workflow-preview-package';
export const CAPABILITY_HANDLERS = {
  'image-evidence': { asynchronous: true, approvals: [] },
  'instagram-evidence': { asynchronous: true, approvals: [] },
  'public-document': { asynchronous: true, approvals: [] },
  'document-text': { asynchronous: true, approvals: [] },
  'structured-analysis': { asynchronous: true, approvals: [] },
  'text-draft': { asynchronous: true, approvals: [] },
  'campaign-images': { asynchronous: true, approvals: ['source_permission', 'generation_confirmation'] },
  'competitor-scope-resolution': { asynchronous: false, approvals: [] },
  'competitor-reference-discovery': { asynchronous: true, approvals: [] },
  'creative-reference-analysis': { asynchronous: true, approvals: [] },
  'grocery-normalization': { asynchronous: false, approvals: [] },
  'grocery-calculation': { asynchronous: false, approvals: [] },
  'form-normalization': { asynchronous: false, approvals: [] },
  'lead-search': { asynchronous: true, approvals: [] },
  'network-discovery': { asynchronous: true, approvals: [] },
  'recruiting-discovery': { asynchronous: true, approvals: [] },
} as const;
export type CapabilityHandler = keyof typeof CAPABILITY_HANDLERS;
export type ApprovalKind = 'source_permission' | 'generation_confirmation' | 'content_approval' | 'input_confirmation';
export type CompetitorSearchScope = {
  venueCategory: string;
  location: string;
  radiusKm: 2 | 5 | 10 | 25;
};
export type CompetitorReferenceMetric = { label: string; value: number; source: string };
export type CompetitorReferenceCandidate = {
  id: string;
  competitorName: string;
  venueName: string;
  platform: 'instagram' | 'youtube' | 'meta_ad_library' | 'website';
  contentType: 'post' | 'carousel' | 'reel' | 'video' | 'short' | 'ad' | 'web';
  publishedAt: string;
  publicPermalink: string;
  metrics: CompetitorReferenceMetric[];
  whyRelevant: string;
  provider: 'google_places' | 'instagram_business_discovery' | 'youtube' | 'meta_ad_library' | 'scrapecreators' | 'apify';
  observedAt: string;
  attribution: string;
  rightsNotice: string;
  /** Server-only analysis evidence. Never projected in reference cards. */
  contentSummary: string;
  /** Server-only normalized ranking signal. */
  score: number;
};
export type CreativeDirectionChoice = { mode: 'original'; candidateId?: never } | { mode: 'reference'; candidateId: string };
export type CreativeReferenceBrief = {
  hook: string;
  narrativeStructure: string;
  composition: string;
  colorMoodLighting: string;
  typographyPlacement: string;
  captionCtaPattern: string;
  videoPacing: string;
  shotRhythm: string;
  transitionStyle: string;
  audioCategory: string;
};
export type CreativeReferenceProvenance = {
  candidateId: string;
  provider: string;
  publicPermalink: string;
  observedAt: string;
  rightsNotice: string;
};
export type JsonSchema = {
  type?: string; properties?: Record<string, JsonSchema>; required?: string[];
  items?: JsonSchema; additionalProperties?: false; maxItems?: number; minItems?: number;
  maxLength?: number; minLength?: number; minimum?: number; maximum?: number;
  enum?: unknown[]; const?: unknown; title?: string; description?: string;
  [key: string]: unknown;
};
export type CapabilityLiteral = string | number | boolean | null | CapabilityLiteral[] | { [key: string]: CapabilityLiteral };
export type CapabilityBinding = { field: string } | { literal: CapabilityLiteral };
/** Ordered, first-present fallback is allowed only for persisted workspace fields. */
export type CapabilityWorkspaceBinding = CapabilityBinding | { fields: string[] };
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
  instructionOperation?: 'analyze-instagram-brand' | 'prepare-event-brief' | 'build-campaign-image-prompts' | 'analyze-capture' | 'revise-inventory' | 'build-dietary-plan';
};
export const CAPABILITY_BLOCKS = ['message', 'notice', 'progress', 'input', 'questionnaire', 'upload', 'document-upload', 'media-selection', 'reference-selection', 'record', 'table', 'evidence', 'permission', 'images', 'draft', 'metrics', 'downloads', 'login'] as const;
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
  /** Authored journey position used by every client to render consistent progress. */
  progress?: { current: number; total: number };
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
  adapter: 'archer-images' | 'form-answers' | 'grocery-inventory' | 'lead-launch' | 'command-launch' | 'lead-search' | 'connection-research' | 'command-inputs' | 'private-chat';
  bindings: Record<string, CapabilityBinding>;
  approvalFields: string[];
  /**
   * Optional package-authored persistence for a reviewed command handoff.
   * The destination list is always resolved from the authenticated active
   * profile; packages may map approved state into fields but can never name a
   * list, pipeline, user, or profile role.
   */
  workspaceRecord?: {
    activeProfile: true;
    identityField: string;
    profileModeField: string;
    fieldBindings: Record<string, CapabilityWorkspaceBinding>;
    defaults?: Record<string, CapabilityLiteral>;
    approvalFingerprintField?: string;
    createdAtField?: string;
    previewIdField?: string;
    sessionIdField?: string;
    emailDelivery?: {
      actionField: string;
      draftValue: string;
      sendValue: string;
      emailField: string;
      subjectField: string;
      bodyField: string;
      contactStatusField: string;
      contactAvailableValue: string;
      deliveryStateField: string;
      receiptField: string;
      recordStatusField?: string;
      approvedStatusValue?: string;
    };
    destination?: { appView: 'dashboard'; tabId?: string };
  };
};
/** Installed adapters accept only these reviewed fields, never launch options. */
export const CAPABILITY_CONTINUATION_INPUTS = {
  'archer-images': { instagram_url: 'string', approved_brand_identity: 'object', event_brief: 'object', competitor_scope: 'object', creative_direction: 'object', reference_brief: 'object', selected_image_ids: 'array' },
  'form-answers': { form_fields: 'array', form_answers: 'object', media_ids: 'array' },
  'grocery-inventory': { confirmed_items: 'array', household: 'object', weekly_plan: 'object', media_ids: 'array' },
  'lead-launch': { source_url: 'string', signal: 'object', selected_role: 'object', draft: 'object' },
  'lead-search': { profile_mode_id: 'string', selected_leads: 'array', lead_results: 'object' },
  'connection-research': { profile_mode_id: 'string', selected_connections: 'array', connection_results: 'object' },
} as const;
export type CapabilityEntrypoint = {
  field: string;
  values: Record<string, string>;
};
export type CapabilityAuthenticationCheckpoint = {
  node: string;
  resumeNode: string;
  preserveFields: string[];
  approvalFields: string[];
  profileModeField: string;
  authenticatedField: string;
  authenticatedValue: string;
};
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
  /** Public state fields seeded by a trusted host context before the first node. */
  contextFields?: string[];
  entrypoint?: CapabilityEntrypoint;
  authenticationCheckpoint?: CapabilityAuthenticationCheckpoint;
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
