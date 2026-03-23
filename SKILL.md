---
name: workflow-builder
description: >
  Build, validate, and deploy Gabriel Operator automation workflows via the API.
  Use this skill when the user wants to create a browser automation, API pipeline,
  AI agent workflow, data processing job, or any multi-step automation. Handles all
  37 action types including navigate, click, fill, goal, rest_api, data_source_read,
  generate_media, coding_agent, and more. Orchestrates child action-* skills for
  step-level detail. Use even when the user says "build a workflow", "automate",
  "create an agent", or describes a multi-step task without naming the platform.
metadata:
  author: gabriel-operator
  version: "1.0"
compatibility: Requires Node.js 18+ for script execution (npx tsx).
---

# Workflow Builder

## Git-backed action repositories
When this skill is materialized as a git repository for a single automation action, the repo includes the scaffold under `actions/`, `scripts/`, `references/`, plus:
- `/assets/workflow.json` — canonical step payload for that action.
- `/runner/SKILL.md` — generated on repository initialization; documents how to start runs and poll status via the automation HTTP API (`POST /api/automation/run/:agentId/:actionId`).

## ⚠️ Critical: Flat step structure — most common mistake

ALL step fields belong at the **ROOT level** of the step object. Never wrap them under
`arguments`, `params`, `options`, `input`, `config`, `data`, or any other key.
There is no `arguments` field in the Step schema.

| | Example |
|---|---|
| ❌ WRONG | `{ "arguments": { "selector": "#btn" }, "action_type": "click" }` |
| ✅ CORRECT | `{ "selectors": ["#btn"], "action_type": "click" }` |

Also note field names are action-type-specific — `click`/`type`/`fill` use `selectors` (array),
`llm_command`/`llm`/`goal` use `userPrompt` (string), `navigate` uses `url` (string).
Read each action's `SKILL.md` and `scripts/generate-example.ts` before building steps.

## ⚠️ Critical: Mandatory step architecture — two strict rules every agent must follow

### Rule 1 — Step 1 MUST always be `navigate`

**Every workflow without exception must begin with a `navigate` step as step 1.**

If the user does not explicitly request browser automation, **always default to browserless mode** (`disableBrowser: true`, empty `url`). Only use `disableBrowser: false` (or omit it) when the user explicitly asks for browser interaction (clicking, filling forms, scraping a website, etc.).

```json
{
  "action_type": "navigate",
  "disableBrowser": true,
  "url": "",
  "selectors": [],
  "label": "Browserless automation",
  "step_number": 1,
  "stepId": "step-XXXXX"
}
```

### Rule 2 — Steps 2+ MUST use `mcp_tool` backed by a Composio toolkit

All steps after the first **must** use `action_type: "mcp_tool"`. Each step must be backed by the most appropriate **Composio toolkit** for the task. Write a focused `systemPrompt` (agent role + context) and a specific `userPrompt` (exact task to execute).

```json
{
  "action_type": "mcp_tool",
  "label": "<short description of what this step does>",
  "llmModel": "",
  "systemPrompt": "<role and context for the LLM — e.g. 'You are a LinkedIn outreach specialist. Your task is to find and return investor profiles matching the given criteria.'>",
  "userPrompt": "<specific instruction — e.g. 'Find investors from the Netherlands with a focus on B2B SaaS. Return name, title, company, and LinkedIn URL for each.'>",
  "mcpServerId": "",
  "mcpServerUrl": "",
  "mcpApiKey": "",
  "step_number": 2,
  "stepId": "step-XXXXX"
}
```

### Choosing the right Composio toolkit

Set `mcpServerId` to the toolkit slug that best matches the task for that step. Composio provides 1,000+ toolkits — choose the most specific one available.

**Common toolkits:**

