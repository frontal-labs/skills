---
name: frontal-cli
description: Frontal CLI, the command-line interface for the Frontal platform (binary `frontal`, npm package `frontal-cli`). Use it to install the CLI, sign in with browser OAuth or an API key, scaffold a project (init), run a local Frontal API with no account (dev), generate typings (types), sync variables (env pull and env push), bundle and deploy workers (deploy, promote, rollback), query or tail logs (logs), run governance checks (policy check), and manage workflows, runs, invocations, events, and CLI profiles from a terminal or script.
metadata:
  author: frontal-labs
  version: "0.1.2"
  category: cli
---

# Frontal CLI

The `frontal` binary is the command-line interface for the Frontal platform. Every platform API call goes through `@frontal-labs/sdk`. The CLI adds a project model (`frontal.jsonc`), a local dev server, and deploy workflows.

## When to Use

- Installing the CLI or checking its version and runtime
- Signing in, switching profiles, or inspecting credentials
- Scaffolding a project or editing `frontal.jsonc`
- Running a local Frontal API for development without an account (`frontal dev`)
- Generating typings from `frontal.jsonc` (`frontal types`)
- Syncing variables between `frontal.jsonc`, `.env.local`, and deployments (`frontal env`)
- Deploying, promoting, or rolling back workers
- Querying or tailing platform logs
- Running governance checks before a deploy
- Operating on workflows, runs, invocations, or events from a shell or CI job

## When NOT to Use

- Writing application code against the platform. Use the `frontal-sdk-*` skills.
- Managing orgs, workspaces, teams, billing, or agent CRUD. The CLI has no commands for these. The v1 command tree is gone; `frontal migrate-legacy` prints the mapping.
- Anything that needs a Node or Bun library API. The CLI is a process, not a library.

## Installation

Verified channels (from `package.json`, `.github/workflows/publish.yml`, and the upstream `docker/` files):

- npm (public registry): `npm install -g frontal-cli`. Requires Node 18 or later.
- Homebrew tap: `brew tap frontal-labs/cli && brew install frontal-cli`. The formula builds from source with Bun. See Troubleshooting before relying on it.
- Single binary: download from the GitHub release page. Release assets are named `cli-<target>` (for example `cli-x86_64-unknown-linux-gnu`). Rename to `frontal` and put it on `PATH`.
- Docker: `docker pull ghcr.io/frontal-labs/cli:latest`. The image puts `frontal` on `PATH`. Local build: `docker build -f docker/Dockerfile -t frontal/cli:latest .` from the repo root.

`frontal deploy` bundles the entry file with `bun build`. It works under Bun, or when `bun` is on `PATH` under Node. Every other command runs without Bun.

Check the install:

```bash
frontal version
frontal --help
```

## Authentication

Credential resolution, first match wins:

1. `--api-key <key>` flag
2. `FRONTAL_API_KEY` environment variable
3. `FRONTAL_API_KEY` in `.env.local`, only when the working directory is inside a project
4. API key stored in the active profile
5. OAuth session (access and refresh tokens) stored in the active profile

API keys start with `frt_`. Use a placeholder in docs and scripts: `FRONTAL_API_KEY=frt_<your-key>`.

Browser login (default when stdin and stdout are a TTY and `CI` is unset):

```bash
frontal auth login
```

The CLI starts a loopback server on `127.0.0.1` (random port, path `/callback`), opens `<authUrl>/oauth/authorize` with PKCE (S256), and waits up to 120 seconds. The default auth URL is `https://auth.frontal.dev`. Override with `--auth-url` or `FRONTAL_AUTH_URL`. Tokens are saved to the profile. Access tokens refresh automatically within 60 seconds of expiry, and once after a 401.

API key login:

```bash
frontal auth login --method api-key
```

This prompts for the key and the API base URL, validates the key against the account profile endpoint, and saves the profile. Any non-interactive run (`CI` set or no TTY) also takes this path, and it still prompts. In CI, set `FRONTAL_API_KEY` instead of calling `auth login`.

Other auth commands: `auth whoami [--local]`, `auth token`, `auth refresh`, `auth logout`, `auth password-login`, `auth signup`, and `auth mfa`. Details in `references/COMMAND_REFERENCE.md`.

## Configuration

Four files matter:

- `~/.frontal/config.json`: CLI profiles and settings. The directory can be moved with `FRONTAL_CONFIG_DIR`.
- `frontal.jsonc` (project root, found by walking up from the working directory): project name, environment, API URL, services, vars, and required secrets. JSON with comments and trailing commas is allowed.
- `frontal.<env>.jsonc`: deep-merged over `frontal.jsonc` when an environment is selected with `--env` or the `env` key.
- `.env.local` (project root, gitignored): secrets and `FRONTAL_API_URL` values written by `env pull`.

Base URL precedence: `--api-url` > `FRONTAL_API_URL` > `.env.local` > `frontal.jsonc` `apiUrl` > profile `baseUrl` > `https://api.frontal.dev/v1`.

Profile precedence: `--profile` > `FRONTAL_PROFILE` > `activeProfile` in `config.json`.

`frontal.jsonc` keys: `name` (required), `env`, `apiUrl`, `entry`, `services`, `vars`, `secrets.required`, `agents`, `sdk`. Full schema and every `config.json` key are in `references/CONFIGURATION.md`.

## Commands

