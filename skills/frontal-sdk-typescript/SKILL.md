---
name: frontal-sdk-typescript
description: TypeScript/JavaScript SDK for the Frontal platform, published as @frontal-labs/sdk (version 2.0.0). Provides the unified Frontal client with lazy service getters (AI, agents, workflows, pipelines, ontology, blob, data, lineage, observability, audit, governance, auth, billing, connectors, webhooks, schedules, functions), typed FrontalError classes, cursor pagination, SSE streams, and @frontal-labs/testing mocks. Per-service packages (@frontal-labs/ai, @frontal-labs/agents, ...) and @frontal-labs/react hooks are also published. Use when writing TypeScript or JavaScript that calls the Frontal API on Node.js, Bun, or fetch-based edge runtimes.
metadata:
  author: frontal-labs
  version: "2.0.0"
  category: sdk
---

# Frontal SDK (TypeScript)

## When to Use

- Calling the Frontal API from TypeScript or JavaScript with `new Frontal({ apiKey })`.
- Using one service from a per-service package, such as `@frontal-labs/ai` or `@frontal-labs/agents`.
- Handling Frontal API errors, pagination, or SSE streams in application code.
- Writing unit tests against Frontal calls with `@frontal-labs/testing`.

## When NOT to Use

- Python, Go, Java, Rust, or CLI work. Use the matching skill in this repo.
- Non-Frontal APIs.
- React hook internals in `@frontal-labs/react`. This skill names the package only.

## Installation

```bash
bun add @frontal-labs/sdk
# or
npm install @frontal-labs/sdk
```

- Ships ESM and CJS builds with types. The package is `"type": "module"`.
- Engines: Node.js `>=18.0.0`, Bun `>=1.3.8`.
- Set `FRONTAL_API_KEY` to a key that starts with `frt_`.

## Quick Start

```ts
import { Frontal } from "@frontal-labs/sdk";

const f = new Frontal({ apiKey: process.env.FRONTAL_API_KEY! });

const { text } = await f.ai.generateText({
  model: "claude-sonnet-4-6",
  prompt: "Summarize this incident report in one line.",
});
console.log(text);

const agent = f.agents.use("agt_ticket_triager"); // example id
const run = await agent.message("support.ticket.created", { ticketId: "t_987" });

for await (const event of agent.watch(run.id)) {
  if (event.type === "event") console.log(event.event, event.data);
  if (event.type === "error") console.error(event.error.code, event.error.retryable);
}
```

Only the `apiKey` is required. Invalid config throws at construction (for example, a key without the `frt_` prefix).

## Configuration

`new Frontal(config)` takes an `SdkConfig` object or an existing `FrontalClient` (to share one transport).

| Option | Default | Notes |
| --- | --- | --- |
| `apiKey` | none, required | Must start with `frt_`. |
| `baseUrl` | `https://api.frontal.dev/v1` | Overrides `FRONTAL_API_URL`. Must be http or https. |
| `timeout` | `30000` | Milliseconds per request attempt. |
| `maxRetries` | `3` | Schema range 0 to 10. Applies to GET, or to non-GET calls that pass `retry.idempotent`. |
| `retryDelay` | `1000` | Base delay in milliseconds for exponential backoff. |
| `headers` | `{}` | Extra headers sent on every request. |
| `env` | `FRONTAL_ENV`, else `development` | `"development" \| "test" \| "production"`. |
| `debug` | `FRONTAL_DEBUG`, else `false` | Verbose logging. |
| `fetch` | global `fetch` | Custom fetch, for tests or edge runtimes. |
| `logger` | none | Optional `request`, `response`, and `error` callbacks. |
| `circuitBreaker` | off | Set `{ failureThreshold, resetTimeoutMs }` to enable. Defaults 5 and 30000. |

Environment variables (read by `@frontal-labs/core`):

| Variable | Purpose |
| --- | --- |
| `FRONTAL_API_KEY` | API key. Used by the deprecated env-driven singletons. |
| `FRONTAL_API_URL` | Base URL override. Must be a valid URL. |
| `FRONTAL_ENV` | `development`, `test`, or `production`. |
| `FRONTAL_DEBUG` | `true` or `1` enables debug. `false` or `0` disables it. |

Env values are validated when `@frontal-labs/core` is first imported, so a malformed `FRONTAL_API_KEY` or `FRONTAL_API_URL` fails at import time.

Details: `references/SDK_ARCHITECTURE.md`.

## Services

Each getter on `Frontal` is lazy and cached. `f.governance()` is a method.

