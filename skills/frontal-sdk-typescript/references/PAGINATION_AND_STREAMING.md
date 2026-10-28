# Pagination, Streaming, and Polling

Source: `packages/core/src/pagination.ts`, `packages/core/src/types.ts`, `packages/core/src/stream.ts`, `packages/core/src/polling.ts`, `packages/ai/src/sdk.ts`, `packages/agents/src/sdk.ts`.

## Cursor Pages

List methods that paginate return `PageResult<T>`, built with `createPageResult`:

```ts
interface PageResult<T> {
  data: T[];
  meta?: ResponseMeta;
  pagination: { cursor: string; hasMore: boolean; total?: number; limit?: number; offset?: number };
  nextPage(): Promise<PageResult<T> | null>; // null when hasMore is false
  all(): Promise<T[]>;                       // walks every page
  [Symbol.asyncIterator](): AsyncIterator<T>; // walks every page lazily
}
```

Usage:

```ts
const page = await f.agents.list({ status: "active", limit: 50 });

for await (const agent of page) {
  // one item at a time; fetches the next page when needed
}

const all = await f.agents.list().then((p) => p.all());
```

- Each list method forwards its options and sets `cursor` on the next call. Pass `limit`, `status`, or other filters on the first call. Do not set `cursor` yourself unless you resume from a saved cursor.
- `nextPage()` shares one in-flight request when called twice.
- Methods that do not return `PageResult` (for example `f.connectors.list()`, `f.observability.dashboards.list()`) return the plain payload. Check the signature.

Verified list methods that return `PageResult`: `f.agents.list`, `agent.runs`, `agent.versions`, and `f.billing.*` namespace lists (`list(opts)` on the shared base). Other services may differ. Check their `sdk.ts`.

## Streams

### Agent runs

`agent.watch(runId, { signal })` is an async iterable of `AgentRunEvent`:

- `{ type: "event", event, data, id? }`: server event. `event` is the SSE event name.
- `{ type: "state", state, id? }`: typed snapshot. Only when the accessor was created with `stateSchema` and the event name matches `stateEvent` (default `"state"`) and parses.
- `{ type: "error", error }`: stream failed. Check `error.retryable`.
- `{ type: "abort" }`: `signal` fired.
- `{ type: "done" }`: always last.

```ts
import { z } from "zod";

const agent = f.agents.use("agt_ticket_triager", {
  stateSchema: z.object({ tier: z.string() }),
});

for await (const e of agent.watch(runId, { signal: controller.signal })) {
  if (e.type === "state") console.log(e.state.tier);
  if (e.type === "error" && e.error.retryable) {
    // reconnect or show a retry prompt
  }
}
```

`zod` is needed in the application for `stateSchema`. Install it as a dependency (`zod@^4`, matching the SDK).

The source notes that the agent run stream is not yet in the published OpenAPI contract (`packages/agents/src/definition.ts`). Override `stateEvent` if a deployment uses a different state event name.

### Generic SSE

| Method | Yields | Throws on failure |
| --- | --- | --- |
| `client.stream(path, params?, opts?)` | `{ type, data, id? }` | yes |
| `client.postStream(path, body?, opts?)` | `{ type, data, id? }` | yes |
| `client.streamParts(path, params?, opts?)` | `StreamPart` | no. Yields `{ type: "error" }` |
| `client.postStreamParts(path, body?, opts?)` | `StreamPart` | no |

`StreamPart`: `{ type: "data", event, data, id? } | { type: "error", error: SdkError } | { type: "abort" } | { type: "done" }`.

The `*Parts` variants always end with `done`. `signal` aborts the read and yields `abort` then `done`.

### Text generation

```ts
const stream = f.ai.streamText({
  model: "claude-sonnet-4-6",
  prompt: "Write a haiku about queues.",
  signal: controller.signal,
});

for await (const chunk of stream.textStream) process.stdout.write(chunk);

const usage = await stream.usage;
const finishReason = await stream.finishReason;
```

- `textStream`: `ReadableStream<string>`, text deltas only.
- `fullStream`: `ReadableStream<TextStreamPart>`, including tool-call parts and error parts. Same request as `textStream`, not a second call.
- `usage` and `finishReason`: promises that resolve when the stream ends.
- Callback and control options in `StreamTextOptions`: `signal`, `onChunk`, `onError`, `onAbort`, `streamRetries`. Tool loops (`maxSteps`) are implemented in `generateText` only.

## Polling

`pollUntil(fn, { until, interval?, timeout?, signal?, backoff? })` in core:

- `interval` default 2000 ms.
- `timeout` default 300000 ms. Throws `TimeoutError` with message "Polling timed out after N ms".
- `until(value)` returns true to stop.
- `withTimeout(promise, ms)` rejects with `TimeoutError` when the promise is too slow.

`agent.waitForCompletion(runId, { interval, timeout, signal })` polls `agent.run(runId)` until the status is `completed`, `failed`, or `escalated`.

```ts
const run = await agent.waitForCompletion(runId, { interval: 1000, timeout: 60_000 });
```

## Pitfalls

- Do not call `nextPage()` on a page whose `hasMore` is false. It returns `null`.
- Do not reuse an `AbortController` after it has fired. Create a new one for each stream.
- `watch()` does not reconnect. Use `error.retryable` to decide whether to start a new `watch()` on the same run.
