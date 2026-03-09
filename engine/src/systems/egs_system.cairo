use starknet::ContractAddress;

#[starknet::interface]
pub trait IEgsSystem<T> {
    fn bind_egs_token(ref self: T, game_id: u64, token_id: felt252);
    fn register_egs_game(ref self: T, creator_address: ContractAddress) -> u64;
    fn publish_egs_settings(ref self: T, settings_id: u64);
    fn publish_all_egs_settings(ref self: T);
}

#[derive(Drop, Serde, Copy, Clone)]
pub struct GameContext {
    pub name: felt252,
    pub value: felt252,
}

#[derive(Drop, Serde, Clone)]
pub struct GameContextDetails {
    pub name: ByteArray,
    pub description: ByteArray,
    pub id: Option<u32>,
    pub context: Span<GameContext>,
}

#[derive(Drop, Serde)]
pub struct MintGameParams {
    pub player_name: Option<felt252>,
    pub settings_id: Option<u32>,
    pub start: Option<u64>,
    pub end: Option<u64>,
    pub objective_id: Option<u32>,
    pub context: Option<GameContextDetails>,
    pub client_url: Option<ByteArray>,
    pub renderer_address: Option<ContractAddress>,
    pub skills_address: Option<ContractAddress>,
    pub to: ContractAddress,
    pub soulbound: bool,
    pub paymaster: bool,
    pub salt: u16,
    pub metadata: u16,
}

#[derive(Drop, Serde)]
pub struct MintParams {
    pub game_address: ContractAddress,
    pub player_name: Option<felt252>,
    pub settings_id: Option<u32>,
    pub start: Option<u64>,
    pub end: Option<u64>,
    pub objective_id: Option<u32>,
    pub context: Option<GameContextDetails>,
    pub client_url: Option<ByteArray>,
    pub renderer_address: Option<ContractAddress>,
    pub skills_address: Option<ContractAddress>,
    pub to: ContractAddress,
    pub soulbound: bool,
    pub paymaster: bool,
    pub salt: u16,
    pub metadata: u16,
}

#[starknet::interface]
pub trait IMinigame<T> {
    fn token_address(self: @T) -> ContractAddress;
    fn settings_address(self: @T) -> ContractAddress;
    fn objectives_address(self: @T) -> ContractAddress;
    fn mint_game(
        self: @T,
        player_name: Option<felt252>,
        settings_id: Option<u32>,
        start: Option<u64>,
        end: Option<u64>,
        objective_id: Option<u32>,
        context: Option<GameContextDetails>,
        client_url: Option<ByteArray>,
        renderer_address: Option<ContractAddress>,
        skills_address: Option<ContractAddress>,
        to: ContractAddress,
        soulbound: bool,
        paymaster: bool,
        salt: u16,
        metadata: u16,
    ) -> felt252;
    fn mint_game_batch(self: @T, mints: Array<MintGameParams>) -> Array<felt252>;
}

#[starknet::interface]
pub trait IMinigameTokenData<T> {
    fn score(self: @T, token_id: felt252) -> u64;
    fn game_over(self: @T, token_id: felt252) -> bool;
    fn score_batch(self: @T, token_ids: Span<felt252>) -> Array<u64>;
    fn game_over_batch(self: @T, token_ids: Span<felt252>) -> Array<bool>;
}

#[derive(Drop, Serde, Copy)]
pub struct GameSetting {
    pub name: felt252,
    pub value: felt252,
}

#[derive(Drop, Serde, Clone)]
pub struct GameSettingDetails {
    pub name: ByteArray,
    pub description: ByteArray,
    pub settings: Span<GameSetting>,
}

#[starknet::interface]
pub trait IMinigameSettings<T> {
    fn settings_exist(self: @T, settings_id: u32) -> bool;
    fn settings_exist_batch(self: @T, settings_ids: Span<u32>) -> Array<bool>;
}

#[starknet::interface]
pub trait IMinigameSettingsDetails<T> {
    fn settings_count(self: @T) -> u32;
    fn settings_details(self: @T, settings_id: u32) -> GameSettingDetails;
    fn settings_details_batch(self: @T, settings_ids: Span<u32>) -> Array<GameSettingDetails>;
}

