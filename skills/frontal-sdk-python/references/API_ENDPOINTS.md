# API surface

Source: upstream `sdk-python` (`frontal_sdk/client.py`, `frontal_sdk/resources/`,
`contracts/sdk-endpoints.json`, `docs/RESOURCES.md`).

## Service namespaces

`Frontal` and `AsyncFrontal` expose the same 17 attributes. Each is a typed
resource object built from the same HTTP transport.

- `ai` (9): sync `SyncAI`, async `AsyncAI`. Includes high-level helpers.
- `agents` (13): `define`, `use`, `get`, `list`, `create`, `update`, `delete`,
  `rollback`, `health`. Sub-resources: `runs`, `versions`.
- `functions` (16): `define`, `use`, `create`, `list`, `get`, `update`,
  `delete`. Sub-resources: `versions`, `deployments`, `executions`.
- `workflows` (25): `define`, `use`, `list`, `create`, plus `*_workflow`,
  approval, execution, task, and template methods.
- `audit` (4): Audit events.
- `auth` (59): Authentication and identity operations.
- `billing` (23): Billing operations.
- `blob` (8): File storage operations.
- `connectors` (12): Integration connectors.
- `data` (45): Data operations.
- `governance` (24): Governance operations.
- `lineage` (7): Lineage operations.
- `observability` (25): Telemetry operations.
- `ontology` (82): Ontology operations. Largest namespace.
- `pipelines` (11): Pipeline operations.
- `schedules` (10): Schedule operations.
- `webhooks` (10): Webhook operations.

The per-service counts come from `contracts/sdk-endpoints.json`, which
totals 383 entries. `README.md` also says 383. `CHANGELOG.md` for 1.0.0 says
370 catalogued operations. The contract file is the most direct source, but
the count in the changelog is not reconciled with it.

## Method conventions

- Read methods take `query=` as a mapping. Example:
  `client.agents.list(query={"limit": 20})`.
- Write methods take `body=`. Omitting `body` sends no body. `body=None`
  sends the JSON value `null`. `body={}` sends an empty JSON object.
  (`docs/RESOURCES.md`, `tests/test_client.py`)
- Path arguments are semantic. Example: `client.agents.get(id="agent_123")`.
  Methods take the resource ID as a positional or keyword argument.
- Multipart uploads take `parts` (a sequence of `MultipartPart`) as a
  positional argument. Example: `client.blob.upload_object(container, key,
  parts)`. Optional `fields` is a mapping of extra form fields.
- Raw-body methods take `data` (bytes) and `content_type` as positional
  arguments. Example: `client.ai.post_raw_internal_predictions(data,
  content_type)`. The return type is `bytes`.
- Streaming methods return `ServerEvent` iterators. Sync clients return
  `Iterator`, async clients return `AsyncIterator`.
- Sync methods return validated JSON (`JSONValue`). Async methods return an
  awaitable of the same value.

## Models

- `APIModel` is the Pydantic v2 base for SDK models. Fields use camelCase
  aliases where the API does (for example `maxTokens`, `toolName`,
  `functionId`).
- Most endpoint payloads are not modelled. They come back as `JSONValue`.
  Upstream docs say the OpenAPI snapshots do not define most operation
  schemas (`docs/ARCHITECTURE.md`).
- `PageResult[T]` and `PaginationMeta` model the cursor envelope. Fields are
  `data`, `pagination` (with `cursor`, `hasMore`, `total`, `limit`), and
  `meta`.

## Function runtimes and status

From `frontal_sdk/models/functions.py`:

- `FunctionRuntime`: `"nodejs20"`, `"nodejs22"`, `"python311"`
- `FunctionStatus`: `"draft"`, `"active"`, `"deprecated"`, `"failed"`

## Contract gate

Upstream maintains `contracts/sdk-endpoints.json` as the hand-written
method inventory. `scripts/check_contracts.py` checks that methods do not
drift from it. Upstream `docs/RESOURCES.md` says to run that script after
changing inventory-backed methods. The script is not in this skill.
