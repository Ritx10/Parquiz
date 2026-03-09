#[cfg(test)]
mod tests {
    use dojo::model::{ModelStorage, ModelStorageTest};
    use dojo::utils::bytearray_hash;
    use dojo::world::WorldStorageTrait;
    use dojo_cairo_test::{
        ContractDef, ContractDefTrait, NamespaceDef, TestResource, WorldStorageTestTrait,
        spawn_test_world,
    };
    use parquiz_engine::constants::{EGS_CONFIG_SINGLETON_ID, config_status};
    use parquiz_engine::models::{EgsConfig, GameConfig};
    use parquiz_engine::systems::config_system::{
        IConfigSystemDispatcher, IConfigSystemDispatcherTrait,
    };
    use parquiz_engine::systems::egs_system::{IEgsSystemDispatcher, IEgsSystemDispatcherTrait};
    use parquiz_engine::types::GameConfigPayload;
    use snforge_std::{DeclareResultTrait, declare, start_cheat_caller_address, stop_cheat_caller_address};
    use starknet::ContractAddress;

    fn host() -> ContractAddress {
        0x111.try_into().unwrap()
    }

    fn zero_address() -> ContractAddress {
        0.try_into().unwrap()
    }

    fn contract_defs() -> Span<ContractDef> {
        let namespace_selector = bytearray_hash(@"parquiz");
        [
            ContractDefTrait::new(@"parquiz", @"config_system")
                .with_writer_of([namespace_selector].span()),
            ContractDefTrait::new(@"parquiz", @"egs_system")
                .with_writer_of([namespace_selector].span()),
        ]
            .span()
    }

    fn setup_world() -> (
        dojo::world::WorldStorage, IConfigSystemDispatcher, IEgsSystemDispatcher, ContractAddress,
        ContractAddress,
    ) {
        let admin_account_model = declare("m_AdminAccount").unwrap().contract_class();
        let egs_config_model = declare("m_EgsConfig").unwrap().contract_class();
        let global_state_model = declare("m_GlobalState").unwrap().contract_class();
        let game_config_model = declare("m_GameConfig").unwrap().contract_class();
        let board_square_model = declare("m_BoardSquare").unwrap().contract_class();
        let world_class = declare("world").unwrap().contract_class();
        let config_class = declare("config_system").unwrap().contract_class();
        let egs_class = declare("egs_system").unwrap().contract_class();

        let namespace = NamespaceDef {
            namespace: "parquiz",
            resources: [
                TestResource::Model(*admin_account_model.class_hash),
                TestResource::Model(*egs_config_model.class_hash),
                TestResource::Model(*global_state_model.class_hash),
                TestResource::Model(*game_config_model.class_hash),
                TestResource::Model(*board_square_model.class_hash),
                TestResource::Contract(*config_class.class_hash),
                TestResource::Contract(*egs_class.class_hash),
            ]
                .span(),
        };

        let mut world = spawn_test_world(*world_class.class_hash, [namespace].span());
        world.sync_perms_and_inits(contract_defs());

        let (config_address, _) = world.dns(@"config_system").unwrap();
        let (egs_address, _) = world.dns(@"egs_system").unwrap();

        (
            world,
            IConfigSystemDispatcher { contract_address: config_address },
            IEgsSystemDispatcher { contract_address: egs_address },
            config_address,
            egs_address,
        )
    }

    #[test]
    fn locking_config_skips_token_publish_when_token_lacks_settings_extension() {
        let (mut world, config_system, _egs_system, _config_address, egs_address) = setup_world();

        world.write_model_test(
            @EgsConfig {
                singleton_id: EGS_CONFIG_SINGLETON_ID,
                adapter_address: egs_address,
                registry_address: zero_address(),
                token_address: egs_address,
                settings_address: egs_address,
                objectives_address: zero_address(),
                enabled: true,
            },
        );

        let config_id = config_system
            .create_game_config(
                GameConfigPayload {
                    answer_time_limit_secs: 30,
                    turn_time_limit_secs: 90,
                    exit_home_rule: 0,
                },
            );

        config_system.lock_game_config(config_id);

        let config: GameConfig = world.read_model(config_id);
        assert(config.status == config_status::LOCKED, 'config not locked');
    }

    #[test]
    fn config_creator_can_publish_egs_settings_from_adapter() {
        let (mut world, config_system, egs_system, config_address, egs_address) = setup_world();

        world.write_model_test(
            @EgsConfig {
                singleton_id: EGS_CONFIG_SINGLETON_ID,
                adapter_address: egs_address,
                registry_address: zero_address(),
                token_address: egs_address,
                settings_address: egs_address,
                objectives_address: zero_address(),
                enabled: true,
            },
        );

        start_cheat_caller_address(config_address, host());
        let config_id = config_system
            .create_game_config(
                GameConfigPayload {
                    answer_time_limit_secs: 30,
                    turn_time_limit_secs: 90,
                    exit_home_rule: 0,
                },
            );
        config_system.lock_game_config(config_id);
        stop_cheat_caller_address(config_address);

        start_cheat_caller_address(egs_address, host());
        egs_system.publish_egs_settings(config_id);
        stop_cheat_caller_address(egs_address);

        let config: GameConfig = world.read_model(config_id);
        assert(config.status == config_status::LOCKED, 'config not locked');
        assert(config.creator == host(), 'config creator mismatch');
    }
}