#[starknet::interface]
pub trait IMinigameToken<T> {
    fn game_registry_address(self: @T) -> ContractAddress;
    fn is_playable(self: @T, token_id: felt252) -> bool;
    fn assert_is_playable(self: @T, token_id: felt252);
    fn settings_id(self: @T, token_id: felt252) -> u32;
    fn mint(
        ref self: T,
        game_address: ContractAddress,
        player_name: Option<felt252>,
        settings_id: Option<u32>,
        start: Option<u64>,
        end: Option<u64>,
        objective_id: Option<u32>,
        context: Option<GameContextDetails>,
        client_url: Option<ByteArray>,
        renderer_address: Option<ContractAddress>,
        skills_address: Option<ContractAddress>,
        to: ContractAddress,
        soulbound: bool,
        paymaster: bool,
        salt: u16,
        metadata: u16,
    ) -> felt252;
    fn mint_batch(ref self: T, mints: Array<MintParams>) -> Array<felt252>;
    fn update_game(ref self: T, token_id: felt252);
}

pub const IMINIGAME_ID: felt252 =
    0x3d1730c22937da340212dec5546ff5826895259966fa6a92d1191ab068cc2b4;
pub const IMINIGAME_SETTINGS_ID: felt252 =
    0x1a58ab3ee416cc018f93236fd0bb995de89ee536626c268491121e51a46a0f4;
pub const IMINIGAME_TOKEN_SETTINGS_ID: felt252 =
    0x3c6f5c714fef5141bb7edbbbf738c80782154e825a5675355c937aa9bc07bae;

#[starknet::interface]
pub trait ISRC5<T> {
    fn supports_interface(self: @T, interface_id: felt252) -> bool;
}

#[starknet::interface]
pub trait IERC721<T> {
    fn owner_of(self: @T, token_id: core::integer::u256) -> starknet::ContractAddress;
}

#[starknet::interface]
pub trait IMinigameTokenSettings<T> {
    fn create_settings(
        ref self: T,
        game_address: ContractAddress,
        creator_address: ContractAddress,
        settings_id: u32,
        settings_details: GameSettingDetails,
    );
}

#[starknet::interface]
pub trait IMinigameRegistry<T> {
    fn is_game_registered(self: @T, contract_address: ContractAddress) -> bool;
    fn game_id_from_address(self: @T, contract_address: ContractAddress) -> u64;
    fn register_game(
        ref self: T,
        creator_address: ContractAddress,
        name: ByteArray,
        description: ByteArray,
        developer: ByteArray,
        publisher: ByteArray,
        genre: ByteArray,
        image: ByteArray,
        color: Option<ByteArray>,
        client_url: Option<ByteArray>,
        renderer_address: Option<ContractAddress>,
        royalty_fraction: Option<u128>,
        skills_address: Option<ContractAddress>,
        version: u64,
    ) -> u64;
}

#[dojo::contract]
pub mod egs_system {
    use crate::constants::{
        EGS_CONFIG_SINGLETON_ID, GLOBAL_STATE_SINGLETON_ID, MAX_SEATS, config_status,
        egs_link_status,
    };
    use crate::models::{
        AdminAccount, BonusState, EgsConfig, EgsSessionBinding, EgsTokenGameLink, Game,
        GameConfig, GamePlayer, GameSeat, GlobalState,
    };
    use dojo::model::ModelStorage;
    use starknet::{ContractAddress, get_caller_address, get_contract_address};
    use super::{
        GameSetting, GameSettingDetails, IERC721Dispatcher, IERC721DispatcherTrait, IEgsSystem,
        GameContextDetails, IMinigame, IMinigameRegistryDispatcher,
        IMinigameRegistryDispatcherTrait, IMinigameSettings, IMinigameSettingsDetails,
        IMinigameTokenData, IMinigameTokenDispatcher, IMinigameTokenDispatcherTrait,
        IMinigameTokenSettingsDispatcher, IMinigameTokenSettingsDispatcherTrait,
        IMINIGAME_ID, IMINIGAME_SETTINGS_ID, IMINIGAME_TOKEN_SETTINGS_ID, ISRC5,
        ISRC5Dispatcher, ISRC5DispatcherTrait,
        MintGameParams, MintParams,
    };

