import { KeysClause, ToriiQueryBuilder, createClient, parseEntities } from '@dojoengine/sdk'
import type { Entity, Subscription, ToriiClient } from '@dojoengine/torii-client'
import { dojoRuntimeConfig, isDojoConfigured } from '../config/dojo'
import { appEnv } from '../config/env'
import type {
  DojoBoardSquareModel,
  DojoGamePlayerCustomizationModel,
  DojoBonusStateModel,
  DojoEgsTokenGameLinkModel,
  DojoGameConfigModel,
  DojoGameModel,
  DojoGlobalStateModel,
  DojoLobbyCodeIndexModel,
  DojoGamePlayerModel,
  DojoGameRuntimeConfigModel,
  DojoGameWonEvent,
  DojoBridgeEvent,
  DojoDiceRolledEvent,
  DojoDiceStateModel,
  DojoPendingQuestionModel,
  DojoQuestionSetModel,
  DojoPublicLobbyIndexModel,
  DojoSquareOccupancyModel,
  DojoTokenCapturedEvent,
  DojoTokenModel,
  DojoTokenMovedEvent,
  DojoTokenReachedHomeEvent,
  DojoTrackedEvent,
  DojoTurnEndedEvent,
  DojoTurnStateModel,
} from './types'

type RawModel = Record<string, unknown>

type OnchainEventModelName =
  | 'AnswerResolved'
  | 'AnswerRevealed'
  | 'DiceRolled'
  | 'QuestionDrawn'
  | 'TokenMoved'
  | 'TokenCaptured'
  | 'TokenReachedHome'
  | 'BridgeFormed'
  | 'BridgeBroken'
  | 'TurnEnded'
  | 'GameWon'

const SAFE_SPACE_SQUARE_TYPE = 1
const MAX_SEATS = 4
const TOKENS_PER_PLAYER = 4
const MAIN_TRACK_LEN = 68

export type DojoGameSnapshot = {
  game: DojoGameModel | null
  turn_state: DojoTurnStateModel | null
  dice_state: DojoDiceStateModel | null
  runtime_config: DojoGameRuntimeConfigModel | null
  pending_question: DojoPendingQuestionModel | null
  players: DojoGamePlayerModel[]
  player_customizations: DojoGamePlayerCustomizationModel[]
  tokens: DojoTokenModel[]
  bonus_states: DojoBonusStateModel[]
  occupancies: DojoSquareOccupancyModel[]
  safe_track_square_refs: number[]
}

export type ReadDojoGameSnapshotOptions = {
  includeBoardSquares?: boolean
  includePlayerCustomizations?: boolean
}

export type SubscribeDojoGameParams = {
  gameId: bigint
  configId?: bigint
  onStateMutation: () => void
  onTrackedEvent: (event: DojoTrackedEvent) => void
}

const namespace = appEnv.namespace

const modelTag = (name: string) => `${namespace}-${name}`

const emptySnapshot: DojoGameSnapshot = {
  game: null,
  turn_state: null,
  dice_state: null,
  runtime_config: null,
  pending_question: null,
  players: [],
  player_customizations: [],
  tokens: [],
  bonus_states: [],
  occupancies: [],
  safe_track_square_refs: [],
}

const trackedEventModelNames: readonly OnchainEventModelName[] = [
  'AnswerResolved',
  'AnswerRevealed',
  'DiceRolled',
  'QuestionDrawn',
  'TokenMoved',
  'TokenCaptured',
  'TokenReachedHome',
  'BridgeFormed',
  'BridgeBroken',
  'TurnEnded',
  'GameWon',
] as const

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const toBigInt = (value: unknown, fallback = 0n): bigint => {
  if (typeof value === 'bigint') {
    return value
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return BigInt(Math.trunc(value))
  }

  if (typeof value === 'string') {
    const normalized = value.trim()

    if (normalized.length === 0) {
      return fallback
    }

    try {
      if (/^0x[0-9a-f]+$/i.test(normalized) || /^\d+$/.test(normalized)) {
        return BigInt(normalized)
      }
    } catch {
      return fallback
    }
  }

  return fallback
}

const toNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'bigint') {
    return Number(value)
  }

  if (typeof value === 'boolean') {
    return value ? 1 : 0
  }

  if (typeof value === 'string') {
    const normalized = value.trim()

    if (/^0x[0-9a-f]+$/i.test(normalized) || /^\d+$/.test(normalized)) {
      return Number(toBigInt(normalized, BigInt(fallback)))
    }

    const parsed = Number(normalized)

    if (Number.isFinite(parsed)) {
      return parsed
    }
  }

  return fallback
}

const toBoolean = (value: unknown): boolean => {
  if (typeof value === 'boolean') {
    return value
  }

  if (typeof value === 'number') {
    return value !== 0
  }

  if (typeof value === 'bigint') {
    return value !== 0n
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    return normalized === '1' || normalized === 'true'
  }

  return false
}

const normalizeHex = (value: unknown): string => {
  const numeric = toBigInt(value)
  return `0x${numeric.toString(16)}`
}

const normalizeAddress = (value: unknown): string => {
  if (typeof value === 'string') {
    const normalized = value.trim()

    if (normalized.startsWith('0x') || normalized.startsWith('0X')) {
      return normalizeHex(normalized)
    }

    if (/^\d+$/.test(normalized)) {
      return normalizeHex(normalized)
    }

    return normalized
  }

  return normalizeHex(value)
}

const asRawModel = (value: unknown): RawModel | null => (isRecord(value) ? value : null)

const extractModelFromEntity = (entity: { models?: Record<string, Record<string, unknown>> }, modelName: string) => {
  const directNamespace = entity.models?.[namespace]

  if (directNamespace && asRawModel(directNamespace[modelName])) {
    return asRawModel(directNamespace[modelName])
  }

  if (!entity.models) {
    return null
  }

  for (const modelsByNamespace of Object.values(entity.models)) {
    const found = asRawModel(modelsByNamespace[modelName])

    if (found) {
      return found
    }
  }

  return null
}

const extractModels = (items: Entity[], modelName: string): RawModel[] => {
  const parsed = parseEntities<any>(items)

  return parsed
    .map((entity) => extractModelFromEntity(entity, modelName))
    .filter((value): value is RawModel => Boolean(value))
}

const isBigNumberishLike = (value: unknown) => {
  if (typeof value === 'bigint' || typeof value === 'number') {
    return true
  }

  if (typeof value === 'string') {
    const normalized = value.trim()
    return /^0x[0-9a-f]+$/i.test(normalized) || /^\d+$/.test(normalized)
  }

  return false
}

const memberValueMatches = (left: unknown, right: bigint | number | string) => {
  if (isBigNumberishLike(left) && isBigNumberishLike(right)) {
    return toBigInt(left) === toBigInt(right)
  }

  if (typeof left === 'string' && typeof right === 'string') {
    return normalizeAddress(left) === normalizeAddress(right)
  }

  return left === right
}

const buildKeysClause = (modelName: string, keys: Array<bigint | number | string>) =>
  (KeysClause as any)([modelTag(modelName)], keys.map((value) => `${value}`), 'FixedLen').build()

let toriiClientPromise: null | Promise<ToriiClient> = null
const boardSquareCache = new Map<string, Promise<DojoBoardSquareModel[]>>()

const withFallback = async <T,>(promise: Promise<T>, fallback: T): Promise<T> => {
  try {
    return await promise
  } catch {
    return fallback
  }
}

export const getToriiClient = async (): Promise<ToriiClient> => {
  if (!isDojoConfigured) {
    throw new Error('Dojo/Torii is not configured in env vars')
  }

  if (!toriiClientPromise) {
    toriiClientPromise = createClient({
      toriiUrl: dojoRuntimeConfig.toriiUrl,
      worldAddress: dojoRuntimeConfig.worldAddress,
    })
  }

  return toriiClientPromise
}

