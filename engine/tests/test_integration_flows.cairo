#[cfg(test)]
mod tests {
use dojo::model::{ModelStorage, ModelStorageTest};
use dojo::utils::bytearray_hash;
use dojo::world::WorldStorageTrait;
use dojo_cairo_test::{
    ContractDef, ContractDefTrait, NamespaceDef, TestResource, WorldStorageTestTrait,
    spawn_test_world,
};
use parquiz_engine::constants::{game_status, lobby_kind, move_type, token_state, turn_phase};
use parquiz_engine::events::{
    e_AnswerRevealed, e_BlockadeBroken, e_BlockadeCreated, e_BonusAwarded, e_BridgeBroken,
    e_BridgeFormed, e_CosmeticPurchased, e_GameFinalPlacementSettled, e_GameStarted,
    e_GameWon, e_InventoryItemGranted, e_LobbyCreated, e_PlayerCustomizationUpdated,
    e_PlayerJoined, e_PlayerLevelUp, e_PlayerProfileInitialized,
    e_PlayerProfileRewardApplied, e_PlayerReadyChanged, e_TokenCaptured, e_TokenMoved,
    e_TokenReachedHome, e_TurnEnded, e_TurnStarted,
};
use parquiz_engine::models::{
    BonusState, CosmeticDefinition, DiceState, Game, GameConfig, GameFinalPlacement, GamePlayer, GlobalState, PlacementRewardConfig,
    PlayerCustomization, PlayerInventoryItem, PlayerProfile, ProgressionConfig,
    PublicLobbyIndex, Token, TurnState, m_AdminAccount, m_BonusState, m_BoardSquare,
    m_CosmeticDefinition, m_DiceState, m_Game, m_GameConfig, m_GameFinalPlacement,
    m_GamePlayer, m_GamePlayerCustomization, m_GamePlayerStats, m_GameRuntimeConfig,
    m_GameSeat, m_GlobalState, m_LobbyCodeIndex, m_PlacementRewardConfig,
    m_PlayerCustomization, m_PlayerInventoryItem, m_PlayerProfile,
    m_PlayerProgressionClaim, m_PublicLobbyIndex, m_ProgressionConfig,
    m_SquareOccupancy, m_Token, m_TurnState,
};
use parquiz_engine::systems::config_system::IConfigSystemDispatcher;
use parquiz_engine::systems::admin_system::{IAdminSystemDispatcher, IAdminSystemDispatcherTrait};
use parquiz_engine::systems::customization_system::{
    ICustomizationSystemDispatcher, ICustomizationSystemDispatcherTrait,
};
use parquiz_engine::systems::lobby_system::{
    ILobbySystemDispatcher, ILobbySystemDispatcherTrait, lobby_system,
};
use parquiz_engine::systems::profile_system::{IProfileSystemDispatcher, IProfileSystemDispatcherTrait};
use parquiz_engine::systems::turn_system::{
    ITurnSystemDispatcher, ITurnSystemDispatcherTrait, turn_system,
};
use parquiz_engine::types::{
    CosmeticDefinitionPayload, LegalMove, MoveInput, ProgressionConfigPayload,
};
use snforge_std::{DeclareResultTrait, declare, start_cheat_caller_address, stop_cheat_caller_address};
use starknet::{ClassHash, ContractAddress, contract_address_const};

fn host() -> ContractAddress {
    contract_address_const::<'HOST'>()
}

fn guest() -> ContractAddress {
    contract_address_const::<'GUEST'>()
}

fn namespace_def(
    admin_system_hash: ClassHash,
    config_system_hash: ClassHash,
    customization_system_hash: ClassHash,
    lobby_system_hash: ClassHash,
    profile_system_hash: ClassHash,
    turn_system_hash: ClassHash,
) -> NamespaceDef {
    NamespaceDef {
        namespace: "parquiz",
        resources: [
            TestResource::Model(m_GlobalState::TEST_CLASS_HASH),
            TestResource::Model(m_AdminAccount::TEST_CLASS_HASH),
            TestResource::Model(m_Game::TEST_CLASS_HASH),
            TestResource::Model(m_GameConfig::TEST_CLASS_HASH),
            TestResource::Model(m_LobbyCodeIndex::TEST_CLASS_HASH),
            TestResource::Model(m_PublicLobbyIndex::TEST_CLASS_HASH),
            TestResource::Model(m_GamePlayer::TEST_CLASS_HASH),
            TestResource::Model(m_GameSeat::TEST_CLASS_HASH),
            TestResource::Model(m_Token::TEST_CLASS_HASH),
            TestResource::Model(m_TurnState::TEST_CLASS_HASH),
            TestResource::Model(m_DiceState::TEST_CLASS_HASH),
            TestResource::Model(m_BonusState::TEST_CLASS_HASH),
            TestResource::Model(m_GameRuntimeConfig::TEST_CLASS_HASH),
            TestResource::Model(m_BoardSquare::TEST_CLASS_HASH),
            TestResource::Model(m_SquareOccupancy::TEST_CLASS_HASH),
            TestResource::Model(m_PlayerCustomization::TEST_CLASS_HASH),
            TestResource::Model(m_PlayerProfile::TEST_CLASS_HASH),
            TestResource::Model(m_CosmeticDefinition::TEST_CLASS_HASH),
            TestResource::Model(m_PlayerInventoryItem::TEST_CLASS_HASH),
            TestResource::Model(m_ProgressionConfig::TEST_CLASS_HASH),
            TestResource::Model(m_PlacementRewardConfig::TEST_CLASS_HASH),
            TestResource::Model(m_PlayerProgressionClaim::TEST_CLASS_HASH),
            TestResource::Model(m_GamePlayerCustomization::TEST_CLASS_HASH),
            TestResource::Model(m_GamePlayerStats::TEST_CLASS_HASH),
            TestResource::Model(m_GameFinalPlacement::TEST_CLASS_HASH),
            TestResource::Event(e_LobbyCreated::TEST_CLASS_HASH),
            TestResource::Event(e_PlayerJoined::TEST_CLASS_HASH),
            TestResource::Event(e_PlayerReadyChanged::TEST_CLASS_HASH),
            TestResource::Event(e_AnswerRevealed::TEST_CLASS_HASH),
            TestResource::Event(e_PlayerProfileInitialized::TEST_CLASS_HASH),
            TestResource::Event(e_PlayerProfileRewardApplied::TEST_CLASS_HASH),
            TestResource::Event(e_PlayerLevelUp::TEST_CLASS_HASH),
            TestResource::Event(e_PlayerCustomizationUpdated::TEST_CLASS_HASH),
            TestResource::Event(e_InventoryItemGranted::TEST_CLASS_HASH),
            TestResource::Event(e_CosmeticPurchased::TEST_CLASS_HASH),
            TestResource::Event(e_GameStarted::TEST_CLASS_HASH),
            TestResource::Event(e_TurnStarted::TEST_CLASS_HASH),
            TestResource::Event(e_TokenMoved::TEST_CLASS_HASH),
            TestResource::Event(e_TokenCaptured::TEST_CLASS_HASH),
            TestResource::Event(e_TokenReachedHome::TEST_CLASS_HASH),
            TestResource::Event(e_BonusAwarded::TEST_CLASS_HASH),
            TestResource::Event(e_BlockadeCreated::TEST_CLASS_HASH),
            TestResource::Event(e_BlockadeBroken::TEST_CLASS_HASH),
            TestResource::Event(e_BridgeFormed::TEST_CLASS_HASH),
            TestResource::Event(e_BridgeBroken::TEST_CLASS_HASH),
            TestResource::Event(e_TurnEnded::TEST_CLASS_HASH),
            TestResource::Event(e_GameWon::TEST_CLASS_HASH),
            TestResource::Event(e_GameFinalPlacementSettled::TEST_CLASS_HASH),
            TestResource::Contract(admin_system_hash),
            TestResource::Contract(config_system_hash),
            TestResource::Contract(customization_system_hash),
            TestResource::Contract(lobby_system_hash),
            TestResource::Contract(profile_system_hash),
            TestResource::Contract(turn_system_hash),
        ]
            .span(),
    }
}

fn contract_defs() -> Span<ContractDef> {
    let namespace_selector = bytearray_hash(@"parquiz");
    [
        ContractDefTrait::new(@"parquiz", @"admin_system")
            .with_writer_of([namespace_selector].span()),
        ContractDefTrait::new(@"parquiz", @"config_system")
            .with_writer_of([namespace_selector].span()),
        ContractDefTrait::new(@"parquiz", @"customization_system")
            .with_writer_of([namespace_selector].span()),
        ContractDefTrait::new(@"parquiz", @"lobby_system")
            .with_writer_of([namespace_selector].span()),
        ContractDefTrait::new(@"parquiz", @"profile_system")
            .with_writer_of([namespace_selector].span()),
        ContractDefTrait::new(@"parquiz", @"turn_system")
            .with_writer_of([namespace_selector].span()),
    ]
        .span()
}

fn setup_world() -> (
    dojo::world::WorldStorage,
    IAdminSystemDispatcher,
    IConfigSystemDispatcher,
    ICustomizationSystemDispatcher,
    ILobbySystemDispatcher,
    IProfileSystemDispatcher,
    ITurnSystemDispatcher,
) {
    let global_state_model = declare("m_GlobalState").unwrap().contract_class();
    let admin_account_model = declare("m_AdminAccount").unwrap().contract_class();
    let game_model = declare("m_Game").unwrap().contract_class();
    let game_config_model = declare("m_GameConfig").unwrap().contract_class();
    let lobby_code_index_model = declare("m_LobbyCodeIndex").unwrap().contract_class();
    let public_lobby_index_model = declare("m_PublicLobbyIndex").unwrap().contract_class();
    let game_player_model = declare("m_GamePlayer").unwrap().contract_class();
    let game_seat_model = declare("m_GameSeat").unwrap().contract_class();
    let token_model = declare("m_Token").unwrap().contract_class();
    let turn_state_model = declare("m_TurnState").unwrap().contract_class();
    let dice_state_model = declare("m_DiceState").unwrap().contract_class();
    let bonus_state_model = declare("m_BonusState").unwrap().contract_class();
    let runtime_config_model = declare("m_GameRuntimeConfig").unwrap().contract_class();
    let board_square_model = declare("m_BoardSquare").unwrap().contract_class();
    let square_occupancy_model = declare("m_SquareOccupancy").unwrap().contract_class();
    let player_customization_model = declare("m_PlayerCustomization").unwrap().contract_class();
    let player_profile_model = declare("m_PlayerProfile").unwrap().contract_class();
    let cosmetic_definition_model = declare("m_CosmeticDefinition").unwrap().contract_class();
    let player_inventory_item_model = declare("m_PlayerInventoryItem").unwrap().contract_class();
    let progression_config_model = declare("m_ProgressionConfig").unwrap().contract_class();
    let placement_reward_config_model = declare("m_PlacementRewardConfig").unwrap().contract_class();
    let player_progression_claim_model = declare("m_PlayerProgressionClaim").unwrap().contract_class();
    let game_player_customization_model = declare("m_GamePlayerCustomization").unwrap().contract_class();
    let game_player_stats_model = declare("m_GamePlayerStats").unwrap().contract_class();
    let game_final_placement_model = declare("m_GameFinalPlacement").unwrap().contract_class();
    let lobby_created_event = declare("e_LobbyCreated").unwrap().contract_class();
    let player_joined_event = declare("e_PlayerJoined").unwrap().contract_class();
    let player_ready_changed_event = declare("e_PlayerReadyChanged").unwrap().contract_class();
    let answer_revealed_event = declare("e_AnswerRevealed").unwrap().contract_class();
    let player_profile_initialized_event = declare("e_PlayerProfileInitialized").unwrap().contract_class();
    let player_profile_reward_applied_event = declare("e_PlayerProfileRewardApplied").unwrap().contract_class();
    let player_level_up_event = declare("e_PlayerLevelUp").unwrap().contract_class();
    let player_customization_updated_event = declare("e_PlayerCustomizationUpdated").unwrap().contract_class();
    let inventory_item_granted_event = declare("e_InventoryItemGranted").unwrap().contract_class();
    let cosmetic_purchased_event = declare("e_CosmeticPurchased").unwrap().contract_class();
    let game_started_event = declare("e_GameStarted").unwrap().contract_class();
    let turn_started_event = declare("e_TurnStarted").unwrap().contract_class();
    let token_moved_event = declare("e_TokenMoved").unwrap().contract_class();
    let token_captured_event = declare("e_TokenCaptured").unwrap().contract_class();
    let token_reached_home_event = declare("e_TokenReachedHome").unwrap().contract_class();
    let bonus_awarded_event = declare("e_BonusAwarded").unwrap().contract_class();
    let blockade_created_event = declare("e_BlockadeCreated").unwrap().contract_class();
    let blockade_broken_event = declare("e_BlockadeBroken").unwrap().contract_class();
    let bridge_formed_event = declare("e_BridgeFormed").unwrap().contract_class();
    let bridge_broken_event = declare("e_BridgeBroken").unwrap().contract_class();
    let turn_ended_event = declare("e_TurnEnded").unwrap().contract_class();
    let game_won_event = declare("e_GameWon").unwrap().contract_class();
    let game_final_placement_settled_event = declare("e_GameFinalPlacementSettled").unwrap().contract_class();
    let world_class = declare("world").unwrap().contract_class();
    let admin_class = declare("admin_system").unwrap().contract_class();
    let config_class = declare("config_system").unwrap().contract_class();
    let customization_class = declare("customization_system").unwrap().contract_class();
    let lobby_class = declare("lobby_system").unwrap().contract_class();
    let profile_class = declare("profile_system").unwrap().contract_class();
    let turn_class = declare("turn_system").unwrap().contract_class();

    let namespace = NamespaceDef {
        namespace: "parquiz",
        resources: [
            TestResource::Model(*global_state_model.class_hash),
            TestResource::Model(*admin_account_model.class_hash),
            TestResource::Model(*game_model.class_hash),
            TestResource::Model(*game_config_model.class_hash),
            TestResource::Model(*lobby_code_index_model.class_hash),
            TestResource::Model(*public_lobby_index_model.class_hash),
            TestResource::Model(*game_player_model.class_hash),
            TestResource::Model(*game_seat_model.class_hash),
            TestResource::Model(*token_model.class_hash),
            TestResource::Model(*turn_state_model.class_hash),
            TestResource::Model(*dice_state_model.class_hash),
            TestResource::Model(*bonus_state_model.class_hash),
            TestResource::Model(*runtime_config_model.class_hash),
            TestResource::Model(*board_square_model.class_hash),
            TestResource::Model(*square_occupancy_model.class_hash),
            TestResource::Model(*player_customization_model.class_hash),
            TestResource::Model(*player_profile_model.class_hash),
            TestResource::Model(*cosmetic_definition_model.class_hash),
            TestResource::Model(*player_inventory_item_model.class_hash),
            TestResource::Model(*progression_config_model.class_hash),
            TestResource::Model(*placement_reward_config_model.class_hash),
            TestResource::Model(*player_progression_claim_model.class_hash),
            TestResource::Model(*game_player_customization_model.class_hash),
            TestResource::Model(*game_player_stats_model.class_hash),
            TestResource::Model(*game_final_placement_model.class_hash),
            TestResource::Event(*lobby_created_event.class_hash),
            TestResource::Event(*player_joined_event.class_hash),
            TestResource::Event(*player_ready_changed_event.class_hash),
            TestResource::Event(*answer_revealed_event.class_hash),
            TestResource::Event(*player_profile_initialized_event.class_hash),
            TestResource::Event(*player_profile_reward_applied_event.class_hash),
            TestResource::Event(*player_level_up_event.class_hash),
            TestResource::Event(*player_customization_updated_event.class_hash),
            TestResource::Event(*inventory_item_granted_event.class_hash),
            TestResource::Event(*cosmetic_purchased_event.class_hash),
            TestResource::Event(*game_started_event.class_hash),
            TestResource::Event(*turn_started_event.class_hash),
            TestResource::Event(*token_moved_event.class_hash),
            TestResource::Event(*token_captured_event.class_hash),
            TestResource::Event(*token_reached_home_event.class_hash),
            TestResource::Event(*bonus_awarded_event.class_hash),
            TestResource::Event(*blockade_created_event.class_hash),
            TestResource::Event(*blockade_broken_event.class_hash),
            TestResource::Event(*bridge_formed_event.class_hash),
            TestResource::Event(*bridge_broken_event.class_hash),
            TestResource::Event(*turn_ended_event.class_hash),
            TestResource::Event(*game_won_event.class_hash),
            TestResource::Event(*game_final_placement_settled_event.class_hash),
            TestResource::Contract(*admin_class.class_hash),
            TestResource::Contract(*config_class.class_hash),
            TestResource::Contract(*customization_class.class_hash),
            TestResource::Contract(*lobby_class.class_hash),
            TestResource::Contract(*profile_class.class_hash),
            TestResource::Contract(*turn_class.class_hash),
        ]
            .span(),
    };

    let mut world = spawn_test_world(
        *world_class.class_hash, [namespace].span(),
    );
    world.sync_perms_and_inits(contract_defs());
    seed_progression_data(ref world);

    let (admin_address, _) = world.dns(@"admin_system").unwrap();
    let (config_address, _) = world.dns(@"config_system").unwrap();
    let (customization_address, _) = world.dns(@"customization_system").unwrap();
    let (lobby_address, _) = world.dns(@"lobby_system").unwrap();
    let (profile_address, _) = world.dns(@"profile_system").unwrap();
    let (turn_address, _) = world.dns(@"turn_system").unwrap();

    (
        world,
        IAdminSystemDispatcher { contract_address: admin_address },
        IConfigSystemDispatcher { contract_address: config_address },
        ICustomizationSystemDispatcher { contract_address: customization_address },
        ILobbySystemDispatcher { contract_address: lobby_address },
        IProfileSystemDispatcher { contract_address: profile_address },
        ITurnSystemDispatcher { contract_address: turn_address },
    )
}

fn seed_progression_data(ref world: dojo::world::WorldStorage) {
    world.write_model_test(
        @CosmeticDefinition {
            kind: 0,
            item_id: 0,
            price_coins: 0,
            required_level: 1,
            enabled: true,
            purchasable: false,
        },
    );
    world.write_model_test(
        @ProgressionConfig {
            singleton_id: 4,
            base_xp_per_level: 100,
            level_xp_growth: 50,
            level_up_coin_reward: 50,
            correct_answer_xp: 10,
            exit_home_xp: 5,
            capture_xp: 15,
            bonus_questions_xp: 20,
            bonus_captures_xp: 10,
            bonus_participation_xp: 10,
            special_reward_level: 10,
            special_reward_avatar_skin_id: 0,
        },
    );
    world.write_model_test(@PlacementRewardConfig { place: 1, base_xp: 120, base_coins: 100 });
    world.write_model_test(@PlacementRewardConfig { place: 2, base_xp: 80, base_coins: 60 });
    world.write_model_test(@PlacementRewardConfig { place: 3, base_xp: 50, base_coins: 40 });
    world.write_model_test(@PlacementRewardConfig { place: 4, base_xp: 30, base_coins: 20 });
}

fn seed_locked_config(ref world: dojo::world::WorldStorage) -> u64 {
    let config_id = 1_u64;
    world.write_model_test(
        @GameConfig {
            config_id,
            creator: host(),
            status: 1,
            answer_time_limit_secs: 20,
            turn_time_limit_secs: 45,
            exit_home_rule: 0,
            created_at: 1,
            updated_at: 1,
        },
    );
    config_id
}

fn create_private_game(
    ref world: dojo::world::WorldStorage, lobby_system: ILobbySystemDispatcher, config_id: u64,
    code_hash: felt252,
) -> u64 {
    start_cheat_caller_address(lobby_system.contract_address, host());
    lobby_system.create_lobby(code_hash, config_id);
    stop_cheat_caller_address(lobby_system.contract_address);

    let global_state: GlobalState = world.read_model(1_u8);
    global_state.next_game_id - 1
}

fn join_private_game(lobby_system: ILobbySystemDispatcher, code_hash: felt252) {
    start_cheat_caller_address(lobby_system.contract_address, guest());
    lobby_system.join_lobby_by_code(code_hash);
    stop_cheat_caller_address(lobby_system.contract_address);
}

fn ready_private_players(lobby_system: ILobbySystemDispatcher, game_id: u64) {
    start_cheat_caller_address(lobby_system.contract_address, host());
    lobby_system.set_ready(game_id, true);
    stop_cheat_caller_address(lobby_system.contract_address);

    start_cheat_caller_address(lobby_system.contract_address, guest());
    lobby_system.set_ready(game_id, true);
    stop_cheat_caller_address(lobby_system.contract_address);
}

fn start_private_game(lobby_system: ILobbySystemDispatcher, game_id: u64) {
    start_cheat_caller_address(lobby_system.contract_address, host());
    lobby_system.start_game(game_id);
    stop_cheat_caller_address(lobby_system.contract_address);
}

fn seed_move_phase(
    ref world: dojo::world::WorldStorage, game_id: u64, active_player: ContractAddress, die_a: u8,
    die_b: u8,
) {
    let mut game: Game = world.read_model(game_id);
    game.active_player = active_player;
    game.status = game_status::IN_PROGRESS;
    world.write_model_test(@game);

    let mut turn: TurnState = world.read_model(game_id);
    turn.phase = turn_phase::MOVE_PENDING;
    turn.active_player = active_player;
    turn.dice_1 = die_a;
    turn.dice_2 = die_b;
    turn.die1_used = false;
    turn.die2_used = false;
    turn.has_moved_token = false;
    turn.first_moved_token_id = 0;
    world.write_model_test(@turn);

    world.write_model_test(
        @DiceState {
            game_id,
            die_a,
            die_b,
            die_a_used: false,
            die_b_used: false,
            sum_used: false,
        },
    );
}

fn place_track_token(
    ref world: dojo::world::WorldStorage, game_id: u64, player: ContractAddress, token_id: u8,
    track_pos: u16, steps_total: u16,
) {
    let mut player_state: GamePlayer = world.read_model((game_id, player));
    player_state.tokens_in_base = 3;
    world.write_model_test(@player_state);

    world.write_model_test(
        @Token {
            game_id,
            player,
            token_id,
            token_state: token_state::ON_TRACK,
            track_pos,
            home_lane_pos: 0,
            steps_total,
        },
    );
}

fn count_legal_moves_for_token(mut moves: Array<LegalMove>, token_id: u8) -> u32 {
    let mut count: u32 = 0;
    loop {
        match moves.pop_front() {
            Option::Some(next_move) => {
                if next_move.token_id == token_id {
                    count += 1;
                }
            },
            Option::None => {
                break;
            },
        }
    };
    count
}

fn has_legal_move(mut moves: Array<LegalMove>, token_id: u8, steps: u8) -> bool {
    loop {
        match moves.pop_front() {
            Option::Some(next_move) => {
                if next_move.token_id == token_id && next_move.steps == steps {
                    return true;
                }
            },
            Option::None => {
                break;
            },
        }
    };

    false
}

#[test]
fn private_lobby_flow_starts_after_ready_and_host_start() {
    let (mut world, _, _, _, lobby_system, _, _) = setup_world();
    let config_id = seed_locked_config(ref world);

    let game_id = create_private_game(ref world, lobby_system, config_id, 12345);
    join_private_game(lobby_system, 12345);
    ready_private_players(lobby_system, game_id);
    start_private_game(lobby_system, game_id);

    let game: Game = world.read_model(game_id);
    let turn: TurnState = world.read_model(game_id);
    assert(game.status == game_status::IN_PROGRESS, 'game not started');
    assert(game.lobby_kind == lobby_kind::PRIVATE, 'wrong lobby kind');
    assert(game.player_count == 2, 'wrong player count');
    assert(turn.phase == turn_phase::ROLL_AND_QUESTION, 'wrong turn phase');
}

#[test]
fn public_matchmaking_auto_starts_when_everyone_is_ready() {
    let (mut world, _, _, _, lobby_system, _, _) = setup_world();
    let config_id = seed_locked_config(ref world);

    start_cheat_caller_address(lobby_system.contract_address, host());
    lobby_system.join_public_matchmaking(config_id);
    stop_cheat_caller_address(lobby_system.contract_address);

    let global_state: GlobalState = world.read_model(1_u8);
    let game_id = global_state.next_game_id - 1;

    start_cheat_caller_address(lobby_system.contract_address, guest());
    lobby_system.join_public_matchmaking(config_id);
    stop_cheat_caller_address(lobby_system.contract_address);

    start_cheat_caller_address(lobby_system.contract_address, host());
    lobby_system.set_ready(game_id, true);
    stop_cheat_caller_address(lobby_system.contract_address);

    let waiting_game: Game = world.read_model(game_id);
    assert(waiting_game.status == game_status::WAITING, 'started too early');

    start_cheat_caller_address(lobby_system.contract_address, guest());
    lobby_system.set_ready(game_id, true);
    stop_cheat_caller_address(lobby_system.contract_address);

    let started_game: Game = world.read_model(game_id);
    assert(started_game.status == game_status::IN_PROGRESS, 'public game not started');
    assert(started_game.lobby_kind == lobby_kind::PUBLIC, 'wrong public kind');

    let public_index: PublicLobbyIndex = world.read_model(config_id);
    assert(!public_index.is_active, 'public index still active');
}

#[test]
fn forfeiting_an_active_two_player_game_finishes_it_and_clears_the_player() {
    let (mut world, _, _, _, lobby_system, _, turn_system) = setup_world();
    let config_id = seed_locked_config(ref world);

    let game_id = create_private_game(ref world, lobby_system, config_id, 888);
    join_private_game(lobby_system, 888);
    ready_private_players(lobby_system, game_id);
    start_private_game(lobby_system, game_id);

    start_cheat_caller_address(turn_system.contract_address, guest());
    turn_system.forfeit_game(game_id);
    stop_cheat_caller_address(turn_system.contract_address);

    let game: Game = world.read_model(game_id);
    let guest_player: GamePlayer = world.read_model((game_id, guest()));
    let host_player: GamePlayer = world.read_model((game_id, host()));

    assert(game.status == game_status::FINISHED, 'game not finished');
    assert(game.winner == host(), 'winner not assigned');
    assert(game.player_count == 1, 'remaining player count mismatch');
    assert(!guest_player.is_active, 'guest still active');
    assert(host_player.is_active, 'host should stay active');
}

#[test]
fn bridge_blocks_capture_and_home_bonus_flow() {
    let (mut world, _, _, _, lobby_system, _, turn_system) = setup_world();
    let config_id = seed_locked_config(ref world);

    let game_id = create_private_game(ref world, lobby_system, config_id, 777);
    join_private_game(lobby_system, 777);
    ready_private_players(lobby_system, game_id);
    start_private_game(lobby_system, game_id);

    let host_address = host();
    place_track_token(ref world, game_id, host_address, 0, 10, 10);
    place_track_token(ref world, game_id, guest(), 0, 12, 12);
    seed_move_phase(ref world, game_id, host_address, 2, 4);

    start_cheat_caller_address(turn_system.contract_address, host_address);
    turn_system.apply_move(
        game_id, MoveInput { move_type: move_type::DIE_A, token_id: 0, steps: 2 },
    );
    stop_cheat_caller_address(turn_system.contract_address);

    let captured_token: Token = world.read_model((game_id, guest(), 0));
    let attacker_bonus: BonusState = world.read_model((game_id, host_address));
    assert(captured_token.token_state == token_state::IN_BASE, 'capture missing');
    assert(attacker_bonus.pending_bonus_20 == 1, 'capture bonus missing');

    let mut home_runner: Token = world.read_model((game_id, host_address, 1));
    home_runner.token_state = token_state::IN_HOME_LANE;
    home_runner.home_lane_pos = 6;
    home_runner.steps_total = 70;
    world.write_model_test(@home_runner);

    seed_move_phase(ref world, game_id, host_address, 1, 3);
    start_cheat_caller_address(turn_system.contract_address, host_address);
    turn_system.apply_move(
        game_id, MoveInput { move_type: move_type::DIE_A, token_id: 1, steps: 1 },
    );
    stop_cheat_caller_address(turn_system.contract_address);

    let goal_token: Token = world.read_model((game_id, host_address, 1));
    let host_state: GamePlayer = world.read_model((game_id, host_address));
    let refreshed_bonus: BonusState = world.read_model((game_id, host_address));
    assert(goal_token.token_state == token_state::IN_CENTER, 'goal token missing');
    assert(host_state.tokens_in_goal == 1, 'goal counter missing');
    assert(refreshed_bonus.pending_bonus_10 == 1, 'home bonus missing');
}

#[test]
fn doubles_force_player_to_break_their_bridge_first() {
    let (mut world, _, _, _, lobby_system, _, turn_system) = setup_world();
    let config_id = seed_locked_config(ref world);

    let game_id = create_private_game(ref world, lobby_system, config_id, 888);
    join_private_game(lobby_system, 888);
    ready_private_players(lobby_system, game_id);
    start_private_game(lobby_system, game_id);

    let host_address = host();
    place_track_token(ref world, game_id, host_address, 0, 10, 10);
    place_track_token(ref world, game_id, host_address, 1, 10, 10);
    place_track_token(ref world, game_id, host_address, 2, 20, 20);
    seed_move_phase(ref world, game_id, host_address, 2, 2);

    start_cheat_caller_address(turn_system.contract_address, host_address);
    let legal_moves = turn_system.compute_legal_moves(game_id);
    stop_cheat_caller_address(turn_system.contract_address);

    assert(count_legal_moves_for_token(legal_moves.clone(), 0) > 0, 'bridge token 0 missing');
    assert(count_legal_moves_for_token(legal_moves.clone(), 1) > 0, 'bridge token 1 missing');
    assert(count_legal_moves_for_token(legal_moves, 2) == 0, 'non bridge token allowed');
}

#[test]
fn bridge_blocks_path_until_broken() {
    let (mut world, _, _, _, lobby_system, _, turn_system) = setup_world();
    let config_id = seed_locked_config(ref world);

    let game_id = create_private_game(ref world, lobby_system, config_id, 999);
    join_private_game(lobby_system, 999);
    ready_private_players(lobby_system, game_id);
    start_private_game(lobby_system, game_id);

    let host_address = host();
    place_track_token(ref world, game_id, host_address, 0, 10, 10);
    place_track_token(ref world, game_id, guest(), 0, 12, 12);
    place_track_token(ref world, game_id, guest(), 1, 12, 12);
    seed_move_phase(ref world, game_id, host_address, 4, 1);

    start_cheat_caller_address(turn_system.contract_address, host_address);
    let legal_moves = turn_system.compute_legal_moves(game_id);
    stop_cheat_caller_address(turn_system.contract_address);

    assert(!has_legal_move(legal_moves.clone(), 0, 4), 'bridge should block path');
    assert(has_legal_move(legal_moves, 0, 1), 'short move should stay legal');
}

#[test]
fn reaching_the_fourth_goal_token_finishes_the_game() {
    let (mut world, _, _, _, lobby_system, _, turn_system) = setup_world();
    let config_id = seed_locked_config(ref world);

    let game_id = create_private_game(ref world, lobby_system, config_id, 1111);
    join_private_game(lobby_system, 1111);
    ready_private_players(lobby_system, game_id);
    start_private_game(lobby_system, game_id);

    let host_address = host();
    let mut host_state: GamePlayer = world.read_model((game_id, host_address));
    host_state.tokens_in_base = 0;
    host_state.tokens_in_goal = 3;
    world.write_model_test(@host_state);

    let finishing_token = Token {
        game_id,
        player: host_address,
        token_id: 0,
        token_state: token_state::IN_HOME_LANE,
        track_pos: 0,
        home_lane_pos: 6,
        steps_total: 70,
    };
    world.write_model_test(@finishing_token);

    seed_move_phase(ref world, game_id, host_address, 1, 2);

    start_cheat_caller_address(turn_system.contract_address, host_address);
    turn_system.apply_move(
        game_id, MoveInput { move_type: move_type::DIE_A, token_id: 0, steps: 1 },
    );
    stop_cheat_caller_address(turn_system.contract_address);

    let game: Game = world.read_model(game_id);
    let turn: TurnState = world.read_model(game_id);
    let refreshed_host: GamePlayer = world.read_model((game_id, host_address));
    let goal_token: Token = world.read_model((game_id, host_address, 0));

    assert(goal_token.token_state == token_state::IN_CENTER, 'goal token missing');
    assert(refreshed_host.tokens_in_goal == 4, 'goal counter missing');
    assert(game.status == game_status::FINISHED, 'game not finished');
    assert(game.winner == host_address, 'winner missing');
    assert(turn.phase == turn_phase::TURN_ENDED, 'turn should be closed');
}

#[test]
fn admin_profile_and_loadout_flow_updates_authoritative_models() {
    let (mut world, admin_system, _, customization_system, _, profile_system, _) = setup_world();

    start_cheat_caller_address(admin_system.contract_address, host());
    admin_system.set_cosmetic_definition(
        0,
        11,
        CosmeticDefinitionPayload {
            price_coins: 0,
            required_level: 1,
            enabled: true,
            purchasable: false,
        },
    );
    admin_system.set_progression_config(
        ProgressionConfigPayload {
            base_xp_per_level: 100,
            level_xp_growth: 50,
            level_up_coin_reward: 50,
            correct_answer_xp: 10,
            exit_home_xp: 5,
            capture_xp: 15,
            bonus_questions_xp: 20,
            bonus_captures_xp: 10,
            bonus_participation_xp: 10,
            special_reward_level: 10,
            special_reward_avatar_skin_id: 11,
        },
    );
    admin_system.set_cosmetic_definition(
        3,
        6,
        CosmeticDefinitionPayload {
            price_coins: 0,
            required_level: 1,
            enabled: true,
            purchasable: false,
        },
    );
    stop_cheat_caller_address(admin_system.contract_address);

    start_cheat_caller_address(profile_system.contract_address, host());
    profile_system.ensure_player_profile();
    stop_cheat_caller_address(profile_system.contract_address);

    let profile: PlayerProfile = world.read_model(host());
    let starter_board: PlayerInventoryItem = world.read_model((host(), 3_u8, 0_u8));
    let starter_avatar: PlayerInventoryItem = world.read_model((host(), 0_u8, 0_u8));
    assert(profile.player == host(), 'profile missing');
    assert(profile.level == 1, 'wrong level');
    assert(profile.coins == 1000, 'wrong coins');
    assert(starter_board.owned, 'starter board missing');
    assert(starter_avatar.owned, 'starter avatar missing');

    world.write_model_test(
        @parquiz_engine::models::PlayerInventoryItem {
            player: host(),
            kind: 3,
            item_id: 6,
            owned: true,
            source: 3,
            acquired_at: 1,
        },
    );

    start_cheat_caller_address(customization_system.contract_address, host());
    customization_system.set_player_loadout(0, 0, 2, 6);
    stop_cheat_caller_address(customization_system.contract_address);

    let customization: PlayerCustomization = world.read_model(host());
    let progression: ProgressionConfig = world.read_model(4_u8);
    assert(customization.board_theme_id == 6, 'board theme missing');
    assert(customization.avatar_skin_id == 0, 'avatar changed');
    assert(progression.special_reward_avatar_skin_id == 11, 'progression not updated');
}

#[test]
fn purchasing_a_cosmetic_deducts_coins_and_grants_inventory() {
    let (mut world, admin_system, _, _, _, profile_system, _) = setup_world();

    start_cheat_caller_address(admin_system.contract_address, host());
    admin_system.set_cosmetic_definition(
        3,
        7,
        CosmeticDefinitionPayload {
            price_coins: 250,
            required_level: 1,
            enabled: true,
            purchasable: true,
        },
    );
    stop_cheat_caller_address(admin_system.contract_address);

    start_cheat_caller_address(profile_system.contract_address, host());
    profile_system.ensure_player_profile();
    profile_system.purchase_cosmetic(3, 7);
    stop_cheat_caller_address(profile_system.contract_address);

    let profile: PlayerProfile = world.read_model(host());
    let board_purchase: PlayerInventoryItem = world.read_model((host(), 3_u8, 7_u8));
    assert(profile.coins == 750, 'coins not deducted');
    assert(board_purchase.owned, 'purchase missing');
    assert(board_purchase.source == 1, 'wrong inventory source');
}

#[test]
fn finishing_a_game_settles_placements_and_persistent_rewards() {
    let (mut world, _, _, _, lobby_system, _, turn_system) = setup_world();
    let config_id = seed_locked_config(ref world);

    let game_id = create_private_game(ref world, lobby_system, config_id, 1112);
    join_private_game(lobby_system, 1112);
    ready_private_players(lobby_system, game_id);
    start_private_game(lobby_system, game_id);

    let host_address = host();
    let guest_address = guest();
    let mut host_state: GamePlayer = world.read_model((game_id, host_address));
    host_state.tokens_in_base = 0;
    host_state.tokens_in_goal = 3;
    world.write_model_test(@host_state);

    let finishing_token = Token {
        game_id,
        player: host_address,
        token_id: 0,
        token_state: token_state::IN_HOME_LANE,
        track_pos: 0,
        home_lane_pos: 6,
        steps_total: 70,
    };
    world.write_model_test(@finishing_token);

    seed_move_phase(ref world, game_id, host_address, 1, 2);

    start_cheat_caller_address(turn_system.contract_address, host_address);
    turn_system.apply_move(
        game_id, MoveInput { move_type: move_type::DIE_A, token_id: 0, steps: 1 },
    );
    stop_cheat_caller_address(turn_system.contract_address);

    let first_place: GameFinalPlacement = world.read_model((game_id, host_address));
    let second_place: GameFinalPlacement = world.read_model((game_id, guest_address));
    let host_profile: PlayerProfile = world.read_model(host_address);
    let guest_profile: PlayerProfile = world.read_model(guest_address);

    assert(first_place.place == 1, 'winner placement missing');
    assert(first_place.total_xp == 130, 'winner xp wrong');
    assert(first_place.total_coins == 100, 'winner coins wrong');
    assert(second_place.place == 2, 'runner-up placement missing');
    assert(second_place.total_xp == 90, 'runner-up xp wrong');
    assert(second_place.total_coins == 60, 'runner-up coins wrong');
    assert(host_profile.coins > 1000, 'winner profile not rewarded');
    assert(host_profile.xp == 130, 'winner profile xp wrong');
    assert(guest_profile.coins > 1000, 'runner-up profile not rewarded');
    assert(guest_profile.xp == 90, 'runner-up profile xp wrong');
}
}
