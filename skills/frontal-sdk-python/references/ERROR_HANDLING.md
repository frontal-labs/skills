# Errors and retries

Source: upstream `frontal_sdk/core/errors.py`, `frontal_sdk/core/http.py`,
`frontal_sdk/core/circuit_breaker.py`, `frontal_sdk/core/retry.py`,
`docs/RESOURCES.md`, `tests/test_client.py`.

## Error classes

All errors subclass `FrontalError`, which subclasses `Exception`. Import the
public classes from the top-level package:

```python
from frontal_sdk import (
    AuthenticationError,
    ConflictError,
    FrontalError,
    NetworkError,
    NotFoundError,
    RateLimitError,
    ServerError,
    TimeoutError,
    ValidationError,
)
```

- `ValidationError`: HTTP 400 and 422
- `AuthenticationError`: HTTP 401 and 403
- `NotFoundError`: HTTP 404
- `ConflictError`: HTTP 409
- `RateLimitError`: HTTP 429
- `ServerError`: HTTP 500 and above
- `FrontalError`: Other HTTP statuses, invalid JSON, unexpected content type
- `NetworkError`: Connection failure or interrupted response
  (`code="NETWORK_ERROR"`)
- `TimeoutError`: Request timeout. Subclass of `NetworkError`

`TimeoutError` shadows the builtin name when imported. Import it explicitly
or qualify it as `frontal_sdk.TimeoutError`.

Also in `frontal_sdk.core.errors`, not exported at top level:
`error_for_status(status_code, message, *, code, request_id, details,
fields, retry_after, safe_to_retry)`. It builds the subtype the transport
raises.

## Fields

Every `FrontalError` has:

- `code` (`str`): API error code when present. `"FRONTAL_ERROR"` when absent.
- `request_id` (`str | None`): From the `x-request-id` response header
- `status_code` (`int | None`): HTTP status. `None` for network errors
- `transient` (`bool`): Temporary failure. Defaults to `status_code in {408,
  425, 429, 500, 502, 503, 504}`
- `safe_to_retry` (`bool`): Replay is safe. Defaults to `False`. See below
- `details` (`JSONValue`): Decoded error body, or response text (first 2048
  characters) for non-JSON errors
- `fields` (`list[ErrorField]`): Field-level issues. Each has `field`,
  `message`, and optional `code`
- `fix` (`str | None`): Remediation hint. Set only for some status and code
  pairs

`RateLimitError` adds `retry_after: float | None`. The value comes from the
`Retry-After` header and is capped at 5 seconds.

`transient` is `True` for every `RateLimitError` and `NetworkError`,
including timeouts, regardless of the default status set.

## Status mapping details

- 401 and 403 get the hint "Check FRONTAL_API_KEY" only when the API code is
  `UNAUTHORIZED` or `INVALID_API_KEY`.
- 400, 422 get the field hint only for codes `BAD_REQUEST` or
  `VALIDATION_ERROR`.
- 5xx gets `ServerError`. It gets the "temporarily unavailable" hint only for
  `SERVICE_UNAVAILABLE` or `INTERNAL_ERROR`. 501 is a `ServerError` with
  `transient=False`.

## Retry behaviour

This is the behaviour in the transport. The `Frontal` and `AsyncFrontal`
constructors take `max_retries` (default `3`, valid range `0` to `10`).

Non-streaming requests:

- Only `GET` requests retry automatically. POST, PUT, PATCH, and DELETE are
  never replayed by the transport.
- A `GET` retries on HTTP 408, 425, 429, 500, 502, 503, and 504. It also
  retries on httpx timeouts and transport errors.
- Up to `max_retries` retries follow the first attempt. With the default of
  3, a `GET` makes at most 4 attempts.
- Delay before each retry: the `Retry-After` value (capped at 5 seconds) if
  the header is present. Otherwise a uniform random value between 0 and
  `min(0.1 * 2**attempt, 2.0)`. With the defaults, the ceilings are 0.1, 0.2,
  and 0.4 seconds.