| Task | Slug |
|------|------|
| LinkedIn profiles / outreach / lead gen | `LINKEDIN` |
| GitHub repos, PRs, issues, code search | `GITHUB` |
| Gmail send / read / search | `GMAIL` |
| Google Sheets read / write / append | `GOOGLESHEETS` |
| Google Calendar events / scheduling | `GOOGLECALENDAR` |
| Google Drive files / folders | `GOOGLEDRIVE` |
| Google Docs create / edit | `GOOGLEDOCS` |
| Notion pages / databases | `NOTION` |
| Airtable bases / records | `AIRTABLE` |
| HubSpot CRM contacts / deals | `HUBSPOT` |
| Salesforce CRM | `SALESFORCE` |
| Slack messages / channels | `SLACK` |
| Jira tickets / projects | `JIRA` |
| Linear issues / projects | `LINEAR` |
| Apollo.io prospecting | `APOLLO` |
| Hunter.io email finder | `HUNTER` |
| Firecrawl web scraping | `FIRECRAWL` |
| Exa AI semantic web search | `EXA` |
| Composio general web search | `COMPOSIO_SEARCH` |
| Ahrefs SEO / backlinks | `AHREFS` |
| Dropbox files | `DROPBOX` |
| Box files / folders | `BOX` |
| Stripe payments / subscriptions | `STRIPE` |
| Twilio SMS / voice | `TWILIO` |
| Zoom meetings | `ZOOM` |
| Calendly scheduling | `CALENDLY` |
| Intercom customer support | `INTERCOM` |
| Freshdesk tickets | `FRESHDESK` |
| Mailchimp campaigns | `MAILCHIMP` |
| Klaviyo email marketing | `KLAVIYO` |
| Brevo (Sendinblue) emails | `BREVO` |
| Datadog monitoring | `DATADOG` |
| Cloudflare DNS / security | `CLOUDFLARE` |
| AWS / cloud infra | use `rest_api` step |
| ClickUp tasks | `CLICKUP` |
| Asana tasks / projects | `ASANA` |
| Monday.com boards | `MONDAY` |
| Confluence docs / spaces | `CONFLUENCE` |
| Figma designs | `FIGMA` |
| Canva designs | `CANVA` |
| Apify web scraping actors | `APIFY` |
| Bright Data scraping | `BRIGHTDATA` |
| ElevenLabs text-to-speech | `ELEVENLABS` |
| HeyGen AI video | `HEYGEN` |
| Deepgram transcription | `DEEPGRAM` |
| OpenAI / LLM calls | `AI_ML_API` |
| Anthropic Claude | use `llm_rest_api` step |

Full toolkit list and docs: `https://docs.composio.dev/llms-full.txt`
Install composio skills pack: `npx skills add composiohq/skills`

**systemPrompt tips:** State the agent's role clearly, include the service name, and describe what a successful outcome looks like.
**userPrompt tips:** Be specific. Include filters, field names, counts, or any constraints the user provided.

---

## Universal step requirements — every step must have all three

These three fields are **required on every step** without exception, regardless of action type.

### 1. `label` — short human-readable description
A concise name for the step (5–10 words). Shown in the UI step list.
```json
"label": "Click the Submit button"
```

### 2. `intent` — structured Input / Processing / Output description

A detailed description (3–8 sentences) that captures everything a future reader — human or AI —
needs to understand this step without looking at anything else. The intent is structured around
**three questions** that fully define the step's contract:

**Must include all three sections:**

1. **Input** — What data does this step consume?
   - List every `{{stepId.variableName}}` template variable used anywhere in this step (URL, value,
     prompts, headers, body, etc.). For each variable, explain: what it holds, which step produced it
     (by step number and label), and why this step needs it.
   - If the step takes no input variables, describe the static/hardcoded inputs (URL, selector, value)
     or state "No input variables."

2. **Processing** — What does this step do?
   - Describe the action type's behavior: navigating to a URL, clicking a button, calling an API,
     running an LLM prompt, executing code in a sandbox, etc.
   - Be specific about the transformation, side effect, or decision being made.

3. **Output** — What data does this step produce?
   - List every exported variable (`exportedVariables`) by name and describe what it contains and
     what downstream steps would use it for.
   - If the step has no exported variables, state the observable outcome that proves success (page
     change, API 200 response, file downloaded, confirmation banner visible, etc.).

