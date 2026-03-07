# Parchis Trivia - Dojo Engine

This directory contains the on-chain game engine for Parchis Trivia using Dojo + Cairo.

## Current Scope

- Base Dojo project scaffold configured for namespace `parchis_trivia`.
- Core models aligned with the v2 spec (`Game`, `GameConfig`, `GamePlayer`, `Token`, `TurnState`, etc.).
- Implemented on-chain baseline for:
  - `config_system`
    - create/update/lock/disable/clone config
    - board square setup per `config_id`
  - `lobby_system`
    - create/join lobby by code, set ready, start game, leave lobby
    - token initialization and runtime config snapshot at game start
  - `turn_system`
    - roll + question draw, answer resolution, turn advancement, timeout skip
  - `shop_system`
    - buy/use item flow with per-turn purchase limits
  - `admin_system`
    - global defaults, question set, and item definition writes
- Event definitions for lobby, turn flow, movement, captures, shop, and win lifecycle.

## Local Setup

1. Ensure ASDF has a Dojo version installed (this project is pinned to `dojo 1.8.0`).
2. Run a local chain:

```bash
katana --dev --dev.no-fee
```

3. Build and migrate:

```bash
sozo build
sozo migrate
```

4. Start Torii indexer:

```bash
torii --world <WORLD_ADDRESS> --indexing.controllers
```

## Next Implementation Targets

1. Replace temporary turn randomness/answer checks with full Merkle proof + VRF strict flow.
2. Implement full movement legality (spawn rules, blockades, safe squares, captures, center exact).
3. Add occupancy recomputation and victory detection from real token movement.
4. Extend tests from smoke to contract integration/invariant scenarios listed in the spec.
5. Add EGS adapter contracts (`mint`, `score`, `setting_exists`, metadata lifecycle).
