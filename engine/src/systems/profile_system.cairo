#[starknet::interface]
pub trait IProfileSystem<T> {
    fn ensure_player_profile(ref self: T);
    fn purchase_cosmetic(ref self: T, kind: u8, item_id: u8);
}

#[dojo::contract]
pub mod profile_system {
    use crate::constants::{
        DEFAULT_AVATAR_SKIN_ID, DEFAULT_BOARD_THEME_ID, DEFAULT_DICE_SKIN_ID,
        DEFAULT_TOKEN_SKIN_ID, PROGRESSION_CONFIG_SINGLETON_ID, STARTER_AVATAR_SKIN_ID_0,
        STARTER_AVATAR_SKIN_ID_1, STARTER_AVATAR_SKIN_ID_2, STARTER_AVATAR_SKIN_ID_3,
        STARTER_AVATAR_SKIN_ID_4, STARTER_AVATAR_SKIN_ID_5, STARTER_AVATAR_SKIN_ID_6,
        STARTER_AVATAR_SKIN_ID_7, STARTER_DICE_SKIN_ID, STARTER_TOKEN_SKIN_BLUE_ID,
        STARTER_TOKEN_SKIN_GREEN_ID, STARTER_TOKEN_SKIN_RED_ID,
        STARTER_TOKEN_SKIN_YELLOW_ID, cosmetic_kind, inventory_source,
    };
    use crate::events::{
        CosmeticPurchased, InventoryItemGranted, PlayerCustomizationUpdated,
        PlayerProfileInitialized,
    };
    use crate::models::{
        CosmeticDefinition, PlayerCustomization, PlayerInventoryItem, PlayerProfile,
        ProgressionConfig,
    };
    use dojo::event::EventStorage;
    use dojo::model::ModelStorage;
    use starknet::{ContractAddress, get_block_timestamp, get_caller_address};
    use super::IProfileSystem;

    #[abi(embed_v0)]
    impl ProfileSystemImpl of IProfileSystem<ContractState> {
        fn ensure_player_profile(ref self: ContractState) {
            let mut world = self.world_default();
            let caller = get_caller_address();
            let now = get_block_timestamp();
            ensure_player_profile_initialized(ref world, caller, now);
        }

        fn purchase_cosmetic(ref self: ContractState, kind: u8, item_id: u8) {
            let mut world = self.world_default();
            let caller = get_caller_address();
            let now = get_block_timestamp();

            assert_known_cosmetic_kind(kind);
            ensure_player_profile_initialized(ref world, caller, now);

            let definition = load_cosmetic_definition(ref world, kind, item_id);
            assert(definition.enabled, 'cos_disabled');
            assert(definition.purchasable, 'cos_locked');

            let existing_inventory: PlayerInventoryItem = world.read_model((caller, kind, item_id));
            assert(!existing_inventory.owned, 'already_owned');

            let mut profile: PlayerProfile = world.read_model(caller);
            assert(profile.level >= 1, 'profile_missing');
            assert(profile.level >= definition.required_level, 'level_locked');
            assert(profile.coins >= definition.price_coins, 'coins_low');

            profile.coins -= definition.price_coins;
            profile.updated_at = now;
            world.write_model(@profile);

            grant_inventory_item(ref world, caller, kind, item_id, inventory_source::PURCHASE, now);
            world.emit_event(@CosmeticPurchased {
                player: caller,
                kind,
                item_id,
                price_coins: definition.price_coins,
            });
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn world_default(self: @ContractState) -> dojo::world::WorldStorage {
            self.world(@"parquiz")
        }
    }

    pub fn ensure_player_profile_initialized(
        ref world: dojo::world::WorldStorage, player: ContractAddress, now: u64,
    ) -> PlayerProfile {
        let existing: PlayerProfile = world.read_model(player);
        if existing.level >= 1 {
            return existing;
        }

        let profile = PlayerProfile {
            player,
            level: 1,
            xp: 0,
            coins: 1000,
            created_at: now,
            updated_at: now,
        };
        world.write_model(@profile);
        world.emit_event(@PlayerProfileInitialized {
            player,
            level: profile.level,
            xp: profile.xp,
            coins: profile.coins,
        });

        grant_starter_inventory(ref world, player, now);

        let existing_customization: PlayerCustomization = world.read_model(player);
        if existing_customization.updated_at > 0 {
            migrate_legacy_customization_inventory(ref world, existing_customization, now);
            world.write_model(
                @PlayerCustomization {
                    player,
                    avatar_skin_id: existing_customization.avatar_skin_id,
                    dice_skin_id: existing_customization.dice_skin_id,
                    token_skin_id: existing_customization.token_skin_id,
                    board_theme_id: DEFAULT_BOARD_THEME_ID,
                    updated_at: now,
                },
            );
            world.emit_event(@PlayerCustomizationUpdated {
                player,
                avatar_skin_id: existing_customization.avatar_skin_id,
                dice_skin_id: existing_customization.dice_skin_id,
                token_skin_id: existing_customization.token_skin_id,
                board_theme_id: DEFAULT_BOARD_THEME_ID,
            });
            return profile;
        }

        world.write_model(
            @PlayerCustomization {
                player,
                avatar_skin_id: DEFAULT_AVATAR_SKIN_ID,
                dice_skin_id: DEFAULT_DICE_SKIN_ID,
                token_skin_id: DEFAULT_TOKEN_SKIN_ID,
                board_theme_id: DEFAULT_BOARD_THEME_ID,
                updated_at: now,
            },
        );
        world.emit_event(@PlayerCustomizationUpdated {
            player,
            avatar_skin_id: DEFAULT_AVATAR_SKIN_ID,
            dice_skin_id: DEFAULT_DICE_SKIN_ID,
            token_skin_id: DEFAULT_TOKEN_SKIN_ID,
            board_theme_id: DEFAULT_BOARD_THEME_ID,
        });

        profile
    }

