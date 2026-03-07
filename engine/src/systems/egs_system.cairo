#[starknet::interface]
pub trait IEgsSystem<T> {
    fn bind_egs_token(ref self: T, game_id: u64, token_id: felt252);
}

#[starknet::interface]
pub trait IEgsAdapter<T> {
    fn sync_session(ref self: T, token_id: felt252, score: u64, game_over: bool);
}

#[dojo::contract]
pub mod egs_system {
    use crate::constants::EGS_CONFIG_SINGLETON_ID;
    use crate::models::{BonusState, EgsConfig, EgsSessionBinding, Game, GamePlayer};
    use dojo::model::ModelStorage;
    use starknet::{ContractAddress, get_caller_address};
    use super::{IEgsAdapterDispatcher, IEgsAdapterDispatcherTrait, IEgsSystem};

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

            let bonus: BonusState = world.read_model((game_id, caller));
            let score = compute_egs_score(player, bonus);
            let binding = EgsSessionBinding {
                game_id,
                player: caller,
                token_id,
                score,
                game_over: false,
            };

            world.write_model(@binding);
            maybe_sync_adapter(ref world, binding);
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn world_default(self: @ContractState) -> dojo::world::WorldStorage {
            self.world(@"parchis_trivia")
        }
    }

    pub fn compute_egs_score(player: GamePlayer, bonus: BonusState) -> u64 {
        let goal_score: u64 = player.tokens_in_goal.into() * 100_000_u64;
        let coin_score: u64 = player.coins.into();
        let bonus_10_score: u64 = bonus.pending_bonus_10.into() * 10_u64;
        let bonus_20_score: u64 = bonus.pending_bonus_20.into() * 20_u64;
        goal_score + coin_score + bonus_10_score + bonus_20_score
    }

    pub fn maybe_sync_adapter(ref world: dojo::world::WorldStorage, binding: EgsSessionBinding) {
        let config: EgsConfig = world.read_model(EGS_CONFIG_SINGLETON_ID);
        if !config.enabled || config.adapter_address == zero_address() {
            return;
        }

        let adapter = IEgsAdapterDispatcher { contract_address: config.adapter_address };
        adapter.sync_session(binding.token_id, binding.score, binding.game_over);
    }

    fn zero_address() -> ContractAddress {
        0.try_into().unwrap()
    }
}
