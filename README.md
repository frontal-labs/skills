# Frontal Skills

![Frontal Banner](./banner.png)

A production-grade collection of [Agent Skills](https://skills.sh) for building with the
[Frontal TypeScript SDK](https://github.com/frontal-labs/sdk-ts) ecosystem (`@frontal-labs/*`).

These skills provide procedural knowledge to AI agents (Claude Code, Cursor, Kilo, Copilot, etc.)
for using Frontal SDKs correctly — covering core patterns, AI inference, agents, workflows,
billing, graph, auth, storage, governance, and 9+ additional domains.

## Installation

```bash
npx skills add frontal-labs/agent-skills
```

Or install a single skill:

```bash
npx skills add frontal-labs/agent-skills --skill frontal-ai
```

## Available Skills

### Foundational

| Skill | Description |
|-------|-------------|
| `frontal` | Unified `Sdk` class, `FrontalClient`, core patterns, errors, retries, pagination |

### Domain SDKs

| Skill | Package | Description |
|-------|---------|-------------|
| `frontal-ai` | `@frontal-labs/ai` | LLM inference, embeddings, streaming, multimodal, tool use |
| `frontal-agents` | `@frontal-labs/agents` | Agent definition, lifecycle, deployment, execution watching |
| `frontal-workflows` | `@frontal-labs/workflows` | Workflow DSL, approvals, triggers, steps |
| `frontal-pipelines` | `@frontal-labs/pipelines` | Data pipeline orchestration, backfills, sources |
| `frontal-graph` | `@frontal-labs/graph` | Graph entities, traversal, semantic search, time travel |
| `frontal-billing` | `@frontal-labs/billing` | Subscriptions, invoices, metering, payment methods |
| `frontal-auth` | `@frontal-labs/auth` | Authentication, MFA, OAuth, SSO, admin management |
| `frontal-storage` | `@frontal-labs/blob` | Blob upload/download, signed URLs, streaming |
| `frontal-governance` | `@frontal-labs/governance` | Policies, RBAC, compliance, access control |
| `frontal-events` | `@frontal-labs/events` | Pub/sub, dead-letter queues, schema registry |
| `frontal-observability` | `@frontal-labs/observability` | Logs, metrics, traces, alerts, dashboards |
| `frontal-webhooks` | `@frontal-labs/webhooks` | Endpoint management, HMAC verification, delivery tracking |
| `frontal-ontology` | `@frontal-labs/ontology` | Domain models, migrations, AI-powered generation |
| `frontal-integrations` | `@frontal-labs/integrations` | Third-party actions (Salesforce, Slack, Linear, etc.) |
| `frontal-sandbox` | `@frontal-labs/sandbox` | Isolated code execution, compile-and-judge |
| `frontal-workers` | `@frontal-labs/workers` | Edge runtime, serverless workers, eszip deployment |
| `frontal-datasets` | `@frontal-labs/datasets` | Dataset CRUD, versioning, import/export |
| `frontal-lineage` | `@frontal-labs/lineage` | Data lineage, dependency tracing, impact analysis |

## Skill Structure

Each skill follows the [Agent Skills Specification](https://agentskills.io):

```
skills/frontal-<domain>/
├── SKILL.md              # Required: metadata + instructions
├── references/           # Optional: detailed documentation
└── assets/               # Optional: templates, resources
```

Shared references live at the repository root:

```
references/
├── sdk-architecture.md   # Package hierarchy, build system, design decisions
├── error-handling.md     # Error taxonomy, recovery strategies, circuit breaker
├── pagination-patterns.md # Async iteration, cursor vs. offset, backpressure
└── testing-patterns.md   # @frontal-labs/testing, mocks, integration harness
```

## Skill Categories

- **sdk-foundation**: Core SDK patterns and unified client
- **sdk-domain**: High-usage domain SDKs (AI, agents, workflows, billing, etc.)
- **sdk-specialized**: Lower-frequency but important SDKs (events, observability, etc.)

## Usage Examples

```typescript
// AI: Generate text with streaming
import { streamText } from "@frontal-labs/ai";
const stream = await streamText({ model: "gpt-4o-mini", prompt: "Hello!" });
for await (const chunk of stream.textStream) process.stdout.write(chunk);

// Agents: Define and run
import { agents } from "@frontal-labs/agents";
const agent = await agents.define("triage").trigger("ticket.created").create();
await agents.use(agent.id).message("ticket.created", { ticketId: "t_123" });

// Workflows: Approval chain
import { workflows } from "@frontal-labs/workflows";
const wf = await workflows.define("approval").manual().approval("manager", ["m@co.com"]).create();
await workflows.use(wf.id).trigger({ docId: "doc_456" });

// Graph: Query entities
import { graph } from "@frontal-labs/graph";
const results = await graph.query({ entityType: "customer", conditions: { tier: "enterprise" } });
```

## Development

### Prerequisites

- Node.js 18+
- Bun 1.3+

### Scripts

```bash
# Validate all skills
npm run validate

# List available skills
npm run list

# Lint markdown
npm run lint

# Run tests
npm test
```

### Adding New Skills

1. Create `skills/frontal-<domain>/SKILL.md` with frontmatter:
   ```yaml
   ---
   name: frontal-<domain>
   description: <pushy description with trigger contexts>
   metadata:
     internal: true
     author: frontal-labs
     version: "1.0"
     category: sdk
   ---
   ```
2. Keep the SKILL.md body under 500 lines
3. Move detailed content to `references/`
4. Run `npm run validate`
5. Update `package.json` `skills` registry

## Maintenance

- **SDK changes**: When `/sdk-typescript` releases, diff exports and flag outdated examples
- **API deprecations**: Track via `openapi/specs/public/v1/openapi.yaml`
- **New packages**: Create a Tier 3 skill within 1 sprint of public release

## Publishing

```bash
git remote add origin https://github.com/frontal-labs/agent-skills.git
git push -u origin main
```

Register at [skills.sh/frontal-labs/agent-skills](https://skills.sh/frontal-labs/agent-skills).

## Related

- [Frontal Platform](https://github.com/frontal-labs/frontal)
- [Frontal SDK TypeScript](https://github.com/frontal-labs/sdk-ts)
- [Agent Skills Specification](https://agentskills.io)
- [Skills.sh Leaderboard](https://skills.sh)

---

**Frontal** — Building the future of intelligent AI systems at scale.
