---
name: frontal-sdk-python
description: Python SDK for the Frontal API. PyPI package `frontal`, import name `frontal_sdk`. Provides sync `Frontal` and async `AsyncFrontal` clients with typed services (ai, agents, functions, workflows, data, ontology and more), AI text helpers, cursor pagination, polling, server-sent event streams, and typed errors with retry signals. Use when writing Python code that calls the Frontal API, defines or invokes Frontal agents, functions or workflows, or generates text through the Frontal AI gateway. Not for TypeScript, Go, Java or Rust projects.
metadata:
  author: frontal-labs
  version: "1.0.0"
  category: sdk
---

# Frontal SDK (Python)

## When to Use

- Writing Python that calls the Frontal API.
- Generating text, streaming text, or validating structured output with
  `client.ai`.
- Defining, invoking, or messaging agents (`client.agents`), functions
  (`client.functions`), or workflows (`client.workflows`).
- Paging through list endpoints, polling a long-running operation, or reading
  server-sent events.
- Catching typed errors and deciding whether a retry is safe.

## When NOT to Use

- TypeScript, Go, Java, or Rust projects. Use the matching `frontal-sdk-*`
  skill.
- Calling the HTTP API directly from a non-Python stack.
- Local development of the SDK itself. See the upstream `CONTRIBUTING.md`.

## Installation

Python 3.9 to 3.12 is supported (upstream `pyproject.toml` and `docs/GETTING_STARTED.md`).

```bash
pip install frontal
# or
uv add frontal
```

Runtime dependencies (installed automatically): `anyio>=4.5,<5`,
`httpx>=0.27.2,<1`, `pydantic>=2.10.6,<3`, and `eval-type-backport` on Python
below 3.10. The SDK does not load `.env` files.

## Quick Start

Set the key in the environment, then call a service:

```bash
export FRONTAL_API_KEY="frt_..."
```

```python
from frontal_sdk import Frontal

with Frontal() as client:
    result = client.ai.generate_text(
        {"model": "frontal-ai-fast", "prompt": "Say hello."}
    )
    print(result.text)
```

Async:

```python
import asyncio

from frontal_sdk import AsyncFrontal


async def main() -> None:
    async with AsyncFrontal() as client:
        result = await client.ai.generate_text(
            {"model": "frontal-ai-fast", "prompt": "Say hello."}
        )
        print(result.text)


asyncio.run(main())
```

## Configuration

Constructor arguments (identical on `Frontal` and `AsyncFrontal`). An explicit
argument always wins over the environment variable.

- `api_key`: env `FRONTAL_API_KEY`. Default: none, required. Must start with
  `frt_`, use base64url characters, and be at least 9 characters. A missing
  key raises `ValueError`.
- `base_url`: env `FRONTAL_API_URL`. Default `https://api.frontal.dev/v1`.
  Absolute `http` or `https` URL with no credentials, query or fragment. A
  trailing slash is removed.
- `timeout`: no env var. Default `30.0`. Finite positive seconds, applied to
  the SDK-created HTTPX client.
- `max_retries`: no env var. Default `3`. Integer from 0 to 10. Booleans are
  rejected. See `references/ERROR_HANDLING.md`.
- `headers`: no env var. Default `{}`. `Authorization`, `X-Request-ID` and
  `X-Frontal-Environment` are reserved and cannot be overridden.
- `environment`: env `FRONTAL_ENV`. Default `"production"`. Sent as the
  `X-Frontal-Environment` header. Must not be empty.
- `debug`: env `FRONTAL_DEBUG`. Default `False`. The values `1`, `true`,
  `yes`, `on` (case-insensitive) enable it. Logs go to the `frontal_sdk.http`
  logger with method, path, status and request ID. Query values are not
  logged.
- `http_client`: no env var. Default `None`. Your own `httpx.Client` or
  `httpx.AsyncClient`. The SDK uses it as given, so its timeout applies, and
  you close it.

`Frontal.from_env()` and `AsyncFrontal.from_env()` take no arguments and read
the same variables.

