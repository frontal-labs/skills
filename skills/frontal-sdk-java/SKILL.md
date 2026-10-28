---
name: frontal-sdk-java
description: Java 17+ client for the Frontal API, published as dev.frontal:frontal-sdk (Maven/Gradle). Provides a Frontal root client with named service accessors (agents, workflows, data, ontology, auth, billing, functions and more), typed exceptions with request IDs, cursor pagination, SSE streams, and retries for safe GET requests, built on OkHttp and Jackson. Use when writing Java or Kotlin code on the JVM that calls the Frontal API. Not for TypeScript, Python, Go, or Rust code, and not for non-Frontal APIs.
metadata:
  author: frontal-labs
  version: "2.0.0"
  category: sdk
---

# Frontal SDK (Java)

Hand-written Java SDK. All production types live in the single package `dev.frontal.sdk`. Modules: `core` (transport), `services` (resource clients), `sdk` (the `Frontal` facade, which is the published `frontal-sdk` artifact).

## When to Use

- Calling the Frontal API from Java 17 or 21 code, including Spring Boot services and Kotlin on the JVM.
- You need typed failures with request IDs, cursor pagination, server-sent event streams, or polling until an agent run or workflow execution finishes.
- You want one shared, configured HTTP transport across many service clients.

## When NOT to Use

- TypeScript, Python, Go, or Rust code (use the matching `frontal-sdk-*` skill).
- Non-Frontal APIs.
- Code that must avoid the OkHttp and Jackson dependencies.

## Installation

Requires JDK 17 or newer (CI runs on 17 and 21). Coordinates: `dev.frontal:frontal-sdk`, version `2.0.0`.

Gradle Kotlin DSL:

```kotlin
dependencies {
    implementation("dev.frontal:frontal-sdk:2.0.0")
}
```

Maven:

```xml
<dependency>
  <groupId>dev.frontal</groupId>
  <artifactId>frontal-sdk</artifactId>
  <version>2.0.0</version>
</dependency>
```

Transitive dependencies: OkHttp 5.5.0, Jackson Databind 2.22.3, JSpecify 1.0.1.

The `CHANGELOG.md` lists the typed Functions client under "Unreleased", so it may be absent from the 2.0.0 artifact. Confirm `Frontal.functions()` exists in the version you resolve before relying on it.

## Quick Start

Set `FRONTAL_API_KEY`, then:

```java
import com.fasterxml.jackson.databind.JsonNode;
import dev.frontal.sdk.Frontal;

public final class Quickstart {
    public static void main(String[] args) throws Exception {
        try (Frontal frontal = Frontal.fromEnvironment()) {
            JsonNode agent = frontal.agents().get("agt_123", JsonNode.class);
            System.out.println(agent.path("name").asText());
        }
    }
}
```

Production base URL: `https://api.frontal.dev/v1`. `Frontal` is `AutoCloseable`; `close()` declares no checked exception.

## Configuration

Build with `Frontal.builder()` (or `new Frontal(ClientConfig)` for the immutable `ClientConfig.builder()`):

```java
Frontal frontal = Frontal.builder()
        .apiKey(System.getenv("FRONTAL_API_KEY"))
        .requestTimeout(Duration.ofSeconds(10))
        .maxRetries(3)
        .header("X-Team", "payments")
        .build();
```

| Builder method | Default | Notes |
| --- | --- | --- |
| `apiKey(String)` | none | Sent as `Authorization: Bearer <key>`. If unset, no Authorization header is sent. |
| `apiBaseUrl(String or URI)` | `https://api.frontal.dev/v1` | Must be absolute http(s), no user info, query, or fragment. Trailing slashes are removed. |
| `aiBaseUrl(String or URI)` | `https://ai.frontal.dev` | Used only by `ai()`. |
| `environment(String)` | `development` | Lowercased; sent as `X-Frontal-Environment`. |
| `debug(boolean)` | `false` | Prints method, path, and request ID to stderr per request. |
| `connectTimeout(Duration)` | 10 s | Must be positive. |
| `requestTimeout(Duration)` | 30 s | Per attempt (OkHttp call timeout). Disabled for SSE. |
| `maxRetries(int)` | 2 | 0 to 10. Applies to safe GET requests only. |
| `maxResponseBytes(long)` | 64 MiB | Limit for buffered successful responses. |
| `maxErrorBodyBytes(int)` | 16 KiB | Raw error body retained for diagnostics. |
| `userAgent(String)` | `frontal-java-sdk/2.0.0` | |
| `header(name, value)` / `headers(map)` | none | Custom headers; names must be valid tokens, unique ignoring case. |
| `objectMapper(ObjectMapper)` | SNAKE_CASE mapper | Copied at build time. |

Functions GET requests default to 3 retries. An explicit `maxRetries(...)` overrides this for every service.

Environment variables read by `Frontal.fromEnvironment()`:

| Variable | Effect |
| --- | --- |
| `FRONTAL_API_KEY` | Required. Missing or blank throws `IllegalStateException`. |
| `FRONTAL_API_URL` | Overrides the API base URL. |
| `FRONTAL_AI_URL` | Overrides the AI base URL. |
| `FRONTAL_ENV` | Sets the environment label. |
| `FRONTAL_DEBUG` | `Boolean.parseBoolean` value. |
| `FRONTAL_TIMEOUT` | Request timeout in milliseconds. Invalid values throw `IllegalStateException`. |

