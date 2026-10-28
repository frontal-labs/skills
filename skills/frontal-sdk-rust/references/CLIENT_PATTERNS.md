# Client patterns

## Two layers

- `Frontal` has raw verb methods (`get`, `post`, `put`, `patch`, `delete`,
  `get_bytes`, `paginate`, and so on). They take any path that passes
  `EndpointPath` validation, which rejects absolute URLs, `..`, `?`, `#`,
  backslashes, and control characters. They do not check the endpoint inventory.
- Service handles (`client.agents()`, `client.functions()`, and so on) expose
  the same verbs. Each call first checks the service, method, path template, and
  required query keys against `contracts/sdk-endpoints.json`. Unknown routes
  return `FrontalError::InvalidPath` with no network call.

Prefer the service handle. Use the raw `Frontal` methods only for routes the
inventory does not list.

## Construction

```rust
use frontal::{ClientBuilder, Frontal, Result};

fn from_env() -> Result<Frontal> {
    // Reads FRONTAL_API_KEY, FRONTAL_API_URL, FRONTAL_TIMEOUT, FRONTAL_ENV, FRONTAL_DEBUG.
    Frontal::from_env()
}

fn from_env_then_override() -> Result<Frontal> {
    ClientBuilder::from_env()?
        .timeout(std::time::Duration::from_secs(5))
        .build()
}
```

- `Frontal::builder(key)` returns a `ClientBuilder`. Setters: `base_url(&str) ->
  Result<Self>`, `timeout(Duration)`, `retry_policy(RetryPolicy)`,
  `environment(impl Into<String>)`, `debug(bool)`, and `build() ->
  Result<Frontal>`.
- `ClientBuilder::from_env()` returns a builder, so you can override a value
  after reading the environment. `Frontal::from_env()` builds immediately.
- `Frontal` and `ClientBuilder` implement `Debug` with the API key redacted.
  Clones are cheap and share the connection pool.
- Accessors: `base_url()`, `environment()`, `is_debug()`.

## Retries

`RetryPolicy` fields: `max_retries` (extra attempts after the first),
`initial_backoff`, `max_backoff`. Defaults: 2 retries, 200 ms initial, 2 s cap.
Backoff doubles per attempt, capped at `max_backoff`. A `Retry-After` header
(seconds or HTTP date) replaces the computed delay, also capped.

Retried responses are HTTP 408, 425, 429, and 5xx. Retried transport errors are
timeouts and connect failures.

Retry only happens when the operation is retry-safe:

- Yes: GET and HEAD, including `get_bytes`, `get_with_bearer_auth`, and
  `events`.
- Yes: PUT and DELETE (`delete`, `delete_with_query`, `delete_with_body`,
  `delete_empty`).
- Yes, with the same key on every attempt: JSON POST with an idempotency key
  (`post_idempotent`, `post_idempotent_with_query`, `post_empty_idempotent`).
- No: PATCH.
- No: POST without a key (`post`, `post_with_query`, `post_empty`).
- No: `post_bytes`, `post_form`, and `post_form_empty`.

Functions gets 3 retries by default. An explicit `retry_policy` on the client
overrides that for every service. `max_retries` above 10 is rejected at
`build()`.

## Idempotency

```rust
use frontal::{
    models::functions::FunctionInvocationInput, models::functions::FunctionInvocationResult,
    Frontal, Result,
};

async fn invoke_once(
    client: &Frontal,
    input: &FunctionInvocationInput,
    request_key: &str,
) -> Result<FunctionInvocationResult> {
    client
        .functions()
        .post_idempotent("functions/invoke", request_key, input)
        .await
}
```

- The key must identify one logical operation. Reuse it only when retrying that
  same operation. An empty or whitespace key is a configuration error.
- Use this only where the server accepts an `Idempotency-Key` header. The SDK
  does not know which endpoints do.
- Function writes are not auto-retried. The Functions guide says to use
  `post_idempotent` only when the server supports the key.

## Empty and raw bodies

- For endpoints with no response body, use the `*_empty` variants:
  `delete_empty` (Functions `delete_function`, Agents `delete_agent`),
  `post_empty` (Functions `deploy_version`, `cancel_execution`). Decoding an
  empty body as JSON fails with `FrontalError::Decode`.
- Raw bytes: `get_bytes(path)` (for example billing invoice PDFs),
  `post_bytes(path, content_type, body)`.
- Multipart: `post_form(path, form)` and `post_form_empty(path, form)` take a
  `reqwest::multipart::Form`. The crate does not re-export `reqwest`, so add
  `reqwest = { version = "0.12", features = ["multipart"] }` in your own crate,
  matching the crate's reqwest 0.12.

