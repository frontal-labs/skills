# Testing Patterns

Source: `packages/testing/src/*.ts`, `docs/TESTING.md`, `packages/sdk/README.md`. Tests run with Vitest. `@frontal-labs/testing` has `vitest` as a peer dependency.

## Principle

The mocks replace only `fetch`. Retries, snake/camel transforms, and typed errors run as in production. Test clients use `maxRetries: 0`, `retryDelay: 0`, `timeout: 5000`, and `environment: "test"`.

## Test Client

```ts
import { Frontal } from "@frontal-labs/sdk";
import { createTestClient } from "@frontal-labs/testing";

const { client, mock } = createTestClient(routes);
const f = new Frontal(client);            // Frontal accepts a FrontalClient
```

- `createTestClient(routes?)` returns `{ client: FrontalClient, mock }`. The fake API key is `frt_test-api-key-1234567890`, base URL `https://api.test.frontal.dev/v1`.
- `createTestHttpClient(routes?)` returns `{ http: HttpClient, mock }` for testing a single service class, such as `new AISdk(http)`.
- `createIntegrationHarness(routes?)` returns `{ fetch, requests, createHttp(extraRoutes) }` for several clients on one mock.

## Routes

```ts
interface MockRoute {
  method: string;                        // "GET", "POST", ...
  path: string | RegExp;                 // string: suffix match; "{param}" or ":param" = one segment
  status?: number;                       // default 200; 204 returns no body
  body?: unknown;                        // JSON body, default {}
  headers?: Record<string, string>;
  stream?: SimulateStreamOptions;        // serve SSE instead of body
  handler?: (req: RequestLog) => Response | undefined | Promise<Response | undefined>;
  times?: number;                        // answer at most N times, then fall through
}
```

- Path matching: a string without `{}` or `:` matches when the request pathname ends with it. So `"/agents"` also matches `/v1/agents`. Use a RegExp or an anchored pattern when you need an exact match.
- Routes are tried in array order. The first route that matches the method and path, and still has calls left, answers.
- No match returns 404 with `{ code: "NOT_FOUND", message: "No mock for <METHOD> <path>", requestId: "mock" }`.
- `RequestLog`: `{ method, url, path, body, headers }`. `body` is parsed JSON with keys converted to camelCase.

Error route:

```ts
{ method: "GET", path: "/agents/{id}", status: 404, body: { code: "NOT_FOUND", message: "no agent", requestId: "req_1" } }
```

Sequenced responses:

```ts
[
  { method: "GET", path: "/agents/runs/run_1", times: 1, body: { id: "run_1", status: "running" } },
  { method: "GET", path: "/agents/runs/run_1", body: { id: "run_1", status: "completed" } },
]
```

## Assertions

`mock` exposes:

- `requests`: every recorded request.
- `expectCalled(method, pathSubstring)`: throws if no request matches. Returns the first match.
- `expectCalledWith(method, pathSubstring, bodyObject)`: checks listed body keys, compared as JSON, using camelCase keys.
- `callCount(method, pathSubstring)`.
- `reset()`: clears requests and per-route counters.

## Response Helpers

- `mockPageResponse(data, { cursor?, hasMore?, total? })` returns `{ data, pagination: { cursor, hasMore, total }, meta }`. Default `cursor` is `null`.
- `mockErrorResponse(code, message)` returns `{ code, message, requestId }`. The third parameter is ignored. Set `status` on the route.
- `catchAllRoute(body?)` and `catchAllRoutes(body?)` answer any path and method with a body that satisfies single-item and paginated readers. Use them for contract-style tests that only check which request was sent.
- `fixtures`: `entity`, `agent`, `workflow`, `pipeline`, `model`, `functionEntry`. Each returns a plain object with a random id and overrides.
- `setupTestEnvironment()` sets `NODE_ENV=test`, `CI=true`, and `FRONTAL_API_KEY`. `cleanupTestEnvironment()` removes them.

## Streams

```ts
import { simulateStream } from "@frontal-labs/testing";

{
  method: "GET",
  path: "/agents/runs/run_1/stream",
  stream: {
    chunks: [{ event: "state", data: { tier: "enterprise" } }, { event: "completed", data: {} }],
    chunkDelayMs: 0,
    done: false,
  },
}
```

`SimulateStreamOptions`: `chunks` (strings are sent as `data:`, objects are JSON-encoded, `{ event, data }` sets the SSE event name), `chunkDelayMs`, `format` (`"sse"` default or `"ndjson"`), `done` (append `data: [DONE]`), `status`, `headers`. `simulateStream(opts)` returns a `Response`. `mockStreamResponse` is also exported.

## AI Model Mocks

`mockLanguageModel({ doGenerate?, doStream?, chunkDelayMs?, modelId? })` returns `{ routes, calls }`. It answers `POST /ai/chat/completions` with OpenAI-compatible bodies, so the real `AISdk` parsing runs.

```ts
import { Frontal } from "@frontal-labs/sdk";
import { createTestClient, mockLanguageModel } from "@frontal-labs/testing";

const model = mockLanguageModel({
  doGenerate: () => ({ text: "Hello from the model" }),
});
const { client } = createTestClient(model.routes);
const f = new Frontal(client);

const { text } = await f.ai.generateText({ model: "claude-sonnet-4-6", prompt: "hi" });
// text === "Hello from the model"
// model.calls holds the captured requests
```

`doStream` returns an array of text chunks and/or `{ toolCall: { id?, toolName, input } }` objects. Default streaming splits `doGenerate().text` into one-word chunks.

`mockDecisionModel(...)` and `mockExtractionModel(...)` mock `/ai/decisions` and `/ai/extractions`. Read their option types in `packages/testing/src/decision.ts` and `extraction.ts` before use.

## Scenarios

`MockFrontal.scenario(name, steps)` (or `createScenario`) builds a sequenced fake for a multi-step flow:

```ts
import { Frontal } from "@frontal-labs/sdk";
import { MockFrontal } from "@frontal-labs/testing";

const s = MockFrontal.scenario("ticket-flow", [
  { on: "agents.message", return: { id: "run_1", status: "running" } },
  { on: "GET /agents/runs/{id}", return: { id: "run_1", status: "completed" } },
]);

const f = new Frontal(s.client);
// ... exercise the code under test ...
s.assertAllHit(); // throws if any step was not reached
```

- `on` is a scenario alias (see `scenarioAliases` in `packages/testing/src/scenario.ts`, for example `ai.generateText` maps to `POST /ai/chat/completions`) or an explicit `"METHOD /path"`.
- Step fields: `return`, `status`, `stream`, `headers`, `times`.
- `s.remaining()` lists unreached steps. `s.mock` gives the same assertions as the test client.

Caveat: the `docs/TESTING.md` example calls `agents.watch` and `workflows.approvals.approve` as scenario aliases. Those aliases are not in the `scenarioAliases` list I read. Use explicit `"METHOD /path"` form for them.

## Example Test (AI call)

```ts
import { describe, expect, it } from "vitest";
import { AISdk } from "@frontal-labs/ai";
import { createTestHttpClient, mockLanguageModel } from "@frontal-labs/testing";

describe("AISdk", () => {
  it("returns model text", async () => {
    const model = mockLanguageModel({ doGenerate: () => ({ text: "ok" }) });
    const { http, mock } = createTestHttpClient(model.routes);
    const ai = new AISdk(http);

    const result = await ai.generateText({ model: "claude-sonnet-4-6", prompt: "hi" });

    expect(result.text).toBe("ok");
    mock.expectCalled("POST", "/ai/chat/completions");
  });
});
```