```json
"intent": "**Input:** The `value` field is populated from `{{step-3a1bc.formData}}`, which is the serialized form payload assembled in step 3 (Fill Registration Fields).\n\n**Processing:** Submits the completed registration form by clicking the primary submit button identified by the `#submit-btn` selector.\n\n**Output:** No exported variables. The step succeeds when the browser navigates away from /register or a success confirmation banner becomes visible on the page."
```

**More examples:**

_Navigate step (no variables):_
```json
"intent": "**Input:** No input variables — uses the hardcoded URL `https://www.linkedin.com/login`.\n\n**Processing:** Opens the LinkedIn login page in the browser so subsequent steps can authenticate the user.\n\n**Output:** No exported variables. The step succeeds when the browser is on the login page and the email input field is visible."
```

_API step with multiple variables:_
```json
"intent": "**Input:** `{{step-2f4da.email}}` is the prospect's email address extracted from the Apollo search in step 2 (Search Prospects); `{{step-4c1ab.companyId}}` is the HubSpot company ID resolved in step 4 (Find Company).\n\n**Processing:** Sends the enriched lead record to HubSpot CRM via a POST request to create a new contact, associating it with the resolved company.\n\n**Output:** Exports `contactId` — the HubSpot contact ID from the 201 response, used by step 6 (Send Welcome Email) to link the email to the CRM record."
```

_LLM step with a template variable and exported output:_
```json
"intent": "**Input:** `{{step-5e9f1.articleBody}}` is the raw HTML-stripped body text captured by the extract step (step 5, Scrape Article).\n\n**Processing:** Runs an LLM prompt that summarizes the scraped article text into three bullet points suitable for a Slack digest.\n\n**Output:** Exports `summary` — the three-bullet-point summary string, consumed by step 7 (Post to Slack) as the message body."
```

_MCP tool step with Composio toolkit:_
```json
"intent": "**Input:** `{{step-1a2b3.searchQuery}}` is the user-provided search query from the intake form in step 1 (Collect Search Criteria).\n\n**Processing:** Uses the LINKEDIN Composio toolkit to search for investor profiles matching the given criteria, filtering by location and industry focus.\n\n**Output:** Exports `investorProfiles` — a JSON array of matching profiles with name, title, company, and LinkedIn URL fields, consumed by step 3 (Enrich Profiles) for further data enrichment."
```

### 3. `selectorPrompts` vision fallback — required for all browser selector steps
For any step that uses `selectors` to target a DOM element (`click`, `fill`, `type`, `hover`,
`select`, `scroll`), you **MUST** add at least one `selectorPrompts` entry with a `userPrompt`
that describes what the action is supposed to do in natural language. This acts as a vision-powered
AI fallback if the CSS/XPath selectors fail at runtime.

```json
"selectorPrompts": [
  {
    "queryType": "prompt",
    "backupType": "task",
    "userPrompt": "Click the blue 'Submit' button at the bottom of the sign-up form"
  }
]
```

The `userPrompt` should describe both **what element to find** and **what action to perform**, so
the vision model has enough context to succeed without the selectors.

### Complete example with all three fields
```json
{
  "step_number": 3,
  "action_type": "click",
  "stepId": "step-3f1a2",
  "label": "Click Submit button",
  "intent": "**Input:** No input variables — targets the submit button via static CSS selectors `#submit-btn` and `button[type='submit']`.\n\n**Processing:** Clicks the primary submit button to submit the registration form that was filled in the previous steps.\n\n**Output:** No exported variables. The step succeeds when the browser navigates to the confirmation page or a success message is displayed.",
  "selectors": ["#submit-btn", "button[type='submit']"],
  "selectorPrompts": [
    {
      "queryType": "prompt",
      "backupType": "task",
      "userPrompt": "Click the primary blue submit button at the bottom of the registration form"
    }
  ],
  "timestamp": 1710000003000
}
```

## When to use this skill

Use this skill when the user wants to:
- Create or modify an automation workflow
- Build a browser automation (scraping, form filling, testing)
- Set up an API integration pipeline
- Create an AI agent that browses the web autonomously
- Build a data processing or ETL job
- Generate media (images, video, audio) as part of a workflow
- Deploy any multi-step automation to Gabriel Operator

## Workflow type — use this to guide step generation

When a user starts a new workflow from scratch, the chat UI asks them to choose a workflow type.
Their answer is prepended to the build request in this format:

```
What type of workflow do you want to build?: <answer>

---

