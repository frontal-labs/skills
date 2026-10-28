# Frontal CLI command reference

Source of truth: `src/cli.ts` and `src/commands/*.ts` in the upstream CLI repo (`frontal-labs/cli`, version 0.1.2). Flags and defaults below are the ones the code defines.

## Global options

Accepted before or after the command name unless noted.

| Flag | Effect |
|---|---|
| `-p, --profile <name>` | Profile to use. Default: `FRONTAL_PROFILE`, then `activeProfile` |
| `--api-key <key>` | Override the API key for this call |
| `--api-url <url>` | Override the API base URL for this call |
| `--env <name>` | Environment: `dev`, `staging`, or `prod`. Selects the `frontal.<env>.jsonc` overlay |
| `-y, --yes` | Skip confirmation prompts (required for `deploy --prod` in non-interactive runs) |
| `-j, --json` | JSON output on stdout. Secrets are redacted |
| `--yaml` | YAML output on stdout |
| `-q, --quiet` | Suppress non-essential output |
| `-v, --verbose` | Log each request and response to stderr |
| `--debug` | Print stack traces and status codes with errors |
| `--no-color` | Disable colors. `NO_COLOR` also disables them |
| `-V, --version` | Print the version |
| `-h, --help` | Help for a command |
| `--watch [seconds]` | Re-run the command every N seconds (default 2) |
| `--until <field=value>` | Re-run until a JSON field matches. With `--watch`, gives up after 150 attempts |

`--watch` and `--until` are root options. The middleware skips a fixed list of top-level names: `auth`, `completion`, `config`, `deploy`, `dev`, `env`, `init`, `logs`, `policy`, `promote`, `rollback`, `types`. The check matches the command's own name, so subcommands such as `env pull` are not skipped.

`--org` and `--workspace` flags do not exist, although the config reads `orgId` and `workspaceId`.

## Exit codes

| Code | Name | Typical cause |
|---|---|---|
| 0 | Success | |
| 1 | General error | Unhandled error, confirmation refused, `policy check` denied, port in use |
| 2 | Validation error | Bad input, missing required secrets, API validation failure |
| 3 | Authentication error | No credentials, rejected key, expired session (401) |
| 4 | Permission denied | API 403 |
| 5 | Not found | API 404, unknown deployment reference, missing artifact |
| 6 | Configuration error | Missing `frontal.jsonc`, invalid config, missing deployment for `env push` |
| 10 | Network error | API unreachable |
| 11 | Timeout | API did not respond in time |
| 12 | Rate limited | API 429 |

## Error output

Human output on stderr:

```text
CODE: message
  - field: message            (validation fields, when present)
Fix:  suggested fix
Docs: https://frontal.dev/docs/cli/errors#code
Request ID: <id>            (when available)
```

With `--json`, stderr receives one line: `{"error":{"code","docs","fields","fix","message","requestId","retryAfter","statusCode"}}`.

## Project commands

### `frontal init [--name <dir>] [--force]`

Creates the project in the current directory, or in `<dir>` with `--name`. The directory name is normalized to a project name (lowercase, dashes).

- Creates `frontal.jsonc`, `.env.example`, and `src/.gitkeep`.
- Creates `package.json` only when none exists. It is never replaced, even with `--force`.
- Appends missing `.gitignore` entries: `.frontal/`, `.env`, `.env.local`.
- Existing `frontal.jsonc` and `.env.example` are kept unless `--force` is given. `--force` overwrites them.
- Prints created, updated, skipped, and kept files, then next steps. `--json` prints `{dir, name, created, updated, skipped, kept}`.
- Errors: `INVALID_PROJECT_NAME` (exit 2).

```bash
frontal init --name my-app
frontal init --force
```

### `frontal dev [--port <n>] [--host <h>] [--scenario <name>] [--remote <a,b>] [--persist-to <dir>] [--no-watch]`

Runs a local Frontal API for the project. No API key is needed unless `--remote` is used.

