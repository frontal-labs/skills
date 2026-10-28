# Client Patterns (Java SDK)

## Construction

- `Frontal.fromEnvironment()`: reads `FRONTAL_API_KEY` and the optional `FRONTAL_*` variables (see SKILL.md).
- `Frontal.builder()...build()`: explicit configuration. Also accepts `.objectMapper(...)`, `.header(...)`, and `.debug(true)`.
- `new Frontal(String apiKey)`: shorthand with default settings.
- `new Frontal(ClientConfig config)`: build the immutable `ClientConfig` with `ClientConfig.builder()`. `ClientConfig.fromEnvironment()` is also available.
- `new Frontal(ClientConfig, AuthProvider)`: replace bearer auth. `AuthProvider` is a functional interface, `void apply(okhttp3.Request.Builder request)`.
- `new Frontal(ApiClient)`: advanced. Supply your own `OkHttpClient` and `ObjectMapper` through `ApiClient(ClientConfig, OkHttpClient, ObjectMapper)`. The SDK does not shut down a client you supplied when `close()` runs.

`Frontal` implements `AutoCloseable`. Close it when the application no longer needs the connection pool, typically with try-with-resources. SSE streams hold their connection until closed.

## Method naming

Generated resource methods follow the route shape. Each comes in several overloads:

- `Class<T>` or `TypeReference<T>` response types (use `TypeReference` for generic collections).
- With or without `QueryParams` (the no-query overload passes `QueryParams.empty()`).

Return type is `@Nullable T`. A null return means the response body was empty. Methods declare `throws IOException, InterruptedException`.

```java
JsonNode agent = frontal.agents().get("agt_123", JsonNode.class);
JsonNode updated = frontal.agents().update("agt_123", body, JsonNode.class);
JsonNode created = frontal.agents().create(body, JsonNode.class);
JsonNode gone = frontal.agents().delete("agt_123", JsonNode.class);
```

`body` is `@Nullable JsonNode`. Build it with `frontal.apiClient().objectMapper().createObjectNode()` or `valueToTree(...)`.

Functions methods are not generic. They take and return typed models (`FunctionDefinition`, `FunctionResource`, and so on). `delete` returns `void`.

## Query parameters

```java
QueryParams query = QueryParams.builder()
        .add("limit", 50)
        .add("status", "failed")
        .addAll("tag", List.of("a", "b"))   // repeated name=value pairs
        .build();
JsonNode page = frontal.agents().list(query, JsonNode.class);
```

- Overloads: `add(String, String)`, `add(String, Number)`, `add(String, boolean)`, `addAll(String, Iterable<String>)`.
- `QueryParams.of(name, value)` and `QueryParams.empty()` are shortcuts.
- Names are sent verbatim. Use `"agent_id"` when the API expects that name.
- Values are URL-encoded. Blank names are rejected.

## Request bodies and wire names

- Bodies are `JsonNode`. Named methods do not take typed request models except for Functions (`FunctionDefinition`) and invocations (`FunctionInvocationInput`).
- The default mapper uses `PropertyNamingStrategies.SNAKE_CASE` for Java beans. Records and classes with `@JsonProperty` keep their explicit names.
- `FunctionDefinition` uses explicit camelCase names (`inputSchema`, `envVars`) through its annotations.
- `builder.objectMapper(mapper)` copies the mapper. Later changes to your instance do not affect the client.

## Pagination

Only `agents().listPages(query, itemType)` and `workflows().listPages(query, itemType)` return `PageResult<T>`:

```java
PageResult<JsonNode> page = frontal.agents().listPages(QueryParams.empty(), JsonNode.class);
List<JsonNode> everything = page.all();                 // loads every page
for (JsonNode item : page) { /* lazy, page by page */ }  // Iterable
PageResult<JsonNode> next = page.nextPage();            // null when no more pages
```