const fetchModelByKeys = async (
  client: ToriiClient,
  modelName: string,
  keys: Array<bigint | number | string>,
): Promise<null | RawModel> => {
  const query = new ToriiQueryBuilder<any>()
    .withEntityModels([modelTag(modelName) as any])
    .withClause(buildKeysClause(modelName, keys))
    .withLimit(1)

  const response = await client.getEntities(query.build())
  const models = extractModels(response.items, modelName)
  return models[0] ?? null
}

const fetchModelsByKeys = async (
  client: ToriiClient,
  modelName: string,
  keysList: Array<Array<bigint | number | string>>,
): Promise<RawModel[]> => {
  if (keysList.length === 0) {
    return []
  }

  const rows = await Promise.all(keysList.map((keys) => fetchModelByKeys(client, modelName, keys)))
  return rows.filter((row): row is RawModel => Boolean(row))
}

const fetchModelsByMember = async (
  client: ToriiClient,
  modelName: string,
  member: string,
  value: bigint | number | string,
  limit = 256,
): Promise<RawModel[]> => {
  const pageSize = Math.min(Math.max(limit, 32), 256)
  const matches: RawModel[] = []
  let cursor: string | undefined

  while (matches.length < limit) {
    const query = new ToriiQueryBuilder<any>()
      .withEntityModels([modelTag(modelName) as any])
      .withLimit(pageSize)

    if (cursor) {
      query.withCursor(cursor)
    }

    const response = await client.getEntities(query.build())
    const pageMatches = extractModels(response.items, modelName).filter((row) => memberValueMatches(row[member], value))

    matches.push(...pageMatches)

    if (!response.next_cursor || response.items.length === 0) {
      break
    }

    cursor = response.next_cursor
  }

  return matches.slice(0, limit)
}

const normalizeGameModel = (raw: RawModel): DojoGameModel => ({
  game_id: toBigInt(raw.game_id),
  status: toNumber(raw.status) as DojoGameModel['status'],
  lobby_kind: toNumber(raw.lobby_kind),
  player_count: toNumber(raw.player_count),
  turn_index: toNumber(raw.turn_index),
  active_player: normalizeAddress(raw.active_player),
  winner: normalizeAddress(raw.winner),
  config_id: toBigInt(raw.config_id),
  lobby_code_hash: typeof raw.lobby_code_hash === 'string' ? raw.lobby_code_hash : normalizeHex(raw.lobby_code_hash),
  created_at: toBigInt(raw.created_at),
  started_at: toBigInt(raw.started_at),
  updated_at: toBigInt(raw.updated_at),
})

const normalizeTurnStateModel = (raw: RawModel): DojoTurnStateModel => ({
  game_id: toBigInt(raw.game_id),
  phase: toNumber(raw.phase) as DojoTurnStateModel['phase'],
  active_player: normalizeAddress(raw.active_player),
  dice_1: toNumber(raw.dice_1),
  dice_2: toNumber(raw.dice_2),
  die1_used: toBoolean(raw.die1_used),
  die2_used: toBoolean(raw.die2_used),
  question_id: toBigInt(raw.question_id),
  question_answered: toBoolean(raw.question_answered),
  question_correct: toBoolean(raw.question_correct),
  has_moved_token: toBoolean(raw.has_moved_token),
  first_moved_token_id: toNumber(raw.first_moved_token_id),
  deadline: toBigInt(raw.deadline),
})

const normalizeGamePlayerModel = (raw: RawModel): DojoGamePlayerModel => ({
  game_id: toBigInt(raw.game_id),
  player: normalizeAddress(raw.player),
  seat: toNumber(raw.seat),
  color: toNumber(raw.color),
  coins: toNumber(raw.coins),
  is_active: toBoolean(raw.is_active),
  tokens_in_base: toNumber(raw.tokens_in_base),
  tokens_in_goal: toNumber(raw.tokens_in_goal),
  is_ready: toBoolean(raw.is_ready),
  is_host: toBoolean(raw.is_host),
})

