# Client Patterns

Source: `client.go`, `service.go`, `field.go`, `extra_fields.go`, `internal/core/client.go`, `internal/headers`, `internal/utils`. SDK version 2.0.0.

## Construction

`frontal.New(opts ...frontal.Option) (*frontal.Client, error)` applies defaults, then `FRONTAL_*` environment variables, then the options passed in. Options win over the environment.

- `New` returns an error when the API key is missing or malformed. The key is checked locally: 9 to 128 characters, no whitespace, prefix `frt_` (letters, digits, `_`, `-`) or `fr_typed` (letters, digits, `_`).
- Create one client and reuse it. The client is safe for concurrent use.
- `client.CloseIdleConnections()` closes idle connections.
- Go does not read `.env` files.

## Options and defaults

| Option | Default | Notes |
| --- | --- | --- |
| `WithAPIKey(key)` | `FRONTAL_API_KEY` | Validated when the client is built. |
| `WithBaseURL(url)` | `https://api.frontal.dev/v1` | Absolute `http` or `https` URL. No userinfo, query, or fragment. |
| `WithTimeout(d)` | 30s | Client-wide timeout for non-stream requests. Must be positive. |
| `WithMaxRetries(n)` | 3 | 0 to 10. Applies only to GET and HEAD. |
| `WithRetryDelay(d)` | 1s | 0 to 30s. Base of exponential backoff. |
| `WithHTTPClient(c)` | SDK-owned client | Transport and redirect policy are kept. Redirects outside the API origin are blocked. |
| `WithUserAgent(s)` | `frontal-go/2.0.0` | No newlines. |
| `WithLogger(l)` | `slog.Default()` | Used only when debug logging is on. |
| `WithDebug(bool)` | off | Logs method, path, status, and request ID. Never bodies or credentials. |
| `WithEnvironment(s)` | `development` | One of `development`, `test`, `production`. Sent as `X-Frontal-Environment`. |
| `WithMaxResponseBytes(n)` | 32 MiB | Limit for decoded JSON responses. |
| `WithHeaders(h)` | none | Added to every request. `Authorization` and `Host` are rejected. |

Environment variables read by `frontal.New`:

| Variable | Accepted values | Default |
| --- | --- | --- |
| `FRONTAL_API_KEY` | Frontal key | none (required) |
| `FRONTAL_API_URL` | absolute URL | `https://api.frontal.dev/v1` |
| `FRONTAL_ENV` | `development`, `test`, `production` | `development` |
| `FRONTAL_DEBUG` | `true`, `false`, `1`, `0` | off |
| `FRONTAL_TIMEOUT` | Go duration (`45s`) or integer milliseconds (`45000`) | 30s |

Invalid values in `FRONTAL_ENV`, `FRONTAL_DEBUG`, or `FRONTAL_TIMEOUT` make `New` return an error.

## Headers sent on every request

- `Authorization: Bearer <key>`
- `X-Request-ID`: a UUID generated per call. Reused across retries of the same call. Use `Headers` on a request to supply your own.
- `X-Frontal-Environment` and `X-Frontal-Core: go@2.0.0`
- `User-Agent` (unless overridden) and `Accept: application/json`. Streams send `Accept: text/event-stream` unless the caller set `Accept`.

Redirects are followed only when they stay on the same scheme and host, up to 10 hops.

## Retries and timeouts

- Attempts for GET and HEAD: `1 + WithMaxRetries`.
- Retried statuses: 408, 425, 429, 500, 502, 503, 504. Network errors are retried only when they are timeouts.
- Backoff: `WithRetryDelay * 2^attempt`, capped at 2s. A `Retry-After` header (seconds or HTTP date) overrides it, capped at 30s.
- POST, PUT, PATCH, and DELETE are never retried by the SDK. The SDK sends no `Idempotency-Key` header. A caller who retries a write must decide how to avoid duplicates. Whether the API accepts an idempotency header is not documented in this repo.
- Non-stream requests use the client-wide timeout. Streams have no client timeout; cancel the context to stop them.

## Request shape

Every service method takes a `Request`:

