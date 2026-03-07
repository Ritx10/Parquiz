# Parquiz (Dojo)

Initial monorepo scaffold for the Parquiz project.

## Directories

- `frontend/src/api/`: API client layer for on-chain calls (runs with `bun run dev` in frontend).
- `PARCHIS_TRIVIA_DOJO_SPEC.md`: v2 functional and technical specification.

## Quickstart

### Engine (smart contracts)

```bash
cd engine
katana --dev --dev.no-fee
sozo build
sozo migrate
```

### Backend

```bash
cd backend
bun install
bun run dev
```
