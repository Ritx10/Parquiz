export type GameConfigApiPayload = {
  answerTimeLimitSecs: number
  turnTimeLimitSecs: number
  exitHomeRule: 0 | 1 | 2
  difficultyLevel: 0 | 1 | 2
  shopEnabledOnSafeSquares: boolean
}

export type GameStatus = 0 | 1 | 2 | 3

export type TurnPhase = 0 | 1 | 2 | 3 | 4

export type TokenState = 0 | 1 | 2 | 3

export type MoveType = 0 | 1 | 2 | 3 | 4 | 5

export type AnswerApiPayload = {
  questionId: bigint
  questionIndex: number
  category: number
  difficulty: number
  correctOption: number
  selectedOption: number
  merkleProof: Array<bigint | number | string>
  merkleDirections: Array<0 | 1>
}

export type MoveApiStep = {
  tokenId: number
  dieValue: number
  actionType: number
}

export type MoveApiPlan = {
  useStep1: boolean
  step1: MoveApiStep
  useStep2: boolean
  step2: MoveApiStep
}

export type ApplyMoveApiPayload = {
  moveType: MoveType
  tokenId: number
  steps: number
}

export type LegalMoveApi = {
  move_type: MoveType
  token_id: number
  steps: number
  target_square_ref: number
}

export type DojoGameModel = {
  game_id: bigint
  status: GameStatus
  lobby_kind: number
  player_count: number
  turn_index: number
  active_player: string
  winner: string
  config_id: bigint
  lobby_code_hash: string
  created_at: bigint
  started_at: bigint
  updated_at: bigint
}

export type DojoTurnStateModel = {
  game_id: bigint
  phase: TurnPhase
  active_player: string
  dice_1: number
  dice_2: number
  die1_used: boolean
  die2_used: boolean
  question_id: bigint
  question_answered: boolean
  question_correct: boolean
  shop_enabled: boolean
  shop_square_ref: number
  purchases_this_turn: number
  has_moved_token: boolean
  first_moved_token_id: number
  deadline: bigint
}

export type DojoGamePlayerModel = {
  game_id: bigint
  player: string
  seat: number
  color: number
  coins: number
  is_active: boolean
  tokens_in_base: number
  tokens_in_goal: number
  is_ready: boolean
  is_host: boolean
}

export type DojoTokenModel = {
  game_id: bigint
  player: string
  token_id: number
  token_state: TokenState
  track_pos: number
  home_lane_pos: number
  steps_total: number
  has_shield: boolean
}

export type DojoDiceStateModel = {
  game_id: bigint
  die_a: number
  die_b: number
  die_a_used: boolean
  die_b_used: boolean
  sum_used: boolean
}

export type DojoBonusStateModel = {
  game_id: bigint
  player: string
  pending_bonus_10: number
  pending_bonus_20: number
  bonus_consumed: boolean
}

export type DojoSquareOccupancyModel = {
  game_id: bigint
  square_ref: number
  seat_0_count: number
  seat_1_count: number
  seat_2_count: number
  seat_3_count: number
  has_blockade: boolean
  blockade_owner_seat: number
}

export type DojoGameRuntimeConfigModel = {
  game_id: bigint
  answer_time_limit_secs: number
  turn_time_limit_secs: number
  exit_home_rule: number
  difficulty_level: number
  shop_enabled_on_safe_squares: boolean
}

export type DojoPendingQuestionModel = {
  game_id: bigint
  turn_index: number
  set_id: bigint
  question_index: number
  category: number
  difficulty: number
  seed_nonce: string
}

export type DojoQuestionSetModel = {
  set_id: bigint
  merkle_root: string
  question_count: number
  version: number
  enabled: boolean
}

export type DojoBoardSquareModel = {
  config_id: bigint
  square_index: number
  square_type: number
  is_safe: boolean
  is_shop: boolean
}

export type DojoGameConfigModel = {
  config_id: bigint
  creator: string
  status: number
  answer_time_limit_secs: number
  turn_time_limit_secs: number
  exit_home_rule: number
  difficulty_level: number
  shop_enabled_on_safe_squares: boolean
  created_at: bigint
  updated_at: bigint
}

export type DojoEgsTokenGameLinkModel = {
  token_id: bigint
  game_id: bigint
  player: string
  config_id: bigint
  score: bigint
  game_over: boolean
  won: boolean
  lifecycle_status: number
}

export type DojoDiceRolledEvent = {
  game_id: bigint
  turn_index: number
  dice_1: number
  dice_2: number
}

export type DojoTokenMovedEvent = {
  game_id: bigint
  player: string
  token_id: number
  from_square_ref: number
  to_square_ref: number
  die_value: number
}

export type DojoTokenCapturedEvent = {
  game_id: bigint
  attacker: string
  defender: string
  defender_token_id: number
  square_ref: number
  bonus_awarded: number
}

export type DojoTokenReachedHomeEvent = {
  game_id: bigint
  player: string
  token_id: number
  bonus_awarded: number
}

export type DojoBridgeEvent = {
  game_id: bigint
  owner: string
  square_ref: number
}

export type DojoTurnEndedEvent = {
  game_id: bigint
  turn_index: number
  next_player: string
}

export type DojoGameWonEvent = {
  game_id: bigint
  winner: string
  turn_index: number
}

export type DojoTrackedEvent =
  | { type: 'DiceRolled'; payload: DojoDiceRolledEvent }
  | { type: 'TokenMoved'; payload: DojoTokenMovedEvent }
  | { type: 'TokenCaptured'; payload: DojoTokenCapturedEvent }
  | { type: 'TokenReachedHome'; payload: DojoTokenReachedHomeEvent }
  | { type: 'BridgeFormed'; payload: DojoBridgeEvent }
  | { type: 'BridgeBroken'; payload: DojoBridgeEvent }
  | { type: 'TurnEnded'; payload: DojoTurnEndedEvent }
  | { type: 'GameWon'; payload: DojoGameWonEvent }

export type BuyItemApiPayload = {
  itemId: number
  targetTokenId?: number
}

export type UseItemApiPayload = {
  gameId: bigint
  itemId: number
  targetPlayer: string
  targetTokenId: number
  effectValue: number
}
