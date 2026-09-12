import { createHash } from 'crypto';
import Ajv, { type ValidateFunction } from 'ajv';
import { validatePreviewPackage, type PreviewPackage } from '../workflow-git/workflow-preview-package';
import { FIXED_CAPABILITY_CONTRACTS, IMAGE_EVIDENCE_INPUT, CAMPAIGN_IMAGE_OUTPUT, NORMALIZED_FORM, FORM_ANSWERS } from './deterministic-contracts';
import { CAPABILITY_BLOCKS, CAPABILITY_HANDLERS, CAPABILITY_CONTINUATION_INPUTS, type ApprovalKind, type CapabilityBinding, type CapabilityJourney, type CapabilityManifest, type CapabilityNode, type CapabilityOperation, type JsonSchema } from './contract';

export const CAPABILITY_PACKAGE_LIMITS = { files: 96, fileBytes: 65536, totalBytes: 3145728, nodes: 40, operations: 20 } as const;
const dangerous = /^(?:html|jsx|css|javascript|script|scripts|code|eval|expression|credentials?|apiKey|providerId|modelId|endpoint|__proto__|prototype|constructor)$/i;
const identifier = /^[a-z][a-z0-9_-]{0,63}$/;
const copyKey = /^[a-z][a-zA-Z0-9_.-]{0,95}$/;
const approvalKinds: ApprovalKind[] = ['source_permission', 'generation_confirmation', 'content_approval', 'input_confirmation'];
const schemaKeys = new Set(['type', 'properties', 'required', 'additionalProperties', 'items', 'maxItems', 'minItems', 'maxLength', 'minLength', 'minimum', 'maximum', 'enum', 'const', 'title', 'description']);
const own = (value: object, key: string) => Object.prototype.hasOwnProperty.call(value, key);
export type CompiledCapabilityOperation = CapabilityOperation & { input: ValidateFunction; output: ValidateFunction; inputDefinition: JsonSchema; outputDefinition: JsonSchema };
export type CompiledCapabilityPackage = {
  schemaVersion: 2;
  fingerprint: string;
  files: Record<string, string>;
  manifest: CapabilityManifest;
  journey: CapabilityJourney;
  stateSchema: JsonSchema;
  stateValidator: ValidateFunction;
  fieldValidators: Record<string, ValidateFunction>;
  operations: Record<string, CompiledCapabilityOperation>;
  instructions?: PreviewPackage;
  copy: Record<string, string>;
  copyCatalogue: Record<string, Record<string, string>>;
};

function fail(message: string): never { throw new Error(`Invalid capability package: ${message}`); }
function object(value: unknown, label: string): asserts value is Record<string, any> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(`${label} must be an object`);
}
function keys(value: object, allowed: string[], label: string): void {
  if (Object.keys(value).some(key => !allowed.includes(key) || dangerous.test(key))) fail(`${label} contains undeclared fields`);
}
function id(value: unknown): asserts value is string {
  if (typeof value !== 'string' || !identifier.test(value) || dangerous.test(value)) fail('unsafe identifier');
}
function fieldName(value: unknown): asserts value is string {
  if (typeof value !== 'string' || !/^[a-z][a-zA-Z0-9_-]{0,63}$/.test(value) || dangerous.test(value)) fail('unsafe field name');
}
function list(value: unknown, max: number, label: string, min = 0): asserts value is any[] {
  if (!Array.isArray(value) || value.length < min || value.length > max) fail(`${label} must contain ${min}–${max} entries`);
}
function scalar(value: unknown): boolean { return value === null || ['string', 'boolean'].includes(typeof value) || typeof value === 'number' && Number.isFinite(value); }

/** Deliberately finite JSON Schema subset: no regexes, recursive refs or custom keywords. */
export function validateCapabilitySchema(value: unknown, depth = 0): asserts value is JsonSchema {
  object(value, 'schema');
  if (depth > 12 || Object.keys(value).some(key => !schemaKeys.has(key))) fail('unsupported or excessive schema');
  if (!['object', 'array', 'string', 'number', 'integer', 'boolean', 'null'].includes(value.type)) fail('explicit schema type required');
  for (const key of ['title', 'description']) if (value[key] !== undefined && (typeof value[key] !== 'string' || value[key].length > 1000)) fail('invalid schema annotation');
  if (value.type === 'object') {
    object(value.properties, 'schema properties');
    if (value.additionalProperties !== false || Object.keys(value.properties).length > 50) fail('closed bounded object required');
    for (const [key, child] of Object.entries(value.properties)) { fieldName(key); validateCapabilitySchema(child, depth + 1); }
    if (value.required !== undefined) {
      list(value.required, 50, 'required');
      if (new Set(value.required).size !== value.required.length || value.required.some((key: string) => !own(value.properties, key))) fail('unknown required field');
    }
  }
  if (value.type === 'array') {
    if (!Number.isInteger(value.maxItems) || value.maxItems < 0 || value.maxItems > 50) fail('bounded array required');
    validateCapabilitySchema(value.items, depth + 1);
  }
  if (value.type === 'string' && (!Number.isInteger(value.maxLength) || value.maxLength < 0 || value.maxLength > 16000)) fail('bounded string required');
  for (const key of ['minimum', 'maximum', 'minItems', 'maxItems', 'minLength', 'maxLength']) if (value[key] !== undefined && (typeof value[key] !== 'number' || !Number.isFinite(value[key]))) fail('finite schema bounds required');
  if (value.enum !== undefined) { list(value.enum, 50, 'enum', 1); if (!value.enum.every(scalar)) fail('scalar enum required'); }
  if (own(value, 'const') && !scalar(value.const)) fail('scalar const required');
}

