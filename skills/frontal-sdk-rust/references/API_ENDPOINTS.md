# API endpoints by service

Source: `contracts/sdk-endpoints.json` in the upstream repo, 383 routes across
the 17 SDK services. Paths are relative to the configured base URL (default
`https://api.frontal.dev/v1/`) and carry no leading `/` in calls.

## How the handles use this table

- Each service handle checks the service name, method, and path template against
  this inventory before it sends a request. Unknown routes return
  `FrontalError::InvalidPath` without a network call.
- `{param}` matches one non-empty path segment. The typed methods (for example
  `get_agent`) percent-encode IDs with `encode_path_segment`. The generic verb
  methods take the literal path, so encode dynamic segments yourself.
- Query keys listed in a template are optional, because the inventory gives them
  empty values. A non-empty value in a template would make that key required.
- Method labels `STREAM`, `GETRAW`, `POSTRAW`, and `POSTFORMDATA` are
  SDK-internal markers for SSE, raw-byte GET, raw-byte POST, and multipart POST.
  They are not sent as HTTP methods. The underlying HTTP verbs are GET for
  `STREAM` and `GETRAW`, POST for `POSTRAW` and `POSTFORMDATA`.
- The `react` and `sandbox` inventory keys are not SDK services and have no
  handle.

## Typed methods on the four concrete-model services

These names are verified in `src/resources/`. Other handles have generic methods
only, and their routes are listed below.

- `agents()`: `list_agents`, `create_agent`, `health`, `get_agent`,
  `update_agent`, `delete_agent`, `rollback_agent`, `create_run`, `get_run`,
  `conversation`, `versions`, `runs`, `watch_run` (stream feature).
- `ai()`: `chat_completions`, `embeddings`, `health`, `models`,
  `model_defaults`, `predict`, `predict_raw`, `predict_form`, `rerank`.
- `functions()`: see `CLIENT_PATTERNS.md` for the full list.
- `workflows()`: `list_workflows`, `create_workflow_record`,
  `add_workflow_version`, `get_workflow`, `update_workflow`, `delete_workflow`,
  `publish_workflow`, `archive_workflow`, `restore_workflow`, `list_executions`,
  `create_execution`, `get_execution`, `execution_tasks`, `run_steps`,
  `get_task`, `retry_task`, `cancel_task`, `list_approvals`, `get_approval`,
  `approve`, `reject`, `list_templates`, `get_template`, `create_template`,
  `instantiate_template`.

## agents: `client.agents()` (13 routes)

| Method | Path |
| --- | --- |
| GET | `/agents` |
| POST | `/agents` |
| GET | `/agents/health` |
| GET | `/agents/runs/{param}` |
| GET | `/agents/runs/{param}/conversation` |
| STREAM | `/agents/runs/{param}/stream` |
| DELETE | `/agents/{param}` |
| GET | `/agents/{param}` |
| PUT | `/agents/{param}` |
| POST | `/agents/{param}/rollback` |
| GET | `/agents/{param}/runs` |
| POST | `/agents/{param}/runs` |
| GET | `/agents/{param}/versions` |

## ai: `client.ai()` (9 routes)

| Method | Path |
| --- | --- |
| POST | `/ai/chat/completions` |
| GET | `/health` |
| POST | `/internal/embeddings` |
| GET | `/internal/models` |
| GET | `/internal/models/defaults` |
| POST | `/internal/predictions` |
| POSTFORMDATA | `/internal/predictions` |
| POSTRAW | `/internal/predictions` |
| POST | `/internal/rerank` |

## audit: `client.audit()` (4 routes)

| Method | Path |
| --- | --- |
| GET | `/audit/events` |
| POST | `/audit/events` |
| POST | `/audit/events/batch` |
| GET | `/audit/events/{param}` |

## auth: `client.auth()` (59 routes)

