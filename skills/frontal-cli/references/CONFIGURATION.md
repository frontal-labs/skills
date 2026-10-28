# Frontal CLI configuration

Source of truth: `src/config/*.ts`, `src/lib/project.ts`, `src/lib/config.ts`, `src/lib/sdk.ts`, `src/lib/state.ts`, `src/lib/deploys.ts`, and `src/commands/env.ts` in the upstream CLI repo (version 0.1.2).

## Files

| File | Scope | Written by | Notes |
|---|---|---|---|
| `~/.frontal/config.json` | User | `config`, `auth` | Profiles and settings. Directory moves with `FRONTAL_CONFIG_DIR`. Stores tokens and keys in plaintext, with default file permissions |
| `frontal.jsonc` | Project | `init`, you | Walks up from the working directory to find it. Comments and trailing commas allowed |
| `frontal.<env>.jsonc` | Project | you | Deep-merged over `frontal.jsonc` when the environment is set (`--env` or `env` key) |
| `.env.local` | Project | `env pull` | Gitignored by `init`. Mode 0600 when written by `env pull` |
| `.env.example` | Project | `init` | Template: `FRONTAL_API_KEY=` and `FRONTAL_API_URL=` |
| `package.json` | Project | `init` (only if missing) | Scripts `deploy`, `dev`, `types`. Dev dependency `frontal-cli` |
| `.frontal/state/` | Project | `dev`, `deploy` | Dev data (`--persist-to` overrides), deploy records under `deploys/` |
| `.frontal/artifacts/<sha>/` | Project | `deploy` | Immutable copy of each deployed bundle |
| `.frontal/build/<target>/` | Project | `deploy` | Bundle and `manifest.json` (default output of `deploy`) |
| `.frontal/scenarios/<name>.json` | Project | you | `dev --scenario` routes |
| `.frontal/policies/*.json`, `*.rego`, `*.cel` | Project | you | Validated by `policy check` |

`.frontal/` is gitignored by `init`.

## Environment variables

| Variable | Read by | Effect |
|---|---|---|
| `FRONTAL_API_KEY` | config resolution | API key (`frt_...`). Used after `--api-key` and before `.env.local` and profile keys |
| `FRONTAL_API_URL` | config resolution | Base URL. Used after `--api-url` and before `.env.local` and `frontal.jsonc` `apiUrl` |
| `FRONTAL_PROFILE` | config resolution | Profile name when `--profile` is not given |
| `FRONTAL_AUTH_URL` | `auth login`, `auth refresh`, session refresh | OAuth authority. Default `https://auth.frontal.dev` |
| `FRONTAL_CONFIG_DIR` | config manager | Directory for `config.json`. Default `~/.frontal` |
| `FRONTAL_DEBUG` | SDK setup | `1` enables verbose request logging. The SDK also accepts `true`, `false`, `0` |
| `FRONTAL_ENV` | SDK setup | SDK environment label: `development`, `test`, or `production`. Invalid values are dropped. Does not select the project environment (use `--env`) |
| `FRONTAL_ORG_ID` | config resolution | Read into the resolved config. No command uses it |
| `FRONTAL_WORKSPACE_ID` | config resolution | Read into the resolved config. No command uses it |
| `NO_COLOR` | output | Disables colors |
| `CI` | prompts | Any value disables interactive prompts (`isInteractive()` is false) |
| `FRONTAL_CLI_VERSION` | version | Development fallback for the version string. Not needed for installs |

Placeholder for docs and CI secrets: `FRONTAL_API_KEY=frt_<your-key>`.

## Precedence

Base URL (first set wins):

1. `--api-url`
2. `FRONTAL_API_URL`
3. `.env.local` `FRONTAL_API_URL` (only inside a project)
4. `frontal.jsonc` `apiUrl` (only inside a project)
5. Profile `baseUrl`
6. `https://api.frontal.dev/v1`

API key (first set wins):

1. `--api-key`
2. `FRONTAL_API_KEY`
3. `.env.local` `FRONTAL_API_KEY` (only inside a project)
4. Profile `apiKey`

If no API key is set, the profile's OAuth session is used (`accessToken`, `refreshToken`, `tokenExpiresAt`, `authUrl`).

Profile name (first set wins):

1. `--profile`
2. `FRONTAL_PROFILE`
3. `activeProfile` in `config.json`

`auth login` and `auth logout` read `--profile`, then the active profile. They do not read `FRONTAL_PROFILE`.

Project environment: `--env` if given, otherwise the `env` key in `frontal.jsonc`, otherwise `dev` as the schema default.

## `config.json` (schema version 2)

```json
{
  "activeProfile": "default",
  "defaults": { "outputFormat": "table", "paginationLimit": 25 },
  "profiles": {
    "default": {
      "apiKey": "frt_<your-key>",
      "baseUrl": "https://api.frontal.dev/v1",
      "debug": false
    }
  },
  "schemaVersion": 2,
  "telemetry": { "enabled": false }
}
```

