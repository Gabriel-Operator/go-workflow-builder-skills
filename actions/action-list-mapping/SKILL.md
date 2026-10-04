---
name: action-list-mapping
description: Map a preceding playbook JSON output into any authorized list independently of the data source.
---

Use action_type `map_json_to_list` with `listMapping: {listId, sourceStepId, recordsPath, fields, operation, matchBy, allowPermanentDelete?}`. `fields` maps declared column keys to JSON pointers relative to each selected row. An empty recordsPath selects the whole output. At most 100 records are mapped per step.

Choose insert, upsert, update, archive or delete. Upsert/update/archive/delete need exact scalar identity columns; ambiguous matches fail before writes. Use archive for deletion synchronization. Permanent delete requires allowPermanentDelete true. Never map approval, consent, submission or pipeline governance fields. Initial pipeline state is set by the server; approved transitions remain separate.

Use optionalFields for explicitly mapped columns whose source values may be absent. Missing values in those columns are omitted, preserving existing values on updates. Exact identity columns cannot be optional, and required destination attributes remain required. This supports sparse, reviewed inventory JSON without inventing unknown attributes.

The destination defaults to runner-owned data. An author-owned destination also requires destinationOwnerId and destinationGrantId with the exact list, operation, playbook and audience authorized. Successful row writes are recorded on the parent run; retries continue the same mapping with its successful source JSON. Feed definitions contain no destination and perform no list writes.

Runtime list IDs and destination grants do not belong in portable feed templates. Resolve destination bindings when installing a consuming playbook.

A persona may declare standalone List models in `assets/data-feeds/catalog.json` under `lists: [{resourceKey, assetPath}]`. Each referenced schema-v2 `definitions_only` asset holds a name and typed columns, with no rows or Pipeline bindings. A mapping with `listRef` allocates a runner-private copy on first use; reading a feed/model never creates records. Existing imported Pipeline Lists continue using their authorized bindings and mutation architecture. Mock evaluations resolve their own isolated List copies and never write the live Lists.

An optional `ontology: {entityType, ontologyVersion?, recordsPath, fields}` validates source JSON against the Persona's `assets/ontology.json` before mutation. The ontology fields are attribute identifiers; the separate mapping fields remain List column keys. Use the `persona-ontology` skill to edit the parent definition. This adds no storage, migrations, relationship traversal, or bypass of state-machine rules.