    pub fn assert_player_owns_cosmetic(
        ref world: dojo::world::WorldStorage, player: ContractAddress, kind: u8, item_id: u8,
    ) {
        let inventory: PlayerInventoryItem = world.read_model((player, kind, item_id));
        assert(inventory.owned, 'not_owned');
    }

    pub fn grant_inventory_item(
        ref world: dojo::world::WorldStorage,
        player: ContractAddress,
        kind: u8,
        item_id: u8,
        source: u8,
        acquired_at: u64,
    ) -> bool {
        let existing: PlayerInventoryItem = world.read_model((player, kind, item_id));
        if existing.owned {
            return false;
        }

        world.write_model(
            @PlayerInventoryItem { player, kind, item_id, owned: true, source, acquired_at },
        );
        world.emit_event(@InventoryItemGranted { player, kind, item_id, source });
        true
    }

    pub fn load_progression_config(ref world: dojo::world::WorldStorage) -> ProgressionConfig {
        let config: ProgressionConfig = world.read_model(PROGRESSION_CONFIG_SINGLETON_ID);
        assert(config.special_reward_level >= 1, 'prog_cfg');
        config
    }

    pub fn load_cosmetic_definition(
        ref world: dojo::world::WorldStorage, kind: u8, item_id: u8,
    ) -> CosmeticDefinition {
        let definition: CosmeticDefinition = world.read_model((kind, item_id));
        assert(definition.required_level >= 1, 'cosmetic_id');
        definition
    }

    fn grant_starter_inventory(
        ref world: dojo::world::WorldStorage, player: ContractAddress, now: u64,
    ) {
        grant_inventory_item(
            ref world, player, cosmetic_kind::AVATAR, STARTER_AVATAR_SKIN_ID_0,
            inventory_source::STARTER, now,
        );
        grant_inventory_item(
            ref world, player, cosmetic_kind::AVATAR, STARTER_AVATAR_SKIN_ID_1,
            inventory_source::STARTER, now,
        );
        grant_inventory_item(
            ref world, player, cosmetic_kind::AVATAR, STARTER_AVATAR_SKIN_ID_2,
            inventory_source::STARTER, now,
        );
        grant_inventory_item(
            ref world, player, cosmetic_kind::AVATAR, STARTER_AVATAR_SKIN_ID_3,
            inventory_source::STARTER, now,
        );
        grant_inventory_item(
            ref world, player, cosmetic_kind::AVATAR, STARTER_AVATAR_SKIN_ID_4,
            inventory_source::STARTER, now,
        );
        grant_inventory_item(
            ref world, player, cosmetic_kind::AVATAR, STARTER_AVATAR_SKIN_ID_5,
            inventory_source::STARTER, now,
        );
        grant_inventory_item(
            ref world, player, cosmetic_kind::AVATAR, STARTER_AVATAR_SKIN_ID_6,
            inventory_source::STARTER, now,
        );
        grant_inventory_item(
            ref world, player, cosmetic_kind::AVATAR, STARTER_AVATAR_SKIN_ID_7,
            inventory_source::STARTER, now,
        );
        grant_inventory_item(
            ref world, player, cosmetic_kind::DICE, STARTER_DICE_SKIN_ID,
            inventory_source::STARTER, now,
        );
        grant_inventory_item(
            ref world, player, cosmetic_kind::TOKEN, STARTER_TOKEN_SKIN_RED_ID,
            inventory_source::STARTER, now,
        );
        grant_inventory_item(
            ref world, player, cosmetic_kind::TOKEN, STARTER_TOKEN_SKIN_BLUE_ID,
            inventory_source::STARTER, now,
        );
        grant_inventory_item(
            ref world, player, cosmetic_kind::TOKEN, STARTER_TOKEN_SKIN_GREEN_ID,
            inventory_source::STARTER, now,
        );
        grant_inventory_item(
            ref world, player, cosmetic_kind::TOKEN, STARTER_TOKEN_SKIN_YELLOW_ID,
            inventory_source::STARTER, now,
        );
        grant_inventory_item(
            ref world, player, cosmetic_kind::BOARD, DEFAULT_BOARD_THEME_ID,
            inventory_source::STARTER, now,
        );
    }

    fn migrate_legacy_customization_inventory(
        ref world: dojo::world::WorldStorage, customization: PlayerCustomization, now: u64,
    ) {
        grant_inventory_item(
            ref world, customization.player, cosmetic_kind::AVATAR, customization.avatar_skin_id,
            inventory_source::MIGRATION, now,
        );
        grant_inventory_item(
            ref world, customization.player, cosmetic_kind::DICE, customization.dice_skin_id,
            inventory_source::MIGRATION, now,
        );
        grant_inventory_item(
            ref world, customization.player, cosmetic_kind::TOKEN, customization.token_skin_id,
            inventory_source::MIGRATION, now,
        );
    }

    fn assert_known_cosmetic_kind(kind: u8) {
        assert(
            kind == cosmetic_kind::AVATAR || kind == cosmetic_kind::DICE
                || kind == cosmetic_kind::TOKEN || kind == cosmetic_kind::BOARD,
            'cos_kind',
        );
    }
}