    #[abi(embed_v0)]
    impl SRC5Impl of ISRC5<ContractState> {
        fn supports_interface(self: @ContractState, interface_id: felt252) -> bool {
            interface_id == IMINIGAME_ID || interface_id == IMINIGAME_SETTINGS_ID
        }
    }

    #[abi(embed_v0)]
    impl MinigameImpl of IMinigame<ContractState> {
        fn token_address(self: @ContractState) -> ContractAddress {
            let world = self.world_default();
            let config: EgsConfig = world.read_model(EGS_CONFIG_SINGLETON_ID);
            config.token_address
        }

        fn settings_address(self: @ContractState) -> ContractAddress {
            let world = self.world_default();
            let config: EgsConfig = world.read_model(EGS_CONFIG_SINGLETON_ID);
            if config.settings_address != zero_address() {
                return config.settings_address;
            }

            get_contract_address()
        }

        fn objectives_address(self: @ContractState) -> ContractAddress {
            let world = self.world_default();
            let config: EgsConfig = world.read_model(EGS_CONFIG_SINGLETON_ID);
            config.objectives_address
        }

        fn mint_game(
            self: @ContractState,
            player_name: Option<felt252>,
            settings_id: Option<u32>,
            start: Option<u64>,
            end: Option<u64>,
            objective_id: Option<u32>,
            context: Option<GameContextDetails>,
            client_url: Option<ByteArray>,
            renderer_address: Option<ContractAddress>,
            skills_address: Option<ContractAddress>,
            to: ContractAddress,
            soulbound: bool,
            paymaster: bool,
            salt: u16,
            metadata: u16,
        ) -> felt252 {
            let world = self.world_default();
            let config: EgsConfig = world.read_model(EGS_CONFIG_SINGLETON_ID);
            assert_token_contract_ready(config);

            let game_address = get_contract_address();
            token_dispatcher(config)
                .mint(
                    game_address,
                    player_name,
                    settings_id,
                    start,
                    end,
                    objective_id,
                    context,
                    client_url,
                    renderer_address,
                    skills_address,
                    to,
                    soulbound,
                    paymaster,
                    salt,
                    metadata,
                )
        }

        fn mint_game_batch(self: @ContractState, mints: Array<MintGameParams>) -> Array<felt252> {
            let world = self.world_default();
            let config: EgsConfig = world.read_model(EGS_CONFIG_SINGLETON_ID);
            assert_token_contract_ready(config);

            let game_address = get_contract_address();
            let mut mint_params = array![];
            let mut index = 0;

            loop {
                if index >= mints.len() {
                    break;
                }

                let mint = mints.at(index);
                let context_clone = match mint.context {
                    Option::Some(ctx) => Option::Some(ctx.clone()),
                    Option::None => Option::None,
                };
                let client_url_clone = match mint.client_url {
                    Option::Some(url) => Option::Some(url.clone()),
                    Option::None => Option::None,
                };

                mint_params
                    .append(
                        MintParams {
                            game_address,
                            player_name: *mint.player_name,
                            settings_id: *mint.settings_id,
                            start: *mint.start,
                            end: *mint.end,
                            objective_id: *mint.objective_id,
                            context: context_clone,
                            client_url: client_url_clone,
                            renderer_address: *mint.renderer_address,
                            skills_address: *mint.skills_address,
                            to: *mint.to,
                            soulbound: *mint.soulbound,
                            paymaster: *mint.paymaster,
                            salt: *mint.salt,
                            metadata: *mint.metadata,
                        },
                    );
                index += 1;
            }

            token_dispatcher(config).mint_batch(mint_params)
        }
    }

    #[abi(embed_v0)]
    impl MinigameTokenDataImpl of IMinigameTokenData<ContractState> {
        fn score(self: @ContractState, token_id: felt252) -> u64 {
            let world = self.world_default();
            let link: EgsTokenGameLink = world.read_model(token_id);
            link.score
        }

