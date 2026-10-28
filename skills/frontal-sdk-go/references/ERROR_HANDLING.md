# Error Handling

Source: `client.go` (aliases and helpers), `internal/handlers/api_error.go`, `internal/handlers/errors.go`, `internal/handlers/response.go`, `internal/core/client.go`.

## Error kinds

| Kind | Type | How to match |
| --- | --- | --- |
| Non-2xx API response | `*frontal.APIError` | `errors.As` or `frontal.IsAPIError` |
| Transport failure | wrapped `*url.Error` or `net.Error` | `frontal.IsNetworkError` |
| Route not in inventory | wrapped sentinel | `errors.Is(err, frontal.ErrUnknownEndpoint)` |
| Client-side validation | plain error | string only; no sentinel |
| Context cancelled or deadline | `context.Canceled`, `context.DeadlineExceeded` | `errors.Is` |

`frontal.APIError` is a type alias for the internal `handlers.APIError`. Match it with a pointer target:

```go
var apiErr *frontal.APIError
if errors.As(err, &apiErr) {
    // apiErr.StatusCode, apiErr.Code, apiErr.RequestID, apiErr.Retryable
}
```

## APIError fields

| Field | Type | Source |
| --- | --- | --- |
| `StatusCode` | `int` | HTTP status |
| `Code` | `string` | `error.code` or top-level `code` in the body |
| `Type` | `string` | `error.type` or top-level `type` in the body |
| `Message` | `string` | `error.message` or top-level `message`; otherwise the body text (up to 4096 bytes), otherwise the status text |
| `RequestID` | `string` | `X-Request-ID` response header, else `requestId` or `request_id` in the body, else the request's `X-Request-ID` |
| `Retryable` | `bool` | Set from the status code only (see below). A `retryable` field in the body is ignored. |
| `RetryAfter` | `time.Duration` | Parsed `Retry-After` header; zero when absent or invalid |
| `Docs` | `string` | `docs` in the body |
| `Fields` | `json.RawMessage` | `fields` in the body (validation details) |
| `Details` | `json.RawMessage` | `details` in the body |

`Error()` formats as `frontal API error (status 400, code X): message`. It does not include credentials.

## Retryable

`Retryable` is true for statuses 408, 425, 429, 500, 502, 503, and 504. Other statuses are not retryable.

The SDK retries GET and HEAD only. A POST, PUT, PATCH, or DELETE that returns 429 or 503 comes back to the caller immediately with `Retryable` true and `RetryAfter` set. The caller must decide whether to repeat the write.

## Category helpers

| Helper | True when |
| --- | --- |
| `frontal.IsAuthError(err)` | status 401 or 403 |
| `frontal.IsValidationError(err)` | status 400 or 422 |
| `frontal.IsRateLimitError(err)` | status 429 |
| `frontal.IsServerError(err)` | status 500 to 599 |
| `frontal.IsNetworkError(err)` | a `net.Error` or `*url.Error`, but not a context error |

The helpers unwrap with `errors.As`, so they work on wrapped errors. `IsNetworkError` returns false for `context.Canceled` and `context.DeadlineExceeded`.

## Decoding a failed response

1. Read up to 1 MiB of the body.
2. If the body has an `error` object, decode it into `APIError`. If `error` is a string, use it as `Message`. If there is no `error` key, decode the top-level JSON as `APIError`.
3. If neither works, use the body text as `Message`, truncated to 4096 bytes.
4. Fill `RequestID` and `RetryAfter` from headers and body as described above.

## Stream errors

A non-2xx response from a stream endpoint returns `*APIError` from `Stream` or `frontal.Watch`. Errors that happen after the stream has started are delivered as `StreamItem.Err` on the channel. The channel then closes.

## Example

```go
health, err := client.Agents.Health(ctx)
if err != nil {
    var apiErr *frontal.APIError
    if errors.As(err, &apiErr) {
        log.Printf("status=%d code=%s request_id=%s", apiErr.StatusCode, apiErr.Code, apiErr.RequestID)
    }
    switch {
    case frontal.IsAuthError(err):
        return fmt.Errorf("check FRONTAL_API_KEY: %w", err)
    case frontal.IsNetworkError(err):
        return fmt.Errorf("network: %w", err)
    }
    return fmt.Errorf("agents health: %w", err)
}
fmt.Println(health.Status)
```

Wrap with `%w` when you add context, so `errors.As` and the helpers still match.
