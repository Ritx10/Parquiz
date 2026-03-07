pub mod game_status {
    pub const WAITING: u8 = 0;
    pub const IN_PROGRESS: u8 = 1;
    pub const FINISHED: u8 = 2;
    pub const CANCELLED: u8 = 3;
}

pub mod turn_phase {
    pub const ROLL_AND_QUESTION: u8 = 0;
    pub const ANSWER_PENDING: u8 = 1;
    pub const MOVE_PENDING: u8 = 2;
    pub const SHOP_PENDING: u8 = 3;
    pub const TURN_ENDED: u8 = 4;
}

pub mod token_state {
    pub const IN_BASE: u8 = 0;
    pub const ON_TRACK: u8 = 1;
    pub const IN_HOME_LANE: u8 = 2;
    pub const IN_CENTER: u8 = 3;
}

pub mod square_type {
    pub const NORMAL: u8 = 0;
    pub const SAFE_SHOP: u8 = 1;
    pub const START: u8 = 2;
    pub const HOME_ENTRY: u8 = 3;
    pub const HOME_LANE: u8 = 4;
    pub const CENTER: u8 = 5;
}

pub mod item_effect_type {
    pub const SHIELD: u8 = 0;
    pub const REROLL_ONE_DIE: u8 = 1;
    pub const COIN_BOOST: u8 = 2;
}

pub mod difficulty_level {
    pub const EASY: u8 = 0;
    pub const MEDIUM: u8 = 1;
    pub const HARD: u8 = 2;
}

pub mod config_status {
    pub const DRAFT: u8 = 0;
    pub const LOCKED: u8 = 1;
    pub const DISABLED: u8 = 2;
}

pub mod lobby_kind {
    pub const PRIVATE: u8 = 0;
    pub const PUBLIC: u8 = 1;
}

pub mod move_type {
    pub const DIE_A: u8 = 0;
    pub const DIE_B: u8 = 1;
    pub const SUM: u8 = 2;
    pub const BONUS_10: u8 = 3;
    pub const BONUS_20: u8 = 4;
    pub const EXIT_HOME: u8 = 5;
}

pub mod bonus_type {
    pub const NONE: u8 = 0;
    pub const BONUS_10: u8 = 10;
    pub const BONUS_20: u8 = 20;
}

pub mod egs_link_status {
    pub const NONE: u8 = 0;
    pub const ACTIVE: u8 = 1;
    pub const FINISHED: u8 = 2;
    pub const CANCELLED: u8 = 3;
}

pub const TOKENS_PER_PLAYER: u8 = 4;
pub const MIN_PLAYERS: u8 = 2;
pub const MAX_SEATS: u8 = 4;
pub const GLOBAL_STATE_SINGLETON_ID: u8 = 1;
pub const EGS_CONFIG_SINGLETON_ID: u8 = 2;
pub const MAIN_TRACK_LEN: u16 = 68;
pub const HOME_LANE_LEN: u8 = 7;
pub const TRACK_STEPS_TO_HOME_ENTRY: u16 = 63;
pub const DEFAULT_QUESTION_SET_ID: u64 = 1;
pub const DEFAULT_MAX_SHOP_PURCHASES_PER_TURN: u8 = 1;
pub const DEFAULT_ALLOW_SPLIT_DICE: bool = true;
pub const DEFAULT_ALLOW_TWO_STEP_SAME_TOKEN: bool = true;
pub const DEFAULT_ALLOW_SUM_DICE: bool = true;
pub const DEFAULT_REQUIRES_EXACT_HOME: bool = true;
pub const EASY_DIFFICULTY_REWARD_COINS: u32 = 60;
pub const MEDIUM_DIFFICULTY_REWARD_COINS: u32 = 90;
pub const HARD_DIFFICULTY_REWARD_COINS: u32 = 130;
