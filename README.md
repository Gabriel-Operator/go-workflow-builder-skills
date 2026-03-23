# go-workflow-builder-skills

**Gabriel Operator** workflow-builder skill pack — the complete scaffold for building, validating, and deploying automation workflows via the Gabriel Operator API.

## Install

### npx (recommended)

```bash
# Install into current directory
npx github:go-code-bot/go-workflow-builder-skills

# Install into a specific directory
npx github:go-code-bot/go-workflow-builder-skills add ./my-workflow

# Re-sync / overwrite existing files
npx github:go-code-bot/go-workflow-builder-skills sync .
```

### curl | bash

```bash
# Install into current directory
curl -fsSL https://raw.githubusercontent.com/go-code-bot/go-workflow-builder-skills/main/install.sh | bash

# Install into a target directory
curl -fsSL https://raw.githubusercontent.com/go-code-bot/go-workflow-builder-skills/main/install.sh | bash -s -- ./my-workflow
```

> **Requirements**: Node.js 16+

---

## What gets installed

```
SKILL.md                          ← Main workflow-builder instructions for AI agents
scripts/
  validate-workflow.ts            ← Validate a workflow.json against the full schema
  generate-example.ts             ← Generate an example workflow for a given scenario
references/
  SCHEMA.md                       ← Complete field-by-field JSON schema reference
  CROSS-CUTTING.md                ← Guards, hooks, evals, groups, parameters
  TEMPLATE.md                     ← Copy-paste blank workflow template
actions/
  action-click/SKILL.md           ← Per-action AI skill instructions
  action-fill/SKILL.md
  action-navigate/SKILL.md
  action-goal/SKILL.md
  action-rest-api/SKILL.md
  … (37 action types total)
```

---

## Usage

After installing, the `SKILL.md` file at the root is the primary entry point for AI agents. It documents:

- All 37 supported action types
- Required fields (`label`, `comment`, `selectorPrompts`) on every step
- Step JSON schema and flat structure rules
- How to validate and build workflows

### Validate a workflow

```bash
npx tsx scripts/validate-workflow.ts assets/workflow.json
```

### Generate an example workflow

```bash
npx tsx scripts/generate-example.ts
```

---

## Supported action types

| Category | Actions |
|----------|---------|
| Browser navigation | `navigate`, `click`, `fill`, `type`, `hover`, `select`, `scroll`, `manual_scroll`, `keypress`, `keyboard_type`, `upload`, `download`, `screenshot`, `switch_tab`, `blank_step`, `take_control` |
| AI/LLM | `llm`, `llm_command`, `goal`, `confirmation`, `manual_extract`, `continuous_screenshots`, `image_response`, `pdf_response` |
| API & Data | `api_call`, `rest_api`, `llm_rest_api`, `mcp_tool`, `data_source_read`, `data_source_write`, `api_output`, `notification`, `wait` |
| Media & Sandbox | `generate_media`, `stitch_videos`, `coding_agent`, `computer_use_agent` |

---

## API endpoint

```
PUT https://gabrieloperator.com/api/automation/build/{automationId}/{actionId}
Authorization: Bearer <token>
Content-Type: application/json
```

---

## License

MIT