Streaming:

- Server-sent event `GET` streams (`stream()`) retry before the first event
  is delivered. They use `max_retries` on the same retryable status set and on
  transport errors. Once an event has been yielded, the stream is not
  replayed.
- Streaming `POST` requests (`stream_request()`) default to zero retries.
  Callers opt in with `max_retries`. `AI.stream_text()` exposes this as
  `stream_retries` (0 to 5, default 0).

Replay rules for `safe_to_retry`:

- For HTTP errors, `safe_to_retry` is `True` only when the failed request
  method was `GET`, `HEAD`, or `OPTIONS`.
- For timeout and network errors, the transport sets `safe_to_retry` for
  `GET`, `HEAD`, `OPTIONS`, `PUT`, and `DELETE`. This differs from the HTTP
  error rule. See the open questions in `SKILL.md`.
- Upstream docs say a transient error from a write may still have been
  accepted by the server. Check `safe_to_retry` before replaying a write.

Parsing and delay helpers:

- `frontal_sdk.core.calculate_delay(attempt, *, strategy="exponential",
  base_delay=1.0, jitter=True)` returns a delay for `exponential`, `linear`, or
  `constant` backoff. Jitter adds up to 0.1 seconds. The transport does not
  use this function. It is a standalone helper exported from `frontal_sdk.core`.

## Handling errors

```python
import os

from frontal_sdk import Frontal, FrontalError, RateLimitError, ValidationError

with Frontal(api_key=os.environ["FRONTAL_API_KEY"]) as client:
    try:
        page = client.agents.list(query={"limit": 50})
    except RateLimitError as error:
        print(f"Rate limited; retry after {error.retry_after}s")
    except ValidationError as error:
        for issue in error.fields:
            print(f"{issue.field}: {issue.message}")
    except FrontalError as error:
        print(f"[{error.code}] {error} (request {error.request_id})")
        if error.fix is not None:
            print(f"Hint: {error.fix}")
```

## Errors in streams

`AI.stream_text()` does not raise a `FrontalError` to the caller. It yields
a `StreamErrorPart` (`type="error"`) followed by a `DonePart`
(`type="done"`). Other exceptions still propagate. Check for the error part
in the loop. See `frontal_sdk/resources/ai.py`.

## Circuit breaker

`CircuitBreaker` is a standalone utility in `frontal_sdk.core`. It is not
wired into `Frontal` or `AsyncFrontal`. The transport does not consult it.

- `CircuitBreakerConfig(failure_threshold=5, reset_timeout=30.0,
  on_open=None, on_close=None, on_half_open=None)`
- States: `"closed"`, `"open"`, `"half_open"`.
- Every `Exception` raised by the wrapped call counts as a failure, including
  4xx `FrontalError` subclasses. Wrap only calls where that is intended.
- Results that do not raise can be counted with `is_failure`.
- When open, `execute()` raises `CircuitBreakerOpenError` (code
  `CIRCUIT_BREAKER_OPEN`, field `retry_after`) without calling the function.
- `BaseException` that is not `Exception` (for example cancellation) does not
  open the circuit.
- `force_open()` and `force_close()` set the state directly.
- `execute_async()` is the awaitable variant.

`CircuitBreakerOpenError` is exported from `frontal_sdk.core`, not from the
top-level package. Upstream tests check that these names are exported from
`frontal_sdk.core` (`tests/test_circuit_breaker.py`).

```python
from frontal_sdk import Frontal
from frontal_sdk.core import CircuitBreaker, CircuitBreakerConfig

breaker = CircuitBreaker(CircuitBreakerConfig(failure_threshold=5, reset_timeout=30.0))

with Frontal() as client:
    result = breaker.execute(
        lambda: client.ai.generate_text(
            {"model": "frontal-ai-fast", "prompt": "Say hello."}
        )
    )
```
