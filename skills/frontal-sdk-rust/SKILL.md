---
name: frontal-sdk-rust
description: Async Rust SDK (crate frontal, version 1.0.0) for the Frontal API. One Frontal client with reqwest and Tokio, typed service handles for 17 services, structured errors, retries, cursor pagination, polling, and optional SSE streaming. Use when writing or reviewing Rust code that calls Frontal, adding the frontal crate to a Cargo project, or changing the frontal crate itself. Not for TypeScript, Python, Go, or Java projects.
metadata:
  author: frontal-labs
  version: "1.0.0"
  category: sdk
---

# Frontal SDK (Rust)

The `frontal` crate is an async client for the Frontal API. Create one `Frontal`
client and reuse it. Clones share the connection pool. Each service is a handle
such as `client.agents()` or `client.functions()`.

## When to Use

- Writing async Rust that calls the Frontal API.
- Adding the `frontal` crate to a Cargo project, or narrowing it with feature
  flags.
- Using retries, idempotency keys, cursor pagination, polling, or SSE from Rust.
- Changing the crate itself (see Testing).

## When NOT to Use

- TypeScript, Python, Go, or Java code. Use the matching `frontal-sdk-*` skill.
- Synchronous or blocking code. The client is async only.
- Sandbox routes. The inventory lists them, but there is no `sandbox()` handle.
- Non-Frontal APIs.

## Installation

```sh
cargo add frontal
cargo add serde_json
cargo add tokio --features macros,rt-multi-thread
```

All 17 services and the `stream` feature are on by default (`full`). To compile
only what you use:

```sh
cargo add frontal --no-default-features --features functions
```

Service features: `agents`, `ai`, `audit`, `auth`, `billing`, `blob`,
`connectors`, `data`, `functions`, `governance`, `lineage`, `observability`,
`ontology`, `pipelines`, `schedules`, `webhooks`, `workflows`. The `stream`
feature enables `watch_run` and `events`. It adds `futures-util`. Add it to your
own crate too if you call `.next()` on a stream (`cargo add futures-util`).

The crate uses edition 2021 and `rust-version = "1.75"`. TLS is rustls, so no
system OpenSSL is needed. The crate needs a Tokio runtime at run time. Its own
Tokio dependency only enables `time`.

## Quick Start

```rust
use frontal::{Frontal, Result};

#[tokio::main]
async fn main() -> Result<()> {
    let client = Frontal::from_env()?;
    let agents = client.agents().list_agents(&[]).await?;
    println!("{agents:#?}");
    Ok(())
}
```

`Frontal::from_env()` needs `FRONTAL_API_KEY`. Without it, the call returns
`FrontalError::Configuration`.

## Configuration

Build a client explicitly when you need more than the environment provides:

```rust
use frontal::{Frontal, Result, RetryPolicy};
use std::time::Duration;

fn build_client() -> Result<Frontal> {
    Frontal::builder(std::env::var("FRONTAL_API_KEY").unwrap_or_default())
        .base_url("https://api.frontal.dev/v1/")?
        .timeout(Duration::from_secs(10))
        .retry_policy(RetryPolicy::default())
        .environment("development")
        .debug(false)
        .build()
}
```

`Frontal::new(api_key)` is shorthand for `Frontal::builder(api_key).build()`.

Environment variables, all read by `Frontal::from_env()`:

- `FRONTAL_API_KEY`: required. Sent as a Bearer token. Missing values are a
  configuration error.
- `FRONTAL_API_URL`: default `https://api.frontal.dev/v1/`. Must be http(s) with
  a host, and no credentials, query, or fragment.
- `FRONTAL_TIMEOUT`: default `30000` (30 s). Unsigned milliseconds. Non-numeric
  values are a configuration error.
- `FRONTAL_ENV`: default unset. A label only. The SDK does not change behavior
  based on it.
- `FRONTAL_DEBUG`: default `false`. `1`, `true`, or `yes` (any case) turns on
  `tracing::debug!` events.

The SDK does not load `.env` files. Builder defaults: timeout 30 s, retry policy
`max_retries: 2`, `initial_backoff: 200 ms`, `max_backoff: 2 s`. `build()`
rejects an empty API key, a zero timeout, and `max_retries` above 10.
`functions()` uses 3 retries unless you set a policy on the client. See
`references/CLIENT_PATTERNS.md`.

## Services overview