```python
from frontal_sdk import Frontal

client = Frontal(
    timeout=10.0,
    max_retries=2,
    environment="staging",
    headers={"X-Team": "support"},
)
```

## Resources and Services

`Frontal` and `AsyncFrontal` both expose these attributes. Full details in
`references/API_ENDPOINTS.md`.

- `ai`: text, object, embedding, speech, image, video, transcription,
  moderation and rerank
- `agents`: agent definitions, runs, versions
- `functions`: function definitions, versions, deployments, executions
- `workflows`: workflow definitions, executions, approvals, tasks, templates
- `audit`, `auth`, `billing`: audit events, authentication, billing
- `blob`, `connectors`, `data`: files, integrations, data operations
- `governance`, `lineage`, `observability`: governance, lineage, telemetry
- `ontology`, `pipelines`: ontology and pipeline operations
- `schedules`, `webhooks`: schedules and webhooks

The upstream contract lists 383 endpoints across these services.

## Async and Functions Usage

- The async client has the same methods. Await them. `stream_text()` returns
  an async iterator (`async for`).
- Method conventions: `query=` for query parameters, `body=` for JSON writes
  (omitted body sends nothing; `None` sends `null`). Multipart uploads pass
  `parts` positionally, for example `client.blob.upload_object(container,
  key, parts)`. Raw-body methods take `data` and `content_type` positionally.
- Agents and workflows use builders that validate before sending:
  `client.agents.define(name)...create()`,
  `client.workflows.define(name)...create()`.
- Functions:

```python
from frontal_sdk import Frontal, FunctionInvocationInput, FunctionResource

with Frontal() as client:
    created = (
        client.functions.define("hello-world")
        .runtime("nodejs22")          # nodejs20 | nodejs22 | python311
        .entrypoint("index.handler")
        .create()
    )
    function = FunctionResource.model_validate(created)
    result = client.functions.executions.invoke(
        FunctionInvocationInput(function_id=function.id, input={"name": "World"})
    )
```

- Pagination: `paginate(fetch_page, query=..., max_pages=...)` and
  `async_paginate`. Polling: `poll_until` and `async_poll_until`. Details and
  signatures in `references/CLIENT_PATTERNS.md`.

## Errors and Retries

All API and transport failures raise a `FrontalError` subclass:

- `ValidationError` (400, 422), `AuthenticationError` (401, 403),
  `NotFoundError` (404), `ConflictError` (409), `RateLimitError` (429, with
  `retry_after`), `ServerError` (5xx), `NetworkError`, `TimeoutError`.
- Fields: `code`, `request_id`, `status_code`, `transient`, `safe_to_retry`,
  `details`, `fields`, `fix`.

Automatic retries apply to `GET` requests only, on 408, 425, 429, 500, 502,
503, 504, and on timeouts and transport errors. Writes are never replayed by
the transport. A `safe_to_retry` of `True` means replay is safe. Streaming
`POST` calls default to zero retries.

The circuit breaker (`CircuitBreaker`, `CircuitBreakerConfig`) is exported
from `frontal_sdk.core`. It is standalone and not used by the clients. Details
in `references/ERROR_HANDLING.md`.

## Testing

- Upstream tests use RESPX at the HTTPX layer. No live API or credentials are
  needed (`docs/TESTING.md`).
- In your own tests, inject a mock-capable `httpx.Client` or
  `httpx.AsyncClient` through `http_client=`. Set `max_retries=0` to make
  failure tests deterministic.
- Set `FRONTAL_API_KEY` to a fake `frt_` value in tests. Validation runs at
  construction, so the value must still be well-formed.

## References

- `references/API_ENDPOINTS.md`: service namespaces, method conventions,
  models, contract counts.
- `references/CLIENT_PATTERNS.md`: construction, sync vs async, AI helpers,
  agents, workflows, functions, pagination, polling.
- `references/ERROR_HANDLING.md`: error classes and fields, status mapping,
  retry and replay rules, circuit breaker.
- `assets/pyproject.toml`: consumer project template.
