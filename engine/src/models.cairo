use starknet::ContractAddress;

#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct Game {
    #[key]
    pub game_id: u64,
    pub status: u8,
    pub lobby_kind: u8,
    pub player_count: u8,
    pub turn_index: u32,
    pub active_player: ContractAddress,
    pub winner: ContractAddress,
    pub config_id: u64,
    pub lobby_code_hash: felt252,
    pub created_at: u64,
    pub started_at: u64,
    pub updated_at: u64,
}

#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct GlobalState {
    #[key]
    pub singleton_id: u8,
    pub next_game_id: u64,
    pub next_config_id: u64,
}

#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct GlobalDefaults {
    #[key]
    pub singleton_id: u8,
    pub min_players: u8,
    pub default_turn_timeout_secs: u32,
    pub default_question_timeout_secs: u32,
    pub updated_at: u64,
}

#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct AdminAccount {
    #[key]
    pub singleton_id: u8,
    pub account: ContractAddress,
}

#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct VrfConfig {
    #[key]
    pub singleton_id: u8,
    pub provider_address: ContractAddress,
}

#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct PlayerCustomization {
    #[key]
    pub player: ContractAddress,
    pub avatar_skin_id: u8,
    pub dice_skin_id: u8,
    pub token_skin_id: u8,
    pub updated_at: u64,
}

#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct GamePlayerCustomization {
    #[key]
    pub game_id: u64,
    #[key]
    pub player: ContractAddress,
    pub avatar_skin_id: u8,
    pub dice_skin_id: u8,
    pub token_skin_id: u8,
}

#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct GameSeat {
    #[key]
    pub game_id: u64,
    #[key]
    pub seat: u8,
    pub player: ContractAddress,
    pub occupied: bool,
}

#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct LobbyCodeIndex {
    #[key]
    pub code_hash: felt252,
    pub game_id: u64,
    pub is_active: bool,
}

#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct PublicLobbyIndex {
    #[key]
    pub config_id: u64,
    pub game_id: u64,
    pub is_active: bool,
}

#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct GamePlayer {
    #[key]
    pub game_id: u64,
    #[key]
    pub player: ContractAddress,
    pub seat: u8,
    pub color: u8,
    pub coins: u32,
    pub is_active: bool,
    pub tokens_in_base: u8,
    pub tokens_in_goal: u8,
    pub is_ready: bool,
    pub is_host: bool,
}

#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct Token {
    #[key]
    pub game_id: u64,
    #[key]
    pub player: ContractAddress,
    #[key]
    pub token_id: u8,
    pub token_state: u8,
    pub track_pos: u16,
    pub home_lane_pos: u8,
    pub steps_total: u16,
}

#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct TurnState {
    #[key]
    pub game_id: u64,
    pub phase: u8,
    pub active_player: ContractAddress,
    pub dice_1: u8,
    pub dice_2: u8,
    pub die1_used: bool,
    pub die2_used: bool,
    pub question_id: u64,
    pub question_answered: bool,
    pub question_correct: bool,
    pub has_moved_token: bool,
    pub exited_home_this_turn: bool,
    pub first_moved_token_id: u8,
    pub deadline: u64,
}

#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct DiceState {
    #[key]
    pub game_id: u64,
    pub die_a: u8,
    pub die_b: u8,
    pub die_a_used: bool,
    pub die_b_used: bool,
    pub sum_used: bool,
}

#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct BonusState {
    #[key]
    pub game_id: u64,
    #[key]
    pub player: ContractAddress,
    pub pending_bonus_10: u8,
    pub pending_bonus_20: u8,
    pub bonus_consumed: bool,
}

#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct QuestionSet {
    #[key]
    pub set_id: u64,
    pub merkle_root: felt252,
    pub question_count: u32,
    pub version: u32,
    pub enabled: bool,
}

#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct PendingQuestion {
    #[key]
    pub game_id: u64,
    #[key]
    pub turn_index: u32,
    pub set_id: u64,
    pub question_index: u32,
    pub category: u8,
    pub seed_nonce: felt252,
}

#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct GameQuestionCycleState {
    #[key]
    pub game_id: u64,
    #[key]
    pub set_id: u64,
    pub cycle: u32,
    pub used_count: u32,
}

#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct GameQuestionUsageSegment {
    #[key]
    pub game_id: u64,
    #[key]
    pub set_id: u64,
    #[key]
    pub cycle: u32,
    #[key]
    pub segment_index: u32,
    pub used_bitmap: u128,
}

#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct GameConfig {
    #[key]
    pub config_id: u64,
    pub creator: ContractAddress,
    pub status: u8,
    pub answer_time_limit_secs: u32,
    pub turn_time_limit_secs: u32,
    pub exit_home_rule: u8,
    pub created_at: u64,
    pub updated_at: u64,
}

#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct GameRuntimeConfig {
    #[key]
    pub game_id: u64,
    pub answer_time_limit_secs: u32,
    pub turn_time_limit_secs: u32,
    pub exit_home_rule: u8,
}

#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct BoardSquare {
    #[key]
    pub config_id: u64,
    #[key]
    pub square_index: u16,
    pub square_type: u8,
    pub is_safe: bool,
}

#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct SquareOccupancy {
    #[key]
    pub game_id: u64,
    #[key]
    pub square_ref: u32,
    pub seat_0_count: u8,
    pub seat_1_count: u8,
    pub seat_2_count: u8,
    pub seat_3_count: u8,
    pub has_blockade: bool,
    pub blockade_owner_seat: u8,
}

#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct EgsConfig {
    #[key]
    pub singleton_id: u8,
    pub adapter_address: ContractAddress,
    pub registry_address: ContractAddress,
    pub token_address: ContractAddress,
    pub settings_address: ContractAddress,
    pub objectives_address: ContractAddress,
    pub enabled: bool,
}

#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct EgsSessionBinding {
    #[key]
    pub game_id: u64,
    #[key]
    pub player: ContractAddress,
    pub token_id: felt252,
    pub config_id: u64,
    pub score: u64,
    pub game_over: bool,
    pub won: bool,
    pub lifecycle_status: u8,
}

#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct EgsTokenGameLink {
    #[key]
    pub token_id: felt252,
    pub game_id: u64,
    pub player: ContractAddress,
    pub config_id: u64,
    pub score: u64,
    pub game_over: bool,
    pub won: bool,
    pub lifecycle_status: u8,
}
