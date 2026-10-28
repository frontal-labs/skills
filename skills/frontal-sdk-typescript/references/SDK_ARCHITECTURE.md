# SDK Architecture

Source: upstream monorepo `sdk-typescript`, `packages/*/src`. Versions from each `packages/*/package.json`.

## Package Graph

| Package | Version | Role |
| --- | --- | --- |
| `@frontal-labs/sdk` | 2.0.0 | Unified `Frontal` client. Re-exports core primitives and helpers. |
| `@frontal-labs/core` | 1.1.0 | `FrontalClient`, `HttpClient`, errors, pagination, polling, streams, config schema, env. |
| `@frontal-labs/ai` | 0.2.0 | `AISdk`: generation, streaming, structured output, decisions, extractions. |
| `@frontal-labs/agents` | 2.0.0 | `AgentsSdk`: define, use, run, watch agents. |
| `@frontal-labs/workflows` | 1.0.0 | Workflow builder, accessor, approvals. |
| `@frontal-labs/pipelines` | 0.0.6 | Pipeline builder and accessor. |
| `@frontal-labs/ontology` | 1.0.4 | Ontology generation, object types, objects. |
| `@frontal-labs/blob` | 1.1.0 | Object storage. |
| `@frontal-labs/data` | 0.1.3 | Data namespaces. |
| `@frontal-labs/lineage` | 0.0.6 | Lineage graph, nodes, edges, impact. |
| `@frontal-labs/observability` | 0.1.4 | Logs, metrics, traces, alerts, dashboards. |
| `@frontal-labs/audit` | 1.0.0 | Audit events. |
| `@frontal-labs/governance` | 0.0.6 | Policies, compliance, roles, permissions, access. |
| `@frontal-labs/auth` | 1.0.4 | Users, MFA, sessions, account, admin. |
| `@frontal-labs/billing` | 1.0.3 | Customers, plans, subscriptions, invoices, meters. |
| `@frontal-labs/connectors` | 0.0.6 | Connectors and installations. |
| `@frontal-labs/webhooks` | 1.0.0 | Endpoints, deliveries, stats. |
| `@frontal-labs/schedules` | 1.0.3 | Cron schedules. |
| `@frontal-labs/functions` | 0.0.2 | Function definitions and executions. |
| `@frontal-labs/testing` | 1.1.0 | Mock fetch, model mocks, scenarios, fixtures. |
| `@frontal-labs/react` | 0.2.0 | `useChat`, `useAgentRun`, `useWorkflowApprovals`. |

Every domain package depends on `@frontal-labs/core`. The unified package depends on all domain packages. Each domain package exports `createXClient(configOrFrontalClient)`.

## Unified Client

`packages/sdk/src/sdk.ts`:

- `Frontal` holds one `FrontalClient` (`#frontal`).
- Each service getter creates its `*Sdk` on first access (`??=`) and caches it.
- `governance()` is a method, not a getter, with the same caching.
- `f.client` returns the `FrontalClient`.
- The constructor accepts `SdkConfig | FrontalClient`. A `FrontalClient` instance is used as-is.

`packages/sdk/src/config.ts` resolves `SdkConfig` into the core config:

- `baseUrl` = `config.baseUrl ?? FRONTAL_API_URL ?? https://api.frontal.dev/v1`
- `timeout` = 30000, `maxRetries` = 3, `retryDelay` = 1000, `headers` = `{}`
- `environment` = `config.env ?? FRONTAL_ENV` (env default `development`)
- `debug` = `config.debug ?? FRONTAL_DEBUG ?? false`
- Passes a fixed set of keys through `clientConfigSchema.parse`. Extra `SdkConfig` keys are dropped without error.

`FrontalClient` (core) takes `ClientConfigInput`, which uses `environment` where `SdkConfig` uses `env`. It also accepts `compression: "zstd"` (default `false`). `compression` is not in `SdkConfig`.

