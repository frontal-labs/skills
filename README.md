# Frontal Skills

![Frontal Banner](./banner.jpg)

A collection of [Agent Skills](https://skills.sh) for building with the [Frontal](https://frontal.dev) platform.

## Installation

```bash
npx skills add frontal-labs/agent-skills
```

Or install a single skill:

```bash
npx skills add frontal-labs/agent-skills --skill frontal-sdk-typescript
```

## Available Skills

| Skill | Description |
|-------|-------------|
| `frontal-sdk-typescript` | TypeScript/JavaScript SDK for the Frontal platform |
| `frontal-sdk-python` | Python SDK for the Frontal Source API |
| `frontal-sdk-rust` | Rust SDK for the Frontal Source API |
| `frontal-sdk-go` | Go SDK for the Frontal Source API |
| `frontal-sdk-java` | Java SDK for the Frontal platform |

## Quick Start

```typescript
import { sdk } from "@frontal-labs/sdk";

const result = await sdk.ai.generateText({
  model: "gpt-4o-mini",
  prompt: "Hello, Frontal!"
});
```

## Skill Structure

Each skill follows the [Agent Skills Specification](https://agentskills.io):

```
skills/<skill-name>/
├── SKILL.md
├── references/
├── scripts/
└── assets/
```

## Development

```bash
npm run validate
npm run list
npm run lint
npm test
```

## Related

- [Frontal Platform](https://frontal.dev)
- [Agent Skills Specification](https://agentskills.io)
- [Skills.sh](https://skills.sh)
