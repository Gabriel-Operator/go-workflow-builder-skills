# Source discovery and feedback

A Source Feed is the same Data Feed primitive with `outputKind: "sources"` and an `ontology` projection onto `Source`. It uses the same CRUD operation tags, immutable revisions, public/private/delegated modes, mobile credential approval, and playbook-only execution. The Persona's single ontology includes `primitives: ["Source"]`; region/language variations do not create new ontologies.

Each newly saved feed has `registryRef` (default `list.data-feed.sources`). Domain feeds may declare:

```json
{
  "sourceSelection": {
    "registryRef": {"kind": "list", "resourceKey": "list.data-feed.sources"},
    "dataTypes": ["Property"],
    "capabilities": ["listings"],
    "minimumQuality": 0.5,
    "minimumReliability": 0.5,
    "minimumCoverage": 0.5,
    "maximumAgeHours": 168,
    "limit": 5
  }
}
```

The workflow consumes `{{sources.primary.url}}` or typed `{{sources.items}}`. Selection uses the runner's private registry, explicit/resolved country and language, authenticated identity, and stored persona profile answers. It rejects stale/inactive sources and ranks individual/ICP/region/language matches before quality scores. A Source Feed may set `includeCandidates: true` to inspect candidate/inactive sources; domain feeds cannot. Selections are pinned on the parent playbook for recovery. The interpreter still enforces the workflow's declared service allowlist and mobile credential slots.

The Source Feed returns JSON without registering anything. A following `map_json_to_list` step performs registration explicitly:

```json
{
  "action_type": "map_json_to_list",
  "listMapping": {
    "listRef": {"kind": "list", "resourceKey": "list.data-feed.sources"},
    "sourceStepId": "discover",
    "recordsPath": "/results",
    "fields": {"source_key": "/source_key", "entityType": "/entityType", "source": "/source"},
    "operation": "upsert",
    "matchBy": ["source_key"],
    "sourceRegistry": {
      "mode": "discover",
      "fields": {"name": "/title", "url": "/url"},
      "defaults": {"accessMethod": "browser", "dataTypes": ["Property"]},
      "policy": {
        "allowedDomains": ["approved-property-portal.example"],
        "minimumQuality": 0.5,
        "minimumReliability": 0.5,
        "minimumCoverage": 0.5,
        "maximumAgeHours": 168,
        "activatePassingSources": false
      },
      "templates": []
    }
  }
}
```

The mapping allocates a private List using the existing List/Mongo infrastructure, normalizes Source fields, generates stable IDs from URLs when omitted, and upserts metadata through the existing governed mutation service with ancestry. No new source database or graph exists. The Source registry owns `source_key`, `entityType`, and a JSON `source` column. Candidate registration does not imply execution permission. Search ranking scores are not source reliability scores; do not invent quality to activate search results. Raw credential-bearing URLs, secret values, and account credential IDs are not source metadata. `authenticationReference` names a logical slot only.

For feedback, another playbook output contains `{sourceId, success, freshness?, qualityScore?, coverageScore?}` objects. Use the same mapping with `sourceRegistry.mode: "evaluate"`, no discovery projection/defaults, and its authorized policy. Scores range 0–1. The registry uses a 0.3 observation weight to update reliability/quality/coverage, deactivates a previously active source failing freshness/quality policy, and permits recovery under a later passing evaluation. A requested deactivation remains in force. All changes require the explicit playbook step; ordinary feed invocation never persists outcomes into the registry.

To instantiate domain feeds, add approved entries to `templates`: `{feedId, revision, urlParameter, dataType, credentialSlots?}`. Select a visible private/public domain skeleton with a declared string URL input used by its workflow. Pin the exact revision; do not invent it. The playbook binds that URL for each active matching Source, optionally rebinds named credential slots to a policy-approved source host, and saves an idempotent runner-private definition. It never copies credentials/bindings/grants. New feeds require the runner's own persona mobile vault approval. At most 100 feed skeletons are created per mapping step. Discovery output cannot supply executable code, prompts, templates, or service policies.

Repeat discovery, domain acquisition, and evaluation with the existing scheduled/event-driven playbook machinery to improve sources over time. No separate scheduler or autonomous background execution is introduced. Nest may use independent Property Source and Buyer Intent Source feeds over the same registry. An empty catalog or unbound registry is valid until a discovery playbook first registers candidates.