## Pagination

`paginate(path, limit)` (on the handle or on `Frontal`) requests `?limit=` and
`?cursor=`, reads `data` for items and `next_cursor` for the next page, and
returns `Vec<T>`. A missing or empty `next_cursor` ends the walk. A repeated
cursor returns `FrontalError::Pagination`.

Some list endpoints use a different envelope. Loop by hand on them:

```rust
use frontal::{models::functions::FunctionListOptions, Frontal, Result};

async fn all_function_ids(client: &Frontal) -> Result<Vec<String>> {
    let mut ids = Vec::new();
    let mut cursor: Option<String> = None;
    loop {
        let page = client
            .functions()
            .list_functions(&FunctionListOptions {
                cursor: cursor.clone(),
                limit: Some(100),
            })
            .await?;
        ids.extend(page.functions.into_iter().map(|function| function.id));
        if !page.pagination.has_more {
            return Ok(ids);
        }
        cursor = page.pagination.cursor;
    }
}
```

- Functions: `FunctionListResponse` has `functions` and `pagination`, where
  `pagination` is a `FunctionPagination` with `cursor` and `has_more`. Version
  and execution lists use the same pagination shape, under `versions` and
  `executions`.
- Agents: `AgentPage { data, pagination: Option<serde_json::Value> }`. The SDK
  does not type the cursor inside `pagination`, so the cursor key is an open
  question. Check the API before writing an agents loop.

## Polling

```rust
use frontal::{models::agents::AgentExecution, Frontal, Result};
use std::time::Duration;

async fn wait_run(
    client: &Frontal,
    id: &str,
) -> Result<Option<AgentExecution>> {
    let path = format!("agents/runs/{}", frontal::encode_path_segment(id));
    client
        .agents()
        .poll_until(path, 30, Duration::from_secs(2), |run: &AgentExecution| {
            run.completed_at.is_some()
        })
        .await
}
```

Notes: `poll_until` sends a GET and decodes `T` on every attempt. It sleeps
between attempts but not after the last one, and returns `Ok(None)` when
attempts run out. It takes a contract path, not an ID, so encode dynamic
segments. The predicate above uses `completed_at`, an optional timestamp in the
model. `AgentExecution.status` is a plain `String`, and the SDK does not document
its terminal values (see open questions).

## Functions

Definitions, invocations, versions, and executions all live on
`client.functions()`. `FunctionDefinition` requires `name`, `runtime`, and
`entrypoint`. `FunctionRuntime` has `Nodejs20`, `Nodejs22`, and `Python311`.

```rust
use frontal::{
    models::functions::{
        FunctionDefinition, FunctionJsonObject, FunctionResource, FunctionRuntime,
    },
    Frontal, Result,
};

async fn create_hello(client: &Frontal) -> Result<FunctionResource> {
    let mut input_schema = FunctionJsonObject::new();
    input_schema.insert("type".to_string(), serde_json::json!("object"));
    let definition = FunctionDefinition {
        name: "hello-world".to_string(),
        description: None,
        runtime: FunctionRuntime::Nodejs22,
        entrypoint: "index.handler".to_string(),
        source: None,
        input_schema: Some(input_schema),
        output_schema: None,
        dependencies: None,
        env_vars: None,
        secrets: None,
        memory: None,
        timeout: None,
        permissions: None,
    };
    client.functions().create_function(&definition).await
}
```

Other calls, by argument shape:

- `get_function(id)`, `update_function(id, &definition)` (PATCH),
  `delete_function(id)` (returns `()`).
- `list_versions(id, &FunctionListOptions)`, `get_version(id, version: u64)`,
  `publish_version(id, version)`, `deploy_version(id, version)` (returns `()`),
  `deployment_status(id, version)`.
- `invoke(&FunctionInvocationInput)` waits for the result.
  `invoke_async(&input)` returns a `FunctionAsyncInvocationResponse`, which holds
  only an `execution_id`.
- `get_execution(execution_id)`, `get_execution_result(execution_id)`,
  `list_executions(&FunctionExecutionListOptions)`,
  `cancel_execution(execution_id)` (returns `()`).

`FunctionInvocationInput` has `function_id`, `version: Option<u64>`, and
`input: Option<FunctionJsonObject>`. `FunctionJsonObject` is `serde_json::Map<String,
Value>`, so nested keys are kept.

## Raw requests

Raw verb methods on `Frontal` skip the inventory check. Use them only for a route
that the inventory does not list. For every listed route, use the service handle.
Pass query pairs as `&[(&str, &str)]` through the `*_with_query` methods, and
never put `?` in a path string.
