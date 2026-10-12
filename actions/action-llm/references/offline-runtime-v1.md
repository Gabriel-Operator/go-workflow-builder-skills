# Embedded offline runtime contract v1

- The embedded mobile/desktop store is encrypted SQLite and synchronizes manually.
- Local operations are: local-model prompt, local knowledge search, local data/list read/write, pipeline transition, task/schedule write, form, approval, condition, bounded loop, durable wait, artifact write, and signal evaluation.
- HTTP/REST, MCP, web/SaaS/remote databases, notifications, cloud models/media, telephony, and meetings require connectivity.
- Browser, coding, and computer control require an installed desktop adapter. Local media needs installed device models.
- Inspect nested steps before execution. Return compatible counts and blocker paths. Unsupported steps persist as blocked; reconnect or sync never executes them.
- Runtime records use stable IDs, revisions, tombstones, operation IDs, conflicts, and owner-device checkpoints. Git exports definitions only.
- Desktop schedules run while the runtime is alive; phone schedules run in the active app. Missed recurrences coalesce once.

For `prompt.local`, use a version-1 model manifest and report chat, structured output, and verified tool use separately. Desktop GGUF requires its packaged llama.cpp protocol sidecar; mobile GGUF requires a build with the native adapter; browser models require a trusted WebLLM MLC record and WebGPU. Validate schema-constrained output and every tool argument. Keep the model selection, Hugging Face token, and execution owner out of authored workflow JSON. The current embedded desktop runner allows at most eight verified local tool turns and requires explicit permission for writes.
