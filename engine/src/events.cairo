use starknet::ContractAddress;

#[derive(Copy, Drop, Serde)]
#[dojo::event]
pub struct LobbyCreated {
    #[key]
    pub game_id: u64,
    #[key]
    pub host: ContractAddress,
    pub config_id: u64,
    pub code_hash: felt252,
}

#[derive(Copy, Drop, Serde)]
#[dojo::event]
pub struct PlayerJoined {
    #[key]
    pub game_id: u64,
    #[key]
    pub player: ContractAddress,
    pub seat: u8,
}

#[derive(Copy, Drop, Serde)]
#[dojo::event]
pub struct PlayerReadyChanged {
    #[key]
    pub game_id: u64,
    #[key]
    pub player: ContractAddress,
    pub is_ready: bool,
}

#[derive(Copy, Drop, Serde)]
#[dojo::event]
pub struct PlayerCustomizationUpdated {
    #[key]
    pub player: ContractAddress,
    pub avatar_skin_id: u8,
    pub dice_skin_id: u8,
    pub token_skin_id: u8,
}

#[derive(Copy, Drop, Serde)]
#[dojo::event]
pub struct GameStarted {
    #[key]
    pub game_id: u64,
    pub config_id: u64,
    pub turn_index: u32,
}

#[derive(Copy, Drop, Serde)]
#[dojo::event]
pub struct TurnStarted {
    #[key]
    pub game_id: u64,
    #[key]
    pub turn_index: u32,
    pub active_player: ContractAddress,
}

#[derive(Copy, Drop, Serde)]
#[dojo::event]
pub struct DiceRolled {
    #[key]
    pub game_id: u64,
    #[key]
    pub turn_index: u32,
    pub dice_1: u8,
    pub dice_2: u8,
}

#[derive(Copy, Drop, Serde)]
#[dojo::event]
pub struct QuestionDrawn {
    #[key]
    pub game_id: u64,
    #[key]
    pub turn_index: u32,
    pub question_id: u64,
}

#[derive(Copy, Drop, Serde)]
#[dojo::event]
pub struct AnswerResolved {
    #[key]
    pub game_id: u64,
    #[key]
    pub player: ContractAddress,
    pub correct: bool,
    pub reward: u32,
}

#[derive(Copy, Drop, Serde)]
#[dojo::event]
pub struct AnswerRevealed {
    #[key]
    pub game_id: u64,
    #[key]
    pub player: ContractAddress,
    pub question_id: u64,
    pub selected_option: u8,
    pub correct: bool,
    pub reward: u32,
}

#[derive(Copy, Drop, Serde)]
#[dojo::event]
pub struct TokenMoved {
    #[key]
    pub game_id: u64,
    #[key]
    pub player: ContractAddress,
    pub token_id: u8,
    pub from_square_ref: u32,
    pub to_square_ref: u32,
    pub die_value: u8,
}

#[derive(Copy, Drop, Serde)]
#[dojo::event]
pub struct TokenCaptured {
    #[key]
    pub game_id: u64,
    pub attacker: ContractAddress,
    pub defender: ContractAddress,
    pub defender_token_id: u8,
    pub square_ref: u32,
    pub bonus_awarded: u8,
}

#[derive(Copy, Drop, Serde)]
#[dojo::event]
pub struct TokenReachedHome {
    #[key]
    pub game_id: u64,
    #[key]
    pub player: ContractAddress,
    pub token_id: u8,
    pub bonus_awarded: u8,
}

#[derive(Copy, Drop, Serde)]
#[dojo::event]
pub struct BonusAwarded {
    #[key]
    pub game_id: u64,
    #[key]
    pub player: ContractAddress,
    pub bonus_type: u8,
    pub pending_bonus_10: u8,
    pub pending_bonus_20: u8,
}

#[derive(Copy, Drop, Serde)]
#[dojo::event]
pub struct BonusConsumed {
    #[key]
    pub game_id: u64,
    #[key]
    pub player: ContractAddress,
    pub bonus_type: u8,
    pub pending_bonus_10: u8,
    pub pending_bonus_20: u8,
}

#[derive(Copy, Drop, Serde)]
#[dojo::event]
pub struct BlockadeCreated {
    #[key]
    pub game_id: u64,
    pub owner: ContractAddress,
    pub square_ref: u32,
}

#[derive(Copy, Drop, Serde)]
#[dojo::event]
pub struct BlockadeBroken {
    #[key]
    pub game_id: u64,
    pub owner: ContractAddress,
    pub square_ref: u32,
}

#[derive(Copy, Drop, Serde)]
#[dojo::event]
pub struct BridgeFormed {
    #[key]
    pub game_id: u64,
    pub owner: ContractAddress,
    pub square_ref: u32,
}

#[derive(Copy, Drop, Serde)]
#[dojo::event]
pub struct BridgeBroken {
    #[key]
    pub game_id: u64,
    pub owner: ContractAddress,
    pub square_ref: u32,
}

#[derive(Copy, Drop, Serde)]
#[dojo::event]
pub struct TurnEnded {
    #[key]
    pub game_id: u64,
    #[key]
    pub turn_index: u32,
    pub next_player: ContractAddress,
}

#[derive(Copy, Drop, Serde)]
#[dojo::event]
pub struct GameWon {
    #[key]
    pub game_id: u64,
    #[key]
    pub winner: ContractAddress,
    pub turn_index: u32,
}
