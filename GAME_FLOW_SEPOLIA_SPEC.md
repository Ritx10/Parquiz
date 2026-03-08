# Game Flow, Safe Spaces, and Sepolia VRF Spec

Status: verified and updated  
Last updated: 2026-03-07

## Scope

This document tracks the fixes and verification work for four areas:

- gameplay integration coverage for play, blockades, capture, home, and win flow
- removal of the in-match shop while keeping the main home customization shop
- safe-space alignment on the board
- Sepolia deployment steps to validate live VRF behavior

## Verified Findings

### 1. Integration tests

- `sozo test` and `scarb test` currently compile the project but report `0 tests` with the current toolchain, so they are not reliable for this repository's real gameplay verification.
- `snforge test` is the authoritative test command here.
- Verified passing test coverage now includes:
  - private lobby start flow
  - public matchmaking auto-start
  - bridge/blockade enforcement
  - capture bonus flow
  - home/goal bonus flow
  - winner detection when the fourth token reaches center

### 2. In-match shop

- The gameplay shop has been removed from the active game flow.
- The home customization shop remains intact in `frontend/src/views/home-view.tsx`.
- Frontend config/session/env wiring for the in-match shop has been removed.
- The dedicated gameplay shop contract module has been removed from the active Dojo systems list.
- A second cleanup pass also removed leftover shop-era storage/config fields such as in-match shop flags, item definitions, and token shield state.

### 3. Safe-space alignment

- The board was mixing engine track references with UI numbering.
- The correct UI safe-space numbers are:
  - `12, 17, 29, 34, 46, 51, 63, 68`
- The corresponding engine track refs are:
  - `8, 13, 25, 30, 42, 47, 59, 64`
- The engine defaults and on-chain view fallback were updated to use the correct underlying track refs.
- Safe-space markers were also adjusted so they render inside the intended tile instead of appearing visually shifted.

## Code Areas Updated

- Test coverage: `engine/tests/test_integration_flows.cairo`
- Safe-square defaults: `engine/src/systems/config_system.cairo`
- Gameplay flow without in-match shop: `engine/src/systems/turn_system.cairo`
- Legacy model/type cleanup: `engine/src/models.cairo`, `engine/src/types.cairo`
- Active system list: `engine/src/systems.cairo`
- Deployment permissions: `engine/dojo_dev.toml`, `engine/dojo_release.toml`
- Frontend config payload/env/session cleanup:
  - `frontend/src/api/parchis-api.ts`
  - `frontend/src/api/types.ts`
  - `frontend/src/config/env.ts`
  - `frontend/src/env.d.ts`
  - `frontend/src/lib/starknet/session-policies.ts`
  - `frontend/.env.example`
- Safe-space rendering:
  - `frontend/src/views/match-onchain-view.tsx`
  - `frontend/src/api/dojo-state.ts`
  - `frontend/src/components/game/tile.tsx`
  - `frontend/src/components/game/parchis-board.tsx`

## Validation Commands

Run these from the repo after pulling the latest changes:

```bash
# Engine gameplay tests
cd engine && snforge test

# Engine compile
cd engine && sozo build

# Frontend typecheck + build
cd frontend && bun run typecheck && bun run build
```

Expected result:

- `snforge test` passes gameplay tests
- `sozo build` succeeds
- frontend typecheck/build succeeds

## Sepolia VRF Deployment Guide

### 1. Prepare your Sepolia account

- Create or choose a Starknet Sepolia account.
- Fund it with enough Sepolia ETH/STRK for deployment gas.
- Update `engine/dojo_release.toml` with:
  - `account_address`
  - `keystore_path` or your preferred signing setup

### 2. Verify locally before deploying

```bash
cd engine && snforge test
cd engine && sozo build
cd frontend && bun run build
```

Do not use `sozo test` as the final verification signal for this repo; use `snforge test`.

### 3. Inspect the Sepolia deployment plan

```bash
cd engine && sozo inspect --profile release
```

Confirm the world and contracts that will be deployed match expectations.

### 4. Deploy the world to Sepolia

```bash
cd engine && sozo migrate --profile release
```

Capture these values from the output or generated manifest:

- world address
- `config_system` address
- `lobby_system` address
- `turn_system` address
- `admin_system` address
- `egs_system` address
- `egs_token_data_system` address

### 5. Start Torii against Sepolia

```bash
torii \
  --world <WORLD_ADDRESS> \
  --rpc https://api.cartridge.gg/x/starknet/sepolia \
  --indexing.controllers
```

If you want a hosted indexer instead, deploy Torii with Slot using the same world address and Sepolia RPC.

### 6. Configure the frontend for Sepolia

Set the frontend env values in `frontend/.env`:

```bash
VITE_STARKNET_NETWORK=sepolia
VITE_DOJO_WORLD_ADDRESS=<WORLD_ADDRESS>
VITE_CONFIG_SYSTEM_ADDRESS=<CONFIG_SYSTEM_ADDRESS>
VITE_LOBBY_SYSTEM_ADDRESS=<LOBBY_SYSTEM_ADDRESS>
VITE_TURN_SYSTEM_ADDRESS=<TURN_SYSTEM_ADDRESS>
VITE_ADMIN_SYSTEM_ADDRESS=<ADMIN_SYSTEM_ADDRESS>
VITE_EGS_SYSTEM_ADDRESS=<EGS_SYSTEM_ADDRESS>
VITE_EGS_TOKEN_DATA_SYSTEM_ADDRESS=<EGS_TOKEN_DATA_SYSTEM_ADDRESS>
VITE_VRF_PROVIDER_ADDRESS=0x051fea4450da9d6aee758bdeba88b2f665bcbf549d2c61421aa724e9ac0ced8f
VITE_DOJO_TORII_URL=<YOUR_TORII_URL>
VITE_DOJO_MANIFEST_PATH=../manifest_release.json
```

Notes:

- `VITE_VRF_PROVIDER_ADDRESS` already matches the Cartridge Sepolia VRF provider.
- The frontend already submits VRF as a multicall in `frontend/src/api/parchis-api.ts` by calling `request_random` before `roll_two_dice_and_draw_question`.

### 7. Run the frontend against Sepolia

```bash
cd frontend && bun run dev
```

Or produce a production build with `bun run build` and host it.

### 8. Test live VRF end-to-end

Use this exact flow:

1. connect Controller on Sepolia
2. create or reuse a locked config
3. create a lobby and start a game
4. on your turn, trigger `Roll + question (VRF)`
5. confirm the transaction succeeds on Sepolia
6. verify Torii reflects `DiceRolled` and `QuestionDrawn`
7. continue through move, capture, home, and win flow

### 9. Sepolia acceptance checklist

- `snforge test` passes locally
- `sozo migrate --profile release` succeeds
- Torii indexes the deployed Sepolia world
- frontend reads the Sepolia world and models successfully
- VRF roll transaction succeeds on Sepolia
- dice/question state updates appear in the UI after the VRF multicall
- movement, blockades, captures, home, and winner flow still behave correctly

## Recommended Follow-up

- Regenerate deployment artifacts after the next Sepolia migration so `manifest_release.json` becomes the source of truth for the frontend.
- If you want a deeper cleanup, the next step is removing the remaining legacy shop-related storage fields from the Cairo models in a dedicated migration.