export function capabilityFieldSchema(schema: JsonSchema, path: string): JsonSchema {
  if (typeof path !== 'string' || !/^\/[a-z][a-zA-Z0-9_-]*(?:\/(?:[a-z][a-zA-Z0-9_-]*|\d+))*$/.test(path)) fail('invalid field binding');
  let current = schema;
  for (const part of path.slice(1).split('/')) {
    if (dangerous.test(part)) fail('unsafe field binding');
    if (current.type === 'array' && /^\d+$/.test(part)) {
      if (Number(part) >= current.maxItems!) fail('array binding outside bounds');
      current = current.items!;
    } else if (current.type === 'object' && own(current.properties!, part)) current = current.properties![part];
    else fail(`unknown field ${path}`);
  }
  return current;
}

export function stripCapabilitySchemaAnnotations(schema: JsonSchema): JsonSchema {
  return Object.fromEntries(Object.entries(schema).filter(([key]) => !['title', 'description'].includes(key)).sort(([a], [b]) => a.localeCompare(b)).map(([key, child]) => {
    // Property names such as title/description are domain data, not annotations.
    if (key === 'properties') return [key, Object.fromEntries(Object.entries(child as Record<string, JsonSchema>).sort(([a], [b]) => a.localeCompare(b)).map(([field, definition]) => [field, stripCapabilitySchemaAnnotations(definition)]))];
    if (key === 'items') return [key, stripCapabilitySchemaAnnotations(child as JsonSchema)];
    return [key, child];
  }));
}
function sameSchema(a: JsonSchema, b: JsonSchema): boolean { return JSON.stringify(stripCapabilitySchemaAnnotations(a)) === JSON.stringify(stripCapabilitySchemaAnnotations(b)); }
function checkBindings(bindings: Record<string, CapabilityBinding>, state: JsonSchema, expected?: JsonSchema): void {
  object(bindings, 'bindings');
  if (Object.keys(bindings).length > 30) fail('too many bindings');
  for (const [key, binding] of Object.entries(bindings)) {
    fieldName(key); object(binding, 'binding');
    if (Object.keys(binding).length !== 1) fail('binding must be a field or literal');
    const target = expected?.properties?.[key];
    if (expected && !target) fail('binding outside input schema');
    if ('field' in binding) {
      const source = capabilityFieldSchema(state, binding.field);
      if (target && !sameSchema(source, target)) fail('incompatible field binding');
    } else if ('literal' in binding && (scalar(binding.literal) || target && JSON.stringify(binding.literal).length <= 4096)) {
      if (target && !new Ajv({ strict: true, validateFormats: false }).compile(target)(binding.literal)) fail('incompatible literal binding');
    } else fail('invalid binding');
  }
  if (expected?.required?.some(key => !own(bindings, key))) fail('missing required input binding');
}

/** Single pass: evidence containing template markers is inserted as data, never evaluated. */
export function renderCapabilityTemplate(template: string, values: Record<string, unknown>, allowed: string[]): string {
  if (typeof template !== 'string' || template.length > 16000) fail('oversized template');
  const remaining = template.replace(/\{\{([a-z][a-z0-9_]*)\}\}/g, (_match, key: string) => {
    if (!allowed.includes(key) || !own(values, key)) fail('undeclared template variable');
    return '';
  });
  if (/[{}]/.test(remaining)) fail('template expressions are forbidden');
  const rendered = template.replace(/\{\{([a-z][a-z0-9_]*)\}\}/g, (_match, key: string) => typeof values[key] === 'string' ? values[key] as string : JSON.stringify(values[key]));
  if (rendered.length > 96000) fail('oversized rendered prompt');
  return rendered;
}

