# Generic acquisition contract

Choose `type`: `email`, `file`, `transaction`, `calendar`, `message`, `portal`, or `source`. Domain meaning belongs to instructions and the Persona ontology. Transaction is provider independent; Email is not synonymous with invoices. A static file/image is an observation of a reusable File feed.

A definition may declare `acquisition` with `mode` (`on_demand`, `push`, `pull`, `watch`, `scheduled`, `event_driven`, `user_solicited`, `device_captured`), an `instruction`, `policy`, `checkpoint`, and `observations`. [The JSON schema](acquisition.schema.json) describes the shape; the standalone validator also checks cross-field references and safe pointers. Run `node scripts/validate-acquisition.cjs <definition.json>` from this action directory, or the enclosing workflow validator for embedded definitions.

## Adapters and execution

All types use the same authorized playbook endpoint and existing REST/MCP/browser adapters. Choose an adapter, exact service allowlist and credential slots in the source workflow; the type never selects an implicit provider or credential. `{{feed.type}}`, `{{feed.operation}}`, `{{feed.instruction}}` and `{{feed.acquisition}}` expose authored context for typed definitions. Wire instructions into the appropriate source step; prose metadata does not silently add source actions.

Mode is the reusable acquisition contract, not another scheduler. Use existing parent playbook schedules, signals/events or source-change triggers for repeated invocations. Push/watch subscriptions deliver observations to an authorized parent playbook; a webhook cannot directly invoke the feed. The parent stores last/next run, cursor, history and returned JSON using its existing state. Source registry provenance, freshness and quality stay on the existing Source List. Do not create a feed database, implicit list writes or independent background runner.

## Active acquisition

`user_solicited` requires `policy.allowUserRequest: true`, a nonempty `requestPrompt`, and `observationInput` naming a required top-level property of `inputSchema`. `device_captured` additionally requires File type and `allowDeviceCapture: true`. The parent uses its existing upload/camera/input capability with the normal user consent, waits for that result, then supplies the observation input. Empty observations fail before credentials/source execution. Permission metadata cannot bypass UI/device permission, Guardian authorization or playbook review.

```json
{
  "type": "file",
  "acquisition": {
    "mode": "user_solicited",
    "instruction": "Extract evidence from the requested receipts.",
    "policy": {
      "allowUserRequest": true,
      "requestPrompt": "Please upload the missing receipts.",
      "observationInput": "document"
    },
    "observations": {"recordsPath": "/items", "identityPath": "/id"}
  }
}
```

## Checkpoints and observations

`checkpoint: {inputParameter, outputPath}` references a declared cursor input and output JSON pointer. Explicit JSON null marks the end. Missing checkpoint output fails. Persist/reuse it in the parent, independently of the feed.

`observations: {recordsPath, identityPath?, observedAtPath?, provenancePath?}` validates the returned JSON without wrapping or persisting it. Identities are stable nonempty strings/finite numbers and unique within a batch. Timestamps need an explicit timezone. Declared provenance is a nonempty string or object. Empty batches are valid; missing/null observations are not. Cross-run deduplication remains the parent mapping's identity/upsert policy.

Source type requires `outputKind: "sources"` and an ontology projection to `Source`. It discovers Sources with the same lifecycle and output rules; only an explicit parent mapping registers them or instantiates approved downstream templates. See [Source registry](source-registry.md).

Legacy untyped immutable definitions remain valid and appear as General (or Source for source output). Editing/adoption may create a new typed revision; update consuming pins deliberately. Country/language/audience variants retain this common JSON contract and one Persona ontology.
