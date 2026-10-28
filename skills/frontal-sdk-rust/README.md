# Frontal SDK (Rust) skill

Agent skill for the `frontal` crate, the async Rust client for the Frontal API.
It covers installation and feature flags, client configuration, service handles,
errors, retries, pagination, and contract checks for changes to the crate.

Files:

- `SKILL.md`: entry point and workflow.
- `references/API_ENDPOINTS.md`: contract routes grouped by service (383
  routes).
- `references/CLIENT_PATTERNS.md`: construction, retry and idempotency rules,
  pagination, polling, Functions.
- `references/ERROR_HANDLING.md`: `FrontalError` variants, `ApiError`, matching
  patterns.
- `assets/Cargo.toml`: consumer crate template.

Source of truth: the `sdk-rust` repository (`Cargo.toml`, `src/`,
`contracts/sdk-endpoints.json`).