| Method | Path |
| --- | --- |
| GET | `/auth/account/audit-log` |
| GET | `/auth/account/mfa` |
| POST | `/auth/account/mfa` |
| DELETE | `/auth/account/mfa/{param}` |
| GET | `/auth/account/mfa/{param}` |
| POST | `/auth/account/mfa/{param}/challenge` |
| POST | `/auth/account/mfa/{param}/verify` |
| POST | `/auth/account/password` |
| DELETE | `/auth/account/profile` |
| GET | `/auth/account/profile` |
| PUT | `/auth/account/profile` |
| GET | `/auth/account/security/api-keys` |
| POST | `/auth/account/security/api-keys` |
| DELETE | `/auth/account/security/api-keys/{param}` |
| GET | `/auth/account/security/api-keys/{param}` |
| PUT | `/auth/account/security/api-keys/{param}` |
| GET | `/auth/account/security/devices` |
| POST | `/auth/account/security/devices` |
| DELETE | `/auth/account/security/devices/{param}` |
| GET | `/auth/account/security/devices/{param}` |
| POST | `/auth/account/security/devices/{param}/trust` |
| GET | `/auth/account/sessions` |
| DELETE | `/auth/account/sessions/{param}` |
| POST | `/auth/account/sessions/{param}/extend` |
| POST | `/auth/admin/generate_link` |
| POST | `/auth/admin/logout` |
| GET | `/auth/admin/users` |
| POST | `/auth/admin/users` |
| DELETE | `/auth/admin/users/{param}` |
| GET | `/auth/admin/users/{param}` |
| PUT | `/auth/admin/users/{param}` |
| GET | `/auth/admin/users/{param}/factors` |
| DELETE | `/auth/admin/users/{param}/factors/{param}` |
| GET | `/auth/auth/session` |
| POST | `/auth/auth/session` |
| POST | `/auth/authorize` |
| GET | `/auth/factors` |
| POST | `/auth/factors` |
| DELETE | `/auth/factors/{param}` |
| POST | `/auth/factors/{param}/challenge` |
| POST | `/auth/factors/{param}/verify` |
| POST | `/auth/invite` |
| POST | `/auth/logout` |
| POST | `/auth/otp` |
| POST | `/auth/reauthenticate` |
| POST | `/auth/recover` |
| POST | `/auth/resend` |
| POST | `/auth/signup` |
| POST | `/auth/sso` |
| POST | `/auth/token?grant_type=id_token` |
| POST | `/auth/token?grant_type=password` |
| POST | `/auth/token?grant_type=pkce` |
| POST | `/auth/token?grant_type=refresh_token` |
| GET | `/auth/user` |
| PUT | `/auth/user` |
| GET | `/auth/user/identities` |
| POST | `/auth/user/identities` |
| DELETE | `/auth/user/identities/{param}` |
| POST | `/auth/verify` |

## billing: `client.billing()` (23 routes)

| Method | Path |
| --- | --- |
| GET | `/billing/addons/{param}/entitlements` |
| GET | `/billing/customers/portal/{param}` |
| GET | `/billing/customers/{param}/entitlements` |
| GET | `/billing/customers/{param}/invoices/summary` |
| GET | `/billing/customers/{param}/usage` |
| GET | `/billing/customers/{param}/wallets` |
| POST | `/billing/invoices/preview` |
| POST | `/billing/invoices/{param}/finalize` |
| GETRAW | `/billing/invoices/{param}/pdf` |
| POST | `/billing/invoices/{param}/void` |
| POST | `/billing/meters/{param}/disable` |
| POST | `/billing/plans/{param}/clone` |
| GET | `/billing/plans/{param}/entitlements` |
| GET | `/billing/prices/lookup/{param}` |
| POST | `/billing/subscriptions/{param}/activate` |
| POST | `/billing/subscriptions/{param}/cancel` |
| GET | `/billing/subscriptions/{param}/entitlements` |
| POST | `/billing/subscriptions/{param}/pause` |
| POST | `/billing/subscriptions/{param}/resume` |
| GET | `/billing/wallets/{param}/balance/real-time` |
| POST | `/billing/wallets/{param}/terminate` |
| POST | `/billing/wallets/{param}/top-up` |
| GET | `/billing/wallets/{param}/transactions` |

