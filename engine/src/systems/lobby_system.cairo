#[starknet::interface]
pub trait ILobbySystem<T> {
    fn create_lobby(ref self: T, code_hash: felt252, config_id: u64) -> u64;
    fn join_lobby_by_code(ref self: T, code_hash: felt252) -> u64;
    fn join_public_matchmaking(ref self: T, config_id: u64) -> u64;
    fn set_ready(ref self: T, game_id: u64, ready: bool);
    fn start_game(ref self: T, game_id: u64);
    fn leave_lobby(ref self: T, game_id: u64);
}

#[dojo::contract]
pub mod lobby_system {
    use crate::constants::{
        GLOBAL_STATE_SINGLETON_ID, MAX_SEATS, MIN_PLAYERS, TOKENS_PER_PLAYER, config_status,
        game_status, lobby_kind, token_state, turn_phase,
    };
    use crate::events::{
        GameStarted, LobbyCreated, PlayerJoined, PlayerReadyChanged, TurnStarted,
    };
    use crate::models::{
        BonusState, DiceState, Game, GameConfig, GamePlayer, GamePlayerCustomization,
        GameRuntimeConfig, GameSeat, GlobalState, LobbyCodeIndex, PublicLobbyIndex, Token,
        TurnState,
    };
    use crate::systems::customization_system::customization_system::load_player_customization;
    use crate::systems::egs_system::egs_system::{
        assert_bound_token_playable, post_bound_token_action, sync_bound_player_state,
    };
    use dojo::event::EventStorage;
    use dojo::model::ModelStorage;
    use starknet::{ContractAddress, get_block_timestamp, get_caller_address};
    use super::ILobbySystem;

    #[abi(embed_v0)]
    impl LobbySystemImpl of ILobbySystem<ContractState> {
        fn create_lobby(ref self: ContractState, code_hash: felt252, config_id: u64) -> u64 {
            assert(code_hash != 0, 'code_hash');

            let mut world = self.world_default();
            let caller = get_caller_address();
            let now = get_block_timestamp();

            assert_config_is_playable(ref world, config_id);

            let existing_code: LobbyCodeIndex = world.read_model(code_hash);
            assert(!existing_code.is_active, 'code_used');

            let game_id = create_waiting_game(
                ref world, caller, now, config_id, code_hash, lobby_kind::PRIVATE,
            );

            let code_index = LobbyCodeIndex { code_hash, game_id, is_active: true };
            world.write_model(@code_index);

            world.emit_event(@LobbyCreated { game_id, host: caller, config_id, code_hash });
            world.emit_event(@PlayerJoined { game_id, player: caller, seat: 0 });

            game_id
        }

        fn join_lobby_by_code(ref self: ContractState, code_hash: felt252) -> u64 {
            let mut world = self.world_default();
            let caller = get_caller_address();
            let now = get_block_timestamp();

            let code: LobbyCodeIndex = world.read_model(code_hash);
            assert(code.is_active, 'code_closed');

            join_waiting_game(ref world, code.game_id, caller, now)
        }

        fn join_public_matchmaking(ref self: ContractState, config_id: u64) -> u64 {
            let mut world = self.world_default();
            let caller = get_caller_address();
            let now = get_block_timestamp();

            assert_config_is_playable(ref world, config_id);

            let mut public_lobby: PublicLobbyIndex = world.read_model(config_id);
            if public_lobby.is_active {
                let current_game: Game = world.read_model(public_lobby.game_id);
                if current_game.game_id == public_lobby.game_id
                    && current_game.status == game_status::WAITING
                    && current_game.lobby_kind == lobby_kind::PUBLIC
                    && current_game.player_count < MAX_SEATS
                {
                    let game_id = join_waiting_game(ref world, public_lobby.game_id, caller, now);

                    let updated_game: Game = world.read_model(game_id);
                    if updated_game.player_count >= MAX_SEATS {
                        public_lobby.is_active = false;
                        world.write_model(@public_lobby);
                    }

                    return game_id;
                }
            }

            let game_id =
                create_waiting_game(ref world, caller, now, config_id, 0, lobby_kind::PUBLIC);

            public_lobby = PublicLobbyIndex { config_id, game_id, is_active: true };
            world.write_model(@public_lobby);

            world.emit_event(@LobbyCreated { game_id, host: caller, config_id, code_hash: 0 });
            world.emit_event(@PlayerJoined { game_id, player: caller, seat: 0 });

            game_id
        }