- `--port` default `8787`. `0` picks a free port. Must be an integer from 0 to 65535.
- `--host` default `127.0.0.1`.
- `--scenario <name>` loads `.frontal/scenarios/<name>.json`. Its routes override the built-in ones.
- `--remote <a,b>` proxies the named services to the real API. Services marked `remote: true` in `frontal.jsonc` are proxied too. Needs credentials. Without them, the proxied request returns 503 `NO_CREDENTIALS`.
- `--persist-to <dir>` sets the state directory. Default `.frontal/state`.
- `--no-watch` turns off live reload of `frontal*.jsonc`, `.env.local`, and scenario files.
- Serves `GET /health` locally and without auth. Routes are served under `/v1`.
- Stops on SIGINT or SIGTERM. Prints a ready line with the URL and service modes. With `--json`, emits NDJSON lines of type `ready`, `request`, `reload`, and `stopped`.
- Errors: `NO_PROJECT` (exit 6), `PORT_IN_USE` (exit 1), `INVALID_PORT` (exit 2).

```bash
frontal dev
frontal dev --port 9000 --scenario deny
frontal dev --remote ai,graph
```

### `frontal types [--out <file>]`

Generates TypeScript typings from `frontal.jsonc`. Default output `src/frontal-configuration.d.ts`. Needs a project. Makes no API call.

Prints `write` when the file changed, or `up-to-date` when it did not.

### `frontal env pull [file] [--force]`

Writes `.env.local`, or `file` relative to the project root.

- Contents: `FRONTAL_API_URL` (from `apiUrl`, respecting `--env`), one line per `secrets.required` key, and every `vars` entry.
- A required secret is filled from the credential only when that credential is an API key from a flag, the shell, or the profile. OAuth sessions do not seed the file. Otherwise the key is written empty and listed as "fill in".
- Without `--force`, an existing file causes `ENV_FILE_EXISTS` (exit 1). With `--force`, the file is merged: existing values win, and other existing keys are kept.
- The file is written with mode 0600.
- Secret values are never printed. `--json` returns `{file, written, preserved, missing}`.

```bash
frontal env pull
frontal env pull --env staging --force
frontal env pull .env.staging
```

### `frontal env push [file]`

Uploads variables to the current deployment for the active environment. Needs credentials.

1. Reads `file` (default `.env.local`). Missing file: `ENV_FILE_MISSING` (exit 6).
2. Every `secrets.required` key must have a value. Otherwise `MISSING_SECRETS` (exit 2).
3. Reads the recorded deployment for the environment. None: `NO_DEPLOYMENT` (exit 6).
4. Verifies the credential with `GET /auth/account/profile`.
5. Redeploys the recorded artifact with `env_vars` set to `vars` plus every file entry except `FRONTAL_API_KEY` and `FRONTAL_API_URL`. The artifact is not rebuilt.

Prints the key names only. `--json` returns `{deployment, keys, requestId}`.

### `frontal deploy [--preview | --prod] [--yes] [--dry-run] [--outdir <dir>]`

Bundles `entry` (default `src/index.ts`) to a single ESM file `index.js`, then uploads it as a worker.

- Target: `--preview` (default) uploads `<project>-preview`. `--prod` uploads `<project>`. Both flags together: `INVALID_TARGET` (exit 2).
- `--prod` asks for confirmation. Non-interactive without `--yes`: `CONFIRMATION_REQUIRED` (exit 1). Answering no: `DEPLOY_CANCELLED` (exit 1).
- `--dry-run` bundles, writes `manifest.json` (name, env, target, entry, sha, size, variable names, and the local state schema), and makes no network call. Output directory: `.frontal/build/<target>/` by default, or `--outdir`.
- Uploads with `POST /workers` (`name`, `code`, `entrypoint`, `env_vars`). The URL is the response `url`, or `<apiUrl>/workers/<name>` if the response has none.
- Records the deployment under `.frontal/state/deploys/` and copies the bundle to `.frontal/artifacts/<sha>/`.
- Bundling uses the in-process Bun runtime when running under Bun. Under Node it spawns `bun build --format=esm --target=bun`. Without `bun` on `PATH`: `BUNDLER_UNAVAILABLE`.

```bash
frontal deploy --preview
frontal deploy --prod --yes
frontal deploy --dry-run --outdir dist/frontal
```

### `frontal promote <url>`

Finds a recorded deployment by URL, id (`dep_...`), or worker name. Re-sends its stored artifact as the production worker (`<project>`). Does not rebuild.

Errors: `DEPLOYMENT_NOT_FOUND` (exit 5), `ARTIFACT_MISSING` (exit 5).

```bash
frontal promote https://api.frontal.dev/v1/workers/my-app-preview
```

### `frontal rollback [url]`

Redeploys a previous production artifact, then rolls back each agent id listed under `agents` in `frontal.jsonc`.