const normalizeTokenModel = (raw: RawModel): DojoTokenModel => ({
  game_id: toBigInt(raw.game_id),
  player: normalizeAddress(raw.player),
  token_id: toNumber(raw.token_id),
  token_state: toNumber(raw.token_state) as DojoTokenModel['token_state'],
  track_pos: toNumber(raw.track_pos),
  home_lane_pos: toNumber(raw.home_lane_pos),
  steps_total: toNumber(raw.steps_total),
})

const normalizeDiceStateModel = (raw: RawModel): DojoDiceStateModel => ({
  game_id: toBigInt(raw.game_id),
  die_a: toNumber(raw.die_a),
  die_b: toNumber(raw.die_b),
  die_a_used: toBoolean(raw.die_a_used),
  die_b_used: toBoolean(raw.die_b_used),
  sum_used: toBoolean(raw.sum_used),
})

const normalizeBonusStateModel = (raw: RawModel): DojoBonusStateModel => ({
  game_id: toBigInt(raw.game_id),
  player: normalizeAddress(raw.player),
  pending_bonus_10: toNumber(raw.pending_bonus_10),
  pending_bonus_20: toNumber(raw.pending_bonus_20),
  bonus_consumed: toBoolean(raw.bonus_consumed),
})

const normalizeRuntimeConfigModel = (raw: RawModel): DojoGameRuntimeConfigModel => ({
  game_id: toBigInt(raw.game_id),
  answer_time_limit_secs: toNumber(raw.answer_time_limit_secs),
  turn_time_limit_secs: toNumber(raw.turn_time_limit_secs),
  exit_home_rule: toNumber(raw.exit_home_rule),
  difficulty_level: toNumber(raw.difficulty_level),
})

const normalizePendingQuestionModel = (raw: RawModel): DojoPendingQuestionModel => ({
  game_id: toBigInt(raw.game_id),
  turn_index: toNumber(raw.turn_index),
  set_id: toBigInt(raw.set_id),
  question_index: toNumber(raw.question_index),
  category: toNumber(raw.category),
  difficulty: toNumber(raw.difficulty),
  seed_nonce: typeof raw.seed_nonce === 'string' ? raw.seed_nonce : normalizeHex(raw.seed_nonce),
})

const normalizeQuestionSetModel = (raw: RawModel): DojoQuestionSetModel => ({
  set_id: toBigInt(raw.set_id),
  merkle_root: typeof raw.merkle_root === 'string' ? normalizeHex(raw.merkle_root) : normalizeHex(raw.merkle_root),
  question_count: toNumber(raw.question_count),
  version: toNumber(raw.version),
  enabled: toBoolean(raw.enabled),
})

const normalizeGamePlayerCustomizationModel = (raw: RawModel): DojoGamePlayerCustomizationModel => ({
  game_id: toBigInt(raw.game_id),
  player: normalizeAddress(raw.player),
  avatar_skin_id: toNumber(raw.avatar_skin_id),
  token_skin_id: toNumber(raw.token_skin_id),
})

const normalizeGlobalStateModel = (raw: RawModel): DojoGlobalStateModel => ({
  singleton_id: toNumber(raw.singleton_id),
  next_game_id: toBigInt(raw.next_game_id),
  next_config_id: toBigInt(raw.next_config_id),
})

const normalizePublicLobbyIndexModel = (raw: RawModel): DojoPublicLobbyIndexModel => ({
  config_id: toBigInt(raw.config_id),
  game_id: toBigInt(raw.game_id),
  is_active: toBoolean(raw.is_active),
})

const normalizeLobbyCodeIndexModel = (raw: RawModel): DojoLobbyCodeIndexModel => ({
  code_hash: typeof raw.code_hash === 'string' ? normalizeHex(raw.code_hash) : normalizeHex(raw.code_hash),
  game_id: toBigInt(raw.game_id),
  is_active: toBoolean(raw.is_active),
})

const normalizeBoardSquareModel = (raw: RawModel): DojoBoardSquareModel => ({
  config_id: toBigInt(raw.config_id),
  square_index: toNumber(raw.square_index),
  square_type: toNumber(raw.square_type),
  is_safe: toBoolean(raw.is_safe),
})

