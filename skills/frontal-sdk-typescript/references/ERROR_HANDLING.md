# Error Handling

Source: `packages/core/src/errors.ts`, `packages/core/src/http.ts`, `packages/core/src/stream.ts`, `packages/core/src/schemas.ts`.

## Class Hierarchy

```text
Error
├── FrontalError                     code, message, requestId, statusCode, retryable, docs?, rateLimit?, fix?
│   ├── ValidationError              400, fields: ErrorField[]
│   ├── UnauthorizedError            401
│   ├── PaymentRequiredError         402 (core only)
│   ├── ForbiddenError               403
│   ├── NotFoundError                404
│   ├── ConflictError                409
│   ├── PayloadTooLargeError         413 (core only)
│   ├── RateLimitError               429, retryAfter (seconds)
│   └── ServiceError                 any other status
├── NetworkError                     code "NETWORK_ERROR", retryable true, cause
├── TimeoutError                     code "TIMEOUT", retryable true
└── CircuitBreakerOpenError          retryAfterMs (core only; thrown when the breaker is OPEN)
```

`@frontal-labs/sdk` re-exports: `FrontalError`, `ValidationError`, `UnauthorizedError`, `ForbiddenError`, `NotFoundError`, `ConflictError`, `RateLimitError`, `ServiceError`, `NetworkError`, `TimeoutError`, `isFrontalError`, `isRetryableError`, `requestIdOf`. `PaymentRequiredError` and `PayloadTooLargeError` need an import from `@frontal-labs/core`.

## Mapping

`parseFrontalError(body, status, retryAfter?, rateLimit?)` picks the class by status:

| Status | Class |
| --- | --- |
| 400 | `ValidationError` |
| 401 | `UnauthorizedError` |
| 402 | `PaymentRequiredError` |
| 403 | `ForbiddenError` |
| 404 | `NotFoundError` |
| 409 | `ConflictError` |
| 413 | `PayloadTooLargeError` |
| 429 | `RateLimitError` |
| anything else | `ServiceError` (422, 500, and so on) |

`RateLimitError.retryAfter` is in seconds. It comes from `Retry-After`, and defaults to 60 when the header is missing or unparseable.

## Properties

- `code`: server error code, such as `UNAUTHORIZED`, `RATE_LIMITED`, `NOT_FOUND`, `VALIDATION_ERROR`. The SDK knows these for `fix` hints. Other codes pass through.
- `requestId`: from the response body or `x-request-id`. `"unknown"` if neither is present.
- `statusCode`: HTTP status.
- `docs`: optional http or https URL from the body.
- `retryable`: true for HTTP 408, 425, 429, 500, 502, 503, 504. Not a guarantee that the SDK retries them automatically.
- `rateLimit`: `{ limit, remaining, reset }` from `X-RateLimit-*` headers, when present.
- `fix`: short remediation text, when the code or status has one.
- `toJSON()`: plain object form for logs.
- `ValidationError.fields`: `{ field, code, message }[]`.

Body shapes accepted: the flat `{ code, message, requestId, docs?, fields? }` and the gateway envelope `{ error: { message, code, ... }, requestId }`. Unrecognized bodies become `UNKNOWN_ERROR` with message "An unknown error occurred".

## Retry Rules

From `HttpClient.request`:

- Automatic retry applies to HTTP 429, 500, 502, 503, and 504 only.
- Only for GET, or for any method when `retry: { idempotent: true }` is passed. Mutations are never replayed by default.
- Attempts: `retry.maxRetries` if set, else client `maxRetries` (default 3).
- Delay: server `retry-after-ms` or `Retry-After` (capped at 60 s), else exponential backoff from `retryDelay` with jitter.
- Network errors and timeouts are not retried by the HTTP layer. Catch them and retry at the call site if the operation is safe.
- Caller `signal` aborts pending retry sleeps.

`RequestOptions` (`signal`, `timeout`, `headers`, `idempotencyKey`, `preserveKeys`, `retry`) is accepted by the `HttpClient` methods in `packages/core/src/http.ts`. The public service methods checked (for example `f.billing.customers.create(input)`) take only their input. Do not assume per-call options reach a service method without reading its signature.

## Checking Errors

```ts
import { FrontalError, isRetryableError, requestIdOf } from "@frontal-labs/sdk";

try {
  await op();
} catch (err) {
  if (err instanceof FrontalError && err.statusCode === 402) {
    // Balance or plan does not cover the request.
  }
  if (isRetryableError(err)) {
    // Safe to retry the same call, subject to idempotency.
  }
  console.error(requestIdOf(err), err);
}
```

- `isRetryableError(e)` returns true when `e.retryable === true`. Plain `Error` objects return false.
- `requestIdOf(e)` returns the request id tagged on the value, or its `requestId` property. Use it for support tickets.
- `FrontalError.isInstance(e)` and `isFrontalError(e)` are structural checks (brand symbol), so they work across duplicate copies of `@frontal-labs/core`. The per-class `isInstance` helpers compare `error.name`.

## Streams

- `agent.watch()` and `client.streamParts()` never throw mid-stream. They yield `{ type: "error", error }` with `error.retryable` and then `{ type: "done" }`.
- `client.stream()` and `client.postStream()` throw on transport or HTTP failure.
- Abort: `signal` yields `{ type: "abort" }` then `{ type: "done" }`.
- `f.ai.streamText()` `fullStream` emits error parts. `textStream` yields text only.

## Telemetry

`registerTelemetry(provider)` (exported from `@frontal-labs/sdk`) takes a `TelemetryProvider` with optional `onRequest({ method, path, requestId, attempt })`, `onResponse(event)`, and `onError(event)` hooks. `TelemetryEvent` carries `requestId`, `serverRequestId`, `status`, `durationMs`, and `error`. Source: `packages/core/src/tracing.ts`.
