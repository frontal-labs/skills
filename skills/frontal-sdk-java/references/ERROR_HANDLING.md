# Error Handling (Java SDK)

## Hierarchy

```text
IOException
└── FrontalException            (abstract, sealed)
    ├── AuthException           (401, 403)            retryable: false
    ├── ValidationException     (400, 422)            retryable: false
    ├── RateLimitException      (429)                 retryable: true
    ├── ServerException         (500 and above)       retryable: 500, 502, 503, 504 only
    ├── ApiException            (other HTTP errors)   retryable: 408, 425 only
    └── NetworkException        (no HTTP response)    retryable: true, code NETWORK_ERROR, statusCode 0
```

Every subclass is `final`. `FrontalException` cannot be subclassed outside the SDK, so an exhaustive `switch` or a chain of `catch` blocks ordered from subclass to base is safe.

Because `FrontalException` extends `IOException`, a method that calls the SDK already declares it. Catch the specific subclass when handling differs, and `FrontalException` for the rest.

## Fields

| Member | Type | Source |
| --- | --- | --- |
| `code()` | `String` | Error body `code`, or `UNKNOWN_ERROR` when absent. `NETWORK_ERROR` for transport failures. |
| `getMessage()` | `String` | Error body `message`, or `Frontal request failed` when absent or blank. |
| `requestId()` | `String` | Server `x-request-id` response header when present; otherwise the SDK-generated request UUID. |
| `statusCode()` | `int` | HTTP status. `0` for `NetworkException`. |
| `retryable()` | `boolean` | Set by the exception type and status (see table above). |
| `responseBody()` | `String` or null | Raw error body, capped at `maxErrorBodyBytes` (16 KiB default). May contain sensitive data. |
| `responseBodyTruncated()` | `boolean` | True when the body exceeded the cap. |
| `RateLimitException.retryAfter()` | `Duration` | From `Retry-After` (seconds or HTTP date, clamped at zero). `Duration.ZERO` when absent or unparseable. |

Error body parsing: if the JSON has an `error` object, `code` and `message` come from inside it. Otherwise they come from the root object. Non-string values and non-JSON bodies yield null, so the defaults above apply.

## Mapping

Status is mapped once in the shared transport (`ApiClient.toFrontalException`):

| Status | Exception |
| --- | --- |
| 401, 403 | `AuthException` |
| 400, 422 | `ValidationException` |
| 429 | `RateLimitException` |
| 500 and above | `ServerException` |
| any other status, including 404, 408, 425 | `ApiException` |

Any other non-2xx status also maps to `ApiException`.

## Retries

- Only GET requests are retried. `attempts = maxRetries + 1`. Writes run once.
- Retried statuses: 408, 425, 429, 500, 502, 503, 504. Other 5xx (for example 501) are not retried.
- Transport `IOException` is retried for GET as well. After the last attempt it becomes `NetworkException`.
- Delay: 100 ms, doubling per attempt, capped at 5 s. If `Retry-After` is present, its value is used, capped at 5 s.
- Interrupting the thread during the delay throws `InterruptedException` and re-sets the interrupt flag.
- `maxRetries` default 2, range 0 to 10. Functions GET defaults to 3 unless `maxRetries` is set explicitly.

Writes that fail with a retryable status or network error are not retried. Decide whether to resend in application code and only do so for operations that are safe to repeat.

## Errors outside FrontalException

- A successful response larger than `maxResponseBytes` (64 MiB default) throws a plain `IOException` with the message `Response exceeded configured limit of ... bytes`. It is not a `FrontalException`.
- Malformed JSON in a successful response surfaces as a Jackson exception from `request(...)`.
- Argument validation throws `IllegalArgumentException` or `NullPointerException`. `ClientConfig` validates URLs, timeouts, retry counts, and header names at build time.
- `SseEventIterator` wraps read failures in `UncheckedIOException`. `PageResult` iteration does the same.

## Pattern

```java
try {
    JsonNode run = frontal.agents().runs().get("run_123", JsonNode.class);
} catch (AuthException e) {
    // Credentials are missing or rejected. Do not retry.
    log.error("auth failed: code={} request={}", e.code(), e.requestId());
} catch (RateLimitException e) {
    Duration wait = e.retryAfter();   // zero when the server sent no hint
    // schedule a retry after `wait`
} catch (ServerException | NetworkException e) {
    if (e.retryable()) {
        // safe to retry reads; writes need application-level idempotency
    }
} catch (FrontalException e) {
    log.warn("request failed: status={} code={} request={}", e.statusCode(), e.code(), e.requestId());
}
```

Log `requestId()` for support requests. Do not log `responseBody()` unless you have reviewed what it can contain.
