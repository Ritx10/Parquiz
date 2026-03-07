# Parchis Trivia Frontend

Scaffold base para el frente de `Parchis Trivia` siguiendo el spec Dojo + Cartridge Controller.

## Stack configurado

- React + TypeScript + Vite
- TailwindCSS
- Dojo SDK packages: `@dojoengine/core`, `@dojoengine/sdk`, `@dojoengine/torii-client`
- Wallet/session: `@cartridge/controller`, `@cartridge/connector`, `@starknet-react/core`, `@starknet-react/chains`, `starknet`
- Estado cliente: `zustand`
- Testing: `vitest`, `@testing-library/react`, `@testing-library/jest-dom`

## Requisitos

- Bun recomendado por spec (`bun --version`)
- Node.js 20+ (fallback para instalar dependencias si Bun no esta disponible)

## Setup rapido

```bash
cp .env.example .env
bun install
bun run dev
```

Si aun no tienes Bun, puedes instalar dependencias con npm y luego usar Bun:

```bash
npm install
```

## Variables de entorno

Edita `.env`:

- `VITE_STARKNET_NETWORK` (`mainnet`, `sepolia`, `katana`)
- `VITE_DOJO_WORLD_ADDRESS`
- `VITE_DOJO_TORII_URL`
- `VITE_DOJO_MANIFEST_PATH`

## Scripts

- `bun run dev` - levanta UI + capa API cliente (`src/api`) en un solo proceso
- `bun run dev:live` - usa RPC live (`VITE_USE_LIVE_RPC=true`)
- `bun run build` - typecheck + build
- `bun run test` - tests en modo run
- `bun run test:watch` - tests en modo watch
- `bun run lint` - lint con ESLint

## Estructura inicial

- `src/app` - router y providers
- `src/api` - llamadas on-chain (reemplaza backend separado para flujo dev)
- `src/config` - env y runtime config Dojo
- `src/lib/starknet` - connector Controller y session policies
- `src/pages` - pantallas base (`Home`, `GameConfig`, `Lobby`, `GameBoard`)
- `src/game/board-geometry.ts` - placeholder para mapping tablero/UI
- `src/store/game-ui-store.ts` - estado UI transitorio (highlight, dado activo)

## Siguiente integracion recomendada

1. Generar bindings Dojo (`sozo build --typescript`) y exponer cliente tipado.
2. Conectar `GameConfig` a `create_game_config`, `update_game_config`, `lock_game_config`.
3. Conectar `Lobby` a `create_lobby`, `join_lobby_by_code`, `set_ready`, `start_game`.
4. Conectar `GameBoard` a `TurnState`, `Token`, `SquareOccupancy` via Torii.
