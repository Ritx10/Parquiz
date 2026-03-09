# ParQuiz - Dojo Engine

This directory contains the on-chain game engine for ParQuiz using Dojo + Cairo.

## Current Scope

- Base Dojo project scaffold configured for namespace `parquiz`.
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
  - `admin_system`
    - global defaults and question set writes
 - Event definitions for lobby, turn flow, movement, captures, and win lifecycle.

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

5. Seed the local VRF provider and question set before testing dice rolls:

```bash
sozo execute --profile dev --wait parquiz-admin_system set_vrf_provider 0x15f542e25a4ce31481f986888c179b6e57412be340b8095f72f75a328fbb27b
sozo execute --profile dev --wait parquiz-admin_system set_question_set 1 0x3a1ec27286ab0b11fb3e34e1266c3977349e39fc2f2fcf42ebd117b6e78e786 63 1 1
```

6. Seed the local progression/shop catalog so profile purchases and cosmetic loadouts work:

```bash
cd ../frontend
bun run profile:seed:dev
```

### Full Local Reset

With a fresh Katana instance, this sequence brings the whole stack back up:

```bash
# terminal 1
katana --dev --dev.no-fee

# terminal 2
sozo build --profile dev
sozo migrate --profile dev
sozo execute --profile dev --wait parquiz-admin_system set_vrf_provider 0x15f542e25a4ce31481f986888c179b6e57412be340b8095f72f75a328fbb27b
sozo execute --profile dev --wait parquiz-admin_system set_question_set 1 0x3a1ec27286ab0b11fb3e34e1266c3977349e39fc2f2fcf42ebd117b6e78e786 63 1 1

# terminal 3
cd ../frontend
bun run profile:seed:dev

# terminal 4
cd ../engine
torii --world 0x92c575ff3ab5a8cd02e3d59856bab57570516f518816f2436252eb86e8953d --indexing.controllers --http.cors_origins "*"

# terminal 5
cd ../frontend
cp .env.katana .env
bun run dev
```

Notes:

- `bun run profile:seed:dev` writes progression config, placement rewards, and the full cosmetic catalog expected by the current shop UI.
- `bun run profile:seed:dev` is not redundant with `set_question_set`: question seeding enables trivia gameplay, while profile seeding enables progression rewards, store purchases, and cosmetic loadouts.
- If you migrate a fresh local world, restart Torii after the migrate so it indexes the latest models.
- If the shop shows missing items or the board view starts spamming Torii 500s, the usual cause is Torii still indexing an older world/schema. Restart Torii after `sozo migrate --profile dev`.

## Sepolia Bootstrap

After a fresh Sepolia deployment, seed the question set before testing live dice rolls. Otherwise the turn system can fail with `q_disabled` or `q_count` during `roll_two_dice_and_draw_question`.

From `frontend/` run:

```bash
DOJO_KEYSTORE_PASSWORD='<your-keystore-password>' bun run questions:seed:release
DOJO_KEYSTORE_PASSWORD='<your-keystore-password>' bun run profile:seed:release
```

These two commands seed different on-chain data and both are required after a fresh deploy.

Then verify the world state:

```bash
sozo --profile release model get parquiz-QuestionSet 1
sozo --profile release model get parquiz-ProgressionConfig 4
sozo --profile release model get parquiz-CosmeticDefinition 1 2
sozo --profile release model get parquiz-PlacementRewardConfig 1
```

## Next Implementation Targets

1. Replace temporary turn randomness/answer checks with full Merkle proof + VRF strict flow.
2. Implement full movement legality (spawn rules, blockades, safe squares, captures, center exact).
3. Add occupancy recomputation and victory detection from real token movement.
4. Extend tests from smoke to contract integration/invariant scenarios listed in the spec.
5. Complete the remaining EGS adapter work (`mint`, objectives exposure, registry reconciliation on-chain, and full lifecycle parity with production EGS flows).