const normalizeGameConfigModel = (raw: RawModel): DojoGameConfigModel => ({
  config_id: toBigInt(raw.config_id),
  creator: normalizeAddress(raw.creator),
  status: toNumber(raw.status),
  answer_time_limit_secs: toNumber(raw.answer_time_limit_secs),
  turn_time_limit_secs: toNumber(raw.turn_time_limit_secs),
  exit_home_rule: toNumber(raw.exit_home_rule),
  difficulty_level: toNumber(raw.difficulty_level),
  created_at: toBigInt(raw.created_at),
  updated_at: toBigInt(raw.updated_at),
})

const normalizeEgsTokenGameLinkModel = (raw: RawModel): DojoEgsTokenGameLinkModel => ({
  token_id: toBigInt(raw.token_id),
  game_id: toBigInt(raw.game_id),
  player: normalizeAddress(raw.player),
  config_id: toBigInt(raw.config_id),
  score: toBigInt(raw.score),
  game_over: toBoolean(raw.game_over),
  won: toBoolean(raw.won),
  lifecycle_status: toNumber(raw.lifecycle_status),
})

const normalizeTrackedEvent = (
  eventName: OnchainEventModelName,
  raw: RawModel,
): DojoTrackedEvent | null => {
  if (eventName === 'DiceRolled') {
    const payload: DojoDiceRolledEvent = {
      game_id: toBigInt(raw.game_id),
      turn_index: toNumber(raw.turn_index),
      dice_1: toNumber(raw.dice_1),
      dice_2: toNumber(raw.dice_2),
    }

    return { type: 'DiceRolled', payload }
  }

  if (eventName === 'QuestionDrawn') {
    const payload = {
      game_id: toBigInt(raw.game_id),
      turn_index: toNumber(raw.turn_index),
      question_id: toBigInt(raw.question_id),
      difficulty: toNumber(raw.difficulty),
    }

    return { type: 'QuestionDrawn', payload }
  }

  if (eventName === 'AnswerResolved') {
    const payload = {
      game_id: toBigInt(raw.game_id),
      player: normalizeAddress(raw.player),
      correct: toBoolean(raw.correct),
      reward: toNumber(raw.reward),
    }

    return { type: 'AnswerResolved', payload }
  }

  if (eventName === 'AnswerRevealed') {
    const payload = {
      game_id: toBigInt(raw.game_id),
      player: normalizeAddress(raw.player),
      question_id: toBigInt(raw.question_id),
      selected_option: toNumber(raw.selected_option),
      correct: toBoolean(raw.correct),
      reward: toNumber(raw.reward),
    }

    return { type: 'AnswerRevealed', payload }
  }

  if (eventName === 'TokenMoved') {
    const payload: DojoTokenMovedEvent = {
      game_id: toBigInt(raw.game_id),
      player: normalizeAddress(raw.player),
      token_id: toNumber(raw.token_id),
      from_square_ref: toNumber(raw.from_square_ref),
      to_square_ref: toNumber(raw.to_square_ref),
      die_value: toNumber(raw.die_value),
    }

    return { type: 'TokenMoved', payload }
  }

  if (eventName === 'TokenCaptured') {
    const payload: DojoTokenCapturedEvent = {
      game_id: toBigInt(raw.game_id),
      attacker: normalizeAddress(raw.attacker),
      defender: normalizeAddress(raw.defender),
      defender_token_id: toNumber(raw.defender_token_id),
      square_ref: toNumber(raw.square_ref),
      bonus_awarded: toNumber(raw.bonus_awarded),
    }

    return { type: 'TokenCaptured', payload }
  }

  if (eventName === 'TokenReachedHome') {
    const payload: DojoTokenReachedHomeEvent = {
      game_id: toBigInt(raw.game_id),
      player: normalizeAddress(raw.player),
      token_id: toNumber(raw.token_id),
      bonus_awarded: toNumber(raw.bonus_awarded),
    }

    return { type: 'TokenReachedHome', payload }
  }

  if (eventName === 'BridgeFormed') {
    const payload: DojoBridgeEvent = {
      game_id: toBigInt(raw.game_id),
      owner: normalizeAddress(raw.owner),
      square_ref: toNumber(raw.square_ref),
    }

    return { type: 'BridgeFormed', payload }
  }

  if (eventName === 'BridgeBroken') {
    const payload: DojoBridgeEvent = {
      game_id: toBigInt(raw.game_id),
      owner: normalizeAddress(raw.owner),
      square_ref: toNumber(raw.square_ref),
    }

    return { type: 'BridgeBroken', payload }
  }

  if (eventName === 'TurnEnded') {
    const payload: DojoTurnEndedEvent = {
      game_id: toBigInt(raw.game_id),
      turn_index: toNumber(raw.turn_index),
      next_player: normalizeAddress(raw.next_player),
    }

    return { type: 'TurnEnded', payload }
  }

  if (eventName === 'GameWon') {
    const payload: DojoGameWonEvent = {
      game_id: toBigInt(raw.game_id),
      winner: normalizeAddress(raw.winner),
      turn_index: toNumber(raw.turn_index),
    }

    return { type: 'GameWon', payload }
  }

  return null
}