```go
type Request struct {
    Endpoint   Endpoint   // service-level: {Method, Path}; root-level: {Service, Method, Path}
    PathParams []string   // fills {param} placeholders in order
    Query      url.Values // appended to the URL
    Headers    http.Header
    Body       any        // JSON-encoded unless the method is POSTRAW or POSTFORMDATA
}
```

Path parameters are escaped as single path segments. An empty value or a count mismatch returns an error before the request is sent.

## Calling any inventory endpoint

Service-level lookup is exact: method is case-sensitive (`"GET"`) and the path is the template string, including `{param}`.

```go
endpoint, ok := client.Workflows.Endpoint(http.MethodGet, "/workflows")
if !ok {
    return frontal.ErrUnknownEndpoint
}
var out map[string]any
err := client.Workflows.Call(ctx, workflows.Request{
    Endpoint: endpoint,
    Query:    url.Values{"status": {"active"}},
}, &out)
```

Root-level `client.Call` takes `frontal.Request` with `frontal.Endpoint{Service, Method, Path}`. Its lookup ignores method case. An unknown route returns an error that matches `frontal.ErrUnknownEndpoint` with `errors.Is`.

```go
var out map[string]any
err := client.Call(ctx, frontal.Request{
    Endpoint: frontal.Endpoint{Service: "workflows", Method: "GET", Path: "/workflows"},
}, &out)
```

To list a service's routes, call `client.Workflows.Endpoints()`, which returns a copy of that service's inventory. See `references/API_ENDPOINTS.md` for the full list.

## Direct HTTP

- `client.Request(ctx, method, path, body, out)`: JSON request to a path relative to the base URL. A leading `/v1/` is accepted when the base URL ends in `/v1`. GET and HEAD are retried.
- `client.NewRequest(ctx, method, path, body)` plus `client.Do(ctx, req)`: raw `*http.Request`. The caller owns and must close the response body. `Do` rejects URLs outside the configured origin with `ErrForeignRequest`.

## Typed agents and functions

These are the only services with typed methods. All other services use the generic path above.

Agents (`client.Agents`):

```go
name := "triage-v2"
agent, err := client.Agents.Update(ctx, id, agents.UpdateDefinition{Name: &name})

run, err := client.Agents.StartRun(ctx, agentID, "ticket.created", map[string]any{"ticketId": "t_1"})
run, err = client.Agents.GetRun(ctx, run.ID)
```

Other typed agent methods: `Create`, `List`, `Get`, `Delete`, `Rollback`, `Health`, `ListRuns`, `GetConversation`, `ListVersions`. Builder: `client.Agents.Define(name)` with `Description`, `Trigger`, `Permissions`, `WithConfidence`, `WithMemory`, `WithRetry`, `WithTimeout`, `WithRateLimit`, `WithTags`, then `Create(ctx)` or `Build()`.

Functions (`client.Functions`):

```go
fn, err := client.Functions.Define("hello").
    Runtime(functions.RuntimeNodeJS22).
    Entrypoint("index.handler").
    Create(ctx)
```

Runtimes: `RuntimeNodeJS20`, `RuntimeNodeJS22`, `RuntimePython311`. `Functions.Update` sends PATCH with a complete `FunctionDefinition` and creates a new version. Other typed methods: `List`, `Get`, `Delete`, `ListVersions`, `GetVersion`, `PublishVersion`, `DeployVersion`, `GetDeploymentStatus`, `Invoke`, `InvokeAsync`, `GetExecution`, `GetExecutionResult`, `ListExecutions`, `CancelExecution`.

Client-side validation runs before the request for required IDs, positive versions, a supported runtime, a non-empty entrypoint, and non-negative memory and timeout.

## Bound operations

`frontal.BindOperation[Req, Resp]` attaches your own types to a known route. The route is checked against the inventory at bind time.

```go
op, err := frontal.BindOperation[chatRequest, chatResponse](client, "ai", http.MethodPost, "/ai/chat/completions")
if err != nil {
    return err
}
resp, err := op.Call(ctx, frontal.TypedRequest[chatRequest]{Body: &chatRequest{Model: "example-model"}})
```

`TypedRequest.Body` is a pointer. `frontal.CallJSON[T](ctx, client, request)` is the function form for a `frontal.Request`.

## Request fields: omitted, explicit, null