| Key | Type | Default | Used by the CLI |
|---|---|---|---|
| `activeProfile` | string | `default` | Yes |
| `defaults.outputFormat` | `table`, `json`, `yaml` | `table` | Stored. Not read. Use `--json` or `--yaml` |
| `defaults.paginationLimit` | positive integer | `25` | Stored. Not read |
| `profiles.<name>.apiKey` | string | unset | Yes |
| `profiles.<name>.accessToken` | string | unset | Yes (OAuth session) |
| `profiles.<name>.refreshToken` | string | unset | Yes |
| `profiles.<name>.tokenExpiresAt` | number (Unix seconds) | unset | Yes |
| `profiles.<name>.authUrl` | URL | unset | Yes (refresh) |
| `profiles.<name>.baseUrl` | URL | unset | Yes |
| `profiles.<name>.debug` | boolean | `false` | Yes (SDK debug flag) |
| `profiles.<name>.orgId` | string | unset | Resolved, not used by any command |
| `profiles.<name>.workspaceId` | string | unset | Resolved, not used by any command |
| `schemaVersion` | integer | `2` | Stored |
| `telemetry.enabled` | boolean | `false` | Stored. Not used to send data |

Behavior to know:

- An unreadable or invalid `config.json` loads as defaults without an error. The next write replaces the file.
- Keys outside this schema are dropped on load.
- `config set` writes dotted keys. `config list` redacts secret fields.

## `frontal.jsonc`

Validated by `buildProjectConfigSchema` (`src/lib/config.ts`). Unknown top-level keys are rejected. The JSON Schema is published at `https://frontal.dev/schemas/frontal.json` (generated from the CLI's validator).

| Key | Type | Required | Default | Notes |
|---|---|---|---|---|
| `$schema` | string | No | | Editor hint |
| `name` | string | Yes | | Lowercase letters, digits, dashes. Must match `^[a-z0-9][a-z0-9-]*$` |
| `env` | `dev`, `staging`, `prod` | No | `dev` | Selects the overlay file. `--env` overrides it |
| `apiUrl` | URL | No | | Validated with the SDK's `baseUrl` rule. `init` writes `https://api.frontal.dev/v1` |
| `entry` | string | No | `src/index.ts` | Entry file bundled by `deploy` |
| `services` | object | No | `{}` | Keys from the list below. Each value is `{ "remote": boolean }` (default `false`). `remote: true` proxies that service in `frontal dev` |
| `vars` | object | No | `{}` | Keys must be `UPPER_SNAKE_CASE`. Values are strings. Written to `.env.local` by `env pull`. Sent as worker `env_vars` on deploy |
| `secrets.required` | string array | No | `["FRONTAL_API_KEY"]` | Keys must be `UPPER_SNAKE_CASE`. `env push` refuses to run if any is empty |
| `agents` | string array | No | `[]` | Agent ids rolled back by `frontal rollback` |
| `sdk` | object | No | | Partial and strict. Allowed keys: `headers`, `maxRetries`, `retryDelay`, `timeout` |

Valid service keys for `services`: `agents`, `ai`, `audit`, `auth`, `billing`, `blob`, `connectors`, `data`, `datasets`, `events`, `governance`, `graph`, `integrations`, `lineage`, `observability`, `ontology`, `pipelines`, `sandbox`, `schedules`, `webhooks`, `workers`, `workflows`. Unknown keys are rejected.

`init` enables `ai`, `agents`, and `graph` by default.

Example:

```jsonc
{
  // Frontal project configuration
  "$schema": "https://frontal.dev/schemas/frontal.json",
  "name": "my-app",
  "env": "dev",
  "apiUrl": "https://api.frontal.dev/v1",
  "services": {
    "ai": { "remote": false },
    "agents": { "remote": false },
    "graph": { "remote": false }
  },
  "vars": { "LOG_LEVEL": "info" },
  "secrets": { "required": ["FRONTAL_API_KEY"] }
}
```

### Environment overlays

`frontal.<env>.jsonc` is deep-merged over `frontal.jsonc` when an environment is selected. Only the file for the selected environment is read. An environment name outside `dev`, `staging`, `prod` fails with `CONFIG_INVALID` (exit 6).

### Parse rules

Comments (`//`, `/* */`) and trailing commas are accepted in `frontal.jsonc` and overlays. Comment markers inside strings are kept.

## `.env.local`

Plain `KEY=value` lines. Blank lines and `#` comments are skipped. `export` prefixes are accepted. Quoted values are unquoted. An unquoted value ends at ` #`.

`env pull` writes:

```text
# Managed by `frontal env pull` — secrets are never stored in frontal.jsonc.
# API base URL (dev)
FRONTAL_API_URL=https://api.frontal.dev/v1
# required secret
FRONTAL_API_KEY=frt_<your-key>
LOG_LEVEL=info
```

Values that contain whitespace, `#`, or quotes are written as JSON strings. Unknown existing keys are kept on merge.

`env push` uploads every `vars` value and every `.env.local` key except `FRONTAL_API_KEY` and `FRONTAL_API_URL`.

## Deployment state

`.frontal/state/deploys/` holds one record per deploy, keyed by id. It also holds `current-<env>` and `current-<env>-<target>` pointers. A record has: `id` (`dep_...`), `name`, `env`, `target` (`preview` or `prod`), `sha`, `url`, `artifactDir`, `entrypoint`, `createdAt`, and `requestId`.

## Not in the CLI

- No standalone secrets store. Variables travel with the worker.
- No `FRONTAL_ORG`, `FRONTAL_WORKSPACE`, `FRONTAL_OUTPUT_FORMAT`, `FRONTAL_DEBUG_HTTP`, or `FRONTAL_NO_COLOR`. The docs mention some of these, but the code does not read them.
- No `--org` or `--workspace` flags.
