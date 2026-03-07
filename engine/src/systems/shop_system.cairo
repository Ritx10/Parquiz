use crate::types::{BuyItemPayload, UseItemPayload};

#[starknet::interface]
pub trait IShopSystem<T> {
    fn buy_item(ref self: T, game_id: u64, payload: BuyItemPayload);
    fn use_item(ref self: T, payload: UseItemPayload);
}

#[dojo::contract]
pub mod shop_system {
    use crate::constants::{DEFAULT_MAX_SHOP_PURCHASES_PER_TURN, game_status, item_effect_type, turn_phase};
    use crate::events::{ItemPurchased, ItemUsed};
    use crate::models::{Game, GamePlayer, ItemDef, PlayerItem, Token, TurnState};
    use crate::systems::egs_system::egs_system::{assert_bound_token_playable, sync_bound_player_state};
    use crate::types::{BuyItemPayload, UseItemPayload};
    use dojo::event::EventStorage;
    use dojo::model::ModelStorage;
    use starknet::get_caller_address;
    use super::IShopSystem;

    #[abi(embed_v0)]
    impl ShopSystemImpl of IShopSystem<ContractState> {
        fn buy_item(ref self: ContractState, game_id: u64, payload: BuyItemPayload) {
            let mut world = self.world_default();
            let caller = get_caller_address();

            let game: Game = world.read_model(game_id);
            assert(game.status == game_status::IN_PROGRESS, 'not_live');
            assert(game.active_player == caller, 'not_active');
            assert_bound_token_playable(ref world, game_id, caller);

            let mut turn: TurnState = world.read_model(game_id);
            assert(turn.phase == turn_phase::SHOP_PENDING, 'phase');
            assert(turn.shop_enabled, 'shop_closed');

            assert(
                turn.purchases_this_turn < DEFAULT_MAX_SHOP_PURCHASES_PER_TURN,
                'purchase_limit',
            );

            let item: ItemDef = world.read_model(payload.item_id);
            assert(item.item_id == payload.item_id, 'item_missing');
            assert(item.enabled, 'item_disabled');

            let mut player: GamePlayer = world.read_model((game_id, caller));
            assert(player.is_active, 'not_player');
            assert(player.coins >= item.price, 'no_coins');

            player.coins -= item.price;

            let mut inventory: PlayerItem = world.read_model((game_id, caller, payload.item_id));
            inventory.game_id = game_id;
            inventory.player = caller;
            inventory.item_id = payload.item_id;
            inventory.amount += 1;

            if payload.has_target_token && item.effect_type == item_effect_type::SHIELD {
                let mut token: Token = world.read_model((game_id, caller, payload.target_token_id));
                token.has_shield = true;
                world.write_model(@token);
            }

            turn.purchases_this_turn += 1;

            world.write_model(@player);
            world.write_model(@inventory);
            world.write_model(@turn);
            sync_bound_player_state(
                ref world,
                game_id,
                caller,
                false,
                false,
                crate::constants::egs_link_status::ACTIVE,
            );

            world.emit_event(@ItemPurchased {
                game_id,
                player: caller,
                item_id: payload.item_id,
                amount: inventory.amount,
            });
        }

        fn use_item(ref self: ContractState, payload: UseItemPayload) {
            let mut world = self.world_default();
            let caller = get_caller_address();

            let game: Game = world.read_model(payload.game_id);
            assert(game.status == game_status::IN_PROGRESS, 'not_live');
            assert_bound_token_playable(ref world, payload.game_id, caller);

            let mut inventory: PlayerItem =
                world.read_model((payload.game_id, caller, payload.item_id));
            assert(inventory.amount > 0, 'item_none');

            let item: ItemDef = world.read_model(payload.item_id);
            assert(item.enabled, 'item_disabled');

            inventory.amount -= 1;

            if item.effect_type == item_effect_type::SHIELD {
                let mut token: Token =
                    world.read_model((payload.game_id, payload.target_player, payload.target_token_id));
                token.has_shield = true;
                world.write_model(@token);
            }

            if item.effect_type == item_effect_type::COIN_BOOST {
                let mut player: GamePlayer = world.read_model((payload.game_id, caller));
                player.coins += payload.effect_value;
                world.write_model(@player);
            }

            if item.effect_type == item_effect_type::REROLL_ONE_DIE {
                let mut turn: TurnState = world.read_model(payload.game_id);
                if !turn.die1_used {
                    turn.dice_1 = ((turn.dice_1 % 6) + 1).try_into().unwrap();
                } else {
                    turn.dice_2 = ((turn.dice_2 % 6) + 1).try_into().unwrap();
                }
                world.write_model(@turn);
            }

            world.write_model(@inventory);
            sync_bound_player_state(
                ref world,
                payload.game_id,
                caller,
                false,
                false,
                crate::constants::egs_link_status::ACTIVE,
            );
            world.emit_event(@ItemUsed {
                game_id: payload.game_id,
                player: caller,
                item_id: payload.item_id,
                target_player: payload.target_player,
                target_token_id: payload.target_token_id,
            });
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn world_default(self: @ContractState) -> dojo::world::WorldStorage {
            self.world(@"parchis_trivia")
        }
    }

}
