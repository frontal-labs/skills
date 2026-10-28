# Client patterns

Source: upstream `frontal_sdk/client.py`, `frontal_sdk/core/http.py`,
`frontal_sdk/core/config.py`, `frontal_sdk/resources/ai.py`,
`frontal_sdk/resources/agents.py`, `frontal_sdk/resources/workflows.py`,
`frontal_sdk/resources/functions.py`, `docs/ARCHITECTURE.md`,
`docs/RESOURCES.md`, `docs/FUNCTIONS.md`.

## Constructing clients

```python
from frontal_sdk import AsyncFrontal, Frontal

client = Frontal()                          # reads FRONTAL_API_KEY
client = Frontal(api_key="frt_...")         # explicit key
client = Frontal.from_env()                 # same as Frontal()
async_client = AsyncFrontal()
```

- `Frontal.from_env()` and `AsyncFrontal.from_env()` take no arguments. They
  call the constructor with no arguments.
- The constructor raises `ValueError` when no key is passed and
  `FRONTAL_API_KEY` is unset.
- Both clients are context managers. `Frontal` closes with `close()` or
  `with`. `AsyncFrontal` closes with `aclose()` or `async with`.
- The SDK does not read `.env` files (`docs/GETTING_STARTED.md`).

## Constructor options

Full list in `SKILL.md`. Notes that affect usage:

- `headers`: custom headers. These names are reserved and raise `ValueError`:
  `Authorization`, `X-Request-ID`, `X-Frontal-Environment`.
- `http_client`: an `httpx.Client` (sync) or `httpx.AsyncClient` (async). The
  SDK uses it as given. Its timeout is the one that applies, not the `timeout`
  argument. The caller owns its lifecycle: the SDK does not close it.

```python
import httpx

from frontal_sdk import Frontal

http = httpx.Client(timeout=httpx.Timeout(10.0, connect=2.0))
with Frontal(http_client=http) as client:
    agents = client.agents.list()
http.close()
```

## Sync and async

Both clients expose the same attributes.

- Sync methods return the JSON value directly.
- Async methods are coroutines. Await them.
- Sync streams are iterators (`for`). Async streams are async iterators
  (`async for`).

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

`AsyncAI.stream_text()` returns an `AsyncIterator[TextStreamPart]`. Use
`async for`.

## AI helpers

`client.ai` has two layers.

- High-level helpers that return validated Pydantic results: `generate_text`,
  `stream_text`, `generate_object`, `embed`, `list_models`,
  `get_default_models`, `generate_speech`, `generate_image`, `generate_video`,
  `transcribe`, `moderate`, `rerank`, `count_tokens`, `estimate_cost`.
- Raw endpoint methods that return JSON: `create_completion`,
  `create_embedding`, `create_prediction`, `list_model_records`,
  `list_defaults`, `get_health`, prompt helpers, and others.

Notes from the code:

- `generate_text(options)` accepts a `GenerateTextOptions` or a mapping. The
  required fields are `model` and `prompt`. Returns `GenerateTextResult` with
  `.text`, `.finish_reason`, `.usage`, `.tool_calls`, `.tool_results`, and
  `.steps`.
- `max_steps` defaults to 1. It can be set from 1 to 50. The tool loop only
  runs when `tools` is provided.
- `tools` is a mapping of name to `ToolDefinition(description, parameters,
  execute)`. In the sync `generate_text`, `execute` must not be a coroutine
  function.
- `stream_text(options)` yields `TextPart` (`type="text"`), `ToolCallPart`
  (`"tool-call"`), `FinishPart` (`"finish"`), `StreamErrorPart` (`"error"`),
  and `DonePart` (`"done"`). `AbortPart` (`"abort"`) is defined in the models
  but `stream_text` never yields it. Use the `on_abort` callback instead.
  Stream errors arrive as an error part followed by a done part. See
  `references/ERROR_HANDLING.md`.
- `count_tokens(text)` estimates with four characters per token. It is not
  a tokenizer.
- `estimate_cost(model, input_tokens, output_tokens)` only supports
  `frontal-ai-fast`. Other models raise `ValueError`. The rate is a
  placeholder. The code documents it as a planning estimate, not billing.
- Model ID `frontal-ai-fast` appears in upstream docs and examples. Other
  model IDs are not documented here. Use `client.ai.list_models()` to see what
  the gateway advertises.

```python
from frontal_sdk import Frontal

with Frontal() as client:
    for part in client.ai.stream_text(
        {"model": "frontal-ai-fast", "prompt": "Count to three."}
    ):
        if part.type == "text":
            print(part.text, end="", flush=True)
        elif part.type == "finish":
            print(f"\n[finished: {part.finish_reason}]")
```

## Agents

```python
from frontal_sdk import Frontal

with Frontal() as client:
    agent = (
        client.agents.define("Ticket triage")
        .description("Route incoming support tickets")
        .trigger("ticket.created")
        .can_read("tickets")
        .create()
    )
```

- `client.agents.define(name)` returns an `AgentBuilder`. It validates inputs
  before sending. `.create()` sends the definition and returns JSON.