`frontal.Field[T]` is an interface. Create values with `frontal.F(v)` (sent) or `frontal.Null[T]()` (sent as `null`).

An unset field is a nil interface. Without `omitempty` it marshals as `null`. Tag optional fields with `omitempty` to omit them:

```go
type Update struct {
    Name  frontal.Field[string] `json:"name,omitempty"`
    Notes frontal.Field[string] `json:"notes,omitempty"`
}
// Update{Name: frontal.F("ada"), Notes: frontal.Null[string]()}
// -> {"name":"ada","notes":null}
```

## Unknown response properties

`frontal.DecodeWithExtraFields(data []byte, target any, knownFields ...string) (frontal.ExtraFields, error)` decodes into `target` and returns the remaining top-level properties as `map[string]json.RawMessage`.

## Streams (SSE)

`frontal.Watch[T](ctx, client, request)` returns `<-chan frontal.StreamItem[T]`. Each item has either `Event` (`ID`, `Name`, `Data T`) or `Err`. The channel closes when the response ends or the context is cancelled.

```go
items, err := frontal.Watch[json.RawMessage](ctx, client, frontal.Request{
    Endpoint:   frontal.Endpoint{Service: "agents", Method: "STREAM", Path: "/agents/runs/{param}/stream"},
    PathParams: []string{runID},
})
if err != nil {
    return err
}
for item := range items {
    if item.Err != nil {
        return item.Err
    }
    handle(item.Event.ID, item.Event.Name, item.Event.Data)
}
```

Use `json.RawMessage` or a typed struct for `T`. The SDK does not document the event payload schema for each stream. Data lines must be JSON or decoding fails with an error item.

Endpoints with method `STREAM`: `agents` `/agents/runs/{param}/stream`, `observability` `/observability/logs/stream`, `pipelines` `/data/pipelines/pipeline-runs/{param}`.

The lower-level `client.Stream(ctx, request)` (or a service's `Stream`) returns `*http.Response`. The caller closes the body.

## Pagination

Typed list methods return the cursor in a `pagination` object and take `Cursor` and `Limit` options. Loop until `HasMore` is false:

```go
opts := agents.ListOptions{Status: agents.AgentStatusActive, Limit: 50}
for {
    page, err := client.Agents.List(ctx, opts)
    if err != nil {
        return err
    }
    for _, agent := range page.Data {
        handle(agent)
    }
    if !page.Pagination.HasMore {
        return nil
    }
    opts.Cursor = page.Pagination.Cursor
}
```

`agents.Page` and `agents.ExecutionPage` have `Data` and `Pagination{Cursor, HasMore, Total}`. `functions.List` returns `FunctionListResponse` (`Functions`, `Pagination{Cursor, HasMore}`). `ListExecutions` uses `ExecutionListOptions` with `FunctionID` and `Status` filters.

Generic collections use `frontal.FetchPage[T](ctx, client, request, collectionKey)`. An empty `collectionKey` means `data`. The function reads the cursor from `pagination.cursor`, `pagination.next_cursor`, `pagination.nextPageToken`, or `pagination.next_page_token`, or from top-level `nextPageToken` or `next_page_token`. A top-level `cursor` is not read. `HasMore` comes from `pagination.hasMore` or `pagination.has_more`, or is true when a cursor is present.

```go
page, err := frontal.FetchPage[map[string]string](ctx, client, frontal.Request{
    Endpoint: frontal.Endpoint{Service: "workflows", Method: "GET", Path: "/workflows"},
    Query:    url.Values{"status": {"active"}},
}, "workflows")
```

## Polling

`frontal.PollUntil[T](ctx, interval, fetch, done) (T, error)` calls `fetch` immediately, then every `interval` (must be positive, fixed interval, no backoff) until `done` returns true. On context cancellation it returns the last value it fetched with the context error.

```go
run, err := frontal.PollUntil(ctx, 2*time.Second,
    func(ctx context.Context) (agents.Execution, error) { return client.Agents.GetRun(ctx, runID) },
    func(e agents.Execution) bool {
        return e.Status == agents.ExecutionStatusCompleted || e.Status == agents.ExecutionStatusFailed
    },
)
```

## Testing

Point the client at `httptest.Server`. See the Testing section in SKILL.md.