        fn set_ready(ref self: ContractState, game_id: u64, ready: bool) {
            let mut world = self.world_default();
            let caller = get_caller_address();
            let now = get_block_timestamp();

            let mut game: Game = world.read_model(game_id);
            assert(game.status == game_status::WAITING, 'not_waiting');

            let mut player: GamePlayer = world.read_model((game_id, caller));
            assert(player.is_active, 'not_in_lobby');
            assert_bound_token_playable(ref world, game_id, caller);

            player.is_ready = ready;
            world.write_model(@player);
            world.emit_event(@PlayerReadyChanged { game_id, player: caller, is_ready: ready });

            if game.lobby_kind != lobby_kind::PUBLIC || game.player_count < MIN_PLAYERS {
                post_bound_token_action(ref world, game_id, caller);
                return;
            }

            if !all_active_players_ready(ref world, game_id) {
                post_bound_token_action(ref world, game_id, caller);
                return;
            }

            start_waiting_game(ref world, ref game, now);
            post_bound_token_action(ref world, game_id, caller);
        }

        fn start_game(ref self: ContractState, game_id: u64) {
            let mut world = self.world_default();
            let caller = get_caller_address();
            let now = get_block_timestamp();

            let mut game: Game = world.read_model(game_id);
            assert(game.status == game_status::WAITING, 'not_waiting');
            assert(game.player_count >= MIN_PLAYERS, 'missing_players');
            assert(game.lobby_kind == lobby_kind::PRIVATE, 'public_auto');
            assert_bound_token_playable(ref world, game_id, caller);

            let host: GamePlayer = world.read_model((game_id, caller));
            assert(host.is_active, 'not_in_lobby');
            assert(host.is_host, 'not_host');
            assert_all_players_ready(ref world, game_id);

            start_waiting_game(ref world, ref game, now);
            post_bound_token_action(ref world, game_id, caller);
        }

        fn leave_lobby(ref self: ContractState, game_id: u64) {
            let mut world = self.world_default();
            let caller = get_caller_address();
            let now = get_block_timestamp();

            let mut game: Game = world.read_model(game_id);
            assert(game.status == game_status::WAITING, 'not_waiting');

            let mut player: GamePlayer = world.read_model((game_id, caller));
            assert(player.is_active, 'not_in_lobby');
            if game.lobby_kind == lobby_kind::PRIVATE {
                assert(!player.is_host, 'host_leave');
            }

            player.is_active = false;
            player.is_ready = false;

            let seat = GameSeat {
                game_id,
                seat: player.seat,
                player: zero_address(),
                occupied: false,
            };

            game.player_count -= 1;
            game.updated_at = now;

            world.write_model(@player);
            world.write_model(@seat);
            sync_bound_player_state(
                ref world,
                game_id,
                caller,
                true,
                false,
                crate::constants::egs_link_status::CANCELLED,
            );

            if game.player_count == 0 {
                game.status = game_status::CANCELLED;
                world.write_model(@game);
                deactivate_lobby_indexes(ref world, game);
                return;
            }

            world.write_model(@game);

            if game.lobby_kind == lobby_kind::PUBLIC {
                set_public_index(ref world, game.config_id, game.game_id, true);
            }
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn world_default(self: @ContractState) -> dojo::world::WorldStorage {
            self.world(@"parquiz")
        }
    }

    fn create_waiting_game(
        ref world: dojo::world::WorldStorage, caller: ContractAddress, now: u64, config_id: u64,
        code_hash: felt252, kind: u8,
    ) -> u64 {
        let mut state = load_or_init_global_state(ref world);
        let game_id = state.next_game_id;
        state.next_game_id += 1;
        world.write_model(@state);

        let game = Game {
            game_id,
            status: game_status::WAITING,
            lobby_kind: kind,
            player_count: 1,
            turn_index: 0,
            active_player: caller,
            winner: zero_address(),
            config_id,
            lobby_code_hash: code_hash,
            created_at: now,
            started_at: 0,
            updated_at: now,
        };

        let host = GamePlayer {
            game_id,
            player: caller,
            seat: 0,
            color: 0,
            coins: 0,
            is_active: true,
            tokens_in_base: TOKENS_PER_PLAYER,
            tokens_in_goal: 0,
            is_ready: false,
            is_host: true,
        };

        let seat = GameSeat { game_id, seat: 0, player: caller, occupied: true };

        world.write_model(@game);
        world.write_model(@host);
        world.write_model(@seat);
        snapshot_player_customization(ref world, game_id, caller);

        game_id
    }