## blob: `client.blob()` (8 routes)

| Method | Path |
| --- | --- |
| POST | `/blob/object/copy` |
| GET | `/blob/object/info/{param}/{param}` |
| POST | `/blob/object/list/{param}` |
| POST | `/blob/object/move` |
| POST | `/blob/object/sign/{param}/{param}` |
| DELETE | `/blob/object/{param}/{param}` |
| GET | `/blob/object/{param}/{param}` |
| POSTFORMDATA | `/blob/object/{param}/{param}` |

## connectors: `client.connectors()` (12 routes)

| Method | Path |
| --- | --- |
| GET | `/connectors/catalog` |
| GET | `/connectors/catalog/{param}` |
| GET | `/connectors/connection-tests/{param}` |
| GET | `/connectors/installations` |
| POST | `/connectors/installations` |
| DELETE | `/connectors/installations/{param}` |
| GET | `/connectors/installations/{param}` |
| PATCH | `/connectors/installations/{param}` |
| POST | `/connectors/installations/{param}/pause` |
| POST | `/connectors/installations/{param}/resume` |
| POST | `/connectors/sync-runs/{param}/replay` |
| GET | `/diagnostics` |

## data: `client.data()` (45 routes)

| Method | Path |
| --- | --- |
| GET | `/data/aggregations/aggregations` |
| POST | `/data/aggregations/aggregations` |
| GET | `/data/aggregations/aggregations/{param}` |
| POST | `/data/aggregations/aggregations/{param}/executions` |
| GET | `/data/archival/archival/policies` |
| POST | `/data/archival/archival/policies` |
| GET | `/data/archival/archival/policies/{param}` |
| POST | `/data/archival/archival/policies/{param}/executions` |
| GET | `/data/enrichment/enrichment/profiles` |
| POST | `/data/enrichment/enrichment/profiles` |
| GET | `/data/enrichment/enrichment/profiles/{param}` |
| POST | `/data/enrichment/enrichment/profiles/{param}/executions` |
| GET | `/data/exports/exports` |
| POST | `/data/exports/exports` |
| GET | `/data/exports/exports/{param}` |
| POST | `/data/exports/exports/{param}/executions` |
| GET | `/data/normalization/normalization/profiles` |
| POST | `/data/normalization/normalization/profiles` |
| GET | `/data/normalization/normalization/profiles/{param}` |
| POST | `/data/normalization/normalization/profiles/{param}/executions` |
| GET | `/data/quality/quality/rulesets` |
| POST | `/data/quality/quality/rulesets` |
| GET | `/data/quality/quality/rulesets/{param}` |
| POST | `/data/quality/quality/rulesets/{param}/evaluations` |
| POST | `/data/query/query/federated` |
| GET | `/data/schemas/schemas` |
| POST | `/data/schemas/schemas` |
| POST | `/data/schemas/schemas/resolve` |
| GET | `/data/schemas/schemas/{param}` |
| GET | `/data/serving/serving/products` |
| POST | `/data/serving/serving/products` |
| GET | `/data/serving/serving/products/{param}` |
| POST | `/data/serving/serving/products/{param}/refreshes` |
| GET | `/data/streams/streams` |
| POST | `/data/streams/streams` |
| GET | `/data/streams/streams/{param}` |
| POST | `/data/streams/streams/{param}/deliveries` |
| GET | `/data/sync/sync/jobs` |
| POST | `/data/sync/sync/jobs` |
| GET | `/data/sync/sync/jobs/{param}` |
| POST | `/data/sync/sync/jobs/{param}/executions` |
| GET | `/data/transformations/transformations` |
| POST | `/data/transformations/transformations` |
| GET | `/data/transformations/transformations/{param}` |
| POST | `/data/transformations/transformations/{param}/executions` |