Java does not load `.env` files. Set variables in the process environment.

## Services overview

Each accessor returns a client for one route group. Nested resources follow the path, for example `frontal.agents().runs()`. Full routes are in `references/API_ENDPOINTS.md`.

| Accessor | Covers | Catalog routes |
| --- | --- | --- |
| `agents()` | Agents, versions, runs, action runs | 13 |
| `ai()` | Chat, completions, models (uses `aiBaseUrl`) | 9 |
| `audit()` | Audit events | 4 |
| `auth()` | Accounts, MFA, users, API keys, sessions | 66 |
| `billing()` | Plans, prices, subscriptions, wallets, invoices | 23 |
| `blob()` | Object storage and signed URLs | 8 |
| `connectors()` | Catalog, installations, sync runs | 12 |
| `connectionTests()` | Connection test status | 1 |
| `data()` | Ingest, query, datasets, pipelines, quality, serving | 151 |
| `events()` | Raw events, usage, reprocessing, benchmark | 17 |
| `functions()` | User-defined functions (not in the route catalog) | n/a |
| `governance()` | Policies, roles, permissions, compliance | 24 |
| `invocations()` | Invocations | 1 |
| `lineage()` | Lineage nodes and edges | 7 |
| `observability()` | Logs, metrics, traces, alerts, incidents | 31 |
| `ontology()` | Object types, objects, relationships, rules | 171 |
| `pipelines()` | Pipelines and pipeline runs | 11 |
| `providers()` | Provider lookup by slug | 1 |
| `react()` | No routes in the catalog | 0 |
| `schedules()` | Schedules, cron, workflows | 10 |
| `webhooks()` | Webhook deliveries and stats | 10 |
| `webhookEndpoints()` | Webhook endpoint deliveries | 7 |
| `workflows()` | Workflow definitions, executions, tasks, approvals | 30 |

`Frontal.service(ApiService)` returns the generic `ServiceClient` for any of the 23 `ApiService` values. The catalog defines 11 `/integrations` routes that have no Java accessor.

## Errors

All HTTP and transport failures extend `FrontalException`, which extends `IOException` and is sealed. Subclasses: `AuthException` (401, 403), `ValidationException` (400, 422), `RateLimitException` (429), `ServerException` (5xx), `ApiException` (other 4xx), `NetworkException` (no response). Fields: `code()`, `requestId()`, `statusCode()`, `retryable()`, `responseBody()`, `responseBodyTruncated()`. `RateLimitException.retryAfter()` returns a `Duration`.

```java
try {
    JsonNode agent = frontal.agents().get("agt_123", JsonNode.class);
} catch (RateLimitException e) {
    System.err.println("Retry after " + e.retryAfter() + "; request " + e.requestId());
} catch (FrontalException e) {
    System.err.println(e.code() + " (" + e.statusCode() + ") request " + e.requestId());
}
```

`responseBody()` is raw and may contain sensitive data. Do not log it by default. Details in `references/ERROR_HANDLING.md`.

## Pagination and streaming

- Pagination: `listPages(QueryParams, Class<T>)` exists on `agents()` and `workflows()` only. It returns `PageResult<T>` with `data()`, `pagination()`, `nextPage()`, `all()`, and `Iterable<T>`. Iteration loads pages lazily.
- Other list operations return the raw response as `T` (often `JsonNode`) and do not paginate for you.
- Streams: `agents().runs().stream(runId)` returns `Flow.Publisher<String>`. `agents().runs().streamBlocking(runId)` returns an `SseEventIterator` that must be closed. Each item is one SSE `data:` payload.
- Polling: `agents().waitForCompletion(runId, interval, timeout)` and `workflows().waitForCompletion(executionId, interval, timeout)` throw `TimeoutException` when the deadline passes.

```java
PageResult<JsonNode> page = frontal.agents().listPages(QueryParams.empty(), JsonNode.class);
for (JsonNode agent : page) {
    System.out.println(agent.path("id").asText());
}
```

## Testing

The SDK's own tests use `okhttp3:mockwebserver:5.5.0`. Point the client at a mock:

```java
try (MockWebServer mock = new MockWebServer()) {
    mock.start();
    mock.enqueue(new MockResponse().setBody("{\"id\":\"agt_123\",\"name\":\"triage\"}"));
    try (Frontal frontal = Frontal.builder()
            .apiKey("frt_test_key")
            .apiBaseUrl(mock.url("/v1").toString())
            .build()) {
        JsonNode agent = frontal.agents().get("agt_123", JsonNode.class);
    }
}
```

Use `maxRetries(0)` in tests that assert on request counts.

## References

- `references/API_ENDPOINTS.md`: accessors, nested resources, Functions routes, known gaps
- `references/CLIENT_PATTERNS.md`: method naming, query params, responses, streams, custom auth, lifecycle
- `references/ERROR_HANDLING.md`: exception mapping, retry rules, diagnostics
