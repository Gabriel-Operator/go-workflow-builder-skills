import type { CapabilityHandler, JsonSchema } from './contract';

const string = (maxLength: number): JsonSchema => ({ type: 'string', maxLength });
const integer = (minimum: number, maximum: number): JsonSchema => ({ type: 'integer', minimum, maximum });
const object = (properties: Record<string, JsonSchema>): JsonSchema => ({ type: 'object', properties, required: Object.keys(properties), additionalProperties: false });
const array = (items: JsonSchema, maxItems: number): JsonSchema => ({ type: 'array', items, maxItems });

export const GROCERY_GAP_CATEGORIES = ['protein', 'carbohydrates', 'fibre', 'healthy fats', 'micronutrients', 'meal coverage'] as const;
export const GROCERY_CALCULATION_INPUT = object({
  items: array(object({ calories: integer(0, 100000) }), 50),
  household: object({ adults: integer(1, 12), children: integer(0, 12) }),
  // Package-owned planning defaults, bounded by platform limits. Not a diagnosis
  // or a per-person medical recommendation.
  targets: object({ adultDaily: integer(1000, 4000), childDaily: integer(500, 3000) }),
  gapCategories: array({ ...string(40), enum: [...GROCERY_GAP_CATEGORIES] }, 3),
});
export const GROCERY_CALCULATION_OUTPUT = object({
  currentCalories: integer(0, 250000), weeklyTargetCalories: integer(0, 250000),
  remainingCalories: integer(0, 250000), progressPercent: integer(0, 100),
  dailyCalories: { ...array(integer(0, 250000), 7), minItems: 7 },
  gapCategories: array({ ...string(40), enum: [...GROCERY_GAP_CATEGORIES] }, 3),
});
export const GROCERY_INVENTORY = object({
  store: string(100),
  items: { ...array(object({ name: string(100), quantity: { type: 'number', minimum: 0, maximum: 10000 }, unit: string(24), calories: integer(0, 100000) }), 30), minItems: 1 },
  gapCategories: GROCERY_CALCULATION_INPUT.properties!.gapCategories,
});
export const NORMALIZED_GROCERY = object({ ...GROCERY_INVENTORY.properties!, calorieItems: GROCERY_CALCULATION_INPUT.properties!.items });

export const NORMALIZED_FORM = object({
  title: string(200),
  fields: { ...array(object({
    key: string(64), label: string(300),
    type: { ...string(20), enum: ['text', 'textarea', 'number', 'boolean', 'select', 'email', 'url', 'date'] },
    required: { type: 'boolean' }, options: array(string(200), 50),
  }), 50), minItems: 1 },
});

export const FORM_ANSWERS = object({ answers: array(object({ key: string(64), value: string(2000) }), 50) });

export const DETERMINISTIC_CONTRACTS: Partial<Record<CapabilityHandler, { input: JsonSchema; output: JsonSchema }>> = {
  'grocery-normalization': { input: GROCERY_INVENTORY, output: NORMALIZED_GROCERY },
  'grocery-calculation': { input: GROCERY_CALCULATION_INPUT, output: GROCERY_CALCULATION_OUTPUT },
  'form-normalization': { input: NORMALIZED_FORM, output: NORMALIZED_FORM },
};

/** Fixed transport result; package authors cannot reinterpret an HTML response as arbitrary data. */
export const IMAGE_EVIDENCE_INPUT = object({ mediaIds: { ...array(string(160), 6), minItems: 1 } });
export const CAMPAIGN_IMAGE_OUTPUT = object({ images: { ...array(object({ id: string(160), format: { ...string(20), enum: ['feed-cover', 'carousel-support', 'story'] }, width: { ...integer(1080, 1080), const: 1080 }, height: { ...integer(1350, 1920), enum: [1350, 1920] }, contentHash: string(64) }), 3), minItems: 3 } });
export const IMAGE_EVIDENCE_OUTPUT = object({ images: { ...array(object({ id: string(160), mimeType: string(30), width: integer(1, 4096), height: integer(1, 4096), contentHash: string(64) }), 6), minItems: 1 } });
export const INSTAGRAM_EVIDENCE_OUTPUT = object({
  identity: object({ name: string(300), handle: string(100), bio: string(2000) }),
  images: { ...array(object({ id: string(160), permalink: string(2000), representation: { ...string(30), enum: ['profile_picture', 'thumbnail', 'original'] }, altText: string(1000), caption: string(2000), width: integer(1, 1600), height: integer(1, 1600), contentHash: string(64) }), 13), minItems: 1 },
  completeness: { ...string(20), enum: ['accessible', 'limited'] },
  limitations: array({ ...string(40), enum: ['login_wall', 'private_content', 'captcha', 'thumbnails_only', 'captions_unavailable', 'media_unavailable', 'time_limit'] }, 7),
});
export const FIXED_CAPABILITY_CONTRACTS = {
  ...DETERMINISTIC_CONTRACTS,
  'image-evidence': { input: IMAGE_EVIDENCE_INPUT, output: IMAGE_EVIDENCE_OUTPUT },
  'instagram-evidence': { input: object({ url: string(2000) }), output: INSTAGRAM_EVIDENCE_OUTPUT },
  'public-document': {
    input: object({ url: string(2000) }),
    output: object({ url: string(2000), title: string(300), text: string(16000), contentHash: string(64), links: array(string(2000), 20) }),
  },
};