const readBoardSquaresForConfig = async (client: ToriiClient, configId: bigint) => {
  const cacheKey = configId.toString()

  if (!boardSquareCache.has(cacheKey)) {
    const pendingSquares = fetchModelsByKeys(
        client,
        'BoardSquare',
        Array.from({ length: MAIN_TRACK_LEN }, (_, squareIndex) => [configId, squareIndex]),
      )
      .then((rows) => rows.map((row) => normalizeBoardSquareModel(row)))
      .catch((error) => {
        boardSquareCache.delete(cacheKey)
        throw error
      })

    boardSquareCache.set(cacheKey, pendingSquares)
  }

  return boardSquareCache.get(cacheKey)!
}

const readCallbackEntity = (callbackArgs: unknown[]): Entity | null => {
  for (const argument of callbackArgs) {
    if (isRecord(argument) && 'models' in argument) {
      return argument as unknown as Entity
    }
  }

  return null
}

export const readDojoGameSnapshot = async (
  gameId: bigint,
  options: ReadDojoGameSnapshotOptions = {},
): Promise<DojoGameSnapshot> => {
  const client = await getToriiClient()
  const gameRaw = await fetchModelByKeys(client, 'Game', [gameId])

  if (!gameRaw) {
    return { ...emptySnapshot }
  }

  const game = normalizeGameModel(gameRaw)
  const seatRows = await fetchModelsByKeys(
    client,
    'GameSeat',
    Array.from({ length: MAX_SEATS }, (_, seat) => [gameId, seat]),
  )

  const occupiedPlayers = seatRows
    .filter((row) => toBoolean(row.occupied))
    .map((row) => normalizeAddress(row.player))
    .filter((value, index, collection) => collection.indexOf(value) === index)

  const playerKeys = occupiedPlayers.map((player) => [gameId, player])
  const tokenKeys = occupiedPlayers.flatMap((player) =>
    Array.from({ length: TOKENS_PER_PLAYER }, (_, tokenId) => [gameId, player, tokenId]),
  )
  const includeBoardSquares = options.includeBoardSquares ?? false
  const includePlayerCustomizations = options.includePlayerCustomizations ?? false

  const [
    turnStateRaw,
    diceStateRaw,
    runtimeConfigRaw,
    playerRows,
    playerCustomizationRows,
    tokenRows,
    bonusRows,
    boardSquareRows,
    pendingQuestionRaw,
  ] = await Promise.all([
    withFallback(fetchModelByKeys(client, 'TurnState', [gameId]), null),
    withFallback(fetchModelByKeys(client, 'DiceState', [gameId]), null),
    withFallback(fetchModelByKeys(client, 'GameRuntimeConfig', [gameId]), null),
    withFallback(fetchModelsByKeys(client, 'GamePlayer', playerKeys), []),
    includePlayerCustomizations
      ? withFallback(fetchModelsByKeys(client, 'GamePlayerCustomization', playerKeys), [])
      : Promise.resolve([]),
    withFallback(fetchModelsByKeys(client, 'Token', tokenKeys), []),
    withFallback(fetchModelsByKeys(client, 'BonusState', playerKeys), []),
    includeBoardSquares
      ? withFallback(readBoardSquaresForConfig(client, game.config_id), [])
      : Promise.resolve([]),
    withFallback(fetchModelByKeys(client, 'PendingQuestion', [gameId, game.turn_index]), null),
  ])

  const turn_state = turnStateRaw ? normalizeTurnStateModel(turnStateRaw) : null
  const dice_state = diceStateRaw ? normalizeDiceStateModel(diceStateRaw) : null
  const runtime_config = runtimeConfigRaw ? normalizeRuntimeConfigModel(runtimeConfigRaw) : null
  const pending_question = pendingQuestionRaw ? normalizePendingQuestionModel(pendingQuestionRaw) : null

  const players = playerRows.map((row) => normalizeGamePlayerModel(row)).sort((left, right) => left.seat - right.seat)
  const player_customizations = playerCustomizationRows
    .map((row) => normalizeGamePlayerCustomizationModel(row))
    .sort((left, right) => left.player.localeCompare(right.player))
  const tokens = tokenRows
    .map((row) => normalizeTokenModel(row))
    .sort((left, right) =>
      left.player === right.player ? left.token_id - right.token_id : left.player.localeCompare(right.player),
    )
  const bonus_states = bonusRows
    .map((row) => normalizeBonusStateModel(row))
    .sort((left, right) => left.player.localeCompare(right.player))

  const safe_track_square_refs = boardSquareRows
    .filter((square) => square.square_type === SAFE_SPACE_SQUARE_TYPE)
    .map((square) => square.square_index + 1)
    .filter((value, index, collection) => collection.indexOf(value) === index)
    .sort((left, right) => left - right)

  return {
    game,
    turn_state,
    dice_state,
    runtime_config,
    pending_question,
    players,
    player_customizations,
    tokens,
    bonus_states,
    occupancies: [],
    safe_track_square_refs,
  }
}