- Without an argument: the newest recorded production deployment for the environment that is not the current one. None: `NO_ROLLBACK_TARGET` (exit 5).
- With an argument: a recorded deployment matched by URL, id, or name.
- Agent rollbacks use `POST /agents/{id}/rollback` through the SDK. A failure for one agent is printed, and the command still exits 0.

```bash
frontal rollback
frontal rollback dep_1a2b3c4d5e6f
```

### `frontal logs [-f] [--filter <query>] [--since <duration>] [--level <level>] [--limit <n>]`

Queries or tails platform logs. Needs a credential, even against the local dev server (any `frt_` value works there). Without one: `NO_CREDENTIALS` (exit 3).

- Default query: `project:<name>` when inside a project, otherwise `*`. `--filter` overrides it. The filter is also applied client-side as a substring match.
- `--since` accepts `15m`, `2h`, `1d`, `500ms`, `30s`, or an ISO timestamp. Default `15m`. Invalid value: `INVALID_SINCE` (exit 2).
- `--level` values: `info`, `warn`, `error`, `debug`.
- `--limit` applies to the query only. Default 100. `--follow` ignores it.
- `-f, --follow` streams over SSE until Ctrl+C. Transport errors reconnect with backoff, 0.5 s doubling to a 10 s cap. `401` and `403` stop immediately.
- Human output: `timestamp level service message (requestId)`. `--json` prints one JSON object per line.

```bash
frontal logs --since 1h --level error
frontal logs --follow --level error
frontal logs --follow --json | jq -r .requestId
frontal logs --since 5m --api-url http://127.0.0.1:8787/v1
```

### `frontal policy check [--strict] [--user <id>] [--role <name>]...`

Dry-run governance check. Needs a credential even with `--api-url` pointing at the local dev server. Any `frt_` value works there, because the dev server does not check keys. Without any credential the command fails with `NO_CREDENTIALS` (exit 3).

Rules evaluated:

| Rule | Source | Result |
|---|---|---|
| `policy-file:<path>` | Each `.frontal/policies/*.json`, `*.rego`, or `*.cel` file, validated remotely | deny when invalid |
| `policies:active` | Active policies | warn when none |
| `access:deploy:<service>` | Deploy access per service in `frontal.jsonc` | deny when not allowed |
| `compliance:score` | Compliance score | warn below 70 |

- The user id comes from the account profile unless `--user` is given. Roles come from the profile unless `--role` is given (repeatable). With no roles at all, `member` is used. Missing user id: `NO_IDENTITY` (exit 3).
- The access rule checks the `deploy` action for each service in `frontal.jsonc`.
- `--strict` turns warnings into denials.
- Exit 1 when any rule is denied. Otherwise exit 0.
- `--json` returns `{passed, policyId, userId, strict, summary, ruleResults}`.

```bash
frontal policy check
frontal policy check --strict --env prod
frontal policy check --user usr_123 --role admin --json
```

## Auth commands

### `frontal auth login [--profile <name>] [--method browser|api-key] [--auth-url <url>]`

- Default method `browser`. Uses the API-key path when `--method api-key` is given or when the session is not interactive (`CI` set or no TTY). The API-key path prompts for the key and the base URL, so it cannot run unattended.
- Browser path: PKCE OAuth against `<authUrl>` (default `https://auth.frontal.dev`), client id `a0000000-0000-0000-0000-000000000001`, scopes `email profile`. Waits up to 120 s. Saves `accessToken`, `refreshToken`, `tokenExpiresAt`, and `authUrl` to the profile, then makes it active.
- API-key path: validates the key with `GET /auth/account/profile`. A rejected key: `INVALID_API_KEY` (exit 3). Other failures save the key with a warning. Saves `apiKey` and `baseUrl` to the profile, then makes it active.

### `frontal auth password-login --email <email> --password <password> [--profile <name>]`

Calls `POST /auth/login` anonymously. Saves the returned `accessToken`, `refreshToken`, and `expiresAt` to the profile, then makes it active. Prints the response.

### `frontal auth signup --email <email> --password <password>`

Calls `POST /auth/signup` anonymously. Prints the response. Does not sign in.

### `frontal auth logout [--profile <name>]`

Clears `accessToken`, `apiKey`, `authUrl`, `refreshToken`, and `tokenExpiresAt` on the profile. The profile itself and its `baseUrl` stay.