## Core Transport

`packages/core/src/http.ts` (`HttpClient`):

- Builds URLs as `baseUrl` (trailing slash removed) plus path, with query params.
- Request bodies are converted from camelCase to snake_case (`deepCamelToSnake`). JSON responses are converted back to camelCase. `preserveKeys` in per-call options keeps selected keys unchanged.
- Sends `X-Request-Id` on every request. Sends `Idempotency-Key` when `idempotencyKey` is passed.
- Per-call `RequestOptions`: `signal`, `timeout`, `headers`, `idempotencyKey`, `preserveKeys`, `retry: { maxRetries, idempotent }`.
- Retries HTTP 429, 500, 502, 503, 504 with exponential backoff (`retryDelay * 2^attempt` plus jitter up to 100 ms), or `retry-after-ms` / `Retry-After` capped at 60 s. Only for GET, or when `retry.idempotent` is true.
- Network failures become `NetworkError` immediately. They are not retried by the HTTP layer.
- Timeouts become `TimeoutError`. A caller abort is rethrown unchanged.
- Non-2xx responses go through `parseFrontalError`. Reads `X-RateLimit-Limit`, `-Remaining`, and `-Reset` into `rateLimit`.
- Circuit breaker: created only when `circuitBreaker` is configured. Counts 500, 502, 503, and 504 as failures. States `CLOSED`, `OPEN`, `HALF_OPEN`. Open-state rejections throw `CircuitBreakerOpenError` (exported by core, with `retryAfterMs`).
- Optional zstd compression of request bodies at 1024 bytes or more. Requires Node 22.15+ or Bun. Off by default.

`FrontalClient` methods: `get`, `post`, `put`, `patch`, `delete`, `stream`, `postStream`, `streamParts`, `postStreamParts`, `putRaw`. Each unwraps `NetworkError` causes so the original error surfaces.

## Environment Variables

`packages/core/src/keys.ts` validates `process.env` with `@t3-oss/env-core` at import time:

- `FRONTAL_ENV`: enum, default `development`.
- `FRONTAL_API_KEY`: optional. If set, must match `^frt_[A-Za-z0-9_]+$` (no hyphens) and be 9 to 128 characters. See the conflict note below.
- `FRONTAL_API_URL`: optional, must be a valid URL.
- `FRONTAL_DEBUG`: accepts `"true"`, `"false"`, `"1"`, `"0"`. Other values fail.

`getDefaultClient()` throws if `FRONTAL_API_KEY` is missing. The `frontal`, `ai`, `agents`, and other singletons in `@frontal-labs/sdk` are deprecated Proxies that call `getDefaultClient()` on first access. They remain for back-compat.

## Build and Tooling

- Bun is the package manager and test runner (`packageManager: bun@1.3.8`). Turborepo runs tasks.
- Each package builds with `tsup` (ESM `index.js`, CJS `index.cjs`, `external: ["zod"]`) plus `tsc --emitDeclarationOnly`.
- `packages/sdk/package.json` exports `import` and `require` conditions with `types`. Subpath `./dist/*` and `./package.json` are exported.
- `sideEffects: false`. `files`: `dist`, `src`.
- Tests: Vitest. Lint and format: Biome.

## Conflicts Between Docs and Code

- Docs say invalid config throws at construction. True for `SdkConfig` (`resolveSdkConfig`). A bad `FRONTAL_API_KEY` env var throws earlier, at import of `@frontal-labs/core`.
- `keys.ts` accepts `fr_typed...` as an alternate key prefix. `config.ts` accepts only `frt_`. Not documented. Treat as unsupported.
- `keys.ts` regex for `FRONTAL_API_KEY` disallows hyphens. `config.ts` allows them.
- `clientConfigSchema` defaults `environment` to `production`. `resolveSdkConfig` always passes `FRONTAL_ENV` (default `development`), so the effective default is `development`.
