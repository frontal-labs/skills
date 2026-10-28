---
name: frontal-sdk-go
description: Go SDK for the Frontal API, module github.com/frontal-labs/sdk-go/v2 (Go 1.23+). Use the context-first frontal.New client with typed Agents and Functions services, a generic Call and Stream path for the other 15 services (635 inventory-backed operations), cursor pagination, SSE via frontal.Watch, polling, and typed *frontal.APIError values. Use when writing Go code that calls the Frontal API. Do not use for other languages or for non-Frontal APIs.
metadata:
  author: frontal-labs
  version: "2.0.0"
  category: sdk
---

# Frontal SDK (Go)

Context-first Go client for the Frontal API. Every call takes a `context.Context` and returns an error.

## When to Use

- Writing Go (1.23 or later) that calls the Frontal API.
- Using the typed `Agents` or `Functions` clients.
- Calling any other Frontal service through the generic `Call` or `Stream` path.
- Needing cursor pagination, SSE streams, or polling.

## When NOT to Use

- Code in another language. Use `frontal-sdk-typescript`, `frontal-sdk-python`, `frontal-sdk-java`, or `frontal-sdk-rust`.
- Non-Frontal APIs.
- Raw HTTP without the SDK. Use the Frontal OpenAPI spec instead.

## Installation

```bash
go get github.com/frontal-labs/sdk-go/v2@v2.0.0
```

The import path ends in `/v2`. The module has no third-party dependencies and declares `go 1.23`.

## Quick Start

```go
package main

import (
	"context"
	"log"

	frontal "github.com/frontal-labs/sdk-go/v2"
)

func main() {
	ctx := context.Background()

	// Reads FRONTAL_API_KEY (required), FRONTAL_API_URL, FRONTAL_ENV, FRONTAL_DEBUG, FRONTAL_TIMEOUT.
	client, err := frontal.New()
	if err != nil {
		log.Fatal(err)
	}

	health, err := client.Agents.Health(ctx)
	if err != nil {
		log.Fatal(err)
	}
	log.Println("agents:", health.Status)
}
```

## Configuration

`frontal.New(opts ...frontal.Option)` reads the environment first, then applies options. Options win.

| Environment variable | Accepted values | Default |
| --- | --- | --- |
| `FRONTAL_API_KEY` | Frontal API key (`frt_...`) | required |
| `FRONTAL_API_URL` | absolute URL | `https://api.frontal.dev/v1` |
| `FRONTAL_ENV` | `development`, `test`, `production` | `development` |
| `FRONTAL_DEBUG` | `true`, `false`, `1`, `0` | off |
| `FRONTAL_TIMEOUT` | Go duration (`45s`) or integer milliseconds | 30s |

Options: `WithAPIKey`, `WithBaseURL`, `WithTimeout` (30s), `WithMaxRetries` (3), `WithRetryDelay` (1s), `WithHTTPClient`, `WithUserAgent` (`frontal-go/2.0.0`), `WithLogger`, `WithDebug`, `WithEnvironment`, `WithMaxResponseBytes` (32 MiB), `WithHeaders`.

`New` returns an error if the key is missing or malformed. The key must start with `frt_` (or `fr_typed`) and be 9 to 128 characters with no whitespace. Go does not read `.env` files. See `references/CLIENT_PATTERNS.md` for the full option table and retry rules.

## Services

| Accessor | Service | Access |
| --- | --- | --- |
| `client.Agents` | `agents` | typed methods and builder, plus generic |
| `client.Functions` | `functions` | typed methods and builder, plus generic |
| `client.AI` | `ai` | generic |
| `client.Audit`, `Auth`, `Billing`, `Blob`, `Connectors`, `Data`, `Governance`, `Lineage`, `Observability`, `Ontology`, `Pipelines`, `Schedules`, `Webhooks`, `Workflows` | same name, lowercase | generic |

Generic access is `Endpoints()`, `Endpoint(method, path)`, `Call`, and `Stream` on each service client. Lookup is exact: method is case-sensitive and the path is the template, for example `"/agents/{param}"`. Positional `PathParams` fill the `{param}` placeholders.

