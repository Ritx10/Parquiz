# ParQuiz

ParQuiz is a multiplayer Parchis-style trivia game built as a Dojo-powered on-chain game plus a React/Bun frontend.

The project currently supports:

- authoritative on-chain matches on Starknet through Dojo
- reusable on-chain game configs
- public matchmaking and private lobbies
- an off-chain `Practice with AI` mode
- player cosmetic customization
- match coins, local profile coins, and profile progression scaffolding
- Embeddable Game Standard (EGS) integration for tournament-style flows

## High-Level Architecture

The repository is split into two main parts:

### `frontend/`

The frontend is built with:

- `Bun`
- `React`
- `TypeScript`
- `Vite`
- `Tailwind CSS`
- `zustand`
- `@starknet-react/core`
- `@cartridge/controller` and `@cartridge/connector`

Frontend responsibilities:

- wallet and session management through Cartridge Controller
- config creation and selection
- public and private lobby UX
- on-chain board rendering and turn interaction
- offline `Practice with AI` mode
- local player profile, settings, and cosmetic ownership state
- Torii reads and live subscriptions for on-chain state

### `engine/`

The engine is built with:

- `Cairo`
- `Dojo`
- `cartridge_vrf`

Active on-chain systems:

- `admin_system`
- `customization_system`
- `config_system`
- `egs_system`
- `lobby_system`
- `turn_system`

Core on-chain models include:

- `Game`
- `GameConfig`
- `GameRuntimeConfig`
- `GamePlayer`
- `GameSeat`
- `Token`
- `TurnState`
- `DiceState`
- `BonusState`
- `PendingQuestion`
- `QuestionSet`
- `BoardSquare`
- `SquareOccupancy`
- `PlayerCustomization`
- `GamePlayerCustomization`
- `EgsSessionBinding`
- `EgsTokenGameLink`

### Runtime Flow

At runtime the stack works like this:

1. the frontend creates or selects an on-chain `config_id`
2. players enter either a public queue or a private lobby
3. when the match starts, the engine snapshots runtime config and player cosmetics
4. the turn loop is validated on-chain
5. Torii indexes models and events so the frontend can stay in sync in real time
6. optional EGS token binding links a tournament token to a specific ParQuiz match

## Current Game Modes

### 1. On-chain multiplayer

This is the main competitive mode.

- state is authoritative on-chain
- dice are requested through Cartridge VRF
- questions are verified on-chain with Merkle proofs
- legal movement is computed on-chain
- captures, bridges, home entries, bonuses, and victory are all contract-driven

### 2. Public matchmaking

Public matchmaking is tied to a specific `config_id`.

- there is one active public waiting lobby per config
- joining public matchmaking either reuses the current waiting lobby or creates a new one
- when at least 2 players are present and all active players are ready, the match auto-starts
- this makes public play feel like a queue around a selected ruleset instead of around a single custom room code

### 3. Private lobbies

Private lobbies are room-code based.

- the host creates a lobby with a hashed room code plus a selected `config_id`
- friends join by code
- each player marks ready
- only the host can start the game
- the host cannot leave a waiting private lobby and leave it orphaned

### 4. Practice with AI

`Practice with AI` is currently an off-chain mode.

- it uses the `board-mock` route in the frontend
- it does not write match state on-chain
- it simulates dice, trivia, turns, movement, and bots locally in React state
- it supports AI difficulty presets: `easy`, `medium`, and `hard`
- it is the current offline practice/sandbox mode for learning the game without touching Starknet

## On-Chain Gameplay Logic

ParQuiz combines Parchis movement with a trivia gate at the start of each turn.

### Turn loop

The current on-chain turn loop is:

1. active player starts in `ROLL_AND_QUESTION`
2. player requests VRF-backed randomness and rolls two dice
3. the contract draws a question from the on-chain question set reference
4. the frontend reconstructs the question and submits the answer with a Merkle proof
5. if the answer is wrong, the turn ends
6. if the answer is correct, movement becomes available
7. the player uses available movement resources until no legal moves remain, then ends the turn

