#[starknet::interface]
pub trait ICustomizationSystem<T> {
    fn set_player_customization(ref self: T, avatar_skin_id: u8, dice_skin_id: u8, token_skin_id: u8);
    fn set_player_loadout(
        ref self: T, avatar_skin_id: u8, dice_skin_id: u8, token_skin_id: u8, board_theme_id: u8,
    );
}

#[dojo::contract]
pub mod customization_system {
    use crate::constants::{
        DEFAULT_AVATAR_SKIN_ID, DEFAULT_BOARD_THEME_ID, DEFAULT_DICE_SKIN_ID,
        DEFAULT_TOKEN_SKIN_ID, cosmetic_kind,
    };
    use crate::events::PlayerCustomizationUpdated;
    use crate::models::PlayerCustomization;
    use crate::systems::profile_system::profile_system::{
        assert_player_owns_cosmetic, ensure_player_profile_initialized,
    };
    use dojo::event::EventStorage;
    use dojo::model::ModelStorage;
    use starknet::{get_block_timestamp, get_caller_address};
    use super::ICustomizationSystem;

    #[abi(embed_v0)]
    impl CustomizationSystemImpl of ICustomizationSystem<ContractState> {
        fn set_player_customization(ref self: ContractState, avatar_skin_id: u8, dice_skin_id: u8, token_skin_id: u8) {
            let mut world = self.world_default();
            let caller = get_caller_address();
            let now = get_block_timestamp();

            ensure_player_profile_initialized(ref world, caller, now);
            let current = load_player_customization(ref world, caller);
            write_player_loadout(
                ref world,
                caller,
                avatar_skin_id,
                dice_skin_id,
                token_skin_id,
                current.board_theme_id,
                now,
            );
        }

        fn set_player_loadout(
            ref self: ContractState, avatar_skin_id: u8, dice_skin_id: u8, token_skin_id: u8, board_theme_id: u8,
        ) {
            let mut world = self.world_default();
            let caller = get_caller_address();
            let now = get_block_timestamp();

            ensure_player_profile_initialized(ref world, caller, now);
            write_player_loadout(
                ref world,
                caller,
                avatar_skin_id,
                dice_skin_id,
                token_skin_id,
                board_theme_id,
                now,
            );
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

        if customization.updated_at > 0 {
            return customization;
        }

        PlayerCustomization {
            player,
            avatar_skin_id: DEFAULT_AVATAR_SKIN_ID,
            dice_skin_id: DEFAULT_DICE_SKIN_ID,
            token_skin_id: DEFAULT_TOKEN_SKIN_ID,
            board_theme_id: DEFAULT_BOARD_THEME_ID,
            updated_at: 0,
        }
    }

    fn write_player_loadout(
        ref world: dojo::world::WorldStorage,
        player: starknet::ContractAddress,
        avatar_skin_id: u8,
        dice_skin_id: u8,
        token_skin_id: u8,
        board_theme_id: u8,
        now: u64,
    ) {
        assert_player_owns_cosmetic(ref world, player, cosmetic_kind::AVATAR, avatar_skin_id);
        assert_player_owns_cosmetic(ref world, player, cosmetic_kind::DICE, dice_skin_id);
        assert_player_owns_cosmetic(ref world, player, cosmetic_kind::TOKEN, token_skin_id);
        assert_player_owns_cosmetic(ref world, player, cosmetic_kind::BOARD, board_theme_id);

        let profile = PlayerCustomization {
            player,
            avatar_skin_id,
            dice_skin_id,
            token_skin_id,
            board_theme_id,
            updated_at: now,
        };

        world.write_model(@profile);
        world.emit_event(@PlayerCustomizationUpdated {
            player,
            avatar_skin_id,
            dice_skin_id,
            token_skin_id,
            board_theme_id,
        });
    }
}