export function validateCapabilityPackage(files: Record<string, string>): CompiledCapabilityPackage {
  const entries = Object.entries(files).sort(([a], [b]) => a.localeCompare(b));
  if (entries.length > CAPABILITY_PACKAGE_LIMITS.files || entries.reduce((sum, [, text]) => sum + Buffer.byteLength(text), 0) > CAPABILITY_PACKAGE_LIMITS.totalBytes) fail('package size exceeded');
  for (const [name, text] of entries) if (!/^(SKILL\.md|references\/[A-Za-z0-9_-]+\.md|(?:assets|fixtures)\/[A-Za-z0-9_.-]+\.json)$/.test(name) || Buffer.byteLength(text) > CAPABILITY_PACKAGE_LIMITS.fileBytes) fail('unsafe package file');
  if (!files['SKILL.md']?.trim() || !files['references/PROMPT.md']?.trim()) fail('missing skill instructions');
  const used = new Set(['SKILL.md', 'references/PROMPT.md']);
  const read = (path: string, directory = 'assets'): any => {
    if (typeof path !== 'string' || !new RegExp(`^${directory}/[a-z0-9_.-]+\\.json$`).test(path) || !own(files, path)) fail('missing or unsafe dependency');
    used.add(path);
    return JSON.parse(files[path]);
  };
  const manifest = read('assets/capability.json') as CapabilityManifest;
  object(manifest, 'manifest');
  keys(manifest, ['schemaVersion', 'operations', 'stateSchema', 'journey', 'copy', 'locales', 'fixtures', 'publicFields', 'continuation', 'policy', 'instructions'], 'manifest');
  if (manifest.schemaVersion !== 2) fail('schema version must be 2');
  list(manifest.operations, CAPABILITY_PACKAGE_LIMITS.operations, 'operations', 1);
  list(manifest.publicFields, 50, 'public fields');
  list(manifest.fixtures, 12, 'fixtures', 1);
  const stateSchema = read(manifest.stateSchema) as JsonSchema;
  validateCapabilitySchema(stateSchema);
  if (stateSchema.type !== 'object' || stateSchema.required?.length) fail('state starts empty; slots must be optional');
  if (new Set(manifest.publicFields).size !== manifest.publicFields.length) fail('duplicate public field');
  for (const field of manifest.publicFields) { fieldName(field); if (!own(stateSchema.properties!, field)) fail('unknown public field'); }
  const ajv = new Ajv({ strict: true, allErrors: false, validateFormats: false, ownProperties: true });
  const stateValidator = ajv.compile(stateSchema);
  const fieldValidators = Object.fromEntries(Object.entries(stateSchema.properties!).map(([key, schema]) => [key, ajv.compile(schema)]));
  const copy = read(manifest.copy) as Record<string, string>;
  object(copy, 'copy');
  if (Object.keys(copy).length > 300 || Object.entries(copy).some(([key, value]) => !copyKey.test(key) || dangerous.test(key) || typeof value !== 'string' || !value.trim() || value.length > 2000 || /<\/?(?:script|iframe|style|img|svg)\b/i.test(value))) fail('invalid bounded copy');
  const label = (key: string) => { if (typeof key !== 'string' || !own(copy, key)) fail('missing copy key'); };
  for (const key of ['loading', 'error', 'retry', 'cancel', 'confirmation', 'add', 'remove']) label(`ui.${key}`);
  const copyCatalogue: Record<string, Record<string, string>> = { en: copy };
  if (manifest.locales !== undefined) {
    object(manifest.locales, 'locales');
    if (Object.keys(manifest.locales).length > 40) fail('locale count exceeded');
    const protectedTokens = (text: string) => [...text.matchAll(/\{\{?[a-zA-Z][a-zA-Z0-9_.-]*\}?\}|https?:\/\/[^\s<>]+|@[A-Za-z0-9_.]+/g)].map(match => match[0]).sort().join('\n');
    for (const [language, path] of Object.entries(manifest.locales)) {
      if (!/^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})?$/.test(language) || language === 'en') fail('invalid locale');
      const catalogue = read(path); object(catalogue, 'locale catalogue');
      keys(catalogue, ['sourceFingerprint', 'language', 'copy'], 'locale catalogue');
      if (catalogue.sourceFingerprint !== createHash('sha256').update(files[manifest.copy]).digest('hex') || catalogue.language !== language) fail('stale locale catalogue');
      object(catalogue.copy, 'locale copy');
      if (Object.keys(catalogue.copy).sort().join() !== Object.keys(copy).sort().join()) fail('locale copy keys differ');
      for (const [key, value] of Object.entries(catalogue.copy)) if (typeof value !== 'string' || !value.trim() || value.length > 2000 || /<\/?[a-z][^>]*>/i.test(value) || protectedTokens(value) !== protectedTokens(copy[key])) fail('invalid or changed locale tokens');
      copyCatalogue[language] = catalogue.copy;
    }
  }
  const operations: Record<string, CompiledCapabilityOperation> = Object.create(null);
  for (const operation of manifest.operations) {
    object(operation, 'operation'); keys(operation, ['id', 'handler', 'inputSchema', 'outputSchema', 'template', 'variables', 'instructionOperation'], 'operation'); id(operation.id);
    if (own(operations, operation.id) || !own(CAPABILITY_HANDLERS, operation.handler)) fail('duplicate operation or unsupported handler');
    const inputDefinition = read(operation.inputSchema) as JsonSchema;
    const outputDefinition = read(operation.outputSchema) as JsonSchema;
    validateCapabilitySchema(inputDefinition); validateCapabilitySchema(outputDefinition);
    if (inputDefinition.type !== 'object' || outputDefinition.type !== 'object') fail('operation schemas must be objects');
    if (operation.handler === 'campaign-images') {
      const sources = inputDefinition.properties?.sources;
      if (sources?.type !== 'array' || !sources.minItems || sources.maxItems! > 13 || sources.items?.type !== 'string' || sources.items.maxLength! > 160 || !inputDefinition.required?.includes('sources')) fail('campaign sources must be bounded owned media IDs');
      if (!sameSchema(outputDefinition, CAMPAIGN_IMAGE_OUTPUT)) fail('incompatible campaign image output contract');
      if ((manifest.policy?.maxImages ?? 3) !== 3) fail('campaign handler requires its three-image format contract');
    }
    const fixedContract = FIXED_CAPABILITY_CONTRACTS[operation.handler];
    if (fixedContract && (!sameSchema(inputDefinition, fixedContract.input) || !sameSchema(outputDefinition, fixedContract.output))) fail('incompatible fixed handler contract');
    if (fixedContract && (operation.template !== undefined || operation.variables !== undefined)) fail('fixed handlers do not accept prompts');
    if (operation.template !== undefined) {
      if (!/^references\/[a-z0-9_-]+\.md$/.test(operation.template) || !own(files, operation.template)) fail('unsafe template reference');
      used.add(operation.template);
      list(operation.variables, 30, 'template variables');
      if (new Set(operation.variables).size !== operation.variables.length || operation.variables.some(key => !/^[a-z][a-z0-9_]*$/.test(key) || !own(inputDefinition.properties!, key))) fail('invalid template variables');
      renderCapabilityTemplate(files[operation.template], Object.fromEntries(operation.variables.map(key => [key, 'fixture'])), operation.variables);
    } else if (operation.variables !== undefined || !operation.instructionOperation && ['structured-analysis', 'text-draft', 'campaign-images'].includes(operation.handler)) fail('model operation requires a declarative template');
    operations[operation.id] = { ...operation, inputDefinition, outputDefinition, input: ajv.compile(inputDefinition), output: ajv.compile(outputDefinition) };
  }
  const journey = read(manifest.journey) as CapabilityJourney;
  object(journey, 'journey'); keys(journey, ['start', 'nodes'], 'journey');
  list(journey.nodes, CAPABILITY_PACKAGE_LIMITS.nodes, 'nodes', 1);
  const nodes = new Map<string, CapabilityNode>();
  for (const node of journey.nodes) {
    object(node, 'node'); keys(node, ['id', 'kind', 'blocks', 'actions', 'output', 'operation', 'bindings', 'initial', 'maxVisits'], 'node'); id(node.id);
    if (nodes.has(node.id) || !['input', 'operation', 'review', 'complete'].includes(node.kind)) fail('duplicate or invalid node');
    const visitLimit = node.kind === 'input' && node.blocks.some(block => block.kind === 'questionnaire') ? 20 : 3;
    if (node.maxVisits !== undefined && (!Number.isInteger(node.maxVisits) || node.maxVisits < 1 || node.maxVisits > visitLimit)) fail(`revisit bound must be 1–${visitLimit}`);
    list(node.blocks, 12, 'blocks'); list(node.actions, 6, 'actions');
    if (node.kind === 'complete' ? node.actions.length !== 0 : !node.actions.length) fail('invalid terminal/actions');
    if (['input', 'operation'].includes(node.kind)) {
      fieldName(node.output); if (!own(stateSchema.properties!, node.output)) fail('unknown output slot');
      if (node.kind === 'input' && !manifest.publicFields.includes(node.output)) fail('visitor input must be visible');
    } else if (node.output !== undefined) fail('only input/operation nodes may write state');
    if (node.kind === 'operation') {
      if (!node.operation || !own(operations, node.operation)) fail('unknown operation');
      const operation = operations[node.operation];
      if (operation.handler === 'public-document' && manifest.publicFields.includes(node.output!)) fail('raw acquisition output must remain private');
      if (operation.handler === 'campaign-images' && (node.maxVisits || 1) > 1 + (manifest.policy?.maxRevisions ?? 1)) fail('image regeneration limit cannot be raised');
      checkBindings(node.bindings!, stateSchema, operation.inputDefinition);
      if (!sameSchema(stateSchema.properties![node.output!], operation.outputDefinition)) fail('operation output incompatible with state');
      if (node.actions.some(action => action.approval)) fail('automated nodes cannot grant human approval');
    } else if (node.operation !== undefined || node.bindings !== undefined) fail('unexpected executable operation');
    if (node.initial !== undefined) {
      if (node.kind !== 'input' || stateSchema.properties![node.output!].type !== 'object') fail('initial bindings require an object input');
      checkBindings(node.initial, stateSchema, { ...stateSchema.properties![node.output!], required: [] });
      for (const binding of Object.values(node.initial)) if ('field' in binding && !manifest.publicFields.includes(binding.field.split('/')[1])) fail('private initial input binding');
    }
    const blockIds = new Set<string>();
    for (const block of node.blocks) {
      object(block, 'block'); keys(block, ['id', 'kind', 'label', 'labelValues', 'field', 'labels', 'enumLabels', 'optionsField'], 'block'); id(block.id); label(block.label);
      if (block.labelValues !== undefined) {
        checkBindings(block.labelValues, stateSchema);
        const placeholders = [...copy[block.label].matchAll(/\{([a-z][a-zA-Z0-9_]*)\}/g)].map(match => match[1]);
        if (new Set(placeholders).size !== Object.keys(block.labelValues).length || placeholders.some(key => !own(block.labelValues!, key))) fail('copy placeholders must match label bindings');
        for (const binding of Object.values(block.labelValues)) {
          if ('field' in binding) {
            const schema = capabilityFieldSchema(stateSchema, binding.field);
            if (!manifest.publicFields.includes(binding.field.split('/')[1]) || !['string', 'number', 'integer', 'boolean'].includes(schema.type!)) fail('label binding must be a public scalar');
          } else if (binding.literal === null) fail('label values cannot be null');
        }
      }
      if (blockIds.has(block.id) || !CAPABILITY_BLOCKS.includes(block.kind)) fail('unsupported/duplicate block');
      blockIds.add(block.id);
      if (block.field !== undefined) {
        const fieldSchema = capabilityFieldSchema(stateSchema, block.field);
        if (!manifest.publicFields.includes(block.field.split('/')[1])) fail('private field in presentation');
        const names = new Set<string>();
        const collectNames = (schema: JsonSchema) => { for (const [name, child] of Object.entries(schema.properties || {})) { names.add(name); collectNames(child); } if (schema.items) collectNames(schema.items); };
        collectNames(fieldSchema);
        if (names.size) {
          object(block.labels, 'block field labels');
          if (Object.keys(block.labels).length !== names.size) fail('field labels must cover presented fields');
          for (const name of names) label(block.labels[name]);
        } else if (block.labels && Object.keys(block.labels).length) fail('scalar blocks cannot declare field labels');
        if (block.enumLabels !== undefined) {
          object(block.enumLabels, 'enum labels');
          const enums = new Map<string, unknown[]>();
          const collectEnums = (schema: JsonSchema, path: string) => {
            if (schema.enum) enums.set(path || '/', schema.enum);
            for (const [name, child] of Object.entries(schema.properties || {})) collectEnums(child, `${path}/${name}`);
            if (schema.items) collectEnums(schema.items, `${path}/*`);
          };
          collectEnums(fieldSchema, '');
          if (Object.keys(block.enumLabels).length !== enums.size) fail('enum labels must cover presented choices');
          for (const [path, values] of enums) {
            const labels = block.enumLabels[path];
            list(labels, 50, 'enum labels', values.length);
            if (labels.length !== values.length) fail('enum labels must match choice order');
            labels.forEach(label);
          }
        }
      }
      if (['input', 'questionnaire', 'upload', 'media-selection'].includes(block.kind) && (node.kind !== 'input' || block.field !== `/${node.output}`)) fail('input block outside editable slot');
      if (block.kind === 'media-selection') {
        const selected = capabilityFieldSchema(stateSchema, block.field!);
        if (selected.type !== 'object' || Object.keys(selected.properties || {}).join() !== 'mediaIds' || !selected.required?.includes('mediaIds') || selected.properties?.mediaIds?.type !== 'array' || selected.properties.mediaIds.items?.type !== 'string' || !selected.properties.mediaIds.maxItems || selected.properties.mediaIds.maxItems > 13 || !selected.properties.mediaIds.minItems) fail('invalid media selection schema');
        if (!block.optionsField || !manifest.publicFields.includes(block.optionsField.split('/')[1])) fail('media selection requires public evidence');
        const options = capabilityFieldSchema(stateSchema, block.optionsField!);
        if (options.properties?.images?.type !== 'array' || options.properties.images.items?.properties?.id?.type !== 'string') fail('media selection requires image IDs');
      } else if (block.kind === 'questionnaire' && block.optionsField) {
        if (!manifest.publicFields.includes(block.optionsField.split('/')[1]) || !sameSchema(capabilityFieldSchema(stateSchema, block.optionsField), NORMALIZED_FORM) || !sameSchema(capabilityFieldSchema(stateSchema, block.field!), FORM_ANSWERS)) fail('questionnaire requires normalized public fields and bounded answers');
      } else if (block.kind === 'input' && block.optionsField) {
        const options = capabilityFieldSchema(stateSchema, block.optionsField);
        const selected = capabilityFieldSchema(stateSchema, block.field!);
        if (!manifest.publicFields.includes(block.optionsField.split('/')[1]) || options.type !== 'array' || !options.maxItems || options.maxItems > 50 || selected.type !== 'object' || !options.items || !sameSchema(options.items, selected)) fail('record selection requires matching public records');
      } else if (block.optionsField !== undefined) fail('options field requires a supported selection block');
      if (block.kind === 'upload' && !sameSchema(capabilityFieldSchema(stateSchema, block.field!), IMAGE_EVIDENCE_INPUT)) fail('upload requires the fixed media input contract');
      if (block.kind === 'login' && (node.kind !== 'complete' || !manifest.continuation)) fail('login requires terminal continuation');
      if (block.labels !== undefined && block.field === undefined) fail('field labels require a field');
      if (block.enumLabels !== undefined && block.field === undefined) fail('enum labels require a field');
    }
    if (node.kind === 'input' && node.blocks.filter(block => ['input', 'questionnaire', 'upload', 'media-selection'].includes(block.kind)).length !== 1) fail('input node requires exactly one editable block');
    if (node.kind === 'operation' && node.actions.filter(action => !action.when).length !== 1) fail('operation requires exactly one fallback transition');
    const actionIds = new Set<string>();
    for (const action of node.actions) {
      object(action, 'action'); keys(action, ['id', 'label', 'target', 'when', 'approval'], 'action'); id(action.id); id(action.target); label(action.label);
      if (actionIds.has(action.id)) fail('duplicate action'); actionIds.add(action.id);
      if (action.when) {
        const condition = action.when;
        object(condition, 'condition'); keys(condition, ['field', 'test', 'value'], 'condition');
        const schema = capabilityFieldSchema(stateSchema, condition.field);
        if (!['equals', 'in', 'exists', 'missing-fields'].includes(condition.test)) fail('unsupported condition');
        if (condition.test === 'equals' && !scalar(condition.value) || condition.test === 'in' && (!Array.isArray(condition.value) || !condition.value.length || condition.value.length > 20 || !condition.value.every(scalar))) fail('invalid condition value');
        if (condition.test === 'missing-fields' && schema.type !== 'object') fail('missing-fields requires object');
        if (['exists', 'missing-fields'].includes(condition.test) && 'value' in condition) fail('unexpected condition value');
        if (condition.test === 'equals' && !ajv.compile(schema)(condition.value) || condition.test === 'in' && !condition.value.every(value => ajv.compile(schema)(value))) fail('condition value incompatible with field');
      }
      if (action.approval) {
        object(action.approval, 'approval'); keys(action.approval, ['kind', 'fields'], 'approval');
        if (!approvalKinds.includes(action.approval.kind)) fail('invalid approval kind');
        list(action.approval.fields, 20, 'approval fields', 1);
        for (const field of action.approval.fields) {
          capabilityFieldSchema(stateSchema, field);
          if (!manifest.publicFields.includes(field.split('/')[1])) fail('visitor cannot approve hidden state');
        }
      }
    }
    nodes.set(node.id, node);
  }
  if (!nodes.has(journey.start)) fail('missing start node');
  for (const node of nodes.values()) for (const action of node.actions) if (!nodes.has(action.target)) fail('missing transition target');
  if (manifest.continuation) {
    const continuation = manifest.continuation;
    object(continuation, 'continuation'); keys(continuation, ['adapter', 'bindings', 'approvalFields'], 'continuation');
    if (!['archer-images', 'form-answers', 'grocery-inventory', 'lead-launch', 'private-chat'].includes(continuation.adapter)) fail('unknown continuation');
    checkBindings(continuation.bindings, stateSchema);
    if (continuation.adapter !== 'private-chat') {
      const expected = CAPABILITY_CONTINUATION_INPUTS[continuation.adapter];
      if (Object.keys(continuation.bindings).sort().join() !== Object.keys(expected).sort().join()) fail('invalid continuation inputs');
      for (const [key, type] of Object.entries(expected)) {
        const binding = continuation.bindings[key];
        if (!('field' in binding) || capabilityFieldSchema(stateSchema, binding.field).type !== type) fail('continuation input must bind reviewed typed state');
      }
    }
    if (continuation.adapter === 'archer-images') label('continuation.videoOffer');
    list(continuation.approvalFields, 20, 'continuation approval fields', 1);
    for (const field of continuation.approvalFields) {
      capabilityFieldSchema(stateSchema, field);
      if (!manifest.publicFields.includes(field.split('/')[1])) fail('continuation approval must be visible');
    }
    for (const binding of Object.values(continuation.bindings)) {
      if ('field' in binding && !continuation.approvalFields.some(field => binding.field === field || binding.field.startsWith(`${field}/`))) fail('continuation input is not covered by approval');
    }
  }
  validateGraph(journey, operations, manifest, stateSchema);
  if (manifest.policy) {
    object(manifest.policy, 'policy'); keys(manifest.policy, ['maxRevisions', 'maxImages', 'protectedTerms'], 'policy');
    if (manifest.policy.maxRevisions !== undefined && ![0, 1].includes(manifest.policy.maxRevisions)) fail('revision limit cannot be raised');
    if (manifest.policy.maxImages !== undefined && ![1, 2, 3].includes(manifest.policy.maxImages)) fail('image limit cannot be raised');
    if (manifest.policy.protectedTerms !== undefined) {
      list(manifest.policy.protectedTerms, 100, 'protected terms');
      for (const term of manifest.policy.protectedTerms) {
        if (typeof term !== 'string' || !term.trim() || term.length > 100) fail('invalid protected term');
        for (const catalogue of Object.values(copyCatalogue)) for (const [key, value] of Object.entries(catalogue)) if (copy[key].split(term).length !== value.split(term).length) fail('translated protected term');
      }
    }
  }
  for (const path of manifest.fixtures) {
    const fixture = read(path, 'fixtures'); object(fixture, 'fixture'); keys(fixture, ['operation', 'input', 'output'], 'fixture');
    const operation = operations[fixture.operation];
    if (!operation || !operation.input(fixture.input) || !operation.output(fixture.output)) fail('fixture schema mismatch');
  }
  let instructions: PreviewPackage | undefined;
  if (manifest.instructions) {
    object(manifest.instructions, 'instructions'); keys(manifest.instructions, ['domain', 'operations'], 'instructions');
    list(manifest.instructions.operations, 4, 'instruction operations', 1);
    const instructionFiles: Record<string, string> = { 'SKILL.md': files['SKILL.md'], 'references/PROMPT.md': files['references/PROMPT.md'], 'assets/capability.json': JSON.stringify({ schemaVersion: 1, ...manifest.instructions }) };
    for (const operation of manifest.instructions.operations) for (const path of [operation.inputSchema, operation.outputSchema, operation.template]) {
      if (typeof path !== 'string' || !own(files, path) || path === 'assets/capability.json') fail('missing instruction dependency');
      instructionFiles[path] = files[path]; used.add(path);
    }
    instructions = validatePreviewPackage(instructionFiles);
  }
  for (const operation of Object.values(operations)) {
    if (operation.instructionOperation === undefined) continue;
    const expectedHandler = { 'analyze-instagram-brand': 'structured-analysis', 'prepare-event-brief': 'structured-analysis', 'build-campaign-image-prompts': 'campaign-images' };
    if (!own(expectedHandler, operation.instructionOperation) || expectedHandler[operation.instructionOperation] !== operation.handler || !instructions?.operations[operation.instructionOperation]) fail('unsupported instruction consumer');
  }
  if (entries.some(([path]) => !used.has(path))) fail('unreferenced package file');
  return { schemaVersion: 2, fingerprint: createHash('sha256').update(JSON.stringify(entries)).digest('hex'), files: { ...files }, manifest, journey, stateSchema, stateValidator, fieldValidators, operations, copy, copyCatalogue, ...(instructions ? { instructions } : {}) };
}

