# Error handling

All fallible SDK calls return `frontal::Result<T>`, an alias for
`std::result::Result<T, frontal::FrontalError>`. `FrontalError` implements
`std::error::Error` (via `thiserror`) and `Debug`.

## Variants

- `Configuration(String)`: bad builder or `FRONTAL_*` input, an empty key, a zero
  timeout, or `max_retries > 10`. Not retryable.
- `InvalidPath(String)`: bad path, or a route missing from the inventory. No
  request is sent. Not retryable.
- `Transport(reqwest::Error)`: no valid response (connect, timeout, TLS).
  Retryable for timeouts and connect failures only.
- `Serialization(serde_json::Error)`: request body could not be serialized. Not
  retryable.
- `Decode(serde_json::Error)`: 2xx body is not the expected JSON, including an
  empty body on a typed call. Not retryable.
- `Stream(String)`: an SSE event could not be parsed (`stream` feature). Not
  retryable.
- `Pagination(String)`: the server repeated a cursor in `paginate`. Not
  retryable.
- `Auth(ApiError)`: HTTP 401 or 403. Not retryable.
- `Validation(ApiError)`: HTTP 422. Not retryable.
- `RateLimit(ApiError)`: HTTP 429. Retryable.
- `Server(ApiError)`: HTTP 5xx. Retryable.
- `Api(ApiError)`: other non-2xx, such as 400, 404, 408, 409, or 425. Retryable
  for 408 and 425 only.

Mapping is by HTTP status: 401 and 403 become `Auth`, 422 becomes `Validation`,
429 becomes `RateLimit`, any 5xx becomes `Server`, and everything else non-2xx
becomes `Api`.

## Helper methods

`FrontalError` methods:

- `category() -> ErrorCategory`: `Configuration`, `Authentication`, `RateLimit`,
  `Validation`, `Server`, `Network`, `Serialization`, or `Api`.
- `code() -> Option<&str>`: machine-readable code from the body.
- `request_id() -> Option<&str>`: server request ID, when available.
- `status_code() -> Option<u16>`: HTTP status for API errors.
- `retryable() -> bool`: whether a retry may succeed.
- `body() -> Option<&serde_json::Value>`: parsed JSON error body.

`ApiError` (the payload of the five API variants) exposes `status()`,
`status_code()`, `code()`, `message()`, `request_id()`, `body()`, and
`retryable()`. It implements `Display` as `"{status}: {message}"`.

## How ApiError is filled

- `code`: body field `code`, else `error_code`.
- `message`: body field `message`, else `error`, else the HTTP reason phrase.
- `request_id`: response header `x-request-id`, else `request-id`. If neither is
  present, the SDK fills in its own `frontal-<pid>-<seq>` ID, so API errors
  nearly always have a request ID.
- `body`: the parsed JSON body, if the body was JSON.

## Matching

```rust
use frontal::{Frontal, FrontalError};

async fn load(client: &Frontal, id: &str) -> Result<String, String> {
    match client.agents().get_agent(id).await {
        Ok(agent) => Ok(agent.name),
        Err(FrontalError::Auth(err)) => Err(format!("check FRONTAL_API_KEY: {err}")),
        Err(FrontalError::Api(err)) if err.status_code() == 404 => {
            Err(format!("no agent {id}"))
        }
        Err(err) if err.retryable() => Err(format!("transient, retry: {err}")),
        Err(err) => Err(format!(
            "{:?} code={:?} request_id={:?}",
            err.category(),
            err.code(),
            err.request_id()
        )),
    }
}
```

Note the 404 arm: a 404 is an `Api` variant, so match `FrontalError::Api(err)`
and check `status_code()`. Do not look for a `NotFound` variant; there is none.

## Retry behavior

- The client retries internally before returning an error, according to the
  retry rules in `CLIENT_PATTERNS.md`. A returned `retryable()` error has
  already used its retry budget (or the operation was not retry-safe).
- For operations that were not retried, a `retryable()` error is safe to retry
  in your own code only if the operation is idempotent. Reuse the same
  idempotency key for the same logical operation.
- `Configuration`, `InvalidPath`, `Auth`, `Validation`, `Serialization`,
  `Decode`, and `Pagination` are never retried.

## Logging

Log `category()`, `status_code()`, `code()`, and `request_id()`. Do not log the
request body or API key; the SDK redacts the key in `Debug`, but it does not
redact your payloads.