### Questions and rewards

Questions are not stored fully on-chain as plain text.

- the contract stores a `QuestionSet` root and metadata
- the frontend uses the local hydrated question bank to reconstruct the selected question
- the submitted answer includes Merkle proof data so the engine can verify it on-chain

Difficulty is part of the config and affects coin rewards.

- `easy`: `60` coins
- `medium`: `90` coins
- `hard`: `130` coins

These coins are match-scoped on-chain coins stored in `GamePlayer.coins`.

### Movement rules currently implemented

- 4 tokens per player
- 2 to 4 players
- 2 dice per turn
- split dice usage is enabled
- moving the same token twice in one turn is enabled
- using the sum of both dice is currently disabled on-chain
- exact entry to the center is required

### Exit-home rules

Each config can choose the rule used to leave base:

- `FIVE`
- `EVEN`
- `SIX`

This is enforced by the contract and snapshotted into `GameRuntimeConfig` when the match begins.

### Safe spaces

Safe spaces are part of board metadata and are configurable per `config_id` through `BoardSquare` records.

- safe spaces cannot be captured
- start squares are also treated as safe
- safe-space definitions can be changed per config through the config system

### Bridges and blockades

The current rules include bridge/blockade behavior.

- two tokens from the same player on one track square create a blockade
- no one can pass through that blockade
- if a player rolls doubles and already has a bridge, the engine can force them to break their own bridge first
- blockade creation and breaking both emit events

### Captures and bonuses

Capturing is implemented on unsafe track squares.

- if a token lands on exactly one rival token on an unsafe square, that rival token returns to base
- the attacking player receives a pending `+20` move bonus
- when a token reaches center, the player receives a pending `+10` move bonus
- these bonus resources are also tracked on-chain and can be consumed in later movement

### Victory and timeouts

- the first player to bring 4 tokens to center wins
- the game moves to `FINISHED`
- stalled turns can be skipped after deadline through `force_skip_turn`

## Game Config Management

Game rules are managed through on-chain configs.

### What a config currently stores

The current on-chain `GameConfig` model stores:

- creator
- status: `DRAFT`, `LOCKED`, `DISABLED`
- answer time limit
- turn time limit
- exit-home rule
- difficulty level
- timestamps

At game start those values are copied into `GameRuntimeConfig`, so live matches use a stable snapshot.

### What can be managed per config

The config system currently supports:

- `create_game_config`
- `update_game_config`
- `lock_game_config`
- `disable_game_config`
- `clone_game_config`
- `set_board_square`

This means a config does more than just define timers. It also controls:

- the difficulty preset used for question rewards
- the exit-home rule
- safe-space metadata on the board
- whether a config is playable in new lobbies

### Frontend config flow

The frontend exposes a game config screen and a config browser.

- players can create a new config from the UI
- once created, the UI locks it for match use
- the selected `config_id` is persisted locally in settings
- the config browser lists indexed configs plus whether a public queue already exists for them

## Public Matchmaking

Public matchmaking is config-driven and fully on-chain.

- the queue is grouped by `config_id`
- if a waiting public lobby exists for the chosen config, the player joins it
- otherwise a new public lobby is created on-chain
- players toggle ready from the public lobby screen
- when all active players are ready and the minimum player count is met, the game auto-starts
- the frontend subscribes to Torii updates and redirects players into the board when status changes to `IN_PROGRESS`

## Private Lobbies

Private lobbies are also on-chain, but indexed by room-code hash.

- lobby creation stores the room code hash in `LobbyCodeIndex`
- players join by code instead of by public queue
- readiness is stored per player
- only the host can press start
- live state is restored from Torii so players can re-open their room

This gives ParQuiz two multiplayer entry points using the same game engine:

- public queue for fast matchmaking
- code-based private room for friends

## Offline Mode: Practice with AI

The `Practice with AI` button launches the offline mode.

This mode is intentionally separate from the on-chain board.

