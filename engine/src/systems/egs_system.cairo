#[starknet::interface]
pub trait IEgsSystem<T> {
    fn bind_egs_token(ref self: T, game_id: u64, token_id: felt252);
}

#[starknet::interface]
pub trait IMinigameTokenData<T> {
    fn score(self: @T, token_id: felt252) -> u64;
    fn game_over(self: @T, token_id: felt252) -> bool;
    fn score_batch(self: @T, token_ids: Span<felt252>) -> Array<u64>;
    fn game_over_batch(self: @T, token_ids: Span<felt252>) -> Array<bool>;
}

#[starknet::interface]
pub trait IMinigameToken<T> {
    fn is_playable(self: @T, token_id: felt252) -> bool;
    fn assert_is_playable(self: @T, token_id: felt252);
    fn settings_id(self: @T, token_id: felt252) -> u32;
    fn update_game(ref self: T, token_id: felt252);
}

pub const IMINIGAME_ID: felt252 =
    0x1050f9a792acfa175e26783e365e1b0b38ff3440b960d0ffdfc0ff9d7dc9f2a;

#[starknet::interface]
pub trait ISRC5<T> {
    fn supports_interface(self: @T, interface_id: felt252) -> bool;
}

#[starknet::interface]
pub trait IERC721<T> {
    fn owner_of(self: @T, token_id: core::integer::u256) -> starknet::ContractAddress;
}

#[dojo::contract]
pub mod egs_system {
    use crate::constants::{EGS_CONFIG_SINGLETON_ID, MAX_SEATS, egs_link_status};
    use crate::models::{
        BonusState, EgsConfig, EgsSessionBinding, EgsTokenGameLink, Game, GameConfig, GamePlayer,
        GameSeat,
    };
    use dojo::model::ModelStorage;
    use starknet::{ContractAddress, get_caller_address};
    use super::{
        IERC721Dispatcher, IERC721DispatcherTrait, IEgsSystem, IMinigameTokenData,
        IMinigameTokenDispatcher, IMinigameTokenDispatcherTrait, IMINIGAME_ID, ISRC5,
    };

    #[abi(embed_v0)]
    impl SRC5Impl of ISRC5<ContractState> {
        fn supports_interface(self: @ContractState, interface_id: felt252) -> bool {
            interface_id == IMINIGAME_ID
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

    pub fn maybe_publish_settings(ref _world: dojo::world::WorldStorage, _config: GameConfig) {
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
        assert(config.enabled, 'egs_disabled');
        assert(config.token_address != zero_address(), 'token_missing');
    }

    fn zero_address() -> ContractAddress {
        0.try_into().unwrap()
    }
}