## functions: `client.functions()` (16 routes)

| Method | Path |
| --- | --- |
| POST | `/functions` |
| GET | `/functions/executions/{param}` |
| POST | `/functions/executions/{param}/cancel` |
| GET | `/functions/executions/{param}/result` |
| GET | `/functions/executions?cursor=&limit=&functionId=&status=` |
| POST | `/functions/invoke` |
| POST | `/functions/invoke-async` |
| DELETE | `/functions/{param}` |
| GET | `/functions/{param}` |
| PATCH | `/functions/{param}` |
| GET | `/functions/{param}/versions/{param}` |
| POST | `/functions/{param}/versions/{param}/deploy` |
| GET | `/functions/{param}/versions/{param}/deployment/status` |
| POST | `/functions/{param}/versions/{param}/publish` |
| GET | `/functions/{param}/versions?cursor=&limit=` |
| GET | `/functions?cursor=&limit=` |

## governance: `client.governance()` (24 routes)

| Method | Path |
| --- | --- |
| POST | `/access/check` |
| GET | `/compliance/assessments` |
| POST | `/compliance/assessments` |
| GET | `/compliance/assessments/{param}` |
| GET | `/compliance/frameworks` |
| GET | `/compliance/score` |
| GET | `/compliance/violations` |
| POST | `/compliance/violations/{param}/resolve` |
| GET | `/permissions` |
| POST | `/permissions` |
| GET | `/permissions/{param}` |
| GET | `/policies` |
| POST | `/policies` |
| POST | `/policies/from-template` |
| GET | `/policies/templates` |
| POST | `/policies/validate` |
| DELETE | `/policies/{param}` |
| GET | `/policies/{param}` |
| PUT | `/policies/{param}` |
| GET | `/policies/{param}/versions` |
| GET | `/roles` |
| POST | `/roles` |
| DELETE | `/roles/{param}` |
| GET | `/roles/{param}` |

## lineage: `client.lineage()` (7 routes)

| Method | Path |
| --- | --- |
| GET | `/lineage/edges` |
| GET | `/lineage/edges/{param}` |
| GET | `/lineage/graph` |
| POST | `/lineage/impact` |
| GET | `/lineage/nodes` |
| GET | `/lineage/nodes/{param}` |
| GET | `/lineage/nodes/{param}/trace` |

## observability: `client.observability()` (25 routes)

| Method | Path |
| --- | --- |
| GET | `/observability/alerts` |
| POST | `/observability/alerts` |
| GET | `/observability/alerts/incidents` |
| DELETE | `/observability/alerts/{param}` |
| PUT | `/observability/alerts/{param}` |
| POST | `/observability/alerts/{param}/disable` |
| POST | `/observability/alerts/{param}/enable` |
| GET | `/observability/dashboards` |
| POST | `/observability/dashboards` |
| DELETE | `/observability/dashboards/{param}` |
| GET | `/observability/dashboards/{param}` |
| PUT | `/observability/dashboards/{param}` |
| POST | `/observability/dashboards/{param}/share` |
| POST | `/observability/events` |
| POST | `/observability/events/batch` |
| GET | `/observability/events/stats` |
| POST | `/observability/logs/ingest` |
| POST | `/observability/logs/query` |
| STREAM | `/observability/logs/stream` |
| GET | `/observability/metrics` |
| POST | `/observability/metrics/ingest` |
| GET | `/observability/metrics/list` |
| GET | `/observability/traces` |
| POST | `/observability/traces/query` |
| GET | `/observability/traces/{param}` |

## ontology: `client.ontology()` (82 routes)