Build request: <original message>
```

Use the workflow type to select appropriate action types and avoid using browser steps when not needed:

| Type | What the user chose | Key action types to use | Avoid |
|------|--------------------|--------------------------|----|
| **Browser agent** | "Browser agent — navigates websites, fills forms, clicks buttons" | `navigate`, `click`, `fill`, `type`, `goal`, `scroll`, `hover`, `screenshot` | `rest_api`, `api_call` as primary |
| **Browserless** | "Browserless — API calls, data processing, integrations (no browser)" | `rest_api`, `llm_rest_api`, `data_source_read`, `data_source_write`, `api_output`, `notification` | any browser action |
| **Explainer** | "Explainer — explain and document the existing workflow steps" | Read existing `assets/workflow.json` only; output a markdown explanation; do NOT modify steps | — |

If no type prefix is present (the user is editing an existing workflow), infer the type from the existing steps.

## Planning mode — confirm before implementing

When the user's message contains **"PLANNING MODE"**, you must follow this two-phase flow:

### Phase 1: Generate the plan (no tools)
1. Read this SKILL.md and the relevant child action SKILL.md files.
2. Output a **numbered plan** listing every step you intend to create:
   - Step number
   - `action_type`
   - One-sentence description of what the step does
3. After the plan, append **exactly** the following `<questions>` block on its own line — do not alter the ids, option ids, or option labels:

```
<questions>[{"id":"plan-confirm","text":"Does this plan look good to you?","options":[{"id":"confirm","label":"✅ Confirm and implement"},{"id":"dismiss","label":"↩ Dismiss and continue planning"}],"allowMultiple":false}]</questions>
```

### Phase 2: Act on the confirmation
- **"✅ Confirm and implement"** → proceed with calling `replace_workflow_steps` (or other mutation tools) to build the workflow exactly as planned.
- **"↩ Dismiss and continue planning"** → do NOT call any mutation tools. Ask the user what they would like to change about the plan.

## Workflow structure overview

This skill repository uses the following layout:

```text
.
├── SKILL.md
├── scripts/
├── references/
└── assets/
    └── workflow.json