Handles on `Frontal`: `agents()`, `ai()`, `audit()`, `auth()`, `billing()`,
`blob()`, `connectors()`, `data()`, `functions()`, `governance()`, `lineage()`,
`observability()`, `ontology()`, `pipelines()`, `schedules()`, `webhooks()`,
`workflows()`.

- `agents`, `ai`, `functions`, and `workflows` have concrete typed methods (for
  example `list_agents`, `chat_completions`, `create_function`,
  `list_workflows`).
- Most other handles use generic methods. Their type parameters, such as
  `list_aggregations::<_, T>`, take caller-defined Serde types or
  `serde_json::Value`.
- Every handle also has raw verb methods (`get`, `post`, `put`, `patch`,
  `delete`, and so on). Each one checks the route against the endpoint inventory
  first.

Full route list: `references/API_ENDPOINTS.md`.

## Functions

```rust
use frontal::{models::functions::FunctionListOptions, Frontal, Result};

async fn first_page(client: &Frontal) -> Result<()> {
    let page = client
        .functions()
        .list_functions(&FunctionListOptions {
            cursor: None,
            limit: Some(20),
        })
        .await?;
    println!(
        "{} functions, more: {}",
        page.functions.len(),
        page.pagination.has_more
    );
    Ok(())
}
```

Create, invoke, and version methods are in `references/CLIENT_PATTERNS.md`.

## Errors

Every fallible call returns `frontal::Result<T>`, which is
`std::result::Result<T, FrontalError>`. Match on the variant for policy
decisions. Use `category()`, `code()`, `request_id()`, `status_code()`, and
`retryable()` for logs and retry loops.

```rust
use frontal::{Frontal, FrontalError};

async fn load_agent(client: &Frontal, id: &str) {
    match client.agents().get_agent(id).await {
        Ok(agent) => println!("{}", agent.name),
        Err(FrontalError::Auth(err)) => eprintln!("auth failed: {err}"),
        Err(err) if err.retryable() => eprintln!("transient, retry later: {err}"),
        Err(err) => eprintln!(
            "{:?} code={:?} request={:?}",
            err.category(),
            err.code(),
            err.request_id()
        ),
    }
}
```

Variants and retry rules are in `references/ERROR_HANDLING.md`.

## Pagination, polling, and streaming

- `paginate(path, limit)` follows `{ "data": [...], "next_cursor": "..." }`
  pages and returns all items. It fails with `FrontalError::Pagination` if the
  server repeats a cursor. It does not understand the agents or functions list
  envelopes: `paginate("agents", ..)` silently returns only the first page, and
  `paginate("functions", ..)` fails to decode. For those, loop on the typed list
  method (see `references/CLIENT_PATTERNS.md`).
- `poll_until(path, max_attempts, interval, ready)` performs GETs until `ready`
  returns true. It returns `Ok(None)` when attempts run out. A deadline cannot
  interrupt a request that is already in flight.
- `agents().watch_run(run_id)` returns a stream of `ServerSentEvent` (needs the
  `stream` feature). Dropping the stream closes the connection.

```rust
use frontal::{Frontal, Result};
use futures_util::StreamExt;

async fn watch(client: &Frontal, run_id: &str) -> Result<()> {
    let mut events = Box::pin(client.agents().watch_run(run_id).await?);
    while let Some(event) = events.next().await {
        let event = event?;
        println!("{} {}", event.event, event.data);
    }
    Ok(())
}
```

## Testing

- Unit and integration tests use `wiremock` and need no backend or credentials.
  Point the client at the mock with `base_url(&server.uri())` and set
  `retry_policy(RetryPolicy { max_retries: 0, ..RetryPolicy::default() })` so
  failures are deterministic.
- Crate checks, run in the upstream repo (in this order):

```sh
cargo fmt --all -- --check
cargo build --workspace
cargo clippy --all-targets --all-features -- -D warnings
cargo nextest run
cargo test --doc
cargo xtask contract
python3 scripts/check_contracts.py
```

- CI also checks MSRV 1.75.0 with `cargo check --workspace --all-targets
  --all-features --locked`.
- If you change endpoint-backed methods, run `cargo xtask contract`. Do not edit
  the OpenAPI snapshots as part of routine SDK work.

## References

- `references/API_ENDPOINTS.md`: the 383 contract routes grouped by service, and
  how route validation works.
- `references/CLIENT_PATTERNS.md`: builder and env setup, retry and idempotency
  rules, pagination loops, Functions examples.
- `references/ERROR_HANDLING.md`: `FrontalError` and `ApiError`, status mapping,
  and matching patterns.
- `assets/Cargo.toml`: consumer crate template.
