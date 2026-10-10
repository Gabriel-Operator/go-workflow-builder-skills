import type { JsonSchema } from './contract';

const str = (maxLength: number): JsonSchema => ({ type: 'string', maxLength });
const num = (minimum: number, maximum: number): JsonSchema => ({ type: 'number', minimum, maximum });
const obj = (properties: Record<string, JsonSchema>): JsonSchema => ({ type: 'object', properties, required: Object.keys(properties), additionalProperties: false });
const arr = (items: JsonSchema, maxItems: number): JsonSchema => ({ type: 'array', items, maxItems });
export const SCRAP_COUNTRY_CURRENCY: Record<string, string> = { IN: 'INR', NL: 'EUR', US: 'USD', GB: 'GBP', AU: 'AUD', FR: 'EUR', ES: 'EUR', DE: 'EUR', CA: 'CAD', SG: 'SGD', JP: 'JPY' };
export const SCRAP_CATEGORIES = ['paper', 'cardboard', 'iron', 'steel', 'aluminium', 'copper', 'plastic', 'ewaste', 'appliance'];
export const SCRAP_ITEM = obj({ category: { ...str(30), enum: SCRAP_CATEGORIES }, description: str(300), weightLowKg: num(0.01, 10000), weightHighKg: num(0.01, 10000) });
export const SCRAP_LOCATION = obj({ countryCode: { ...str(2), enum: Object.keys(SCRAP_COUNTRY_CURRENCY) }, city: { ...str(120), minLength: 2 }, postcode: { ...str(30), minLength: 2 } });
export const SCRAP_INTAKE = obj({ location: SCRAP_LOCATION, items: { ...arr(SCRAP_ITEM, 12), minItems: 1 } });
const RATE = obj({ category: SCRAP_ITEM.properties!.category, currency: str(3), lowPerKg: num(0, 100000), highPerKg: num(0, 100000), sourceUrl: str(2000), sourceExcerpt: str(500), effectiveDate: str(30), verified: { type: 'boolean' } });
export const SCRAP_BUYER_PRIVATE = obj({ id: str(100), title: str(200), sourceUrl: str(2000), address: str(500), locality: str(120), countryCode: str(2), materials: arr(SCRAP_ITEM.properties!.category, 9), collection: { ...str(30), enum: ['pickup', 'dropoff', 'unknown'] }, rates: arr(RATE, 12) });
export const SCRAP_MARKET = obj({ buyers: arr(SCRAP_BUYER_PRIVATE, 10), observedAt: str(30), providerRunId: str(200), warnings: arr(str(500), 10) });
const LINE = obj({ category: SCRAP_ITEM.properties!.category, weightLowKg: num(0, 10000), weightHighKg: num(0, 10000), rateLowPerKg: num(0, 100000), rateHighPerKg: num(0, 100000), amountLow: num(0, 1000000000), amountHigh: num(0, 1000000000), status: { ...str(20), enum: ['estimated', 'rate_unavailable'] } });
export const SCRAP_QUOTE = obj({ currency: str(3), amountLow: num(0, 1000000000), amountHigh: num(0, 1000000000), status: { ...str(20), enum: ['estimated', 'partial', 'unavailable'] }, lines: arr(LINE, 12), summary: str(1000), observedAt: str(30) });
export const SCRAP_BUYER_PUBLIC = obj({ id: str(100), title: str(200), sourceUrl: str(2000), locality: str(120), collection: str(30), materials: arr(SCRAP_ITEM.properties!.category, 9), identityLocked: { type: 'boolean' }, registrationStatus: { ...str(30), enum: ['not_registered'] } });
export const SCRAP_BUYERS_PUBLIC = obj({ items: arr(SCRAP_BUYER_PUBLIC, 10), identityLocked: { type: 'boolean' }, summary: str(1000) });
export const SCRAP_FIXED_CONTRACTS = {
  'scrap-market-discovery': { input: SCRAP_INTAKE, output: SCRAP_MARKET },
  'scrap-valuation': { input: obj({ intake: SCRAP_INTAKE, market: SCRAP_MARKET }), output: SCRAP_QUOTE },
  'scrap-buyer-projection': { input: obj({ market: SCRAP_MARKET, location: SCRAP_LOCATION }), output: SCRAP_BUYERS_PUBLIC },
};
