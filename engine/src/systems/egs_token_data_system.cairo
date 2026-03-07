#[starknet::interface]
pub trait IMinigameTokenData<T> {
    fn score(self: @T, token_id: felt252) -> u64;
    fn game_over(self: @T, token_id: felt252) -> bool;
    fn score_batch(self: @T, token_ids: Span<felt252>) -> Array<u64>;
    fn game_over_batch(self: @T, token_ids: Span<felt252>) -> Array<bool>;
}

#[dojo::contract]
pub mod egs_token_data_system {
    use crate::models::EgsTokenGameLink;
    use dojo::model::ModelStorage;
    use super::IMinigameTokenData;

    #[abi(embed_v0)]
    impl MinigameTokenDataImpl of IMinigameTokenData<ContractState> {
        fn score(self: @ContractState, token_id: felt252) -> u64 {
            let world = self.world(@"parchis_trivia");
            let link: EgsTokenGameLink = world.read_model(token_id);
            link.score
        }

        fn game_over(self: @ContractState, token_id: felt252) -> bool {
            let world = self.world(@"parchis_trivia");
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
}