Typed `Agents` methods include `Create`, `List`, `Get`, `Update`, `Delete`, `StartRun`, `GetRun`, `ListRuns`, `GetConversation`, `ListVersions`, `Rollback`, and `Health`.

Typed `Functions` methods include `Create`, `Update`, `Invoke`, `InvokeAsync`, `GetExecution`, `ListExecutions`, and `CancelExecution`. Use `client.Functions.Define(name)` for a builder.

Root helpers: `client.Call` and `client.Stream` (route lookup ignores method case), `client.Request` for a direct JSON call to a path, `frontal.BindOperation[Req, Resp]` for your own types, `frontal.FetchPage`, `frontal.Watch`, `frontal.PollUntil`, `frontal.F` and `frontal.Null` for request fields, and `frontal.DecodeWithExtraFields`.

```go
created, err := client.Functions.Create(ctx, functions.FunctionDefinition{
	Name:       "hello",
	Runtime:    functions.RuntimeNodeJS22,
	Entrypoint: "index.handler",
})
result, err := client.Functions.Invoke(ctx, functions.FunctionInvocationInput{
	FunctionID: created.ID,
	Input:      map[string]any{"name": "Ada"},
})
```

Runtimes: `RuntimeNodeJS20`, `RuntimeNodeJS22`, `RuntimePython311`.

## Errors

Non-2xx responses return `*frontal.APIError`. Match it with `errors.As`:

```go
var apiErr *frontal.APIError
if errors.As(err, &apiErr) {
	log.Printf("status=%d code=%s request_id=%s", apiErr.StatusCode, apiErr.Code, apiErr.RequestID)
}
```

Helpers: `IsAuthError` (401, 403), `IsValidationError` (400, 422), `IsRateLimitError` (429), `IsServerError` (5xx), `IsNetworkError`. Unknown routes match `errors.Is(err, frontal.ErrUnknownEndpoint)`. `APIError.Retryable` is derived from the status code. See `references/ERROR_HANDLING.md`.

## Retries

The SDK retries GET and HEAD only, on 408, 425, 429, 500, 502, 503, 504, and on network timeouts. POST, PUT, PATCH, and DELETE are never retried, and no `Idempotency-Key` header is sent. Callers that retry writes must handle duplicates themselves.

## Pagination and streaming

Typed list methods take `Cursor` and `Limit` options and return `Pagination{Cursor, HasMore}`:

```go
opts := agents.ListOptions{Limit: 50}
for {
	page, err := client.Agents.List(ctx, opts)
	if err != nil {
		return err
	}
	// use page.Data
	if !page.Pagination.HasMore {
		break
	}
	opts.Cursor = page.Pagination.Cursor
}
```

`frontal.FetchPage[T]` does the same for generic collections. `frontal.Watch[T]` opens an SSE stream and returns a channel. Cancel the context to stop it. Endpoints with method `STREAM`: `agents` run stream, `observability` log stream, and `pipelines` run stream. `frontal.PollUntil` polls at a fixed interval until a condition holds. Details are in `references/CLIENT_PATTERNS.md`.

## Testing

Point the client at an `httptest.Server`. Use `WithBaseURL(server.URL + "/v1")` so paths resolve the same way as in production.

```go
server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
	fmt.Fprint(w, `{"status":"ok"}`)
}))
defer server.Close()

client, err := frontal.New(
	frontal.WithAPIKey("frt_example_key"),
	frontal.WithBaseURL(server.URL+"/v1"),
	frontal.WithHTTPClient(server.Client()),
)
```

Keep tests independent of live keys. Upstream runs `go test -race ./...` and `go test -run '^Example' ./...`.

## References

- `references/API_ENDPOINTS.md`: all 635 operations by service, with methods and path templates.
- `references/CLIENT_PATTERNS.md`: options, env vars, headers, retries, request shape, typed services, streams, pagination, polling.
- `references/ERROR_HANDLING.md`: `APIError` fields, decoding rules, helpers, and retryability.
- `assets/go.mod`: consumer module template.