export const readLatestGameConfigByCreator = async (
  creator: string,
): Promise<DojoGameConfigModel | null> => {
  const client = await getToriiClient()
  const rows = await fetchModelsByMember(client, 'GameConfig', 'creator', creator, 64)

  if (rows.length === 0) {
    return null
  }

  return rows
    .map((row) => normalizeGameConfigModel(row))
    .sort((left, right) => Number(right.config_id - left.config_id))[0] || null
}

export const readGlobalState = async (): Promise<DojoGlobalStateModel | null> => {
  const client = await getToriiClient()
  const row = await fetchModelByKeys(client, 'GlobalState', [1])

  return row ? normalizeGlobalStateModel(row) : null
}

export const readPublicLobbyIndex = async (configId: bigint): Promise<DojoPublicLobbyIndexModel | null> => {
  const client = await getToriiClient()
  const row = await fetchModelByKeys(client, 'PublicLobbyIndex', [configId])

  if (!row) {
    return null
  }

  const publicLobby = normalizePublicLobbyIndexModel(row)
  return publicLobby.game_id > 0n ? publicLobby : null
}

export const readLobbyCodeIndex = async (codeHash: bigint | string): Promise<DojoLobbyCodeIndexModel | null> => {
  const client = await getToriiClient()
  const row = await fetchModelByKeys(client, 'LobbyCodeIndex', [codeHash])

  if (!row) {
    return null
  }

  const lobbyCode = normalizeLobbyCodeIndexModel(row)
  return lobbyCode.game_id > 0n ? lobbyCode : null
}