```

The canonical workflow file lives at `assets/workflow.json`. Its top-level shape:

```json
{
  "actionId": "<action-id>",
  "structure": {
    "name": "Internal label",
    "actionName": "Human-readable title",
    "baseUrl": "",
    "screenshotEnabled": true,
    "steps": [],
    "parameters": {
      "execute": []
    },
    "groups": []
  },
  "commitMessage": "Describe what changed"
}
```

### Key fields

| Field | Required | Description |
|-------|----------|-------------|
| `actionId` | Yes | Action identifier this repo is bound to |
| `structure.name` | Yes | Internal workflow label |
| `structure.actionName` | Yes | Display title shown to users |
| `structure.baseUrl` | Yes | Base URL prefix (empty string if steps use absolute URLs) |
| `structure.steps` | Yes | Array of step objects — the core of the workflow |
| `structure.parameters` | Yes | Parameterized execution config (use `{ "execute": [] }` if none) |
| `structure.groups` | Yes | Repeat/conditional group definitions (use `[]` if none) |
| `structure.screenshotEnabled` | No | Capture screenshots per step (default: true) |
| `commitMessage` | Yes | Git commit message for version control |

## Action type routing table

Load the relevant child skill for each step type you need:

### Browser Navigation & Interaction
| action_type | Child Skill | Description |
|-------------|-------------|-------------|
| `navigate` | `action-navigate` | Go to a URL, optionally verify login state |
| `click` | `action-click` | Click element by selector, coordinates, or AI |
| `fill` | `action-fill` | Clear field and set value |
| `type` | `action-type` | Type text keystroke-by-keystroke |
| `hover` | `action-hover` | Hover over element |
| `select` | `action-select` | Select dropdown option |
| `scroll` | `action-scroll` | Scroll to element or coordinates |
| `manual_scroll` | `action-manual-scroll` | Directional scroll (up/down/left/right) |
| `keypress` | `action-keypress` | Press a keyboard key |
| `keyboard_type` | `action-keyboard-type` | Type via keyboard API |
| `upload` | `action-upload` | Upload file to input |
| `download` | `action-download` | Download file from page |
| `screenshot` | `action-screenshot` | Capture page screenshot |
| `switch_tab` | `action-switch-tab` | Switch browser tab |
| `blank_step` | `action-blank-step` | Open about:blank |
| `take_control` | `action-take-control` | Pause for manual browser control |

### AI/LLM-Powered Actions
| action_type | Child Skill | Description |
|-------------|-------------|-------------|
| `llm` | `action-llm` | LLM vision-guided click/fill/extract |
| `llm_command` | `action-llm-command` | LLM-generated browser command |
| `goal` | `action-goal` | Autonomous AI agent (multi-step browsing) |
| `confirmation` | `action-confirmation` | Pause for user confirmation |
| `manual_extract` | `action-manual-extract` | AI-assisted data extraction |
| `continuous_screenshots` | `action-continuous-screenshots` | Periodic capture + analysis |
| `image_response` | `action-image-response` | Capture page images |
| `pdf_response` | `action-pdf-response` | Capture page as PDF |

### API & Data Actions (no browser)
| action_type | Child Skill | Description |
|-------------|-------------|-------------|
| `api_call` | `action-api-call` | Simple HTTP request |
| `rest_api` | `action-rest-api` | Full REST client (Postman-like) |
| `llm_rest_api` | `action-llm-rest-api` | Call any LLM provider API |
| `mcp_tool` | `action-mcp-tool` | Model Context Protocol tool call |
| `data_source_read` | `action-data-source-read` | Read from DB/datasource |
| `data_source_write` | `action-data-source-write` | Write to DB/datasource |
| `api_output` | `action-api-output` | Define structured output schema |
| `notification` | `action-notification` | Send notification (email/Slack/webhook/etc.) |
| `wait` | `action-wait` | Delay/pause step |

### Media & Sandbox Actions (no browser)
| action_type | Child Skill | Description |
|-------------|-------------|-------------|
| `generate_media` | `action-generate-media` | AI image/video/audio generation |
| `stitch_videos` | `action-stitch-videos` | Combine video clips |
| `coding_agent` | `action-coding-agent` | Sandbox code execution |
| `computer_use_agent` | `action-computer-use-agent` | Computer use in sandbox |

## How to build a workflow

### Step 1: Identify required action types
Based on the user's goal, determine which action types are needed. Common patterns:

- **Web scraping**: `navigate` → `goal` or `click`/`fill` sequence → `manual_extract` or `api_output`
- **API pipeline**: `rest_api` → `llm_rest_api` → `api_output`
- **AI browsing agent**: `navigate` → `goal` → `confirmation`
- **Data ETL**: `data_source_read` → `llm_rest_api` (transform) → `data_source_write`
- **Media generation**: `generate_media` → `stitch_videos` → `notification`

### Step 2: Load child skills
For each action type, read the corresponding child skill's `SKILL.md` to get the exact JSON schema, required/optional fields, and examples.

### Step 3: Assemble the steps array
Each step must have:
- `step_number` — sequential starting from 1
- `action_type` — one of the 37 supported types
- `stepId` — unique identifier (format: `step-XXXXX` where X is a hex char)
- `timestamp` — Unix timestamp in milliseconds
- `label` — short human-readable description of the step (REQUIRED)
- `intent` — rich purpose, variable documentation, and acceptance criteria for this step (REQUIRED)
- `selectorPrompts` with `userPrompt` — vision fallback (REQUIRED for all selector-based browser steps: click, fill, type, hover, select, scroll)

### Step 4: Add cross-cutting features (optional)
Any step can have guards, hooks, evals, and narration. See [references/CROSS-CUTTING.md](references/CROSS-CUTTING.md) for details.

### Step 5: Add groups (optional)
If steps need to loop or execute conditionally, define groups. See [references/CROSS-CUTTING.md](references/CROSS-CUTTING.md).

### Step 6: Add parameters (optional)
For data-driven runs with multiple value sets. See [references/CROSS-CUTTING.md](references/CROSS-CUTTING.md).

### Step 7: Validate
Run the validation script from the skill repo root:
```bash
npx tsx scripts/validate-workflow.ts assets/workflow.json
```

## API endpoint

```
PUT https://gabrieloperator.com/api/automation/build/{automationId}/{actionId}
Authorization: Bearer <token>
Content-Type: application/json
```

The backend normalizes step IDs, reindexes step numbers, and commits through workflow Git. When this skill pack is migrated into a git-backed workflow repo, `SKILL.md`, `scripts/`, `references/`, and `assets/workflow.json` move together.

## Generating step IDs

Each step needs a unique `stepId`. Generate them as `step-` followed by 5 random hex characters:
```
step-714da, step-4e1fc, step-2ecd5
```

## Template variable syntax

Steps can reference outputs from previous steps using the `{{stepId.variable}}` template syntax in string fields (URLs, prompts, headers, body). Example:
```json
{
  "url": "https://api.example.com/users/{{step-714da.userId}}"
}
```

## Available scripts

- **`scripts/validate-workflow.ts`** — Validates a workflow JSON file against the full schema
- **`scripts/generate-example.ts`** — Generates an example workflow JSON for a given scenario

## Full schema reference

See [references/SCHEMA.md](references/SCHEMA.md) for the complete field-by-field JSON schema.

See [references/CROSS-CUTTING.md](references/CROSS-CUTTING.md) for guards, hooks, evals, groups, and parameters.

See [references/TEMPLATE.md](references/TEMPLATE.md) for a copy-paste blank template.
