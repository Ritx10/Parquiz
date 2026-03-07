use crate::types::{EgsConfigPayload, GlobalDefaultsPayload, ItemDefPayload, QuestionSetPayload};

#[starknet::interface]
pub trait IAdminSystem<T> {
    fn set_global_defaults(ref self: T, payload: GlobalDefaultsPayload);
    fn set_question_set(ref self: T, set_id: u64, payload: QuestionSetPayload);
    fn set_item_def(ref self: T, item_id: u16, payload: ItemDefPayload);
    fn set_egs_config(ref self: T, payload: EgsConfigPayload);
}

#[dojo::contract]
pub mod admin_system {
    use crate::constants::{EGS_CONFIG_SINGLETON_ID, GLOBAL_STATE_SINGLETON_ID, MIN_PLAYERS};
    use crate::models::{AdminAccount, EgsConfig, GlobalDefaults, ItemDef, QuestionSet};
    use crate::types::{EgsConfigPayload, GlobalDefaultsPayload, ItemDefPayload, QuestionSetPayload};
    use dojo::model::ModelStorage;
    use starknet::{ContractAddress, get_block_timestamp, get_caller_address};
    use super::IAdminSystem;

    #[abi(embed_v0)]
    impl AdminSystemImpl of IAdminSystem<ContractState> {
        fn set_global_defaults(ref self: ContractState, payload: GlobalDefaultsPayload) {
            assert(payload.min_players >= MIN_PLAYERS, 'min_players');

            let mut world = self.world_default();
            let caller = get_caller_address();
            assert_admin_or_init(ref world, caller);

            let defaults = GlobalDefaults {
                singleton_id: GLOBAL_STATE_SINGLETON_ID,
                min_players: payload.min_players,
                default_turn_timeout_secs: payload.default_turn_timeout_secs,
                default_question_timeout_secs: payload.default_question_timeout_secs,
                updated_at: get_block_timestamp(),
            };

            world.write_model(@defaults);
        }

        fn set_question_set(ref self: ContractState, set_id: u64, payload: QuestionSetPayload) {
            assert(set_id > 0, 'set_id');
            assert(payload.question_count > 0, 'q_count');

            let mut world = self.world_default();
            let caller = get_caller_address();
            assert_admin_or_init(ref world, caller);

            let set = QuestionSet {
                set_id,
                merkle_root: payload.merkle_root,
                question_count: payload.question_count,
                version: payload.version,
                enabled: payload.enabled,
            };

            world.write_model(@set);
        }

        fn set_item_def(ref self: ContractState, item_id: u16, payload: ItemDefPayload) {
            assert(item_id > 0, 'item_id');
            assert(payload.price > 0, 'item_price');

            let mut world = self.world_default();
            let caller = get_caller_address();
            assert_admin_or_init(ref world, caller);

            let item = ItemDef {
                item_id,
                price: payload.price,
                effect_type: payload.effect_type,
                effect_value: payload.effect_value,
                enabled: payload.enabled,
            };

            world.write_model(@item);
        }

        fn set_egs_config(ref self: ContractState, payload: EgsConfigPayload) {
            let mut world = self.world_default();
            let caller = get_caller_address();
            assert_admin_or_init(ref world, caller);

            let config = EgsConfig {
                singleton_id: EGS_CONFIG_SINGLETON_ID,
                adapter_address: payload.adapter_address,
                token_address: payload.token_address,
                settings_address: payload.settings_address,
                objectives_address: payload.objectives_address,
                enabled: payload.enabled,
            };

            world.write_model(@config);
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn world_default(self: @ContractState) -> dojo::world::WorldStorage {
            self.world(@"parchis_trivia")
        }
    }

    fn assert_admin_or_init(ref world: dojo::world::WorldStorage, caller: ContractAddress) {
        let mut admin: AdminAccount = world.read_model(GLOBAL_STATE_SINGLETON_ID);

        if admin.singleton_id != GLOBAL_STATE_SINGLETON_ID || admin.account == zero_address() {
            admin = AdminAccount { singleton_id: GLOBAL_STATE_SINGLETON_ID, account: caller };
            world.write_model(@admin);
        }

        assert(admin.account == caller, 'not_admin');
    }

    fn zero_address() -> ContractAddress {
        0.try_into().unwrap()
    }
}