| Method | Path |
| --- | --- |
| POST | `/ontology/engine/ontologies/compare-versions` |
| POST | `/ontology/engine/ontologies/export` |
| POST | `/ontology/engine/ontologies/export-shacl` |
| POST | `/ontology/engine/ontologies/generate` |
| POST | `/ontology/engine/ontologies/infer-classes` |
| POST | `/ontology/engine/ontologies/infer-properties` |
| POST | `/ontology/engine/ontologies/validate` |
| GET | `/ontology/events/events` |
| POST | `/ontology/events/events` |
| POST | `/ontology/events/events/checkpoints` |
| GET | `/ontology/events/events/checkpoints/{param}` |
| POST | `/ontology/events/events/leases/acknowledge` |
| POST | `/ontology/events/events/leases/acquire` |
| GET | `/ontology/events/events/{param}` |
| POST | `/ontology/extract/extract/analyze` |
| POST | `/ontology/extract/extract/architecture` |
| POST | `/ontology/extract/extract/coreferences` |
| POST | `/ontology/extract/extract/entities` |
| POST | `/ontology/extract/extract/events` |
| POST | `/ontology/extract/extract/relations` |
| POST | `/ontology/extract/extract/triplets` |
| GET | `/ontology/objects/object-types` |
| DELETE | `/ontology/objects/object-types/{param}` |
| GET | `/ontology/objects/object-types/{param}` |
| PUT | `/ontology/objects/object-types/{param}` |
| GET | `/ontology/objects/objects` |
| DELETE | `/ontology/objects/objects/{param}` |
| GET | `/ontology/objects/objects/{param}` |
| PUT | `/ontology/objects/objects/{param}` |
| POST | `/ontology/reasoning/explain` |
| POST | `/ontology/reasoning/facts` |
| POST | `/ontology/reasoning/facts/load-graph` |
| POST | `/ontology/reasoning/reason/backward` |
| POST | `/ontology/reasoning/reason/forward` |
| GET | `/ontology/reasoning/rules` |
| POST | `/ontology/reasoning/rules` |
| DELETE | `/ontology/reasoning/rules/{param}` |
| PUT | `/ontology/reasoning/rules/{param}` |
| GET | `/ontology/relationships/relationship-types` |
| DELETE | `/ontology/relationships/relationship-types/{param}` |
| GET | `/ontology/relationships/relationships` |
| DELETE | `/ontology/relationships/relationships/{param}` |
| GET | `/ontology/relationships/relationships/{param}` |
| PUT | `/ontology/relationships/relationships/{param}` |
| GET | `/ontology/rollouts/rollouts` |
| POST | `/ontology/rollouts/rollouts` |
| DELETE | `/ontology/rollouts/rollouts/{param}` |
| GET | `/ontology/rollouts/rollouts/{param}` |
| PUT | `/ontology/rollouts/rollouts/{param}` |
| POST | `/ontology/rollouts/rollouts/{param}/pause` |
| POST | `/ontology/rollouts/rollouts/{param}/resume` |
| POST | `/ontology/rollouts/rollouts/{param}/rollback` |
| POST | `/ontology/rollouts/rollouts/{param}/start` |
| GET | `/ontology/rollouts/rollouts/{param}/status` |
| GET | `/ontology/rollups/rollup-results/{param}` |
| GET | `/ontology/rollups/rollups` |
| POST | `/ontology/rollups/rollups` |
| DELETE | `/ontology/rollups/rollups/{param}` |
| GET | `/ontology/rollups/rollups/{param}` |
| PUT | `/ontology/rollups/rollups/{param}` |
| POST | `/ontology/rollups/rollups/{param}/execute` |
| POST | `/ontology/rollups/rollups/{param}/preview` |
| GET | `/ontology/rollups/rollups/{param}/result` |
| GET | `/ontology/schemas/schemas` |
| POST | `/ontology/schemas/schemas` |
| POST | `/ontology/schemas/schemas/validate` |
| DELETE | `/ontology/schemas/schemas/{param}` |
| GET | `/ontology/schemas/schemas/{param}` |
| POST | `/ontology/transformations/transformations` |
| POST | `/ontology/validation/payloads/validate` |
| GET | `/ontology/validation/rules` |
| POST | `/ontology/validation/rules` |
| DELETE | `/ontology/validation/rules/{param}` |
| GET | `/ontology/validation/rules/{param}` |
| POST | `/ontology/versions/audit/verify` |
| GET | `/ontology/versions/release-bundles` |
| POST | `/ontology/versions/release-bundles` |
| GET | `/ontology/versions/release-bundles/{param}` |
| POST | `/ontology/versions/versions` |
| POST | `/ontology/versions/versions/compare` |
| DELETE | `/ontology/versions/versions/{param}` |
| GET | `/ontology/versions/versions/{param}` |

