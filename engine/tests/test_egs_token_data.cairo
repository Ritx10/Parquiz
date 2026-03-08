#[cfg(test)]
mod tests {
    use dojo::model::{ModelStorageTest};
    use dojo::utils::bytearray_hash;
    use dojo::world::WorldStorageTrait;
    use dojo_cairo_test::{
        ContractDef, ContractDefTrait, NamespaceDef, TestResource, WorldStorageTestTrait,
        spawn_test_world,
    };
    use parquiz_engine::constants::{GLOBAL_STATE_SINGLETON_ID, config_status, difficulty_level};
    use parquiz_engine::models::{EgsTokenGameLink, GameConfig, GlobalState};
    use parquiz_engine::systems::egs_system::{
        IMINIGAME_ID, IMINIGAME_SETTINGS_ID, IMinigameSettingsDetailsDispatcher,
        IMinigameSettingsDetailsDispatcherTrait, IMinigameSettingsDispatcher,
        IMinigameSettingsDispatcherTrait, IMinigameTokenDataDispatcher,
        IMinigameTokenDataDispatcherTrait, ISRC5Dispatcher, ISRC5DispatcherTrait,
    };
    use snforge_std::{DeclareResultTrait, declare};
    use starknet::ContractAddress;

    fn zero_address() -> ContractAddress {
        0.try_into().unwrap()
    }

    fn contract_defs() -> Span<ContractDef> {
        let namespace_selector = bytearray_hash(@"parquiz");
        [
            ContractDefTrait::new(@"parquiz", @"egs_system")
                .with_writer_of([namespace_selector].span()),
        ]
            .span()
    }

    fn setup_world() -> (
        dojo::world::WorldStorage, IMinigameTokenDataDispatcher, ISRC5Dispatcher,
    ) {
        let token_link_model = declare("m_EgsTokenGameLink").unwrap().contract_class();
        let global_state_model = declare("m_GlobalState").unwrap().contract_class();
        let game_config_model = declare("m_GameConfig").unwrap().contract_class();
        let world_class = declare("world").unwrap().contract_class();
        let egs_class = declare("egs_system").unwrap().contract_class();

        let namespace = NamespaceDef {
            namespace: "parquiz",
            resources: [
                TestResource::Model(*global_state_model.class_hash),
                TestResource::Model(*game_config_model.class_hash),
                TestResource::Model(*token_link_model.class_hash),
                TestResource::Contract(*egs_class.class_hash),
            ]
                .span(),
        };

        let mut world = spawn_test_world(*world_class.class_hash, [namespace].span());
        world.sync_perms_and_inits(contract_defs());

        let (egs_address, _) = world.dns(@"egs_system").unwrap();
        (
            world,
            IMinigameTokenDataDispatcher { contract_address: egs_address },
            ISRC5Dispatcher { contract_address: egs_address },
        )
    }

    #[test]
    fn egs_system_exposes_minigame_token_data() {
        let (mut world, token_data, src5) = setup_world();

        let first_token_id = 101;
        let second_token_id = 202;

        world.write_model_test(
            @EgsTokenGameLink {
                token_id: first_token_id,
                game_id: 7,
                player: zero_address(),
                config_id: 3,
                score: 777,
                game_over: true,
                won: true,
                lifecycle_status: 1,
            },
        );
        world.write_model_test(
            @EgsTokenGameLink {
                token_id: second_token_id,
                game_id: 8,
                player: zero_address(),
                config_id: 4,
                score: 42,
                game_over: false,
                won: false,
                lifecycle_status: 1,
            },
        );

        assert(src5.supports_interface(IMINIGAME_ID), 'src5 mismatch');
        assert(token_data.score(first_token_id) == 777, 'score mismatch');
        assert(token_data.game_over(first_token_id), 'game over mismatch');

        let score_token_ids = array![first_token_id, second_token_id];
        let game_over_token_ids = array![first_token_id, second_token_id];
        let scores = token_data.score_batch(score_token_ids.span());
        let game_overs = token_data.game_over_batch(game_over_token_ids.span());

        assert(scores.len() == 2, 'scores len');
        assert(*scores.at(0) == 777, 'first score');
        assert(*scores.at(1) == 42, 'second score');

        assert(game_overs.len() == 2, 'status len');
        assert(*game_overs.at(0), 'first status');
        assert(!*game_overs.at(1), 'second status');
    }

    #[test]
    fn egs_system_exposes_locked_game_configs_as_settings() {
        let (mut world, _token_data, src5) = setup_world();
        let (egs_address, _) = world.dns(@"egs_system").unwrap();
        let settings = IMinigameSettingsDispatcher { contract_address: egs_address };
        let settings_details = IMinigameSettingsDetailsDispatcher { contract_address: egs_address };

        world.write_model_test(
            @GlobalState {
                singleton_id: GLOBAL_STATE_SINGLETON_ID,
                next_game_id: 1,
                next_config_id: 4,
            },
        );
        world.write_model_test(
            @GameConfig {
                config_id: 1,
                creator: zero_address(),
                status: config_status::LOCKED,
                answer_time_limit_secs: 30,
                turn_time_limit_secs: 60,
                exit_home_rule: 0,
                difficulty_level: difficulty_level::EASY,
                created_at: 1,
                updated_at: 1,
            },
        );
        world.write_model_test(
            @GameConfig {
                config_id: 2,
                creator: zero_address(),
                status: config_status::DRAFT,
                answer_time_limit_secs: 45,
                turn_time_limit_secs: 90,
                exit_home_rule: 1,
                difficulty_level: difficulty_level::MEDIUM,
                created_at: 1,
                updated_at: 1,
            },
        );
        world.write_model_test(
            @GameConfig {
                config_id: 3,
                creator: zero_address(),
                status: config_status::LOCKED,
                answer_time_limit_secs: 20,
                turn_time_limit_secs: 40,
                exit_home_rule: 2,
                difficulty_level: difficulty_level::HARD,
                created_at: 1,
                updated_at: 1,
            },
        );

        assert(src5.supports_interface(IMINIGAME_SETTINGS_ID), 'settings src5 mismatch');
        assert(settings.settings_exist(1), 'locked settings missing');
        assert(!settings.settings_exist(2), 'draft settings exposed');
        assert(settings_details.settings_count() == 2, 'settings count');

        let first = settings_details.settings_details(1);
        assert(first.settings.len() == 4, 'first settings len');
        let first_setting = *first.settings.at(0);
        let second_setting = *first.settings.at(1);
        assert(first_setting.name == 'difficulty', 'difficulty key');
        assert(first_setting.value == 0, 'difficulty value');
        assert(second_setting.name == 'answer_secs', 'answer key');
        assert(second_setting.value == 30, 'answer timer');

        let batch = settings_details.settings_details_batch(array![1_u32, 3_u32].span());
        assert(batch.len() == 2, 'details batch len');
    }
}
