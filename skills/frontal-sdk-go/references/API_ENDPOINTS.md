# API Endpoints by Service

Generated from `internal/core/endpoints_generated.go` at SDK version 2.0.0 (module `github.com/frontal-labs/sdk-go/v2`). This is the full inventory: 635 operations across 17 services.

Each row is one path template. `{param}` placeholders are filled, in order, from `Request.PathParams`. Methods are the HTTP verbs the SDK sends. Pseudo-methods: `STREAM` (SSE, use `Stream` or `frontal.Watch`), `GETRAW` (writes body to an `io.Writer`), `POSTRAW` and `POSTFORMDATA` (body is `io.Reader`, `[]byte`, or `string`).

Service names match the `Service` field of `frontal.Endpoint` and the service accessor on `frontal.Client` (lowercase, e.g. `client.Observability` for `observability`). `ai` is accessed as `client.AI`, `blob` as `client.Blob`.

Typed methods exist only for `agents` and `functions`. Every other service is called with the generic `Call`/`Stream` path.

## Index

- [agents](#agents) (13 operations)
- [ai](#ai) (11 operations)
- [audit](#audit) (4 operations)
- [auth](#auth) (66 operations)
- [billing](#billing) (23 operations)
- [blob](#blob) (8 operations)
- [connectors](#connectors) (25 operations)
- [data](#data) (151 operations)
- [functions](#functions) (16 operations)
- [governance](#governance) (24 operations)
- [lineage](#lineage) (7 operations)
- [observability](#observability) (48 operations)
- [ontology](#ontology) (171 operations)
- [pipelines](#pipelines) (11 operations)
- [schedules](#schedules) (10 operations)
- [webhooks](#webhooks) (17 operations)
- [workflows](#workflows) (30 operations)

## agents

13 operations.

| Path | Methods |
| --- | --- |
| `/agents` | GET, POST |
| `/agents/health` | GET |
| `/agents/runs/{param}` | GET |
| `/agents/runs/{param}/conversation` | GET |
| `/agents/runs/{param}/stream` | STREAM |
| `/agents/{param}` | GET, PUT, DELETE |
| `/agents/{param}/rollback` | POST |
| `/agents/{param}/runs` | GET, POST |
| `/agents/{param}/versions` | GET |

## ai

11 operations.

| Path | Methods |
| --- | --- |
| `/ai/chat/completions` | POST |
| `/health` | GET |
| `/internal/embeddings` | POST |
| `/internal/models` | GET |
| `/internal/models/defaults` | GET |
| `/internal/predictions` | POST, POSTRAW, POSTFORMDATA |
| `/internal/rerank` | POST |
| `/invocations` | POST |
| `/providers/{param}` | GET |

## audit

4 operations.

| Path | Methods |
| --- | --- |
| `/audit/events` | GET, POST |
| `/audit/events/batch` | POST |
| `/audit/events/{param}` | GET |

## auth

66 operations.

| Path | Methods |
| --- | --- |
| `/auth/account/audit-log` | GET |
| `/auth/account/mfa` | GET, POST |
| `/auth/account/mfa/{param}` | GET, DELETE |
| `/auth/account/mfa/{param}/challenge` | POST |
| `/auth/account/mfa/{param}/verify` | POST |
| `/auth/account/password` | POST |
| `/auth/account/profile` | GET, PUT, DELETE |
| `/auth/account/security/api-keys` | GET, POST |
| `/auth/account/security/api-keys/{param}` | GET, PUT, DELETE |
| `/auth/account/security/devices` | GET, POST |
| `/auth/account/security/devices/{param}` | GET, DELETE |
| `/auth/account/security/devices/{param}/trust` | POST |
| `/auth/account/sessions` | GET |
| `/auth/account/sessions/{param}` | DELETE |
| `/auth/account/sessions/{param}/extend` | POST |
| `/auth/admin/generate_link` | POST |
| `/auth/admin/logout` | POST |
| `/auth/admin/users` | GET, POST |
| `/auth/admin/users/{param}` | GET, PUT, DELETE |
| `/auth/admin/users/{param}/factors` | GET |
| `/auth/admin/users/{param}/factors/{param}` | DELETE |
| `/auth/auth/session` | GET, POST |
| `/auth/authorize` | POST |
| `/auth/factors` | GET, POST |
| `/auth/factors/{param}` | DELETE |
| `/auth/factors/{param}/challenge` | POST |
| `/auth/factors/{param}/verify` | POST |
| `/auth/invite` | POST |
| `/auth/login` | POST |
| `/auth/logout` | POST |
| `/auth/mfa/backup-codes/regenerate` | POST |
| `/auth/mfa/disable` | POST |
| `/auth/mfa/enable` | POST |
| `/auth/mfa/setup` | POST |
| `/auth/mfa/status` | GET |
| `/auth/mfa/verify` | POST |
| `/auth/otp` | POST |
| `/auth/reauthenticate` | POST |
| `/auth/recover` | POST |
| `/auth/resend` | POST |
| `/auth/signup` | POST |
| `/auth/sso` | POST |
| `/auth/token?grant_type=id_token` | POST |
| `/auth/token?grant_type=password` | POST |
| `/auth/token?grant_type=pkce` | POST |
| `/auth/token?grant_type=refresh_token` | POST |
| `/auth/user` | GET, PUT |
| `/auth/user/identities` | GET, POST |
| `/auth/user/identities/{param}` | DELETE |
| `/auth/verify` | POST |

## billing

23 operations.

| Path | Methods |
| --- | --- |
| `/billing/addons/{param}/entitlements` | GET |
| `/billing/customers/portal/{param}` | GET |
| `/billing/customers/{param}/entitlements` | GET |
| `/billing/customers/{param}/invoices/summary` | GET |
| `/billing/customers/{param}/usage` | GET |
| `/billing/customers/{param}/wallets` | GET |
| `/billing/invoices/preview` | POST |
| `/billing/invoices/{param}/finalize` | POST |
| `/billing/invoices/{param}/pdf` | GETRAW |
| `/billing/invoices/{param}/void` | POST |
| `/billing/meters/{param}/disable` | POST |
| `/billing/plans/{param}/clone` | POST |
| `/billing/plans/{param}/entitlements` | GET |
| `/billing/prices/lookup/{param}` | GET |
| `/billing/subscriptions/{param}/activate` | POST |
| `/billing/subscriptions/{param}/cancel` | POST |
| `/billing/subscriptions/{param}/entitlements` | GET |
| `/billing/subscriptions/{param}/pause` | POST |
| `/billing/subscriptions/{param}/resume` | POST |
| `/billing/wallets/{param}/balance/real-time` | GET |
| `/billing/wallets/{param}/terminate` | POST |
| `/billing/wallets/{param}/top-up` | POST |
| `/billing/wallets/{param}/transactions` | GET |

## blob

8 operations.

| Path | Methods |
| --- | --- |
| `/blob/object/copy` | POST |
| `/blob/object/info/{param}/{param}` | GET |
| `/blob/object/list/{param}` | POST |
| `/blob/object/move` | POST |
| `/blob/object/sign/{param}/{param}` | POST |
| `/blob/object/{param}/{param}` | GET, DELETE, POSTFORMDATA |

## connectors

25 operations.

| Path | Methods |
| --- | --- |
| `/action-runs/{param}` | GET |
| `/connection-tests/{param}` | GET |
| `/connectors/catalog` | GET |
| `/connectors/catalog/{param}` | GET |
| `/connectors/connection-tests/{param}` | GET |
| `/connectors/installations` | GET, POST |
| `/connectors/installations/{param}` | GET, PATCH, DELETE |
| `/connectors/installations/{param}/pause` | POST |
| `/connectors/installations/{param}/resume` | POST |
| `/connectors/sync-runs/{param}/replay` | POST |
| `/diagnostics` | GET |
| `/integrations/{param}` | GET, PATCH, DELETE |
| `/integrations/{param}/action-runs` | GET, POST |
| `/integrations/{param}/capabilities` | GET |
| `/integrations/{param}/capabilities/{param}` | PUT |
| `/integrations/{param}/connection-tests` | GET, POST |
| `/integrations/{param}/surfaces` | GET |
| `/integrations/{param}/surfaces/{param}` | PUT |

## data

151 operations.

| Path | Methods |
| --- | --- |
| `/data/aggregations/aggregations` | GET, POST |
| `/data/aggregations/aggregations/{param}` | GET |
| `/data/aggregations/aggregations/{param}/executions` | POST |
| `/data/aggregations/capabilities` | GET |
| `/data/aggregations/health` | GET |
| `/data/aggregations/info` | GET |
| `/data/aggregations/runs` | GET, POST |
| `/data/aggregations/runs/{param}` | GET |
| `/data/archival/archival/policies` | GET, POST |
| `/data/archival/archival/policies/{param}` | GET |
| `/data/archival/archival/policies/{param}/executions` | POST |
| `/data/archival/capabilities` | GET |
| `/data/archival/health` | GET |
| `/data/archival/info` | GET |
| `/data/archival/runs` | GET, POST |
| `/data/archival/runs/{param}` | GET |
| `/data/catalog/capabilities` | GET |
| `/data/catalog/catalog/datasets` | GET |
| `/data/catalog/catalog/datasets/{param}` | GET |
| `/data/catalog/catalog/datasets/{param}/artifacts/{param}/content` | GET |
| `/data/catalog/catalog/sources` | GET |
| `/data/catalog/catalog/sources/{param}` | GET |
| `/data/catalog/health` | GET |
| `/data/catalog/info` | GET |
| `/data/catalog/runs` | GET, POST |
| `/data/catalog/runs/{param}` | GET |
| `/data/enrichment/capabilities` | GET |
| `/data/enrichment/enrichment/profiles` | GET, POST |
| `/data/enrichment/enrichment/profiles/{param}` | GET |
| `/data/enrichment/enrichment/profiles/{param}/executions` | POST |
| `/data/enrichment/health` | GET |
| `/data/enrichment/info` | GET |
| `/data/enrichment/runs` | GET, POST |
| `/data/enrichment/runs/{param}` | GET |
| `/data/exports/capabilities` | GET |
| `/data/exports/exports` | GET, POST |
| `/data/exports/exports/{param}` | GET |
| `/data/exports/exports/{param}/executions` | POST |
| `/data/exports/health` | GET |
| `/data/exports/info` | GET |
| `/data/exports/runs` | GET, POST |
| `/data/exports/runs/{param}` | GET |
| `/data/ingest/capabilities` | GET |
| `/data/ingest/datasets` | GET |
| `/data/ingest/datasets/ingest` | POST |
| `/data/ingest/datasets/{param}` | GET |
| `/data/ingest/datasets/{param}/artifacts/{param}/content` | GET |
| `/data/ingest/health` | GET |
| `/data/ingest/info` | GET |
| `/data/ingest/runs` | GET, POST |
| `/data/ingest/runs/{param}` | GET |
| `/data/ingest/schemas` | GET |
| `/data/ingest/schemas/{param}` | GET |
| `/data/normalization/capabilities` | GET |
| `/data/normalization/health` | GET |
| `/data/normalization/info` | GET |
| `/data/normalization/normalization/profiles` | GET, POST |
| `/data/normalization/normalization/profiles/{param}` | GET |
| `/data/normalization/normalization/profiles/{param}/executions` | POST |
| `/data/normalization/runs` | GET, POST |
| `/data/normalization/runs/{param}` | GET |
| `/data/pipelines/capabilities` | GET |
| `/data/pipelines/health` | GET |
| `/data/pipelines/info` | GET |
| `/data/pipelines/pipeline-runs` | GET |
| `/data/pipelines/pipeline-runs/{param}` | GET |
| `/data/pipelines/pipelines` | GET, POST |
| `/data/pipelines/pipelines/{param}` | GET |
| `/data/pipelines/runs` | GET, POST |
| `/data/pipelines/runs/{param}` | GET |
| `/data/quality/capabilities` | GET |
| `/data/quality/health` | GET |
| `/data/quality/info` | GET |
| `/data/quality/quality/rulesets` | GET, POST |
| `/data/quality/quality/rulesets/{param}` | GET |
| `/data/quality/quality/rulesets/{param}/evaluations` | POST |
| `/data/quality/runs` | GET, POST |
| `/data/quality/runs/{param}` | GET |
| `/data/query/capabilities` | GET |
| `/data/query/health` | GET |
| `/data/query/info` | GET |
| `/data/query/query/federated` | POST |
| `/data/query/runs` | GET, POST |
| `/data/query/runs/{param}` | GET |
| `/data/schemas/capabilities` | GET |
| `/data/schemas/health` | GET |
| `/data/schemas/info` | GET |
| `/data/schemas/runs` | GET, POST |
| `/data/schemas/runs/{param}` | GET |
| `/data/schemas/schemas` | GET, POST |
| `/data/schemas/schemas/resolve` | POST |
| `/data/schemas/schemas/{param}` | GET |
| `/data/serving/capabilities` | GET |
| `/data/serving/health` | GET |
| `/data/serving/info` | GET |
| `/data/serving/runs` | GET, POST |
| `/data/serving/runs/{param}` | GET |
| `/data/serving/serving/products` | GET, POST |
| `/data/serving/serving/products/{param}` | GET |
| `/data/serving/serving/products/{param}/refreshes` | POST |
| `/data/streams/capabilities` | GET |
| `/data/streams/health` | GET |
| `/data/streams/info` | GET |
| `/data/streams/runs` | GET, POST |
| `/data/streams/runs/{param}` | GET |
| `/data/streams/streams` | GET, POST |
| `/data/streams/streams/{param}` | GET |
| `/data/streams/streams/{param}/deliveries` | POST |
| `/data/sync/capabilities` | GET |
| `/data/sync/health` | GET |
| `/data/sync/info` | GET |
| `/data/sync/runs` | GET, POST |
| `/data/sync/runs/{param}` | GET |
| `/data/sync/sync/jobs` | GET, POST |
| `/data/sync/sync/jobs/{param}` | GET |
| `/data/sync/sync/jobs/{param}/executions` | POST |
| `/data/transformations/capabilities` | GET |
| `/data/transformations/health` | GET |
| `/data/transformations/info` | GET |
| `/data/transformations/runs` | GET, POST |
| `/data/transformations/runs/{param}` | GET |
| `/data/transformations/transformations` | GET, POST |
| `/data/transformations/transformations/{param}` | GET |
| `/data/transformations/transformations/{param}/executions` | POST |

## functions

16 operations.

| Path | Methods |
| --- | --- |
| `/functions` | GET, POST |
| `/functions/executions` | GET |
| `/functions/executions/{param}` | GET |
| `/functions/executions/{param}/cancel` | POST |
| `/functions/executions/{param}/result` | GET |
| `/functions/invoke` | POST |
| `/functions/invoke-async` | POST |
| `/functions/{param}` | GET, PATCH, DELETE |
| `/functions/{param}/versions` | GET |
| `/functions/{param}/versions/{param}` | GET |
| `/functions/{param}/versions/{param}/deploy` | POST |
| `/functions/{param}/versions/{param}/deployment/status` | GET |
| `/functions/{param}/versions/{param}/publish` | POST |

## governance

24 operations.

| Path | Methods |
| --- | --- |
| `/access/check` | POST |
| `/compliance/assessments` | GET, POST |
| `/compliance/assessments/{param}` | GET |
| `/compliance/frameworks` | GET |
| `/compliance/score` | GET |
| `/compliance/violations` | GET |
| `/compliance/violations/{param}/resolve` | POST |
| `/permissions` | GET, POST |
| `/permissions/{param}` | GET |
| `/policies` | GET, POST |
| `/policies/from-template` | POST |
| `/policies/templates` | GET |
| `/policies/validate` | POST |
| `/policies/{param}` | GET, PUT, DELETE |
| `/policies/{param}/versions` | GET |
| `/roles` | GET, POST |
| `/roles/{param}` | GET, DELETE |

## lineage

7 operations.

| Path | Methods |
| --- | --- |
| `/lineage/edges` | GET |
| `/lineage/edges/{param}` | GET |
| `/lineage/graph` | GET |
| `/lineage/impact` | POST |
| `/lineage/nodes` | GET |
| `/lineage/nodes/{param}` | GET |
| `/lineage/nodes/{param}/trace` | GET |

## observability

48 operations.

| Path | Methods |
| --- | --- |
| `/events` | GET, POST |
| `/events/analytics` | POST |
| `/events/analytics-v2` | POST |
| `/events/benchmark/v1` | POST |
| `/events/benchmark/v2` | POST |
| `/events/bulk` | POST |
| `/events/huggingface-billing` | POST |
| `/events/monitoring` | GET |
| `/events/query` | POST |
| `/events/raw/reprocess/all` | POST |
| `/events/raw/reprocess/pending` | POST |
| `/events/reprocess` | POST |
| `/events/reprocess/internal` | POST |
| `/events/usage` | POST |
| `/events/usage/meter` | POST |
| `/events/{param}` | GET |
| `/observability/alerts` | GET, POST |
| `/observability/alerts/incidents` | GET |
| `/observability/alerts/rules` | GET, POST |
| `/observability/alerts/rules/{param}` | GET, PUT, DELETE |
| `/observability/alerts/rules/{param}/toggle` | POST |
| `/observability/alerts/{param}` | PUT, DELETE |
| `/observability/alerts/{param}/disable` | POST |
| `/observability/alerts/{param}/enable` | POST |
| `/observability/dashboards` | GET, POST |
| `/observability/dashboards/{param}` | GET, PUT, DELETE |
| `/observability/dashboards/{param}/share` | POST |
| `/observability/events` | POST |
| `/observability/events/batch` | POST |
| `/observability/events/stats` | GET |
| `/observability/logs/ingest` | POST |
| `/observability/logs/query` | POST |
| `/observability/logs/stream` | STREAM |
| `/observability/metrics` | GET |
| `/observability/metrics/ingest` | POST |
| `/observability/metrics/list` | GET |
| `/observability/traces` | GET |
| `/observability/traces/query` | POST |
| `/observability/traces/{param}` | GET |

## ontology

171 operations.

| Path | Methods |
| --- | --- |
| `/ontology/engine/capabilities` | GET |
| `/ontology/engine/health` | GET |
| `/ontology/engine/info` | GET |
| `/ontology/engine/ontologies/compare-versions` | POST |
| `/ontology/engine/ontologies/export` | POST |
| `/ontology/engine/ontologies/export-shacl` | POST |
| `/ontology/engine/ontologies/generate` | POST |
| `/ontology/engine/ontologies/infer-classes` | POST |
| `/ontology/engine/ontologies/infer-properties` | POST |
| `/ontology/engine/ontologies/validate` | POST |
| `/ontology/engine/runs` | GET, POST |
| `/ontology/engine/runs/{param}` | GET |
| `/ontology/events/capabilities` | GET |
| `/ontology/events/events` | GET, POST |
| `/ontology/events/events/checkpoints` | POST |
| `/ontology/events/events/checkpoints/{param}` | GET |
| `/ontology/events/events/leases/acknowledge` | POST |
| `/ontology/events/events/leases/acquire` | POST |
| `/ontology/events/events/{param}` | GET |
| `/ontology/events/health` | GET |
| `/ontology/events/info` | GET |
| `/ontology/events/runs` | GET, POST |
| `/ontology/events/runs/{param}` | GET |
| `/ontology/extract/capabilities` | GET |
| `/ontology/extract/extract/analyze` | POST |
| `/ontology/extract/extract/architecture` | POST |
| `/ontology/extract/extract/coreferences` | POST |
| `/ontology/extract/extract/entities` | POST |
| `/ontology/extract/extract/events` | POST |
| `/ontology/extract/extract/relations` | POST |
| `/ontology/extract/extract/triplets` | POST |
| `/ontology/extract/health` | GET |
| `/ontology/extract/info` | GET |
| `/ontology/extract/runs` | GET, POST |
| `/ontology/extract/runs/{param}` | GET |
| `/ontology/graph/capabilities` | GET |
| `/ontology/graph/entities/{param}` | GET, PUT |
| `/ontology/graph/entities/{param}/provenance` | GET |
| `/ontology/graph/graph/analyze` | POST |
| `/ontology/graph/graph/build` | POST |
| `/ontology/graph/graph/bulk-read` | POST |
| `/ontology/graph/graph/neighborhood` | POST |
| `/ontology/graph/graph/path` | POST |
| `/ontology/graph/graph/query` | POST |
| `/ontology/graph/health` | GET |
| `/ontology/graph/info` | GET |
| `/ontology/graph/relationships/{param}` | GET, PUT |
| `/ontology/graph/runs` | GET, POST |
| `/ontology/graph/runs/{param}` | GET |
| `/ontology/objects/capabilities` | GET |
| `/ontology/objects/health` | GET |
| `/ontology/objects/info` | GET |
| `/ontology/objects/object-types` | GET |
| `/ontology/objects/object-types/{param}` | GET, PUT, DELETE |
| `/ontology/objects/objects` | GET |
| `/ontology/objects/objects/{param}` | GET, PUT, DELETE |
| `/ontology/objects/runs` | GET, POST |
| `/ontology/objects/runs/{param}` | GET |
| `/ontology/reasoning/capabilities` | GET |
| `/ontology/reasoning/explain` | POST |
| `/ontology/reasoning/facts` | POST |
| `/ontology/reasoning/facts/load-graph` | POST |
| `/ontology/reasoning/health` | GET |
| `/ontology/reasoning/info` | GET |
| `/ontology/reasoning/reason/backward` | POST |
| `/ontology/reasoning/reason/forward` | POST |
| `/ontology/reasoning/rules` | GET, POST |
| `/ontology/reasoning/rules/{param}` | PUT, DELETE |
| `/ontology/reasoning/runs` | GET, POST |
| `/ontology/reasoning/runs/{param}` | GET |
| `/ontology/relationships/capabilities` | GET |
| `/ontology/relationships/health` | GET |
| `/ontology/relationships/info` | GET |
| `/ontology/relationships/relationship-types` | GET |
| `/ontology/relationships/relationship-types/{param}` | DELETE |
| `/ontology/relationships/relationships` | GET |
| `/ontology/relationships/relationships/{param}` | GET, PUT, DELETE |
| `/ontology/relationships/runs` | GET, POST |
| `/ontology/relationships/runs/{param}` | GET |
| `/ontology/rollouts/capabilities` | GET |
| `/ontology/rollouts/health` | GET |
| `/ontology/rollouts/info` | GET |
| `/ontology/rollouts/rollouts` | GET, POST |
| `/ontology/rollouts/rollouts/{param}` | GET, PUT, DELETE |
| `/ontology/rollouts/rollouts/{param}/pause` | POST |
| `/ontology/rollouts/rollouts/{param}/resume` | POST |
| `/ontology/rollouts/rollouts/{param}/rollback` | POST |
| `/ontology/rollouts/rollouts/{param}/start` | POST |
| `/ontology/rollouts/rollouts/{param}/status` | GET |
| `/ontology/rollouts/runs` | GET, POST |
| `/ontology/rollouts/runs/{param}` | GET |
| `/ontology/rollups/capabilities` | GET |
| `/ontology/rollups/health` | GET |
| `/ontology/rollups/info` | GET |
| `/ontology/rollups/rollup-results/{param}` | GET |
| `/ontology/rollups/rollups` | GET, POST |
| `/ontology/rollups/rollups/{param}` | GET, PUT, DELETE |
| `/ontology/rollups/rollups/{param}/execute` | POST |
| `/ontology/rollups/rollups/{param}/preview` | POST |
| `/ontology/rollups/rollups/{param}/result` | GET |
| `/ontology/rollups/runs` | GET, POST |
| `/ontology/rollups/runs/{param}` | GET |
| `/ontology/schemas/capabilities` | GET |
| `/ontology/schemas/health` | GET |
| `/ontology/schemas/info` | GET |
| `/ontology/schemas/runs` | GET, POST |
| `/ontology/schemas/runs/{param}` | GET |
| `/ontology/schemas/schemas` | GET, POST |
| `/ontology/schemas/schemas/validate` | POST |
| `/ontology/schemas/schemas/{param}` | GET, DELETE |
| `/ontology/transformations/capabilities` | GET |
| `/ontology/transformations/health` | GET |
| `/ontology/transformations/info` | GET |
| `/ontology/transformations/runs` | GET, POST |
| `/ontology/transformations/runs/{param}` | GET |
| `/ontology/transformations/transformations` | POST |
| `/ontology/validation/capabilities` | GET |
| `/ontology/validation/health` | GET |
| `/ontology/validation/info` | GET |
| `/ontology/validation/payloads/validate` | POST |
| `/ontology/validation/rules` | GET, POST |
| `/ontology/validation/rules/{param}` | GET, DELETE |
| `/ontology/validation/runs` | GET, POST |
| `/ontology/validation/runs/{param}` | GET |
| `/ontology/versions/audit/verify` | POST |
| `/ontology/versions/capabilities` | GET |
| `/ontology/versions/health` | GET |
| `/ontology/versions/info` | GET |
| `/ontology/versions/release-bundles` | GET, POST |
| `/ontology/versions/release-bundles/{param}` | GET |
| `/ontology/versions/runs` | GET, POST |
| `/ontology/versions/runs/{param}` | GET |
| `/ontology/versions/versions` | POST |
| `/ontology/versions/versions/compare` | POST |
| `/ontology/versions/versions/{param}` | GET, DELETE |

## pipelines

11 operations.

| Path | Methods |
| --- | --- |
| `/data/pipelines/capabilities` | GET |
| `/data/pipelines/health` | GET |
| `/data/pipelines/info` | GET |
| `/data/pipelines/pipeline-runs` | GET |
| `/data/pipelines/pipeline-runs/{param}` | GET, STREAM |
| `/data/pipelines/pipelines` | GET, POST |
| `/data/pipelines/pipelines/{param}` | GET |
| `/data/pipelines/runs` | GET, POST |

## schedules

10 operations.

| Path | Methods |
| --- | --- |
| `/workflows/cron/parse` | POST |
| `/workflows/cron/validate` | POST |
| `/workflows/schedules` | GET, POST |
| `/workflows/schedules/{param}` | GET, PATCH, DELETE |
| `/workflows/schedules/{param}/pause` | POST |
| `/workflows/schedules/{param}/resume` | POST |
| `/workflows/schedules/{param}/trigger` | POST |

## webhooks

17 operations.

| Path | Methods |
| --- | --- |
| `/webhook-endpoints` | GET, POST |
| `/webhook-endpoints/{param}` | GET, PATCH, DELETE |
| `/webhook-endpoints/{param}/deliveries` | GET |
| `/webhook-endpoints/{param}/rotate-secret` | POST |
| `/webhooks` | GET, POST |
| `/webhooks/deliveries` | GET |
| `/webhooks/deliveries/{param}` | GET |
| `/webhooks/deliveries/{param}/retry` | POST |
| `/webhooks/stats` | GET |
| `/webhooks/{param}` | GET, PUT, DELETE |
| `/webhooks/{param}/rotate-secret` | POST |

## workflows

30 operations.

| Path | Methods |
| --- | --- |
| `/workflows` | GET, POST |
| `/workflows/approvals` | GET |
| `/workflows/approvals/{param}` | GET |
| `/workflows/approvals/{param}/approve` | POST |
| `/workflows/approvals/{param}/reject` | POST |
| `/workflows/batch` | POST |
| `/workflows/executions` | GET, POST |
| `/workflows/executions/{param}` | GET |
| `/workflows/executions/{param}/tasks` | GET |
| `/workflows/runs/{param}/steps` | GET |
| `/workflows/search` | POST |
| `/workflows/tasks/{param}` | GET |
| `/workflows/tasks/{param}/cancel` | POST |
| `/workflows/tasks/{param}/retry` | POST |
| `/workflows/templates` | GET, POST |
| `/workflows/templates/{param}` | GET |
| `/workflows/templates/{param}/instantiate` | POST |
| `/workflows/{param}` | GET, PATCH, DELETE |
| `/workflows/{param}/archive` | POST |
| `/workflows/{param}/publish` | POST |
| `/workflows/{param}/restore` | POST |
| `/workflows/{param}/versions` | POST |
| `/workflows/{param}/{param}` | GET |
| `/workflows/{param}/{param}/summary` | GET |
| `/workflows/{param}/{param}/timeline` | GET |