### `frontal auth whoami [--local]`

Shows `authMethod` (`api-key`, `oauth`, or `none`), profile name, base URL, auth URL, token presence and expiry, and the account profile. `--local` skips the API call.

### `frontal auth token`

Prints the raw OAuth access token, or the API key if there is no OAuth session. No trailing newline. No credentials: `NO_CREDENTIALS` (exit 3).

### `frontal auth refresh`

Refreshes the OAuth session with the stored refresh token and saves the new tokens. Needs `refreshToken` and `authUrl` on the profile. Otherwise `NO_REFRESH_TOKEN` (exit 3).

### `frontal auth mfa <subcommand>`

| Subcommand | API call | Flags |
|---|---|---|
| `status` | `GET /auth/mfa/status` | |
| `setup` | `POST /auth/mfa/setup` | |
| `enable` | `POST /auth/mfa/enable` | `--code <code>` (required) |
| `disable` | `POST /auth/mfa/disable` | `--code <code>` (required) |
| `verify` | `POST /auth/mfa/verify` | `--code <code>` (required) |
| `backup-codes-regenerate` | `POST /auth/mfa/backup-codes/regenerate` | |

## Config commands

### `frontal config set <key> <value>`

Sets a dotted key in `~/.frontal/config.json`, for example `defaults.paginationLimit 50`. Values `true` and `false` become booleans. Numeric strings become numbers. Everything else stays a string. Keys that are not in the schema are dropped the next time the file is loaded, so they have no effect. `defaults.*` values are stored but no command reads them (see `CONFIGURATION.md`).

### `frontal config get <key>`

Prints the value, or `(not set)`.

### `frontal config list`

Prints the active profile name, profile names, schema version, telemetry flag, defaults, and the active profile's fields. Secrets are redacted.

### `frontal config reset [--force]`

Resets the file to defaults. Without `--force`, it asks for confirmation. Non-interactive without `--force`: prints a message and exits 0 without changing anything.

### `frontal config profiles`

Lists profiles with the active one marked `*`, a masked API key prefix, and the base URL.

### `frontal config use <profile>`

Sets `activeProfile`.

### `frontal config telemetry enable|disable|status`

Sets or shows `telemetry.enabled`. The flag is stored only. No telemetry is sent by the source.

## Platform commands

These call the platform API through the SDK and need credentials. Flags that take `--body <json>` parse the JSON before the call. Malformed JSON fails without a request.

### `frontal workflows list [--limit <n>] [--cursor <c>]`

Lists workflows.

### `frontal workflows create --body <json>`

Creates a workflow from a JSON definition. The definition is validated with the SDK before the request.

### `frontal workflows search --body <json>`

Searches workflows with a raw JSON body.

### `frontal workflows batch --body <json>`

Runs a batch workflow operation with a raw JSON body.

### `frontal workflows run get <workflow-id> <run-id>`

Gets one workflow run.

### `frontal workflows run summary <workflow-id> <run-id>`

Gets a workflow run summary.

### `frontal workflows run timeline <workflow-id> <run-id>`

Streams the run timeline over SSE.

### `frontal runs list [--limit <n>] [--cursor <c>]`

Lists runs.

### `frontal runs create --body <json>`

Creates a run.

### `frontal invocations create --body <json>`

Submits an invocation.

### `frontal events list [--limit <n>] [--cursor <c>]`

Lists events.

### `frontal events get <id>`

Gets one event.

### `frontal events query --body <json>`

Queries events.

### `frontal events usage --body <json>`

Creates a usage event.

### `frontal events reprocess --body <json>`

Triggers reprocessing.

## Other commands

### `frontal version`

Prints `Frontal CLI v<version>` and the runtime. `--json` prints `{version, runtime, platform, arch, ...}`.

### `frontal completion bash|zsh|fish`

Prints a completion script to stdout. Redirect it to the location your shell reads.

### `frontal migrate-legacy`

Prints the table mapping v1 commands to current ones, plus local profile checks. No API call.

| Legacy | Current |
|---|---|
| `orgs *`, `workspaces *` | removed |
| `workflows trigger` | `workflows run get\|summary\|timeline` |
| `agents *` | removed |
| `functions *` | `invocations create` |
| `pipelines *` | `runs *` (partial) |
| `auth mfa:*` | `auth mfa <subcommand>` |

### `frontal help [command]`

Same as `--help` for a command.