- The cursor is sent as the `cursor` query parameter.
- `nextPage()` throws `IOException` when the cursor fails to advance. `all()` throws `IOException` on a repeated cursor.
- Iteration (`Iterable`) throws `IllegalStateException` on a repeated cursor, `UncheckedIOException` on I/O failure, and `IllegalStateException` when interrupted.
- `Pagination` exposes `cursor()`, `hasMore()`, and `total()` (nullable).

## Responses and downloads

- `execute(...)` returns `ApiResponse` with `statusCode()`, `headers()`, `body()` (copied bytes), `bodyText()`, and `requestId()`.
- `requestBytes(...)` buffers the body up to `maxResponseBytes` (64 MiB default). Use it for small binary responses.
- `streamBody(endpoint, pathParams, query, body)` returns an `ApiStream`. Read `body()` and close the stream (try-with-resources). Use it for large downloads. It retries safe GET calls before the response is returned.
- `requestForm(...)` and `executeForm(...)` send multipart form data. `requestRaw(...)` and `executeRaw(...)` send an opaque `byte[]` body. Both live on `ApiClient` and on each `ServiceClient`.

These low-level methods take an `Endpoint` (`new Endpoint(ApiService, HttpMethod, path)`). Use them only for routes without a named method. Check `HttpMethod` for the kind: `STREAM`, `GETRAW`, `POSTRAW`, and `POSTFORMDATA` have restrictions.

## Streams (SSE)

| Method | Returns | Close or cancel |
| --- | --- | --- |
| `runs().stream(runId[, query])` | `Flow.Publisher<String>` | Cancel the subscription. |
| `runs().streamBlocking(runId[, query])` | `SseEventIterator` | Call `close()` (declares `IOException`). |
| `observability().logs().stream(...)` / `streamBlocking(...)` | Same shapes | Same. |

`SseEventIterator` yields the joined `data:` lines of each event. It skips comment lines and ignores `event:` and `id:` fields. The publisher is backpressure-aware. SSE connections disable the read and call timeouts, so close them when you are done.

```java
try (SseEventIterator events = frontal.agents().runs().streamBlocking("run_123")) {
    while (events.hasNext()) {
        System.out.println(events.next());
    }
}
```

## Polling

```java
JsonNode finished = frontal.agents().waitForCompletion("run_123", Duration.ofSeconds(2), Duration.ofMinutes(5));
```

- Same method on `workflows()` takes an execution ID.
- Terminal statuses, compared case-insensitively: `completed`, `succeeded`, `failed`, `cancelled`, `rejected`.
- Throws `TimeoutException` (checked) when the timeout expires.
- `interval` and `timeout` must be positive.

## Retries and timeouts

- Timeouts: connect (10 s), request (30 s, applied per attempt as OkHttp's call and read timeouts). SSE disables them.
- Retries: GET only, up to `maxRetries` extra attempts. Writes (POST, PUT, PATCH, DELETE) run once. See `ERROR_HANDLING.md` for the status codes.
- Backoff: 100 ms doubling per attempt, capped at 5 s. A `Retry-After` header overrides the delay, capped at 5 s.

## Diagnostics

- `debug(true)` prints `Frontal SDK <METHOD> <path> requestId=<id>` to stderr for each attempt. It does not print bodies.
- Every request sends `X-Request-Id` (a UUID generated per call). The server's `x-request-id` response header replaces it in exceptions when present.
- `ClientConfig.headers()` are added to every request. Header names are validated and must not repeat ignoring case.

## Custom auth

```java
// sign() is application code, not part of the SDK.
AuthProvider signer = request -> request.header("X-Signature", sign());
try (Frontal frontal = new Frontal(ClientConfig.builder().apiBaseUrl("https://api.frontal.dev/v1").build(), signer)) {
    ...
}
```

With a custom provider, the SDK does not add `Authorization` on its own. Your provider controls every auth header.

## Anti-patterns

- Do not log `responseBody()` by default. It can include sensitive data.
- Do not rely on automatic retries for writes. Add your own idempotency handling if the API requires it.
- Do not treat the empty-body null return as an error without checking the route.
- Do not leave SSE iterators or publishers open. They hold a connection and disable timeouts.