/** Meet-over-all-paths approval analysis. Runtime still checks approval fingerprints. */
function validateGraph(journey: CapabilityJourney, operations: Record<string, CompiledCapabilityOperation>, manifest: CapabilityManifest, stateSchema: JsonSchema): void {
  const nodes = new Map(journey.nodes.map(node => [node.id, node]));
  const reachable = new Set<string>();
  const walk = (node: string) => { if (reachable.has(node)) return; reachable.add(node); nodes.get(node)!.actions.forEach(action => walk(action.target)); };
  walk(journey.start);
  if (reachable.size !== nodes.size || !journey.nodes.some(node => node.kind === 'complete')) fail('unreachable node or missing completion');
  const invalidatedSlots = (node: CapabilityNode): Set<string> => {
    const invalidated = new Set(node.output ? [node.output] : []);
    let expanded = true;
    while (expanded) {
      expanded = false;
      for (const dependent of journey.nodes) {
        const changedBinding = Object.values(dependent.bindings || {}).some(binding => 'field' in binding && invalidated.has(binding.field.split('/')[1]));
        const changedOptions = dependent.blocks.some(block => block.optionsField && invalidated.has(block.optionsField.split('/')[1]));
        if (dependent.output && !invalidated.has(dependent.output) && (changedBinding || changedOptions)) {
          invalidated.add(dependent.output); expanded = true;
        }
      }
    }
    return invalidated;
  };
  // A typed binding is not sufficient if its source is only produced on another
  // branch. Require definitely assigned root slots before required reads. Leaf
  // optional/missing-field checks still execute against the schema at runtime.
  const slots = Object.keys(stateSchema.properties!);
  const available = new Map(journey.nodes.map(node => [node.id, new Set(node.id === journey.start ? [] : slots)]));
  const afterWrite = (node: CapabilityNode) => {
    const invalidated = invalidatedSlots(node);
    const result = new Set([...available.get(node.id)!].filter(slot => !invalidated.has(slot)));
    if (node.output) result.add(node.output);
    return result;
  };
  let availabilityChanged = true;
  while (availabilityChanged) {
    availabilityChanged = false;
    for (const node of journey.nodes.filter(item => item.id !== journey.start)) {
      const incoming = journey.nodes.filter(source => source.actions.some(action => action.target === node.id)).map(afterWrite);
      const common = new Set(slots.filter(slot => incoming.length && incoming.every(fields => fields.has(slot))));
      if ([...common].sort().join() !== [...available.get(node.id)!].sort().join()) { available.set(node.id, common); availabilityChanged = true; }
    }
  }
  for (const node of journey.nodes) {
    const requireSlot = (field: string, fields: Set<string>) => { if (!fields.has(field.split('/')[1])) fail(`unavailable required input ${field} at ${node.id}`); };
    if (node.operation) for (const [key, binding] of Object.entries(node.bindings!)) {
      if ('field' in binding && operations[node.operation].inputDefinition.required?.includes(key)) requireSlot(binding.field, available.get(node.id)!);
    }
    for (const block of node.blocks) {
      if (block.optionsField) requireSlot(block.optionsField, available.get(node.id)!);
      for (const binding of Object.values(block.labelValues || {})) if ('field' in binding) requireSlot(binding.field, available.get(node.id)!);
    }
    for (const action of node.actions) for (const field of action.approval?.fields || []) requireSlot(field, afterWrite(node));
  }
  // Facts include scope: approving a harmless field cannot authorize spending on
  // other inputs. Kill approvals after upstream writes, including derived slots.
  const requirements = (node: CapabilityNode): Array<[ApprovalKind, string]> => {
    if (node.kind === 'complete' && manifest.continuation) return manifest.continuation.approvalFields.map(field => ['content_approval', field]);
    if (!node.operation) return [];
    return CAPABILITY_HANDLERS[operations[node.operation].handler].approvals.flatMap(kind => {
      const bindings = kind === 'source_permission' ? Object.entries(node.bindings!).filter(([key]) => key === 'sources').map(([, binding]) => binding) : Object.values(node.bindings!);
      const fields = bindings.filter((binding): binding is { field: string } => 'field' in binding).map(binding => binding.field);
      if (!fields.length) fail(`missing ${kind} scoped inputs`);
      return fields.map(field => [kind, field] as [ApprovalKind, string]);
    });
  };
  const atoms = [...new Set(journey.nodes.flatMap(node => requirements(node).map(([kind, field]) => `${kind}:${field}`)))];
  const approvals = new Map<string, Set<string>>(journey.nodes.map(node => [node.id, new Set(node.id === journey.start ? [] : atoms)]));
  const outgoing = (node: CapabilityNode, action: CapabilityNode['actions'][number]): Set<string> => {
    const invalidated = invalidatedSlots(node);
    const facts = new Set([...approvals.get(node.id)!].filter(atom => !invalidated.has(atom.split(':')[1].split('/')[1])));
    if (action.approval) for (const atom of atoms) {
      const [kind, field] = atom.split(':');
      if (kind === action.approval.kind) {
        // Runtime replaces the previous approval of this kind, not an additive grant.
        facts.delete(atom);
        if (action.approval.fields.some(approved => field === approved || field.startsWith(`${approved}/`))) facts.add(atom);
      }
    }
    return facts;
  };
  let changed = true;
  while (changed) {
    changed = false;
    for (const target of journey.nodes.filter(node => node.id !== journey.start)) {
      const incoming = journey.nodes.flatMap(node => node.actions.filter(action => action.target === target.id).map(action => outgoing(node, action)));
      const intersection = new Set(atoms.filter(atom => incoming.length && incoming.every(set => set.has(atom))));
      if ([...approvals.get(target.id)!].sort().join() !== [...intersection].sort().join()) { approvals.set(target.id, intersection); changed = true; }
    }
  }
  for (const node of journey.nodes) {
    for (const [kind, field] of requirements(node)) if (!approvals.get(node.id)!.has(`${kind}:${field}`)) fail(`missing ${kind} gate for ${field} before ${node.id}`);
  }
  // A loop is legal only if every participant explicitly opts into a finite visit limit.
  for (const start of journey.nodes) {
    const seen = new Set<string>();
    const reachesStart = (id: string): boolean => { if (id === start.id) return true; if (seen.has(id)) return false; seen.add(id); return nodes.get(id)!.actions.some(action => reachesStart(action.target)); };
    if (start.actions.some(action => reachesStart(action.target)) && start.maxVisits === undefined) fail('cycle requires explicit visit bounds');
  }
}
