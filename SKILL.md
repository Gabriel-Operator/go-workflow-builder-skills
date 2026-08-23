---
name: workflow-builder
description: >
  Build, validate, and deploy Gabriel Operator automation workflows via the API.
  Use this skill when the user wants to create a browser automation, API pipeline,
  AI agent workflow, data processing job, or any multi-step automation. Handles all
  39 action types including navigate, click, fill, goal, rest_api, data_source_read,
  generate_media, coding_agent, and more. Orchestrates child action-* skills for
  step-level detail. Use even when the user says "build a workflow", "automate",
  "create an agent", or describes a multi-step task without naming the platform.
metadata:
  author: gabriel-operator
  version: "1.2"
  compatibility: Requires Node.js 18+ for script execution (npx tsx).
---

# Workflow Builder

## Portable Git contract (schema v2)

New workflow repositories must use a stable resource key and portable dependency refs:

```json
{
  "schemaVersion": 2,
  "resourceKey": "workflow.example.fulfil-v2",
  "structure": {
    "steps": [{
      "stepId": "review",
      "execution": {
        "type": "pipeline_transition",
        "pipelineRef": { "kind": "pipeline", "resourceKey": "pipeline.example.fulfil-v2" },
        "transitionId": "review"
      }
    }]
  }
}
```

- Never commit `actionId`, `automationId`, `pageId`, `pipelineId`, `collectionId`, or other database IDs to portable workflow JSON or generated connection diagrams.
- When publishing through a Persona bundle, update the Persona registry entry with the exact Workflow commit `revision` and the SHA-256 `definitionFingerprint` of `assets/workflow.json`.
- Use `pipelineRef` everywhere an authored Canvas task depends on a Pipeline, including expanded tasks and the aggregate Canvas definition.
- Keep `stepId`, `canvasTaskId`, `sequenceId`, transition IDs, and dependency IDs stable; they are logical model IDs.
- Ensure the Persona registry declares the Workflow and every transitive Pipeline/List dependency before publishing.
- Import resolves refs into environment-local IDs before execution. Runtime runs and audit records may store those resolved IDs; Git must not.
- Legacy schema v1 runs only when its exact local IDs exist. Never copy v1 between environments or generate a new v1 export.

This scaffold declares its required validator in root `gabriel.workspace.json`. Keep that
manifest, `scripts/validate-workflow.ts`, and `assets/workflow.json` together. In a Persona
workspace, commit and push this repository first; the parent publisher verifies that the
pinned SHA is reachable from this repo's declared branch before advancing the Persona lock.
Several commands may share this Workflow's one registry entry.
Unmarked older child repos use the parent's loud legacy-validator fallback. Do not remove
this marker from new repos. If the parent reports a stale link, run its `prune`; it removes
only Git metadata and preserves this checkout. Never publish the parent before this child
commit is pushed.

## Using this skill in coding agents

Gabriel Operator skills are designed for Claude Code, Codex, Cursor, Hermes, OpenClaw, and any agent that supports skill packs. Work in the git-backed workflow repository connected to your automation.

### Install the skill pack

| Agent | Install |
|-------|---------|
| **Claude Code** | `npx skills add go-code-bot/go-workflow-builder-skills` |
| **Codex** | `codex plugin marketplace add Gabriel-Operator/gabriel-operator-coding-agent-plugin --sparse .agents/plugins` then install the Gabriel Operator plugin |
| **Cursor** | `npx github:go-code-bot/go-workflow-builder-skills add ./my-workflow` or copy into `.cursor/skills/workflow-builder/` |
| **Hermes / generic CLI** | `npx github:go-code-bot/go-workflow-builder-skills add ./my-workflow` |
| **OpenClaw** | `npx skills add go-code-bot/go-workflow-builder-skills` then `openclaw gateway connect --url https://your-openclaw-gateway` |
| **Gabriel Operator monorepo** | `cp -R server/skills/workflow-builder ./your-git-repo/` |

Alternative curl installer:

```bash
curl -fsSL https://raw.githubusercontent.com/go-code-bot/go-workflow-builder-skills/main/install.sh | bash
```

### Modify with your coding agent

1. Open the git-backed workflow repository.
2. Tell your agent: *"Read `SKILL.md` and update `assets/workflow.json` for \<describe the automation\>. Consult `actions/action-*/SKILL.md` for step-level field shapes. Keep step fields flat at the root — never wrap under `arguments`."*
3. Scaffold a starting workflow when helpful:
   ```bash
   npx tsx scripts/generate-example.ts
   ```
4. Validate before committing:
   ```bash
   npx tsx scripts/validate-workflow.ts assets/workflow.json
   ```