        fn game_over(self: @ContractState, token_id: felt252) -> bool {
            let world = self.world_default();
            let link: EgsTokenGameLink = world.read_model(token_id);
            link.game_over
        }

        fn score_batch(self: @ContractState, token_ids: Span<felt252>) -> Array<u64> {
            let mut scores = array![];
            let mut index = 0;

            loop {
                if index >= token_ids.len() {
                    break;
                }

                scores.append(self.score(*token_ids.at(index)));
                index += 1;
            }

            scores
        }

        fn game_over_batch(self: @ContractState, token_ids: Span<felt252>) -> Array<bool> {
            let mut results = array![];
            let mut index = 0;

            loop {
                if index >= token_ids.len() {
                    break;
                }

                results.append(self.game_over(*token_ids.at(index)));
                index += 1;
            }

            results
        }
    }

    #[abi(embed_v0)]
    impl MinigameSettingsImpl of IMinigameSettings<ContractState> {
        fn settings_exist(self: @ContractState, settings_id: u32) -> bool {
            let world = self.world_default();
            settings_exists_internal(@world, settings_id)
        }

        fn settings_exist_batch(self: @ContractState, settings_ids: Span<u32>) -> Array<bool> {
            let mut results = array![];
            let mut index = 0;

            loop {
                if index >= settings_ids.len() {
                    break;
                }

                results.append(self.settings_exist(*settings_ids.at(index)));
                index += 1;
            }

            results
        }
    }

    #[abi(embed_v0)]
    impl MinigameSettingsDetailsImpl of IMinigameSettingsDetails<ContractState> {
        fn settings_count(self: @ContractState) -> u32 {
            let world = self.world_default();
            settings_count_internal(@world)
        }

        fn settings_details(self: @ContractState, settings_id: u32) -> GameSettingDetails {
            let world = self.world_default();
            let config = load_locked_settings_config(@world, settings_id);
            setting_details_from_config(config)
        }

        fn settings_details_batch(
            self: @ContractState, settings_ids: Span<u32>,
        ) -> Array<GameSettingDetails> {
            let mut results = array![];
            let mut index = 0;

            loop {
                if index >= settings_ids.len() {
                    break;
                }

                results.append(self.settings_details(*settings_ids.at(index)));
                index += 1;
            }

            results
        }
    }

    #[abi(embed_v0)]
    impl EgsSystemImpl of IEgsSystem<ContractState> {
        fn bind_egs_token(ref self: ContractState, game_id: u64, token_id: felt252) {
            assert(token_id != 0, 'token_id');

            let mut world = self.world_default();
            let caller = get_caller_address();

            let game: Game = world.read_model(game_id);
            assert(game.game_id == game_id, 'game_missing');

            let player: GamePlayer = world.read_model((game_id, caller));
            assert(player.is_active, 'not_player');

            let existing: EgsSessionBinding = world.read_model((game_id, caller));
            assert(existing.token_id == 0, 'already_bound');

            let token_link: EgsTokenGameLink = world.read_model(token_id);
            assert(token_link.token_id == 0, 'token_bound');

            let config: EgsConfig = world.read_model(EGS_CONFIG_SINGLETON_ID);
            assert_token_contract_ready(config);

            let token = token_dispatcher(config);
            assert_token_owner(config.token_address, token_id, caller);
            token.assert_is_playable(token_id);
            assert(token.settings_id(token_id).into() == game.config_id, 'config_mismatch');

            let bonus: BonusState = world.read_model((game_id, caller));
            let score = compute_egs_score(player, bonus);
            let binding = EgsSessionBinding {
                game_id,
                player: caller,
                token_id,
                config_id: game.config_id,
                score,
                game_over: false,
                won: false,
                lifecycle_status: egs_link_status::ACTIVE,
            };

            world.write_model(@binding);
            write_token_link(ref world, binding);
            sync_token_contract_state(binding, token);
        }

