export const INSTAGRAM_PREVIEW_OPERATIONS = ['analyze-instagram-brand', 'prepare-event-brief', 'build-campaign-image-prompts'] as const;
export type InstagramPreviewOperation = typeof INSTAGRAM_PREVIEW_OPERATIONS[number];
export const DOMAIN_PREVIEW_OPERATIONS = {
  grocery: ['analyze-capture', 'revise-inventory', 'build-dietary-plan'],
  form: ['analyze-form', 'revise-answers', 'render-filled-form'],
  lead: ['analyze-hiring-signal', 'analyze-company-roles', 'draft-outreach', 'revise-outreach'],
} as const;
export type PreviewOperation = InstagramPreviewOperation | typeof DOMAIN_PREVIEW_OPERATIONS[keyof typeof DOMAIN_PREVIEW_OPERATIONS][number];