| Command | Purpose | Needs credentials |
|---|---|---|
| `init [--name <dir>] [--force]` | Create `frontal.jsonc`, `.env.example`, `.gitignore` entries, `package.json` if missing | No |
| `dev [--port] [--host] [--scenario] [--remote] [--persist-to] [--no-watch]` | Local Frontal API for the project | No (unless `--remote`) |
| `types [--out <file>]` | Generate typings from `frontal.jsonc` | No |
| `env pull [file] [--force]` | Write `.env.local` from `frontal.jsonc` and your credential | No |
| `env push [file]` | Upload variables to the current deployment | Yes |
| `deploy [--preview\|--prod] [--yes] [--dry-run] [--outdir]` | Bundle and upload a worker | Yes (not for `--dry-run`) |
| `promote <url>` | Point production at a recorded preview artifact | Yes |
| `rollback [url]` | Redeploy the previous production artifact, plus agents in `frontal.jsonc` | Yes |
| `logs [-f] [--filter] [--since] [--level] [--limit]` | Query or tail platform logs | Yes |
| `policy check [--strict] [--user] [--role]` | Governance dry run | Yes |
| `auth ...` | Login, logout, whoami, token, refresh, password-login, signup, mfa | Varies |
| `config ...` | Profiles and CLI settings | No |
| `workflows ...` | list, create, search, batch, run get/summary/timeline | Yes |
| `runs list\|create` | Runs | Yes |
| `invocations create --body` | Submit an invocation | Yes |
| `events ...` | list, get, query, usage, reprocess | Yes |
| `completion bash\|zsh\|fish` | Print a shell completion script | No |
| `version` | CLI version and runtime | No |
| `migrate-legacy` | Show the v1 to current command mapping | No |

Global options: `-p/--profile`, `--api-key`, `--api-url`, `--env <dev|staging|prod>`, `-y/--yes`, `-j/--json`, `--yaml`, `-q/--quiet`, `-v/--verbose`, `--debug`, `--no-color`, `-V/--version`, and `--watch [seconds]` / `--until <field=value>` for re-running read commands. Full flags and exit codes are in `references/COMMAND_REFERENCE.md`.

## Common workflows

Local loop with no account:

```bash
frontal init --name my-app
cd my-app
frontal dev                          # serves http://127.0.0.1:8787 by default

# In a second shell: logs and policy check need some frt_ key, but the dev server does not check it
export FRONTAL_API_KEY=frt_local_dev
frontal logs --since 5m --api-url http://127.0.0.1:8787/v1
```

Preview, then promote:

```bash
frontal deploy --preview             # prints the worker URL (<name> is <project>-preview)
frontal promote <preview-url>        # re-sends that artifact as production, no rebuild
```

Build and ship to production directly:

```bash
frontal policy check --strict --env prod
frontal deploy --prod --yes
```

Sync variables:

```bash
frontal env pull                     # writes .env.local, fill in the secrets it lists
frontal env push                     # needs a prior deploy for the same env
```

Undo a production deploy:

```bash
frontal rollback                     # previous production artifact
frontal rollback <url-or-dep-id>     # a specific recorded deployment
```

## CI usage

The CLI supports non-interactive use. `CI` set (or no TTY) turns off prompts:

- `deploy --prod` fails with `CONFIRMATION_REQUIRED` unless `--yes` is passed.
- `config reset` does nothing without `--force`, and exits 0.
- Authenticate with `FRONTAL_API_KEY` from a secret. Do not use `auth login` in CI.
- Use `--json` for parseable output. Errors go to stderr as `{"error":{...}}`.

For GitHub Actions, `frontal-labs/cli-action@v1` installs the CLI on hosted runners. Inputs: `version`, `api-key` (exported as `FRONTAL_API_KEY`), `api-url`.

## Troubleshooting

Errors print `CODE: message`, then `Fix:`, `Docs:`, and `Request ID:` when available. Exit codes are listed in the command reference.

- `NO_CREDENTIALS` (exit 3): no API key or OAuth session. Run `frontal auth login` or set `FRONTAL_API_KEY`.
- `NO_PROJECT` (exit 6): no `frontal.jsonc` in this directory or any parent. Run `frontal init` or `cd` into a project.
- `CONFIG_INVALID` or `CONFIG_PARSE_ERROR` (exit 6): `frontal.jsonc` fails validation. Fix the listed fields. Unknown top-level keys and unknown services are rejected. A malformed API key in the environment also reports `CONFIG_INVALID`.
- `CONFIRMATION_REQUIRED` (exit 1): add `--yes` in non-interactive runs.
- `BUNDLER_UNAVAILABLE` (exit 1): `deploy` under Node without `bun` on `PATH`. Install Bun or use the compiled binary.
- `PORT_IN_USE` (exit 1): pass `--port <other>`.
- `ENV_FILE_EXISTS` (exit 1): `env pull` refuses to overwrite. Pass `--force` to merge.
- `NO_DEPLOYMENT` (exit 6): `env push` needs a recorded deployment for the environment. Run `frontal deploy` first.
- `ARTIFACT_MISSING` (exit 5): the stored bundle under `.frontal/artifacts/` was deleted. Re-run `frontal deploy`. `promote` and `rollback` never rebuild.
- A corrupt `~/.frontal/config.json` is silently replaced by defaults on read, and the next write overwrites the file.
- Homebrew formula: the tap formula pins v0.1.1 and installs `dist/bin/frontal.js`, which the current build does not produce. Prefer npm until the formula is fixed.
- For debugging, use `--verbose` (or `FRONTAL_DEBUG=1`) to log each request, and `--debug` to print stack traces.

## References

- `references/COMMAND_REFERENCE.md`: every command, flag, default, and exit behavior
- `references/CONFIGURATION.md`: `frontal.jsonc` schema, `config.json` keys, environment variables, and precedence