        fn register_egs_game(ref self: ContractState, creator_address: ContractAddress) -> u64 {
            let mut world = self.world_default();
            let caller = get_caller_address();
            assert_admin_or_init(ref world, caller);

            let config: EgsConfig = world.read_model(EGS_CONFIG_SINGLETON_ID);
            assert(config.enabled, 'egs_disabled');
            assert(config.registry_address != zero_address(), 'registry_missing');
            assert(config.token_address != zero_address(), 'token_missing');

            let game_address = get_contract_address();
            if config.adapter_address != zero_address() {
                assert(config.adapter_address == game_address, 'adapter_mismatch');
            }

            let registry = IMinigameRegistryDispatcher { contract_address: config.registry_address };
            if registry.is_game_registered(game_address) {
                return registry.game_id_from_address(game_address);
            }

            registry.register_game(
                creator_address,
                egs_game_name(),
                egs_game_description(),
                egs_game_developer(),
                egs_game_publisher(),
                egs_game_genre(),
                egs_game_image(),
                Option::Some(egs_game_color()),
                Option::None,
                Option::None,
                Option::None,
                Option::None,
                egs_game_version(),
            )
        }

        fn publish_egs_settings(ref self: ContractState, settings_id: u64) {
            let mut world = self.world_default();
            let caller = get_caller_address();
            let config: GameConfig = load_locked_settings_config(@world, settings_id.try_into().unwrap());
            assert_admin_or_config_creator(ref world, caller, config.creator);
            publish_settings_to_token(ref world, config);
        }

        fn publish_all_egs_settings(ref self: ContractState) {
            let mut world = self.world_default();
            let caller = get_caller_address();
            assert_admin_or_init(ref world, caller);

            let state: GlobalState = world.read_model(GLOBAL_STATE_SINGLETON_ID);
            if state.singleton_id != GLOBAL_STATE_SINGLETON_ID || state.next_config_id == 0 {
                return;
            }

            let mut config_id: u64 = 1;
            loop {
                if config_id >= state.next_config_id {
                    break;
                }

                let config: GameConfig = world.read_model(config_id);
                if is_publishable_settings_config(config) {
                    publish_settings_to_token(ref world, config);
                }

                config_id += 1;
            }
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn world_default(self: @ContractState) -> dojo::world::WorldStorage {
            self.world(@"parquiz")
        }
    }

    pub fn compute_egs_score(player: GamePlayer, bonus: BonusState) -> u64 {
        let goal_score: u64 = player.tokens_in_goal.into() * 100_000_u64;
        let coin_score: u64 = player.coins.into();
        let bonus_10_score: u64 = bonus.pending_bonus_10.into() * 10_u64;
        let bonus_20_score: u64 = bonus.pending_bonus_20.into() * 20_u64;
        goal_score + coin_score + bonus_10_score + bonus_20_score
    }

    pub fn assert_bound_token_playable(
        ref world: dojo::world::WorldStorage, game_id: u64, player: ContractAddress,
    ) {
        let binding: EgsSessionBinding = world.read_model((game_id, player));
        if binding.token_id == 0 {
            return;
        }

        let config: EgsConfig = world.read_model(EGS_CONFIG_SINGLETON_ID);
        assert_token_contract_ready(config);
        assert_token_owner(config.token_address, binding.token_id, player);

        let token = token_dispatcher(config);
        token.assert_is_playable(binding.token_id);
        assert(token.settings_id(binding.token_id).into() == binding.config_id, 'config_mismatch');
    }

    pub fn sync_bound_player_state(
        ref world: dojo::world::WorldStorage,
        game_id: u64,
        player: ContractAddress,
        game_over: bool,
        won: bool,
        lifecycle_status: u8,
    ) {
        let mut binding: EgsSessionBinding = world.read_model((game_id, player));
        if binding.token_id == 0 {
            return;
        }

        let player_state: GamePlayer = world.read_model((game_id, player));
        let bonus_state: BonusState = world.read_model((game_id, player));
        binding.score = compute_egs_score(player_state, bonus_state);
        binding.game_over = game_over;
        binding.won = won;
        binding.lifecycle_status = lifecycle_status;

        world.write_model(@binding);
        write_token_link(ref world, binding);
        maybe_sync_token_contract_state(ref world, binding);
    }

