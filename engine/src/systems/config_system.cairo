use crate::types::{BoardSquarePayload, GameConfigPayload};

#[starknet::interface]
pub trait IConfigSystem<T> {
    fn create_game_config(ref self: T, payload: GameConfigPayload) -> u64;
    fn update_game_config(ref self: T, config_id: u64, payload: GameConfigPayload);
    fn lock_game_config(ref self: T, config_id: u64);
    fn disable_game_config(ref self: T, config_id: u64);
    fn clone_game_config(ref self: T, base_config_id: u64, payload: GameConfigPayload) -> u64;
    fn set_board_square(
        ref self: T, config_id: u64, square_index: u16, payload: BoardSquarePayload,
    );
}

#[dojo::contract]
pub mod config_system {
    use crate::constants::{
        GLOBAL_STATE_SINGLETON_ID, MAIN_TRACK_LEN, config_status, square_type,
    };
    use crate::models::{BoardSquare, GameConfig, GlobalState};
    use crate::systems::egs_system::egs_system::{maybe_disable_settings, maybe_publish_settings};
    use crate::types::{BoardSquarePayload, GameConfigPayload};
    use dojo::model::ModelStorage;
    use starknet::{get_block_timestamp, get_caller_address};
    use super::IConfigSystem;

    #[abi(embed_v0)]
    impl ConfigSystemImpl of IConfigSystem<ContractState> {
        fn create_game_config(ref self: ContractState, payload: GameConfigPayload) -> u64 {
            assert_valid_payload(payload);

            let mut world = self.world_default();
            let caller = get_caller_address();
            let now = get_block_timestamp();

            let mut state = load_or_init_global_state(ref world);
            let config_id = state.next_config_id;
            state.next_config_id += 1;
            world.write_model(@state);

            let config = GameConfig {
                config_id,
                creator: caller,
                status: config_status::DRAFT,
                answer_time_limit_secs: payload.answer_time_limit_secs,
                turn_time_limit_secs: payload.turn_time_limit_secs,
                exit_home_rule: payload.exit_home_rule,
                created_at: now,
                updated_at: now,
            };

            world.write_model(@config);
            initialize_default_board_squares(ref world, config_id);
            config_id
        }

        fn update_game_config(ref self: ContractState, config_id: u64, payload: GameConfigPayload) {
            assert_valid_payload(payload);

            let mut world = self.world_default();
            let caller = get_caller_address();
            let now = get_block_timestamp();

            let mut config: GameConfig = world.read_model(config_id);
            assert(config.config_id == config_id, 'cfg_missing');
            assert(config.creator == caller, 'not_creator');
            assert(config.status == config_status::DRAFT, 'cfg_locked');

            config.answer_time_limit_secs = payload.answer_time_limit_secs;
            config.turn_time_limit_secs = payload.turn_time_limit_secs;
            config.exit_home_rule = payload.exit_home_rule;
            config.updated_at = now;

            world.write_model(@config);
        }

        fn lock_game_config(ref self: ContractState, config_id: u64) {
            let mut world = self.world_default();
            let caller = get_caller_address();
            let now = get_block_timestamp();

            let mut config: GameConfig = world.read_model(config_id);
            assert(config.config_id == config_id, 'cfg_missing');
            assert(config.creator == caller, 'not_creator');
            assert(config.status == config_status::DRAFT, 'cfg_locked');

            config.status = config_status::LOCKED;
            config.updated_at = now;
            world.write_model(@config);
            maybe_publish_settings(ref world, config);
        }

        fn disable_game_config(ref self: ContractState, config_id: u64) {
            let mut world = self.world_default();
            let caller = get_caller_address();
            let now = get_block_timestamp();

            let mut config: GameConfig = world.read_model(config_id);
            assert(config.config_id == config_id, 'cfg_missing');
            assert(config.creator == caller, 'not_creator');

            config.status = config_status::DISABLED;
            config.updated_at = now;
            world.write_model(@config);
            maybe_disable_settings(ref world, config_id);
        }

