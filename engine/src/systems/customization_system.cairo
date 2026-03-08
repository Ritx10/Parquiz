#[starknet::interface]
pub trait ICustomizationSystem<T> {
    fn set_player_customization(ref self: T, avatar_skin_id: u8, token_skin_id: u8);
}

#[dojo::contract]
pub mod customization_system {
    use crate::constants::{DEFAULT_AVATAR_SKIN_ID, DEFAULT_TOKEN_SKIN_ID};
    use crate::events::PlayerCustomizationUpdated;
    use crate::models::PlayerCustomization;
    use dojo::event::EventStorage;
    use dojo::model::ModelStorage;
    use starknet::{get_block_timestamp, get_caller_address};
    use super::ICustomizationSystem;

    #[abi(embed_v0)]
    impl CustomizationSystemImpl of ICustomizationSystem<ContractState> {
        fn set_player_customization(ref self: ContractState, avatar_skin_id: u8, token_skin_id: u8) {
            let mut world = self.world_default();
            let caller = get_caller_address();
            let now = get_block_timestamp();

            let profile = PlayerCustomization {
                player: caller,
                avatar_skin_id,
                token_skin_id,
                updated_at: now,
            };

            world.write_model(@profile);
            world.emit_event(@PlayerCustomizationUpdated {
                player: caller,
                avatar_skin_id,
                token_skin_id,
            });
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn world_default(self: @ContractState) -> dojo::world::WorldStorage {
            self.world(@"parquiz")
        }
    }

    pub fn load_player_customization(
        ref world: dojo::world::WorldStorage, player: starknet::ContractAddress,
    ) -> PlayerCustomization {
        let customization: PlayerCustomization = world.read_model(player);

        if customization.player == player {
            return customization;
        }

        PlayerCustomization {
            player,
            avatar_skin_id: DEFAULT_AVATAR_SKIN_ID,
            token_skin_id: DEFAULT_TOKEN_SKIN_ID,
            updated_at: 0,
        }
    }
}