    pub fn post_bound_token_action(
        ref world: dojo::world::WorldStorage, game_id: u64, player: ContractAddress,
    ) {
        let binding: EgsSessionBinding = world.read_model((game_id, player));
        if binding.token_id == 0 {
            return;
        }

        maybe_sync_token_contract_state(ref world, binding);
    }

    pub fn sync_bound_players_terminal(
        ref world: dojo::world::WorldStorage,
        game_id: u64,
        winner: ContractAddress,
        lifecycle_status: u8,
    ) {
        let mut seat: u8 = 0;
        loop {
            if seat >= MAX_SEATS {
                break;
            }

            let game_seat: GameSeat = world.read_model((game_id, seat));
            if game_seat.occupied {
                sync_bound_player_state(
                    ref world,
                    game_id,
                    game_seat.player,
                    true,
                    game_seat.player == winner,
                    lifecycle_status,
                );
            }

            seat += 1;
        }
    }

    pub fn maybe_publish_settings(ref world: dojo::world::WorldStorage, config: GameConfig) {
        if !is_publishable_settings_config(config) {
            return;
        }

        publish_settings_to_token(ref world, config);
    }

    pub fn maybe_disable_settings(ref _world: dojo::world::WorldStorage, _config_id: u64) {
    }

    fn write_token_link(ref world: dojo::world::WorldStorage, binding: EgsSessionBinding) {
        world.write_model(
            @EgsTokenGameLink {
                token_id: binding.token_id,
                game_id: binding.game_id,
                player: binding.player,
                config_id: binding.config_id,
                score: binding.score,
                game_over: binding.game_over,
                won: binding.won,
                lifecycle_status: binding.lifecycle_status,
            },
        );
    }

    fn token_dispatcher(config: EgsConfig) -> IMinigameTokenDispatcher {
        IMinigameTokenDispatcher { contract_address: config.token_address }
    }

    fn token_settings_dispatcher(
        config: EgsConfig,
    ) -> IMinigameTokenSettingsDispatcher {
        IMinigameTokenSettingsDispatcher { contract_address: config.token_address }
    }

    fn maybe_sync_token_contract_state(
        ref world: dojo::world::WorldStorage,
        binding: EgsSessionBinding,
    ) {
        let config: EgsConfig = world.read_model(EGS_CONFIG_SINGLETON_ID);
        if !config.enabled || config.token_address == zero_address() {
            return;
        }

        sync_token_contract_state(binding, token_dispatcher(config));
    }

    fn sync_token_contract_state(
        binding: EgsSessionBinding,
        token: IMinigameTokenDispatcher,
    ) {
        token.update_game(binding.token_id);
    }

    fn assert_token_owner(
        token_address: ContractAddress, token_id: felt252, expected_owner: ContractAddress,
    ) {
        let erc721 = IERC721Dispatcher { contract_address: token_address };
        let owner = erc721.owner_of(token_id.into());
        assert(owner == expected_owner, 'not_token_owner');
    }

    fn assert_token_contract_ready(config: EgsConfig) {
        assert(config.token_address != zero_address(), 'token_missing');
    }

    fn token_supports_settings_extension(token_address: ContractAddress) -> bool {
        if token_address == zero_address() {
            return false;
        }

        let src5 = ISRC5Dispatcher { contract_address: token_address };
        src5.supports_interface(IMINIGAME_TOKEN_SETTINGS_ID)
    }

    fn settings_exists_internal(world: @dojo::world::WorldStorage, settings_id: u32) -> bool {
        let config_id: u64 = settings_id.into();
        let config: GameConfig = world.read_model(config_id);
        is_publishable_settings_config(config)
    }

    fn settings_count_internal(world: @dojo::world::WorldStorage) -> u32 {
        let state: GlobalState = world.read_model(GLOBAL_STATE_SINGLETON_ID);
        if state.singleton_id != GLOBAL_STATE_SINGLETON_ID || state.next_config_id == 0 {
            return 0;
        }

        let mut count: u32 = 0;
        let mut config_id: u64 = 1;
        loop {
            if config_id >= state.next_config_id {
                break;
            }

            let config: GameConfig = world.read_model(config_id);
            if is_publishable_settings_config(config) {
                count += 1;
            }

            config_id += 1;
        }

        count
    }