5. Commit and push to the default branch.

**Example prompts by agent:**
- **Claude Code:** *"Generate and run this Gabriel operator workflow from assets/workflow.json."*
- **Codex:** *"Validate, generate, and deploy this Gabriel operator workflow."*
- **Cursor:** *"Install the workflow skill, generate steps, and run the operator loop."*
- **Hermes:** *"Run the Gabriel operator workflow and poll run status until complete."*
- **OpenClaw:** *"Scaffold the workflow from the harness steps, validate assets/workflow.json, and execute the operator harness loop."*

### Deploy and run

1. **Validate** (required before deploy):
   ```bash
   npx tsx scripts/validate-workflow.ts assets/workflow.json
   ```
2. **Deploy** the workflow definition:
   ```
   PUT https://gabrieloperator.com/api/automation/build/{automationId}/{actionId}
   Authorization: Bearer $GABRIEL_TOKEN
   Content-Type: application/json
   ```
3. **Run** the automation:
   ```bash
   curl -X POST "https://gabrieloperator.com/api/automation/run/$AGENT_ID/$ACTION_ID" \
     -H "Authorization: Bearer $GABRIEL_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{}'
   ```
4. Poll run status via the automation API or Gabriel UI until the harness loop completes (including any confirmation gates).

See `runner/SKILL.md` in git-backed workflow repos for run-specific details generated at repository initialization.

---

## Git-backed action repositories
When this skill is materialized as a git repository for a single automation action, the repo includes the scaffold under `actions/`, `scripts/`, `references/`, plus:
- `/assets/workflow.json` — canonical step payload for that action.
- `/runner/SKILL.md` — generated on repository initialization; documents how to start runs and poll status via the automation HTTP API (`POST /api/automation/run/:agentId/:actionId`).

The HTTP path above uses resolved runtime IDs. Those values are supplied by the current environment and must never be copied back into `assets/workflow.json`.

### Inside a Persona workspace

This repository is usually a **git submodule** of an AI Persona repository, at
`references/workflows/<resource-key>/`. The parent owns `references/registry.json`, which
pins **exactly one** portable workflow (plus the pipeline and list). Extra slash-command
workflows are depth-1 checkouts too, but they live in generated
`references/workspace.json`, not as extra portable registry kinds. After changing this
definition, commit and push here **first**, then publish the parent workspace. Until you
do, the Persona still resolves the previous commit. The parent root is coordinated
authoring, not an atomic multi-repo commit.

A Persona may link several workflow repositories. Exactly one is the portable
`workflowRef` named in `registry.json` — that is the workflow import materializes as the
published command. Adding a second workflow repo does not repoint the Persona; changing
`workflowRef` does. Do not mark rows `"primary": true` and do not add `team_agent` to the
portable registry.

### Persona slash-command repositories

If `/assets/persona-command.json` exists, this workflow is the executable half of a persona slash command. Before explaining or changing it:

1. Read `/skills/persona-command/SKILL.md` and `/assets/persona-command.json`.
2. Read this repository's debug/docs assets first:
   - `/assets/workflow.json` — executable steps
   - `/assets/slash-connections.json` — slash-command connection debug graph
   - `/skills/persona-command/SKILL.md` — authoring guidance for this command
3. Open the parent persona repository only for **registration** fields in `/assets/chat-config.json` (`agentTopology.slashCommands`: id, trigger, label, description, enabled, presentation, Operator action reference).
4. First summarize what the connected command currently implements, then ask what the author wants to explain, extend, or modify unless a concrete change was already requested.
5. **Do not** create or edit `assets/slash-connections/` (or any slash-command debug definitions) in the parent persona chat-config repository. Debug/docs for slash commands are owned by this workflow repository and the workflow-builder skill.

#### Ownership split

