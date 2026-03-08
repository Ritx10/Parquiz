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
    e_BridgeFormed, e_GameStarted, e_GameWon, e_LobbyCreated, e_PlayerJoined,
    e_PlayerReadyChanged, e_TokenCaptured, e_TokenMoved, e_TokenReachedHome, e_TurnEnded,
    e_TurnStarted,
};
use parquiz_engine::models::{
    BonusState, DiceState, Game, GameConfig, GamePlayer, GlobalState, PublicLobbyIndex, Token,
    TurnState, m_BonusState, m_BoardSquare, m_DiceState, m_Game, m_GameConfig,
    m_GamePlayer, m_GamePlayerCustomization, m_GameRuntimeConfig, m_GameSeat, m_GlobalState,
    m_LobbyCodeIndex, m_PlayerCustomization, m_PublicLobbyIndex, m_SquareOccupancy, m_Token,
    m_TurnState,
};
use parquiz_engine::systems::config_system::IConfigSystemDispatcher;
use parquiz_engine::systems::lobby_system::{
    ILobbySystemDispatcher, ILobbySystemDispatcherTrait, lobby_system,
};
use parquiz_engine::systems::turn_system::{
    ITurnSystemDispatcher, ITurnSystemDispatcherTrait, turn_system,
};
use parquiz_engine::types::{LegalMove, MoveInput};
use snforge_std::{DeclareResultTrait, declare, start_cheat_caller_address, stop_cheat_caller_address};
use starknet::{ClassHash, ContractAddress, contract_address_const};

fn host() -> ContractAddress {
    contract_address_const::<'HOST'>()
}

fn guest() -> ContractAddress {
    contract_address_const::<'GUEST'>()
}

fn namespace_def(
    config_system_hash: ClassHash, lobby_system_hash: ClassHash, turn_system_hash: ClassHash,
) -> NamespaceDef {
    NamespaceDef {
        namespace: "parquiz",
        resources: [
            TestResource::Model(m_GlobalState::TEST_CLASS_HASH),
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
            TestResource::Model(m_GamePlayerCustomization::TEST_CLASS_HASH),
            TestResource::Event(e_LobbyCreated::TEST_CLASS_HASH),
            TestResource::Event(e_PlayerJoined::TEST_CLASS_HASH),
            TestResource::Event(e_PlayerReadyChanged::TEST_CLASS_HASH),
            TestResource::Event(e_AnswerRevealed::TEST_CLASS_HASH),
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
            TestResource::Contract(config_system_hash),
            TestResource::Contract(lobby_system_hash),
            TestResource::Contract(turn_system_hash),
        ]
            .span(),
    }
}

fn contract_defs() -> Span<ContractDef> {
    let namespace_selector = bytearray_hash(@"parquiz");
    [
        ContractDefTrait::new(@"parquiz", @"config_system")
            .with_writer_of([namespace_selector].span()),
        ContractDefTrait::new(@"parquiz", @"lobby_system")
            .with_writer_of([namespace_selector].span()),
        ContractDefTrait::new(@"parquiz", @"turn_system")
            .with_writer_of([namespace_selector].span()),
    ]
        .span()
}

fn setup_world() -> (
    dojo::world::WorldStorage,
    IConfigSystemDispatcher,
    ILobbySystemDispatcher,
    ITurnSystemDispatcher,
) {
    let global_state_model = declare("m_GlobalState").unwrap().contract_class();
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
    let game_player_customization_model = declare("m_GamePlayerCustomization").unwrap().contract_class();
    let lobby_created_event = declare("e_LobbyCreated").unwrap().contract_class();
    let player_joined_event = declare("e_PlayerJoined").unwrap().contract_class();
    let player_ready_changed_event = declare("e_PlayerReadyChanged").unwrap().contract_class();
    let answer_revealed_event = declare("e_AnswerRevealed").unwrap().contract_class();
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
    let world_class = declare("world").unwrap().contract_class();
    let config_class = declare("config_system").unwrap().contract_class();
    let lobby_class = declare("lobby_system").unwrap().contract_class();
    let turn_class = declare("turn_system").unwrap().contract_class();

    let namespace = NamespaceDef {
        namespace: "parquiz",
        resources: [
            TestResource::Model(*global_state_model.class_hash),
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
            TestResource::Model(*game_player_customization_model.class_hash),
            TestResource::Event(*lobby_created_event.class_hash),
            TestResource::Event(*player_joined_event.class_hash),
            TestResource::Event(*player_ready_changed_event.class_hash),
            TestResource::Event(*answer_revealed_event.class_hash),
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
            TestResource::Contract(*config_class.class_hash),
            TestResource::Contract(*lobby_class.class_hash),
            TestResource::Contract(*turn_class.class_hash),
        ]
            .span(),
    };

    let mut world = spawn_test_world(
        *world_class.class_hash, [namespace].span(),
    );
    world.sync_perms_and_inits(contract_defs());

    let (config_address, _) = world.dns(@"config_system").unwrap();
    let (lobby_address, _) = world.dns(@"lobby_system").unwrap();
    let (turn_address, _) = world.dns(@"turn_system").unwrap();

    (
        world,
        IConfigSystemDispatcher { contract_address: config_address },
        ILobbySystemDispatcher { contract_address: lobby_address },
        ITurnSystemDispatcher { contract_address: turn_address },
    )
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
            difficulty_level: 1,
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
    let (mut world, _, lobby_system, _) = setup_world();
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
    let (mut world, _, lobby_system, _) = setup_world();
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
fn bridge_blocks_capture_and_home_bonus_flow() {
    let (mut world, _, lobby_system, turn_system) = setup_world();
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
    let (mut world, _, lobby_system, turn_system) = setup_world();
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
    let (mut world, _, lobby_system, turn_system) = setup_world();
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
    let (mut world, _, lobby_system, turn_system) = setup_world();
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
}