    fn load_locked_settings_config(
        world: @dojo::world::WorldStorage, settings_id: u32,
    ) -> GameConfig {
        let config_id: u64 = settings_id.into();
        let config: GameConfig = world.read_model(config_id);
        assert(is_publishable_settings_config(config), 'settings_missing');
        config
    }

    fn is_publishable_settings_config(config: GameConfig) -> bool {
        config.config_id != 0 && config.status == config_status::LOCKED
    }

    fn setting_details_from_config(config: GameConfig) -> GameSettingDetails {
        GameSettingDetails {
            name: settings_name(),
            description: settings_description(),
            settings: array![
                GameSetting { name: 'answer_secs', value: config.answer_time_limit_secs.into() },
                GameSetting { name: 'turn_secs', value: config.turn_time_limit_secs.into() },
                GameSetting { name: 'exit_rule', value: config.exit_home_rule.into() },
            ]
                .span(),
        }
    }

    fn settings_name() -> ByteArray {
        "ParQuiz Timed Match"
    }

    fn settings_description() -> ByteArray {
        "On-chain ParQuiz settings with answer timer, turn timer, and exit rule."
    }

    fn publish_settings_to_token(ref world: dojo::world::WorldStorage, game_config: GameConfig) {
        let config: EgsConfig = world.read_model(EGS_CONFIG_SINGLETON_ID);
        if !config.enabled || config.token_address == zero_address() {
            return;
        }
        if config.adapter_address == zero_address() {
            return;
        }
        if get_contract_address() != config.adapter_address {
            return;
        }
        if !token_supports_settings_extension(config.token_address) {
            return;
        }

        token_settings_dispatcher(config)
            .create_settings(
                config.adapter_address,
                game_config.creator,
                game_config.config_id.try_into().unwrap(),
                setting_details_from_config(game_config),
            );
    }

    fn assert_admin_or_init(ref world: dojo::world::WorldStorage, caller: ContractAddress) {
        let mut admin: AdminAccount = world.read_model(GLOBAL_STATE_SINGLETON_ID);

        if admin.singleton_id != GLOBAL_STATE_SINGLETON_ID || admin.account == zero_address() {
            admin = AdminAccount { singleton_id: GLOBAL_STATE_SINGLETON_ID, account: caller };
            world.write_model(@admin);
        }

        assert(admin.account == caller, 'not_admin');
    }

    fn assert_admin_or_config_creator(
        ref world: dojo::world::WorldStorage,
        caller: ContractAddress,
        config_creator: ContractAddress,
    ) {
        let mut admin: AdminAccount = world.read_model(GLOBAL_STATE_SINGLETON_ID);

        if admin.singleton_id != GLOBAL_STATE_SINGLETON_ID || admin.account == zero_address() {
            admin = AdminAccount { singleton_id: GLOBAL_STATE_SINGLETON_ID, account: caller };
            world.write_model(@admin);
        }

        assert(admin.account == caller || config_creator == caller, 'not_admin_or_creator');
    }

    fn egs_game_name() -> ByteArray {
        "ParQuiz"
    }

    fn egs_game_description() -> ByteArray {
        "A multiplayer Starknet board race where every turn is powered by trivia."
    }

    fn egs_game_developer() -> ByteArray {
        "ParQuiz"
    }

    fn egs_game_publisher() -> ByteArray {
        "ParQuiz"
    }

    fn egs_game_genre() -> ByteArray {
        "Trivia Board Game"
    }

    fn egs_game_image() -> ByteArray {
        "https://raw.githubusercontent.com/Ritx10/Parquiz/main/engine/assets/cover.png"
    }

    fn egs_game_color() -> ByteArray {
        "#F59E0B"
    }

    fn egs_game_version() -> u64 {
        1
    }

    fn zero_address() -> ContractAddress {
        0.try_into().unwrap()
    }
}