| Location | Owns |
|----------|------|
| Parent `assets/chat-config.json` | Runtime registration only: trigger, label, description, enabled, presentation, Operator action linkage |
| This workflow repo | Executable workflow, prompts, I/O, generated child skills, **slash-connection debug graph** (`assets/slash-connections.json`), persona-command authoring skill |

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
  "label": "Workflow Start",
  "step_number": 1,
  "stepId": "step-XXXXX"
}
```

### Rule 2 — In browserless workflows, prefer no-browser actions and Composio-backed `mcp_tool`

For browserless workflows (`step 1 = navigate` with `disableBrowser: true`), **prefer** `action_type: "mcp_tool"` backed by the most appropriate **Composio toolkit** for the task. Write a focused `systemPrompt` (agent role + context) and a specific `userPrompt` (exact task to execute).

Other no-browser action types are also valid when they fit the task, including:
- `rest_api`
- `llm_rest_api`
- `data_source_read`
- `data_source_write`
- `api_output`
- `notification`
- `wait`
- `confirmation`

Do **not** use browser-required steps when the first step has `disableBrowser: true`.

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

### Rule 3 — Workflow-authored Canvas must always use `blueprintRef: "inline"`

Every `persona_capability` step with `kind: "canvas_task_execution"` must set:

```json
"blueprintRef": "inline"
```

Set it in both places when the Canvas is expanded across multiple workflow steps:

- `personaCapabilityConfig.execution.canvas.blueprintRef`
- the terminal step's `personaCapabilityConfig.canvasTask.aggregateCanvas.blueprintRef`

Never use `"page"`, a page id, a sequence id, a product name, or any other custom string as
`blueprintRef`. The old `"page"` mode depends on a deprecated page-level master-skill blueprint
and is retained only so existing stored executions can migrate. A workflow already owns its Canvas
task catalog, so `"inline"` is the only valid authoring mode. Use `canvasTask.sequenceId` for the
stable workflow/playbook identity; do not overload `blueprintRef` with that identity.

### Rule 4 — Acquisition-backed Canvas uses presentation tasks, not scraping steps

When a pipeline transition declares `acquisition`, the workflow must not repeat
that external read with `goal`, `manual_extract`, Firecrawl, or custom browser
steps. The shared acquisition executor owns cache-first/API-first/browser-last
selection; the workflow only defines the Canvas sequence.

For an Archer-style form playbook, author exactly three contiguous
`persona_capability` Canvas tasks after the browserless bootstrap:

1. Analyze: `presentation.kind: "schema_form_questions"`, `artifactPolicy: "none"`.
2. Collect/review: `presentation.kind: "schema_form_answer_review"`,
   `requiresApproval: true`, `autoApprove: false`, `artifactPolicy: "none"`.
3. Fill/submit: `artifactPolicy: "explicit_only"`, user-visible mappings only
   for screenshots (`image`) and browser recording (`video`), and
   `playbookEntrypointId: "execute"`.

For a `channels_only` questionnaire, submitting the trusted response form (or
confirming its exact preview in voice) is the task's explicit human approval.
Keep `requiresApproval: true`: after the Collect transition commits, Canvas
records the matching run-and-answer approval and proceeds directly to
Fill/submit. Do not author a second Looks good/Improve approval step for the
same answers. If the approval record cannot be written, runtime falls back to
the normal explicit Canvas review and fails closed.

Never emit transition summaries, URLs, schemas, answers, fingerprints, or
playbook JSON as artifacts. All pipeline task transitions are `manual`, have
`autoFireOnEntry: false`, and map one Canvas task to one transition. The execute
entrypoint belongs only on the final task and may not permit a form URL override.

For model-driven prior-case detection, set one `existingCasePolicyId` on the
shared Canvas definition (and therefore the terminal aggregate Canvas). Do not
add a separate "check previous submission" Canvas task or place prior answers in
workflow JSON. The standard slash-command launcher asks Reuse / Start fresh
before execution exists; dismissing the prompt is the non-mutating cancel path.
The Analyze task then reconciles referenced answers against the newly acquired
trusted schema and continues to the normal review gate. Reconciled values are
prefill only: even when every prior answer remains compatible, Canvas must show
the current full Q&A and obtain a new explicit confirmation before executing the
Collect transition. Never turn a fully reusable answer bag into a synthetic
completed response.

The referenced policy is authored under **Pipeline → Manage → Config →
Existing-case detection**. Workflow owns only the stable policy ID. Never copy
`locatorField`, `identityField`, answer fields, or lineage mappings into the Canvas
configuration. The policy locator must match the Analyze acquisition locator; for
example, a policy using `product_url` cannot launch an Analyze transition still
configured for `form_url`. Cross-asset validation must reject that mismatch.

For a task-scoped questionnaire, put `responseCollection` on both the expanded
Canvas task and its matching `taskTypes[]` entry:

```json
{
  "responseCollection": {
    "mode": "channels_only",
    "questionsField": "form_fields",
    "answersInputKey": "form_answers",
    "allowedChannels": ["in_app_voice", "phone", "email", "persona_channels"]
  }
}
```

`channels_only` deliberately removes the inline/chat answer form. Linked Persona
Chat apps such as Slack, Discord, Telegram, and WhatsApp receive a single-use
questionnaire for this Canvas task; they do not start or reuse general Persona
chat. A submitted questionnaire is an explicit confirmation of the displayed
values; voice must preview the exact normalized values and obtain an affirmative
confirmation before its answer tool may submit them. Do not create a team-agent `suspend_resume` workflow merely to collect
these answers. Canvas owns the durable response session, and the pipeline's
workflowless transition validates and commits the returned data. The normal
Filer path must not run a live `schema_form_dry_run` here: doing so opens the
external browser once during Collect and again during Fill/submit. Fill/submit
is the single browser execution after answer confirmation. If a deployment
explicitly needs live conditional discovery, model it as a separate user-visible
suspension rather than silently duplicating the submission automation.

The final Fill/submit task must map both `evidence_screenshots` and
`evidence_recording` as explicit media. Runtime preserves any recording emitted
after the browser session starts even when submission fails or becomes
uncertain, so recovery UI can show what happened without treating evidence as a
successful business transition.

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
| **Browserless** | "Browserless — API calls, data processing, integrations (no browser)" | `mcp_tool`, `rest_api`, `llm_rest_api`, `data_source_read`, `data_source_write`, `api_output`, `notification`, `confirmation` | any browser-required action |
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
  "schemaVersion": 2,
  "resourceKey": "workflow.example.run-v2",
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
| `schemaVersion` | Yes | Use `2` for a portable workflow. |
| `resourceKey` | Yes | Stable model identity resolved to a local action during import. |
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
| `confirmation` | `action-confirmation` | Pause for structured confirmation or retry guidance |
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
| `persona_capability` | `action-persona-capability` | Delegate to a persona tool, Canvas task, retained skill, or workflow endpoint |

## How to build a workflow

### Step 1: Identify required action types
Based on the user's goal, determine which action types are needed. Common patterns:

- **Web scraping**: `navigate` → `goal` or `click`/`fill` sequence → `manual_extract` or `api_output`
- **API pipeline**: `rest_api` → `llm_rest_api` → `api_output`
- **AI browsing agent**: `navigate` → `goal` → `confirmation`
- **Browserless approval gate**: `navigate` (`disableBrowser: true`) → `mcp_tool`/`rest_api` → `confirmation`
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

## Structured confirmation steps

`confirmation` now supports **structured inline questions** in both web and mobile chat surfaces and can be used in both:
- browser workflows
- browserless workflows

`confirmation` is **not** browser-required. It is valid even when step 1 has `disableBrowser: true`.

### Authoring rules

- Put all confirmation fields at the **root** of the step object.
- Use `userPrompt` for the question text shown to the user.
- Use `confirmationConfig` to define how the user should answer and what happens next.
- `userPrompt` supports runtime variable interpolation from earlier step outputs, for example `{{step-abc12.companyName}}`.
- When authoring confirmation prompts, only reference variables that were explicitly exported/configured on previous steps.

### Confirmation schema

```json
{
  "step_number": 6,
  "action_type": "confirmation",
  "stepId": "step-cf123",
  "label": "Confirm enriched lead",
  "intent": "**Input:** `{{step-a1b2c.companyName}}` is the company name exported by step 4 (Enrich lead).\\n\\n**Processing:** Pauses the run and asks the user to confirm whether the enriched result looks correct before continuing.\\n\\n**Output:** Exports `answer`, `answerId`, `answerLabel`, and `confirmed` for downstream branching, logging, or notifications.",
  "userPrompt": "I found {{step-a1b2c.companyName}} as the best match. Should I continue?",
  "confirmationConfig": {
    "answerMode": "yes_no",
    "postAnswer": "continue"
  },
  "timestamp": 1710000006000
}
```

### `confirmationConfig`

| Field | Type | Required | Notes |
|---|---|---|---|
| `answerMode` | `"yes_no" \| "freeform" \| "multiple_choice"` | Yes | Controls the UI shown to the user |
| `options` | array | Only for `multiple_choice` | Provide non-empty labeled options |
| `postAnswer` | `"continue" \| "retry_from_step"` | Yes | Continue the run or restart from an earlier step |
| `retryFromStepNumber` | number | Required when `postAnswer = "retry_from_step"` | Must be an earlier step number |

### Answer modes

#### 1. `yes_no`
Use when the user should explicitly approve or reject the next action.

```json
"confirmationConfig": {
  "answerMode": "yes_no",
  "postAnswer": "continue"
}
```

#### 2. `freeform`
Use when the user needs to type a short explanation, correction, or instruction.

```json
"confirmationConfig": {
  "answerMode": "freeform",
  "postAnswer": "continue"
}
```

#### 3. `multiple_choice`
Use when the user should choose from authored options.

```json
"confirmationConfig": {
  "answerMode": "multiple_choice",
  "options": [
    { "id": "cheapest", "label": "Use the cheapest option" },
    { "id": "healthiest", "label": "Use the healthiest option" },
    { "id": "skip", "label": "Do not proceed" }
  ],
  "postAnswer": "continue"
}
```

### Retry-from-step flows

When `postAnswer` is `retry_from_step`, the confirmation step becomes a structured retry checkpoint:

- the run pauses and asks the question inline
- the user can answer normally
- if the target client supports it, the user can also provide retry guidance
- the runtime restarts from `retryFromStepNumber`

Important:
- `retryFromStepNumber` must point to an earlier step
- the runtime automatically derives retry inputs from the steps between the retry target and the confirmation step
- do **not** author `retryInputs` manually in the step JSON
- downstream retry payloads may include natural-language retry notes and manual field overrides

Example:

```json
{
  "step_number": 8,
  "action_type": "confirmation",
  "stepId": "step-retry1",
  "label": "Review extracted invoice fields",
  "intent": "**Input:** Uses the extracted invoice fields from steps 4 through 7.\\n\\n**Processing:** Pauses the run so the user can verify the extracted values and decide whether to continue or retry from the extraction stage.\\n\\n**Output:** Exports `answer`, `answerId`, `answerLabel`, and `confirmed`. If the user requests a retry, the run restarts from step 4 with any provided retry guidance.",
  "userPrompt": "Please review the extracted invoice fields. If something looks wrong, retry from the extraction step.",
  "confirmationConfig": {
    "answerMode": "yes_no",
    "postAnswer": "retry_from_step",
    "retryFromStepNumber": 4
  }
}
```

### Variables emitted by confirmation

After the user answers, the confirmation step can expose these outputs for later steps:

| Variable | Meaning |
|---|---|
| `answer` | Final answer text |
| `answerId` | Selected option ID, when applicable |
| `answerLabel` | Selected option label, when applicable |
| `confirmed` | Boolean confirmation state when answer maps to yes/no |

Example usage:

```json
"userPrompt": "The reviewer answered: {{step-cf123.answer}}"
```

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

## Exported variables (step outputs)

Steps can expose data they produce so downstream steps and connectors can reference it.

### `exportedVariables`

Maps a variable name to the dot-path where the runtime should read its value from the step's execution result:

```json
"exportedVariables": {
  "userId": "response.data.id",
  "profileUrl": "url",
  "fileSize": "metadata.size"
}
```

Referenced in later steps as `{{stepId.variableName}}`, e.g. `{{step-714da.userId}}`.

Common source paths by action type:

| Action type | Typical source paths |
|-------------|----------------------|
| `download` | `filePath`, `fileName`, `url` |
| `fill` / `type` | `value` |
| `rest_api` / `api_call` | `response`, `statusCode`, `response.data.<field>` |
| `navigate` | `url` |
| `llm` / `goal` | `response`, `extractedData.<field>` |
| `mcp_tool` | `response`, `response.<field>` |

### `exportedVariableDescriptions`

For each variable in `exportedVariables`, you can add a natural-language description that the AI intake agent will use when asking the user to provide values. Without a description, the agent only has the variable name — with one, it can phrase its question clearly and naturally.

```json
"exportedVariables": {
  "searchQuery": "value",
  "profileName": "response.name"
},
"exportedVariableDescriptions": {
  "searchQuery": "The keyword or name to search for on LinkedIn",
  "profileName": "The full name of the LinkedIn profile to extract"
}
```

**When to set `exportedVariableDescriptions`:**
- The variable name alone is cryptic (e.g. `v1`, `param`, `data`)
- The variable holds user-supplied data (names, queries, IDs, dates) that the AI will need to ask about
- Multiple steps export similarly-named variables and you want to disambiguate

**What to write:** One sentence describing what the value represents in the real world and, if relevant, what format it should be in. Do NOT describe the technical path — describe what the user would understand.

Good examples:
- `"The company name to search for in the database"`
- `"The recipient's email address for the notification"`
- `"The LinkedIn profile URL or full name of the target person"`

Bad examples (too technical):
- `"response.data.id field from step 3"` — describes the path, not the value
- `"string value"` — no useful context

## Available scripts

- **`scripts/validate-workflow.ts`** — Validates a workflow JSON file against the full schema
- **`scripts/generate-example.ts`** — Generates an example workflow JSON for a given scenario

## Full schema reference

See [references/SCHEMA.md](references/SCHEMA.md) for the complete field-by-field JSON schema.

See [references/CROSS-CUTTING.md](references/CROSS-CUTTING.md) for guards, hooks, evals, groups, and parameters.

See [references/TEMPLATE.md](references/TEMPLATE.md) for a copy-paste blank template.