    fn join_waiting_game(
        ref world: dojo::world::WorldStorage, game_id: u64, caller: ContractAddress, now: u64,
    ) -> u64 {
        let mut game: Game = world.read_model(game_id);
        assert(game.status == game_status::WAITING, 'not_waiting');
        assert(game.player_count < MAX_SEATS, 'lobby_full');

        let existing_player: GamePlayer = world.read_model((game_id, caller));
        assert(!existing_player.is_active, 'already_joined');

        let seat = next_open_seat(ref world, game_id);

        let player = GamePlayer {
            game_id,
            player: caller,
            seat,
            color: seat,
            coins: 0,
            is_active: true,
            tokens_in_base: TOKENS_PER_PLAYER,
            tokens_in_goal: 0,
            is_ready: false,
            is_host: false,
        };

        let game_seat = GameSeat { game_id, seat, player: caller, occupied: true };

        game.player_count += 1;
        game.updated_at = now;

        world.write_model(@game);
        world.write_model(@player);
        world.write_model(@game_seat);
        snapshot_player_customization(ref world, game_id, caller);
        world.emit_event(@PlayerJoined { game_id, player: caller, seat });

        game_id
    }

    fn start_waiting_game(ref world: dojo::world::WorldStorage, ref game: Game, now: u64) {
        let config: GameConfig = world.read_model(game.config_id);
        assert(config.config_id == game.config_id, 'cfg_missing');
        assert(config.status != config_status::DISABLED, 'cfg_disabled');
        assert_all_bound_tokens_playable(ref world, game.game_id);

        let runtime_config = GameRuntimeConfig {
            game_id: game.game_id,
            answer_time_limit_secs: config.answer_time_limit_secs,
            turn_time_limit_secs: config.turn_time_limit_secs,
            exit_home_rule: config.exit_home_rule,
        };

        initialize_tokens_for_game(ref world, game.game_id);
        initialize_bonus_state_for_game(ref world, game.game_id);
        snapshot_all_player_customizations(ref world, game.game_id);

        let active_player = first_active_player(ref world, game.game_id);

        game.status = game_status::IN_PROGRESS;
        game.turn_index = 1;
        game.active_player = active_player;
        game.started_at = now;
        game.updated_at = now;

        let turn_state = TurnState {
            game_id: game.game_id,
            phase: turn_phase::ROLL_AND_QUESTION,
            active_player,
            dice_1: 0,
            dice_2: 0,
            die1_used: false,
            die2_used: false,
            question_id: 0,
            question_answered: false,
            question_correct: false,
            has_moved_token: false,
            exited_home_this_turn: false,
            first_moved_token_id: 0,
            deadline: now + config.turn_time_limit_secs.into(),
        };

        let dice_state = DiceState {
            game_id: game.game_id,
            die_a: 0,
            die_b: 0,
            die_a_used: false,
            die_b_used: false,
            sum_used: false,
        };

        if game.lobby_kind == lobby_kind::PRIVATE {
            let mut code: LobbyCodeIndex = world.read_model(game.lobby_code_hash);
            code.is_active = false;
            world.write_model(@code);
        } else {
            set_public_index(ref world, game.config_id, game.game_id, false);
        }

        world.write_model(@runtime_config);
        world.write_model(@game);
        world.write_model(@turn_state);
        world.write_model(@dice_state);

        world.emit_event(@GameStarted {
            game_id: game.game_id,
            config_id: game.config_id,
            turn_index: game.turn_index,
        });
        world.emit_event(@TurnStarted {
            game_id: game.game_id,
            turn_index: game.turn_index,
            active_player,
        });
    }

    fn assert_config_is_playable(ref world: dojo::world::WorldStorage, config_id: u64) {
        assert(config_id > 0, 'config_id');

        let config: GameConfig = world.read_model(config_id);
        assert(config.config_id == config_id, 'cfg_missing');
        assert(config.status == config_status::LOCKED, 'cfg_locked');
    }

    fn set_public_index(
        ref world: dojo::world::WorldStorage, config_id: u64, game_id: u64, is_active: bool,
    ) {
        let index = PublicLobbyIndex { config_id, game_id, is_active };
        world.write_model(@index);
    }

    fn deactivate_lobby_indexes(ref world: dojo::world::WorldStorage, game: Game) {
        if game.lobby_kind == lobby_kind::PRIVATE {
            if game.lobby_code_hash == 0 {
                return;
            }

            let mut code: LobbyCodeIndex = world.read_model(game.lobby_code_hash);
            code.is_active = false;
            world.write_model(@code);
            return;
        }

        set_public_index(ref world, game.config_id, game.game_id, false);
    }