        fn clone_game_config(
            ref self: ContractState, base_config_id: u64, payload: GameConfigPayload,
        ) -> u64 {
            assert_valid_payload(payload);

            let mut world = self.world_default();
            let caller = get_caller_address();
            let now = get_block_timestamp();

            let base_config: GameConfig = world.read_model(base_config_id);
            assert(base_config.config_id == base_config_id, 'base_missing');
            assert(base_config.status != config_status::DISABLED, 'base_disabled');

            let mut state = load_or_init_global_state(ref world);
            let config_id = state.next_config_id;
            state.next_config_id += 1;
            world.write_model(@state);

            let config = GameConfig {
                config_id,
                creator: caller,
                status: config_status::DRAFT,
                answer_time_limit_secs: payload.answer_time_limit_secs,
                turn_time_limit_secs: payload.turn_time_limit_secs,
                exit_home_rule: payload.exit_home_rule,
                created_at: now,
                updated_at: now,
            };

            world.write_model(@config);
            clone_board_squares(ref world, base_config_id, config_id);
            config_id
        }

        fn set_board_square(
            ref self: ContractState, config_id: u64, square_index: u16, payload: BoardSquarePayload,
        ) {
            let mut world = self.world_default();
            let caller = get_caller_address();

            let config: GameConfig = world.read_model(config_id);
            assert(config.config_id == config_id, 'cfg_missing');
            assert(config.creator == caller, 'not_creator');
            assert(config.status == config_status::DRAFT, 'cfg_locked');

            let square = BoardSquare {
                config_id,
                square_index,
                square_type: payload.square_type,
                is_safe: payload.is_safe,
            };

            world.write_model(@square);
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn world_default(self: @ContractState) -> dojo::world::WorldStorage {
            self.world(@"parquiz")
        }
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

    fn assert_valid_payload(payload: GameConfigPayload) {
        assert(payload.answer_time_limit_secs > 0, 'answer_timer');
        assert(payload.turn_time_limit_secs > 0, 'turn_timer');
        assert(payload.exit_home_rule <= 2, 'exit_rule');
    }

    fn initialize_default_board_squares(ref world: dojo::world::WorldStorage, config_id: u64) {
        let mut square_index: u16 = 0;
        loop {
            if square_index >= MAIN_TRACK_LEN {
                break;
            }

            let square = default_board_square_for_index(config_id, square_index);
            world.write_model(@square);

            square_index += 1;
        }
    }

    fn clone_board_squares(
        ref world: dojo::world::WorldStorage, base_config_id: u64, target_config_id: u64,
    ) {
        let mut square_index: u16 = 0;
        loop {
            if square_index >= MAIN_TRACK_LEN {
                break;
            }

            let base_square: BoardSquare = world.read_model((base_config_id, square_index));
            let square = if base_square.config_id == base_config_id {
                BoardSquare {
                    config_id: target_config_id,
                    square_index,
                    square_type: base_square.square_type,
                    is_safe: base_square.is_safe,
                }
            } else {
                default_board_square_for_index(target_config_id, square_index)
            };

            world.write_model(@square);
            square_index += 1;
        }
    }

    fn default_board_square_for_index(config_id: u64, square_index: u16) -> BoardSquare {
        let is_start = is_start_square(square_index);
        let is_home_entry = is_home_entry_square(square_index);
        let is_safe_square = is_default_safe_square(square_index);
        let kind = if is_start {
            square_type::START
        } else if is_home_entry {
            square_type::HOME_ENTRY
        } else if is_safe_square {
            square_type::SAFE
        } else {
            square_type::NORMAL
        };

        BoardSquare {
            config_id,
            square_index,
            square_type: kind,
            is_safe: is_safe_square || is_start,
        }
    }

    fn is_start_square(square_index: u16) -> bool {
        square_index == 0 || square_index == 17 || square_index == 34 || square_index == 51
    }

    fn is_home_entry_square(square_index: u16) -> bool {
        square_index == 63 || square_index == 12 || square_index == 29 || square_index == 46
    }

    fn is_default_safe_square(square_index: u16) -> bool {
        square_index == 7
            || square_index == 12
            || square_index == 24
            || square_index == 29
            || square_index == 41
            || square_index == 46
            || square_index == 58
            || square_index == 63
    }
}