export const readLatestGameIdByPlayer = async (playerAddress: string): Promise<bigint | null> => {
  const client = await getToriiClient()
  const globalStateRow = await fetchModelByKeys(client, 'GlobalState', [1])
  const nextGameId = globalStateRow ? toBigInt(globalStateRow.next_game_id) : 0n

  if (nextGameId <= 1n) {
    return null
  }

  const probeCount = 16n
  const minGameId = nextGameId > probeCount ? nextGameId - probeCount : 1n
  const candidateKeys: Array<Array<bigint | number | string>> = []

  for (let currentGameId = nextGameId - 1n; currentGameId >= minGameId; currentGameId -= 1n) {
    candidateKeys.push([currentGameId, playerAddress])

    if (currentGameId === 1n) {
      break
    }
  }

  const rows = await fetchModelsByKeys(client, 'GamePlayer', candidateKeys)
  const latest = rows.map((row) => normalizeGamePlayerModel(row)).find((row) => row.is_active)

  return latest?.game_id ?? null
}

export const readQuestionSet = async (setId: bigint): Promise<DojoQuestionSetModel | null> => {
  const client = await getToriiClient()
  const row = await fetchModelByKeys(client, 'QuestionSet', [setId])

  if (!row) {
    return null
  }

  const questionSet = normalizeQuestionSetModel(row)
  return questionSet.set_id > 0n ? questionSet : null
}

export const readEgsTokenGameLink = async (tokenId: bigint): Promise<DojoEgsTokenGameLinkModel | null> => {
  const client = await getToriiClient()
  const row = await fetchModelByKeys(client, 'EgsTokenGameLink', [tokenId])

  if (!row) {
    return null
  }

  const link = normalizeEgsTokenGameLinkModel(row)
  return link.game_id > 0n ? link : null
}

export const subscribeDojoGame = async (params: SubscribeDojoGameParams): Promise<() => void> => {
  const client = await getToriiClient()
  const subscriptions: Subscription[] = []
  const worldAddresses = dojoRuntimeConfig.worldAddress ? [dojoRuntimeConfig.worldAddress] : undefined

  const entityModelFilters: Array<{ modelName: string; member: string; value: bigint | number | string }> = [
    { modelName: 'Game', member: 'game_id', value: params.gameId },
    { modelName: 'TurnState', member: 'game_id', value: params.gameId },
    { modelName: 'DiceState', member: 'game_id', value: params.gameId },
    { modelName: 'GameRuntimeConfig', member: 'game_id', value: params.gameId },
    { modelName: 'PendingQuestion', member: 'game_id', value: params.gameId },
    { modelName: 'GamePlayer', member: 'game_id', value: params.gameId },
    { modelName: 'Token', member: 'game_id', value: params.gameId },
    { modelName: 'BonusState', member: 'game_id', value: params.gameId },
  ]

  try {
    const entitySubscription = await client.onEntityUpdated(
      null,
      worldAddresses,
      (...callbackArgs: unknown[]) => {
        const entity = readCallbackEntity(callbackArgs)

        if (!entity) {
          return
        }

        const shouldRefresh = entityModelFilters.some(({ modelName, member, value }) => {
          const model = extractModels([entity], modelName)[0]
          return model ? memberValueMatches(model[member], value) : false
        })

        if (shouldRefresh) {
          params.onStateMutation()
        }
      },
    )

    subscriptions.push(entitySubscription)

    const eventSubscription = await client.onEventMessageUpdated(
      null,
      worldAddresses,
      (...callbackArgs: unknown[]) => {
        const entity = readCallbackEntity(callbackArgs)

        if (!entity) {
          return
        }

        for (const eventModelName of trackedEventModelNames) {
          const model = extractModels([entity], eventModelName)[0]

          if (!model || !memberValueMatches(model.game_id, params.gameId)) {
            continue
          }

          const parsedEvent = normalizeTrackedEvent(eventModelName, model)

          if (parsedEvent) {
            params.onTrackedEvent(parsedEvent)
          }

          params.onStateMutation()
          break
        }
      },
    )

    subscriptions.push(eventSubscription)
  } catch {
    for (const subscription of subscriptions) {
      try {
        subscription.cancel()
      } catch {
        // noop
      }
    }

    throw new Error('Failed to subscribe to Dojo/Torii game updates')
  }

  return () => {
    for (const subscription of subscriptions) {
      try {
        subscription.cancel()
      } catch {
        // noop
      }
    }
  }
}