- it uses local mock state instead of Dojo models
- it runs without requiring an on-chain game id
- it creates local trivia questions from the frontend trivia engine
- bot answer accuracy and behavior change by difficulty
- it includes bot think delays, local turn timers, move generation, and fallback watchdog logic

This is the current off-chain practice experience for solo play.

## Player Money, Experience, and Progression

ParQuiz currently has two different money/progression layers.

### 1. Match coins on-chain

During an on-chain match, each `GamePlayer` has `coins`.

- these start at `0`
- they are earned from correct trivia answers
- reward size depends on config difficulty
- they are part of the EGS score calculation

These coins belong to the current match state, not to the global profile.

### 2. Persistent profile data in the frontend

The frontend also keeps a persistent local player profile keyed by wallet address or username.

Current stored profile fields are:

- `coins`
- `level`
- `prestige`

Current implementation status:

- persistent profile coins are stored locally in browser storage
- offline `Practice with AI` awards profile coins based on final placement: `1000`, `500`, `250`, `100`
- the home screen displays coins, level, and prestige
- level and prestige are present as profile fields and UI labels
- full experience earning and level-up progression logic is not implemented yet

So the progression layer exists in the product surface already, but the complete experience system is still scaffolding rather than a finished loop.

## Customization

Customization is already a meaningful part of the game.

### Cosmetic categories

The current frontend supports:

- avatar skins
- token skins
- dice skins
- board themes

### Ownership and equip state

The frontend stores local ownership/equip state for cosmetics in the app settings store.

- owned avatar skins
- owned token skins
- owned dice skins
- owned board themes
- selected equipped variants

### On-chain customization sync

There is also an on-chain customization system.

The engine stores a player customization profile with:

- `avatar_skin_id`
- `dice_skin_id`
- `token_skin_id`

When a player joins or starts a lobby, those cosmetics are snapshotted into the game state so match rendering can stay consistent.

Current scope split:

- avatar, dice, and token cosmetics can sync on-chain
- board themes are currently frontend-only

### Home customization shop

The main shop experience currently lives on the home screen, not inside matches.

- players can browse cosmetic tabs for avatars, tokens, dice, and themes
- the UI supports buying/equipping flows and cosmetic sync
- today the unlock flow is mostly local ownership state
- coin spending for the home cosmetic shop is not fully enforced yet

## Sound and Audio Direction

The game already exposes a persistent sound toggle in the settings flow.

Current state:

- `soundEnabled` is stored in the app settings store
- sound can be toggled from the config/settings screen
- the final sound playback layer is not fully wired yet

The intended audio experience around that toggle includes different sound effects for game moments such as:

- UI and menu interactions
- dice rolls
- correct and incorrect trivia answers
- token movement
- captures
- bridge/blockade moments
- reaching home/center
- victory and final ranking moments

So audio already has a settings surface in the app, and the README now documents it as part of the game UX, while being clear that the final SFX implementation is still in progress.

## EGS Game Standard Integration

ParQuiz is already connected to the Embeddable Game Standard through `egs_system`.

### What the integration does

The current EGS layer exposes:

- `score(token_id)`
- `game_over(token_id)`
- settings existence queries
- settings details queries
- token-to-game binding
- registration and settings publishing helpers

### How EGS maps to ParQuiz

The important design choice is:

- `settings_id == config_id`

That means every locked ParQuiz config can act as an EGS settings entry.

EGS settings published from a config currently expose values such as:

- difficulty
- answer timer
- turn timer
- exit-home rule

### Binding a tournament token to a match

The EGS binding flow lets a player connect a playable token to a ParQuiz match.

- the token owner must be the caller
- the token must still be playable in the EGS contract
- the token settings id must match the match `config_id`

Once linked, the engine updates mirrored token state as the match progresses.

### Current EGS score model

ParQuiz currently computes EGS score from live match state.

The score is based on:

- tokens in goal
- on-chain match coins
- pending `+10` bonuses
- pending `+20` bonuses

In the current contract the formula is effectively:

`tokens_in_goal * 100000 + match_coins + pending_bonus_10 * 10 + pending_bonus_20 * 20`

This is how the current engine translates board progress and trivia performance into EGS-compatible tournament data.

### Frontend EGS support

The frontend can resolve an on-chain match either by:

- `gameId`
- `tokenId`

This makes it possible to open the board from an EGS-linked token flow and resolve the bound match.

## Repository Structure

```text
.
|- engine/                     # Dojo + Cairo world, systems, models, tests
|- frontend/                   # Bun + React app, wallets, Torii client, UI
|- PARQUIZ_DOJO_SPEC.md        # broader gameplay and technical spec
|- GAME_FLOW_SEPOLIA_SPEC.md   # gameplay verification and Sepolia notes
```

Useful frontend areas:

- `frontend/src/app/` - router and providers
- `frontend/src/views/` - main screens and game flows
- `frontend/src/api/` - Starknet and Torii client layer
- `frontend/src/store/` - local settings, profile, and UI state
- `frontend/src/lib/` - trivia engine, cosmetics, controller utilities

Useful engine areas:

- `engine/src/models.cairo` - persistent world state
- `engine/src/events.cairo` - emitted gameplay events
- `engine/src/types.cairo` - payload types
- `engine/src/systems/*.cairo` - on-chain logic
- `engine/tests/` - contract tests

## Local Development

To run the full game locally, it is best to run steps `1` through `6` from `engine/`.

Use separate terminals for the long-running processes:

### Engine stack (`engine/`)

Terminal 1:

```bash
cd engine
katana --dev --dev.no-fee --http.addr 0.0.0.0 --http.cors_origins "*" --cartridge.paymaster --explorer
```

Terminal 2:

```bash
cd engine
sozo build --profile dev
sozo migrate --profile dev
sozo execute --profile dev --wait parquiz-admin_system set_vrf_provider 0x15f542e25a4ce31481f986888c179b6e57412be340b8095f72f75a328fbb27b
sozo execute --profile dev --wait parquiz-admin_system set_question_set 1 0x79d1cead79eeb7c7906a4ed96ccb1a3407cd11a25712a473b88fc982bec2087 180 2 1
torii \
  --world 0x0092c575ff3ab5a8cd02e3d59856bab57570516f518816f2436252eb86e8953d \
  --rpc http://127.0.0.1:5050 \
  --http.addr 0.0.0.0 \
  --http.port 8080 \
  --grpc.addr 0.0.0.0 \
  --grpc.port 50051 \
  --config ./torii_dev.toml \
  --indexing.controllers \
  --runner.check_contracts
```

Notes:

- Step `4` sets the VRF provider for Katana.
- Step `5` populates the local question set.
- `./torii_dev.toml` is the project-relative path to the Torii config when you run the command from `engine/`.

### Frontend (`frontend/`)

Terminal 3:

```bash
cd frontend
bun install
bun run dev
```

The frontend environment is controlled by `frontend/.env`, `frontend/.env.katana`, and `frontend/.env.example`.

Important env values include:

- network selection
- world address
- system contract addresses
- Torii URL
- VRF provider address
- EGS system address

## Testing and Verification

Recommended verification commands:

### Engine

```bash
cd engine && snforge test
cd engine && sozo build
```

### Frontend

```bash
cd frontend && bun run typecheck
cd frontend && bun run build
```

## Current Implementation Notes

The README reflects the current game as implemented today, with a few important clarifications:

- the main multiplayer game loop is on-chain and authoritative
- `Practice with AI` is currently off-chain
- configuration is real and on-chain, but the frontend mostly exposes create, lock, browse, and select flows
- sound settings exist already, but final SFX playback is still pending
- persistent profile progression currently stores coins, level, and prestige locally; full XP progression is not finished yet
- the main cosmetic shop is a home customization experience, not an in-match purchase system

In short: the core board game, lobbies, configs, customization sync, and EGS bridge are real; some progression and presentation layers are already surfaced in the product but are still being completed.