- `client.agents.use(agent_id)` returns an `AgentAccessor`. Its methods are
  `get`, `update`, `delete`, `rollback`, `versions`, `runs`, `run`,
  `wait_for_completion`, `conversation`, `message`, and `watch`.
- `accessor.wait_for_completion(run_id, *, interval=2.0, timeout=300.0)`.
  `timeout` may be `None`. For a sync client it blocks the thread. Use the
  client's HTTP timeout for individual requests.
- Direct methods: `client.agents.get(id=...)`, `list(query=...)`,
  `create(...)`, `update(...)`, `delete(...)`, `rollback(...)`, `health()`.
- Run and version sub-resources: `client.agents.runs` (`list`, `create`,
  `get`, `conversation`, `stream`) and `client.agents.versions` (`list`).

## Workflows

```python
from frontal_sdk import Frontal

with Frontal() as client:
    workflow = (
        client.workflows.define("Support ticket handoff")
        .description("Review a new ticket and route it to the support queue")
        .manual()
        .task("review", {"action": "review_ticket"}, timeout="30s")
        .create()
    )
    workflow_id = str(workflow["id"])
    execution = client.workflows.use(workflow_id).trigger({"ticket_id": "ticket_123"})
```

- Triggers on the builder: `manual()`, `schedule(...)`, `event(...)`,
  `webhook(...)`. Steps: `task`, `approval`, `condition`, `parallel`, `delay`,
  `notification`, and `step`.
- `.create()` creates the workflow. `.activate()` creates and publishes it.
- `client.workflows.use(id)` returns a `WorkflowAccessor`. Methods: `get`,
  `update`, `delete`, `activate`, `archive`, `restore`, `executions`,
  `execution(execution_id)`, `trigger(input)`, `wait_for_completion`.
- `WorkflowAccessor.wait_for_completion(execution_id, *, interval=2.0,
  timeout=300.0)` polls until the execution is completed, failed, or cancelled.

## Functions

```python
from frontal_sdk import Frontal, FunctionInvocationInput, FunctionResource

with Frontal() as client:
    created = (
        client.functions.define("hello-world")
        .runtime("nodejs22")
        .entrypoint("index.handler")
        .input_schema({"type": "object", "properties": {"name": {"type": "string"}}})
        .create()
    )
    function = FunctionResource.model_validate(created)
    raw = client.functions.executions.invoke(
        FunctionInvocationInput(function_id=function.id, input={"name": "World"})
    )
```

- `client.functions.define(name, options=None)` returns a `FunctionBuilder`
  with `runtime`, `entrypoint`, `description`, `source`, `input_schema`,
  `output_schema`, `dependencies`, `env_vars`, `secrets`, `memory`, `timeout`,
  `permissions`, and `create()`.
- `client.functions.create(definition)` takes a `FunctionDefinition` or a
  mapping. `list`, `get`, `update`, and `delete` take an ID where needed.
- `client.functions.use(function_id)` returns a `FunctionAccessor` with `get`,
  `update`, and `delete`.
- Sub-resources:
  - `versions`: `list`, `get`, `publish`
  - `deployments`: `deploy`, `status`
  - `executions`: `invoke` (waits for the result), `invoke_async`, `get`,
    `get_result`, `list`, `cancel`
- List filters: `client.functions.list(query={"cursor": ..., "limit": 25})`.
  Execution filters use `functionId` and `status` in the query.
- Function writes are not retried by the transport. See `references/ERROR_HANDLING.md`.

## Pagination

Cursor pagination with the shared helpers:

```python
from frontal_sdk import Frontal, PageResult, paginate
from frontal_sdk.models import JSONValue

with Frontal() as client:

    def fetch(query):
        response = client.agents.list(query=query)
        return PageResult[dict[str, JSONValue]].model_validate(response)

    rows = list(paginate(fetch, query={"limit": 50}))
```

- `paginate(fetch_page, *, query=None, cursor_param="cursor", max_pages=None)`
  yields items. `fetch_page` receives the query on the first call and the
  query plus the returned cursor on each later call.
- Stops when `pagination.hasMore` is false, or when `max_pages` is reached.
- Raises `FrontalError` when the cursor is missing or repeats.
- `async_paginate` is the async version. `fetch_page` must be awaitable.
- Many endpoint methods return raw JSON with no page model. Validate the
  page envelope in your callback.

## Polling

```python
from frontal_sdk import poll_until

def is_done(state: JSONValue) -> bool:
    ...  # predicate over the JSON response


result = poll_until(
    lambda: client.workflows.use("wf_id").execution("exec_id"),  # placeholder IDs
    until=is_done,
    interval=2.0,
    timeout=300.0,
    backoff="constant",  # or "linear", "exponential"
)
```

- `poll_until(fetch, *, until=None, interval=2.0, timeout=300.0,
  backoff="constant")` in `frontal_sdk.core.polling`. Exported at top level.
- `async_poll_until` is the async version. Its `timeout` can interrupt an
  awaiting fetch. For sync polling, `timeout` cannot interrupt a blocking
  fetch. Set the HTTP timeout on the client too.

## Circuit breaker

Standalone. Not wired into the clients. See `references/ERROR_HANDLING.md`.
