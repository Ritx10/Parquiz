use starknet::ContractAddress;

#[derive(Copy, Drop, Serde)]
pub struct GameConfigPayload {
    pub answer_time_limit_secs: u32,
    pub turn_time_limit_secs: u32,
    pub exit_home_rule: u8,
}

#[derive(Copy, Drop, Serde)]
pub struct BoardSquarePayload {
    pub square_type: u8,
    pub is_safe: bool,
}

#[derive(Drop, Serde)]
pub struct AnswerPayload {
    pub question_id: u64,
    pub question_index: u32,
    pub category: u8,
    pub correct_option: u8,
    pub selected_option: u8,
    pub merkle_proof: Array<felt252>,
    pub merkle_directions: Array<u8>,
}

#[derive(Copy, Drop, Serde)]
pub struct MoveStep {
    pub token_id: u8,
    pub die_value: u8,
    pub action_type: u8,
}

#[derive(Copy, Drop, Serde)]
pub struct MoveInput {
    pub move_type: u8,
    pub token_id: u8,
    pub steps: u8,
}

#[derive(Copy, Drop, Serde)]
pub struct LegalMove {
    pub move_type: u8,
    pub token_id: u8,
    pub steps: u8,
    pub target_square_ref: u32,
}

#[derive(Copy, Drop, Serde)]
pub struct MovePlan {
    pub use_step_1: bool,
    pub step_1: MoveStep,
    pub use_step_2: bool,
    pub step_2: MoveStep,
}

#[derive(Copy, Drop, Serde)]
pub struct BuyItemPayload {
    pub item_id: u16,
    pub target_token_id: u8,
    pub has_target_token: bool,
}

#[derive(Copy, Drop, Serde)]
pub struct UseItemPayload {
    pub item_id: u16,
    pub game_id: u64,
    pub target_player: ContractAddress,
    pub target_token_id: u8,
    pub effect_value: u32,
}

#[derive(Copy, Drop, Serde)]
pub struct QuestionSetPayload {
    pub merkle_root: felt252,
    pub question_count: u32,
    pub version: u32,
    pub enabled: bool,
}

#[derive(Copy, Drop, Serde)]
pub struct GlobalDefaultsPayload {
    pub min_players: u8,
    pub default_turn_timeout_secs: u32,
    pub default_question_timeout_secs: u32,
}

#[derive(Copy, Drop, Serde)]
pub struct EgsConfigPayload {
    pub adapter_address: ContractAddress,
    pub registry_address: ContractAddress,
    pub token_address: ContractAddress,
    pub settings_address: ContractAddress,
    pub objectives_address: ContractAddress,
    pub enabled: bool,
}