    fn load_or_init_global_state(ref world: dojo::world::WorldStorage) -> GlobalState {
        let mut state: GlobalState = world.read_model(GLOBAL_STATE_SINGLETON_ID);
        if state.singleton_id != GLOBAL_STATE_SINGLETON_ID || state.next_game_id == 0 || state.next_config_id == 0 {
            state = GlobalState {
                singleton_id: GLOBAL_STATE_SINGLETON_ID,
                next_game_id: 1,
                next_config_id: 1,
            };
            world.write_model(@state);
        }
        state
    }

    fn next_open_seat(ref world: dojo::world::WorldStorage, game_id: u64) -> u8 {
        let mut seat: u8 = 0;
        loop {
            assert(seat < MAX_SEATS, 'lobby_full');
            let existing: GameSeat = world.read_model((game_id, seat));
            if !existing.occupied {
                break seat;
            }
            seat += 1;
        }
    }

    fn first_active_player(ref world: dojo::world::WorldStorage, game_id: u64) -> ContractAddress {
        let mut seat: u8 = 0;
        loop {
            assert(seat < MAX_SEATS, 'no_players');
            let game_seat: GameSeat = world.read_model((game_id, seat));
            if game_seat.occupied {
                break game_seat.player;
            }
            seat += 1;
        }
    }

    fn all_active_players_ready(ref world: dojo::world::WorldStorage, game_id: u64) -> bool {
        let mut seat: u8 = 0;
        loop {
            if seat >= MAX_SEATS {
                break;
            }

            let game_seat: GameSeat = world.read_model((game_id, seat));
            if game_seat.occupied {
                let player: GamePlayer = world.read_model((game_id, game_seat.player));
                if !player.is_ready {
                    return false;
                }
            }

            seat += 1;
        }

        true
    }

    fn assert_all_players_ready(ref world: dojo::world::WorldStorage, game_id: u64) {
        assert(all_active_players_ready(ref world, game_id), 'player_not_ready');
    }

    fn assert_all_bound_tokens_playable(ref world: dojo::world::WorldStorage, game_id: u64) {
        let mut seat: u8 = 0;
        loop {
            if seat >= MAX_SEATS {
                break;
            }

            let game_seat: GameSeat = world.read_model((game_id, seat));
            if game_seat.occupied {
                assert_bound_token_playable(ref world, game_id, game_seat.player);
            }

            seat += 1;
        }
    }

    fn initialize_tokens_for_game(ref world: dojo::world::WorldStorage, game_id: u64) {
        let mut seat: u8 = 0;
        loop {
            if seat >= MAX_SEATS {
                break;
            }

            let game_seat: GameSeat = world.read_model((game_id, seat));
            if game_seat.occupied {
                let mut token_id: u8 = 0;
                loop {
                    if token_id >= TOKENS_PER_PLAYER {
                        break;
                    }

                    let token = Token {
                        game_id,
                        player: game_seat.player,
                        token_id,
                        token_state: token_state::IN_BASE,
                        track_pos: 0,
                        home_lane_pos: 0,
                        steps_total: 0,
                    };
                    world.write_model(@token);

                    token_id += 1;
                }
            }

            seat += 1;
        }
    }

    fn initialize_bonus_state_for_game(ref world: dojo::world::WorldStorage, game_id: u64) {
        let mut seat: u8 = 0;

        loop {
            if seat >= MAX_SEATS {
                break;
            }

            let game_seat: GameSeat = world.read_model((game_id, seat));
            if game_seat.occupied {
                let bonus = BonusState {
                    game_id,
                    player: game_seat.player,
                    pending_bonus_10: 0,
                    pending_bonus_20: 0,
                    bonus_consumed: false,
                };
                world.write_model(@bonus);
            }

            seat += 1;
        }
    }

    fn snapshot_player_customization(
        ref world: dojo::world::WorldStorage, game_id: u64, player: ContractAddress,
    ) {
        let profile = load_player_customization(ref world, player);
        world.write_model(
            @GamePlayerCustomization {
                game_id,
                player,
                avatar_skin_id: profile.avatar_skin_id,
                dice_skin_id: profile.dice_skin_id,
                token_skin_id: profile.token_skin_id,
            },
        );
    }

    fn snapshot_all_player_customizations(ref world: dojo::world::WorldStorage, game_id: u64) {
        let mut seat: u8 = 0;

        loop {
            if seat >= MAX_SEATS {
                break;
            }

            let game_seat: GameSeat = world.read_model((game_id, seat));
            if game_seat.occupied {
                snapshot_player_customization(ref world, game_id, game_seat.player);
            }

            seat += 1;
        }
    }

    fn zero_address() -> ContractAddress {
        0.try_into().unwrap()
    }
}