## pipelines: `client.pipelines()` (11 routes)

| Method | Path |
| --- | --- |
| GET | `/data/pipelines/capabilities` |
| GET | `/data/pipelines/health` |
| GET | `/data/pipelines/info` |
| GET | `/data/pipelines/pipeline-runs` |
| GET | `/data/pipelines/pipeline-runs/{param}` |
| STREAM | `/data/pipelines/pipeline-runs/{param}` |
| GET | `/data/pipelines/pipelines` |
| POST | `/data/pipelines/pipelines` |
| GET | `/data/pipelines/pipelines/{param}` |
| GET | `/data/pipelines/runs` |
| POST | `/data/pipelines/runs` |

## schedules: `client.schedules()` (10 routes)

| Method | Path |
| --- | --- |
| POST | `/workflows/cron/parse` |
| POST | `/workflows/cron/validate` |
| GET | `/workflows/schedules` |
| POST | `/workflows/schedules` |
| DELETE | `/workflows/schedules/{param}` |
| GET | `/workflows/schedules/{param}` |
| PATCH | `/workflows/schedules/{param}` |
| POST | `/workflows/schedules/{param}/pause` |
| POST | `/workflows/schedules/{param}/resume` |
| POST | `/workflows/schedules/{param}/trigger` |

## webhooks: `client.webhooks()` (10 routes)

| Method | Path |
| --- | --- |
| GET | `/webhooks` |
| POST | `/webhooks` |
| GET | `/webhooks/deliveries` |
| GET | `/webhooks/deliveries/{param}` |
| POST | `/webhooks/deliveries/{param}/retry` |
| GET | `/webhooks/stats` |
| DELETE | `/webhooks/{param}` |
| GET | `/webhooks/{param}` |
| PUT | `/webhooks/{param}` |
| POST | `/webhooks/{param}/rotate-secret` |

## workflows: `client.workflows()` (25 routes)

| Method | Path |
| --- | --- |
| GET | `/workflows` |
| POST | `/workflows` |
| GET | `/workflows/approvals` |
| GET | `/workflows/approvals/{param}` |
| POST | `/workflows/approvals/{param}/approve` |
| POST | `/workflows/approvals/{param}/reject` |
| GET | `/workflows/executions` |
| POST | `/workflows/executions` |
| GET | `/workflows/executions/{param}` |
| GET | `/workflows/executions/{param}/tasks` |
| GET | `/workflows/runs/{param}/steps` |
| GET | `/workflows/tasks/{param}` |
| POST | `/workflows/tasks/{param}/cancel` |
| POST | `/workflows/tasks/{param}/retry` |
| GET | `/workflows/templates` |
| POST | `/workflows/templates` |
| GET | `/workflows/templates/{param}` |
| POST | `/workflows/templates/{param}/instantiate` |
| DELETE | `/workflows/{param}` |
| GET | `/workflows/{param}` |
| PATCH | `/workflows/{param}` |
| POST | `/workflows/{param}/archive` |
| POST | `/workflows/{param}/publish` |
| POST | `/workflows/{param}/restore` |
| POST | `/workflows/{param}/versions` |
