use crate::types::{
    CosmeticDefinitionPayload, EgsConfigPayload, GlobalDefaultsPayload,
    PlacementRewardPayload, ProgressionConfigPayload, QuestionSetPayload,
};
use starknet::ContractAddress;

#[starknet::interface]
pub trait IAdminSystem<T> {
    fn set_global_defaults(ref self: T, payload: GlobalDefaultsPayload);
    fn set_question_set(ref self: T, set_id: u64, payload: QuestionSetPayload);
    fn set_egs_config(ref self: T, payload: EgsConfigPayload);
    fn set_vrf_provider(ref self: T, provider_address: ContractAddress);
    fn set_progression_config(ref self: T, payload: ProgressionConfigPayload);
    fn set_placement_reward(ref self: T, place: u8, payload: PlacementRewardPayload);
    fn set_cosmetic_definition(
        ref self: T, kind: u8, item_id: u8, payload: CosmeticDefinitionPayload,
    );
}

#[dojo::contract]
pub mod admin_system {
    use crate::constants::{
        EGS_CONFIG_SINGLETON_ID, GLOBAL_STATE_SINGLETON_ID, MIN_PLAYERS,
        PROGRESSION_CONFIG_SINGLETON_ID, VRF_CONFIG_SINGLETON_ID, cosmetic_kind,
    };
    use crate::models::{
        AdminAccount, CosmeticDefinition, EgsConfig, GlobalDefaults, PlacementRewardConfig,
        ProgressionConfig, QuestionSet, VrfConfig,
    };
    use crate::types::{
        CosmeticDefinitionPayload, EgsConfigPayload, GlobalDefaultsPayload,
        PlacementRewardPayload, ProgressionConfigPayload, QuestionSetPayload,
    };
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

        fn set_egs_config(ref self: ContractState, payload: EgsConfigPayload) {
            let mut world = self.world_default();
            let caller = get_caller_address();
            assert_admin_or_init(ref world, caller);

            let config = EgsConfig {
                singleton_id: EGS_CONFIG_SINGLETON_ID,
                adapter_address: payload.adapter_address,
                registry_address: payload.registry_address,
                token_address: payload.token_address,
                settings_address: payload.settings_address,
                objectives_address: payload.objectives_address,
                enabled: payload.enabled,
            };

            world.write_model(@config);
        }

        fn set_vrf_provider(ref self: ContractState, provider_address: ContractAddress) {
            let mut world = self.world_default();
            let caller = get_caller_address();
            assert_admin_or_init(ref world, caller);

            let config = VrfConfig { singleton_id: VRF_CONFIG_SINGLETON_ID, provider_address };
            world.write_model(@config);
        }

        fn set_progression_config(ref self: ContractState, payload: ProgressionConfigPayload) {
            assert(payload.special_reward_level >= 1, 'special_lvl');

            let mut world = self.world_default();
            let caller = get_caller_address();
            assert_admin_or_init(ref world, caller);

            let special_reward = load_cosmetic_definition(
                ref world,
                cosmetic_kind::AVATAR,
                payload.special_reward_avatar_skin_id,
            );
            assert(special_reward.kind == cosmetic_kind::AVATAR, 'special_cos');

            world.write_model(
                @ProgressionConfig {
                    singleton_id: PROGRESSION_CONFIG_SINGLETON_ID,
                    base_xp_per_level: payload.base_xp_per_level,
                    level_xp_growth: payload.level_xp_growth,
                    level_up_coin_reward: payload.level_up_coin_reward,
                    correct_answer_xp: payload.correct_answer_xp,
                    exit_home_xp: payload.exit_home_xp,
                    capture_xp: payload.capture_xp,
                    bonus_questions_xp: payload.bonus_questions_xp,
                    bonus_captures_xp: payload.bonus_captures_xp,
                    bonus_participation_xp: payload.bonus_participation_xp,
                    special_reward_level: payload.special_reward_level,
                    special_reward_avatar_skin_id: payload.special_reward_avatar_skin_id,
                },
            );
        }

        fn set_placement_reward(ref self: ContractState, place: u8, payload: PlacementRewardPayload) {
            assert(place >= 1 && place <= 4, 'place');

            let mut world = self.world_default();
            let caller = get_caller_address();
            assert_admin_or_init(ref world, caller);

            world.write_model(@PlacementRewardConfig {
                place,
                base_xp: payload.base_xp,
                base_coins: payload.base_coins,
            });
        }

        fn set_cosmetic_definition(
            ref self: ContractState, kind: u8, item_id: u8, payload: CosmeticDefinitionPayload,
        ) {
            assert_known_cosmetic_kind(kind);
            assert(payload.required_level >= 1, 'req_level');

            if !payload.purchasable {
                assert(payload.price_coins == 0, 'starter_price');
            }

            let mut world = self.world_default();
            let caller = get_caller_address();
            assert_admin_or_init(ref world, caller);

            world.write_model(@CosmeticDefinition {
                kind,
                item_id,
                price_coins: payload.price_coins,
                required_level: payload.required_level,
                enabled: payload.enabled,
                purchasable: payload.purchasable,
            });
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn world_default(self: @ContractState) -> dojo::world::WorldStorage {
            self.world(@"parquiz")
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

    fn assert_known_cosmetic_kind(kind: u8) {
        assert(
            kind == cosmetic_kind::AVATAR || kind == cosmetic_kind::DICE
                || kind == cosmetic_kind::TOKEN || kind == cosmetic_kind::BOARD,
            'cos_kind',
        );
    }

    fn load_cosmetic_definition(
        ref world: dojo::world::WorldStorage, kind: u8, item_id: u8,
    ) -> CosmeticDefinition {
        let definition: CosmeticDefinition = world.read_model((kind, item_id));
        assert(definition.required_level >= 1, 'cosmetic_id');
        definition
    }
}