| Getter | Covers |
| --- | --- |
| `f.ai` | `generateText`, `streamText`, `generateObject`, `decisions` (`decide`, `models`), `extractions` (`create`, `list`, `get`), `health`. |
| `f.agents` | `define` (builder), `use(id)` (accessor: `message`, `watch`, `run`, `runs`, `waitForCompletion`, `update`, `rollback`), `list`, `create`. |
| `f.workflows` | `define`, `use`, `list`, `create`; `approvals` (`approve`, `reject`); `steps`; `templates`. |
| `f.pipelines` | `define`, `use`, `list`, `create`, `capabilities`. |
| `f.ontology` | Ontology generation, validation, export, and inference; object types and objects; version comparison. |
| `f.blob` | `upload`, `download`, `downloadStream`, `delete`, `list`, `getSignedUrl`, `copyObject`, `moveObject`, `getMetadata`. |
| `f.data` | Namespaces `aggregations`, `archival`, `enrichment`, `exports`, `normalization`, `quality`, `query`, `schemas`, `serving`, `streams`, `sync`, `transformations`. |
| `f.lineage` | Namespaces `graph`, `nodes`, `edges`, `impact`. |
| `f.observability` | Namespaces `logs`, `metrics`, `traces`, `alerts`, `dashboards`, `events`. |
| `f.audit` | `log(event)` shorthand; namespace `events` (`create`, `createBatch`, `list`, `get`). |
| `f.governance()` | Namespaces `policies`, `compliance`, `roles`, `permissions`, `access`. |
| `f.auth` | Namespaces `users`, `mfa`, `session`, `sessions`, `account`, `admin`, `invite`, `apiKeys`, `devices`. |
| `f.billing` | Namespaces `customers`, `plans`, `prices`, `subscriptions`, `invoices`, `meters`, `wallets`, `addons`. |
| `f.connectors` | `list`, `get`, `replay`, `diagnostics`; namespaces `installations`, `sync`, `checkpoint`, `test`. |
| `f.webhooks` | Namespaces `endpoints`, `deliveries`, `stats`. |
| `f.schedules` | `list`, `create`, `get`, `update`, `delete`, `pause`, `resume`, `trigger`; namespace `cron`. |
| `f.functions` | `define`, `use`; namespaces `functions`, `executions`. |

`f.client` returns the underlying `FrontalClient`. Pass it to any `createXClient(f.client)` factory to share one transport.

Namespace names come from the `*Sdk` class fields in `packages/<name>/src/sdk.ts`. Check the source before you depend on a method that is not listed here.

## Errors

All API failures are `FrontalError` subclasses with `code`, `message`, `requestId`, `statusCode`, `retryable`, optional `docs`, optional `rateLimit`, and optional `fix`.

| Class | Status | Notes |
| --- | --- | --- |
| `ValidationError` | 400 | `fields: ErrorField[]` (`field`, `code`, `message`). |
| `UnauthorizedError` | 401 | |
| `ForbiddenError` | 403 | |
| `NotFoundError` | 404 | |
| `ConflictError` | 409 | |
| `RateLimitError` | 429 | `retryAfter` in seconds. Defaults to 60 when the header is missing. |
| `ServiceError` | any other status | Includes 5xx and unlisted 4xx such as 422. |
| `PaymentRequiredError` (402), `PayloadTooLargeError` (413) | 402, 413 | Exported from `@frontal-labs/core`, not from `@frontal-labs/sdk`. |
| `NetworkError` | none | Request never reached the API. `retryable` is always true. |
| `TimeoutError` | none | Code `TIMEOUT`. `retryable` is always true. |

```ts
import { FrontalError, RateLimitError, ValidationError, isRetryableError, requestIdOf } from "@frontal-labs/sdk";

try {
  await f.ai.generateText({ model: "claude-sonnet-4-6", prompt: "hi" });
} catch (err) {
  if (err instanceof RateLimitError) console.log("retry after", err.retryAfter, "s");
  else if (err instanceof ValidationError) console.log(err.fields);
  else if (err instanceof FrontalError) console.log(err.code, err.statusCode, err.requestId);
  console.log("retryable:", isRetryableError(err), "request:", requestIdOf(err));
}
```

Automatic retries cover HTTP 429, 500, 502, 503, and 504 only. Non-GET calls are never retried unless the caller passes `retry: { idempotent: true }`. Streams yield errors as data (see below).

Details: `references/ERROR_HANDLING.md`.

## Pagination and Streaming

List methods return a `PageResult<T>`:

```ts
const page = await f.agents.list({ limit: 20 });
for await (const agent of page) {
  console.log(agent.id);
}
const everything = await page.all();
const next = await page.nextPage(); // null when pagination.hasMore is false
```

Streams:

- `agent.watch(runId)` yields `event`, `state` (when `stateSchema` is given), `error`, `abort`, and `done` parts. It never throws mid-stream.
- `f.ai.streamText({...})` returns `textStream`, `fullStream`, `usage`, and `finishReason`.
- `f.client.stream()` and `f.client.postStream()` throw on failure. `f.client.streamParts()` and `f.client.postStreamParts()` yield errors as `{ type: "error" }` parts.

Details: `references/PAGINATION_AND_STREAMING.md`.

## Testing

```ts
import { Frontal } from "@frontal-labs/sdk";
import { createTestClient, mockPageResponse } from "@frontal-labs/testing";
import { expect, it } from "vitest";

it("lists agents", async () => {
  const { client, mock } = createTestClient([
    { method: "GET", path: "/agents", body: mockPageResponse([{ id: "agt_1" }]) },
  ]);
  const f = new Frontal(client);

  const page = await f.agents.list();

  expect(page.data[0]?.id).toBe("agt_1");
  mock.expectCalled("GET", "/agents");
});
```

`@frontal-labs/testing` mocks at the `fetch` layer, so the real retries, key transforms, and error mapping run. It has a peer dependency on `vitest`.

Details: `references/TESTING_PATTERNS.md`.

## References

- `references/SDK_ARCHITECTURE.md` - package graph, request pipeline, config resolution.
- `references/ERROR_HANDLING.md` - error classes, retry rules, stream error handling.
- `references/PAGINATION_AND_STREAMING.md` - `PageResult`, SSE helpers, polling.
- `references/TESTING_PATTERNS.md` - mock fetch, model mocks, scenarios.
- `assets/consumer-package.json` - dependency template for an app that uses the SDK.
- `assets/consumer-tsconfig.json` - TypeScript template for an ESM Node.js app.
