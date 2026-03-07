import { KeysClause, MemberClause, ToriiQueryBuilder, createClient, parseEntities } from '@dojoengine/sdk'
import type { Entity, Subscription, ToriiClient } from '@dojoengine/torii-client'
import { dojoRuntimeConfig, isDojoConfigured } from '../config/dojo'
import { appEnv } from '../config/env'
import type {
  DojoBoardSquareModel,
  DojoBonusStateModel,
  DojoEgsTokenGameLinkModel,
  DojoGameConfigModel,
  DojoGameModel,
  DojoGamePlayerModel,
  DojoGameRuntimeConfigModel,
  DojoGameWonEvent,
  DojoBridgeEvent,
  DojoDiceRolledEvent,
  DojoDiceStateModel,
  DojoPendingQuestionModel,
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
  | 'DiceRolled'
  | 'TokenMoved'
  | 'TokenCaptured'
  | 'TokenReachedHome'
  | 'BridgeFormed'
  | 'BridgeBroken'
  | 'TurnEnded'
  | 'GameWon'

export type DojoGameSnapshot = {
  game: DojoGameModel | null
  turn_state: DojoTurnStateModel | null
  dice_state: DojoDiceStateModel | null
  runtime_config: DojoGameRuntimeConfigModel | null
  pending_question: DojoPendingQuestionModel | null
  players: DojoGamePlayerModel[]
  tokens: DojoTokenModel[]
  bonus_states: DojoBonusStateModel[]
  occupancies: DojoSquareOccupancyModel[]
  safe_track_square_refs: number[]
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
  tokens: [],
  bonus_states: [],
  occupancies: [],
  safe_track_square_refs: [],
}

const trackedEventModelNames: readonly OnchainEventModelName[] = [
  'DiceRolled',
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

const buildMemberEqClause = (modelName: string, member: string, value: bigint | number | string) =>
  (MemberClause as any)(modelTag(modelName), member, 'Eq', value).build()

const buildKeysClause = (modelName: string, keys: Array<bigint | number | string>) =>
  (KeysClause as any)([modelTag(modelName)], keys.map((value) => `${value}`), 'FixedLen').build()

let toriiClientPromise: null | Promise<ToriiClient> = null

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

const fetchModelsByMember = async (
  client: ToriiClient,
  modelName: string,
  member: string,
  value: bigint | number | string,
  limit = 256,
): Promise<RawModel[]> => {
  const query = new ToriiQueryBuilder<any>()
    .withEntityModels([modelTag(modelName) as any])
    .withClause(buildMemberEqClause(modelName, member, value))
    .withLimit(limit)

  const response = await client.getEntities(query.build())
  return extractModels(response.items, modelName)
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
  shop_enabled: toBoolean(raw.shop_enabled),
  shop_square_ref: toNumber(raw.shop_square_ref),
  purchases_this_turn: toNumber(raw.purchases_this_turn),
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
  has_shield: toBoolean(raw.has_shield),
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

const normalizeSquareOccupancyModel = (raw: RawModel): DojoSquareOccupancyModel => ({
  game_id: toBigInt(raw.game_id),
  square_ref: toNumber(raw.square_ref),
  seat_0_count: toNumber(raw.seat_0_count),
  seat_1_count: toNumber(raw.seat_1_count),
  seat_2_count: toNumber(raw.seat_2_count),
  seat_3_count: toNumber(raw.seat_3_count),
  has_blockade: toBoolean(raw.has_blockade),
  blockade_owner_seat: toNumber(raw.blockade_owner_seat),
})

const normalizeRuntimeConfigModel = (raw: RawModel): DojoGameRuntimeConfigModel => ({
  game_id: toBigInt(raw.game_id),
  answer_time_limit_secs: toNumber(raw.answer_time_limit_secs),
  turn_time_limit_secs: toNumber(raw.turn_time_limit_secs),
  exit_home_rule: toNumber(raw.exit_home_rule),
  difficulty_level: toNumber(raw.difficulty_level),
  shop_enabled_on_safe_squares: toBoolean(raw.shop_enabled_on_safe_squares),
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

const normalizeBoardSquareModel = (raw: RawModel): DojoBoardSquareModel => ({
  config_id: toBigInt(raw.config_id),
  square_index: toNumber(raw.square_index),
  square_type: toNumber(raw.square_type),
  is_safe: toBoolean(raw.is_safe),
  is_shop: toBoolean(raw.is_shop),
})

const normalizeGameConfigModel = (raw: RawModel): DojoGameConfigModel => ({
  config_id: toBigInt(raw.config_id),
  creator: normalizeAddress(raw.creator),
  status: toNumber(raw.status),
  answer_time_limit_secs: toNumber(raw.answer_time_limit_secs),
  turn_time_limit_secs: toNumber(raw.turn_time_limit_secs),
  exit_home_rule: toNumber(raw.exit_home_rule),
  difficulty_level: toNumber(raw.difficulty_level),
  shop_enabled_on_safe_squares: toBoolean(raw.shop_enabled_on_safe_squares),
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

const readCallbackEntity = (callbackArgs: unknown[]): Entity | null => {
  for (const argument of callbackArgs) {
    if (isRecord(argument) && 'models' in argument) {
      return argument as unknown as Entity
    }
  }

  return null
}

export const readDojoGameSnapshot = async (gameId: bigint): Promise<DojoGameSnapshot> => {
  const client = await getToriiClient()
  const gameRaw = await fetchModelByKeys(client, 'Game', [gameId])

  if (!gameRaw) {
    return { ...emptySnapshot }
  }

  const game = normalizeGameModel(gameRaw)

  const [
    turnStateRaw,
    diceStateRaw,
    runtimeConfigRaw,
    playerRows,
    tokenRows,
    bonusRows,
    occupancyRows,
    boardSquareRows,
    pendingQuestionRaw,
  ] = await Promise.all([
    fetchModelByKeys(client, 'TurnState', [gameId]),
    fetchModelByKeys(client, 'DiceState', [gameId]),
    fetchModelByKeys(client, 'GameRuntimeConfig', [gameId]),
    fetchModelsByMember(client, 'GamePlayer', 'game_id', gameId, 16),
    fetchModelsByMember(client, 'Token', 'game_id', gameId, 64),
    fetchModelsByMember(client, 'BonusState', 'game_id', gameId, 16),
    fetchModelsByMember(client, 'SquareOccupancy', 'game_id', gameId, 128),
    fetchModelsByMember(client, 'BoardSquare', 'config_id', game.config_id, 256),
    fetchModelByKeys(client, 'PendingQuestion', [gameId, game.turn_index]),
  ])

  const turn_state = turnStateRaw ? normalizeTurnStateModel(turnStateRaw) : null
  const dice_state = diceStateRaw ? normalizeDiceStateModel(diceStateRaw) : null
  const runtime_config = runtimeConfigRaw ? normalizeRuntimeConfigModel(runtimeConfigRaw) : null
  const pending_question = pendingQuestionRaw ? normalizePendingQuestionModel(pendingQuestionRaw) : null

  const players = playerRows.map((row) => normalizeGamePlayerModel(row)).sort((left, right) => left.seat - right.seat)
  const tokens = tokenRows
    .map((row) => normalizeTokenModel(row))
    .sort((left, right) =>
      left.player === right.player ? left.token_id - right.token_id : left.player.localeCompare(right.player),
    )
  const bonus_states = bonusRows
    .map((row) => normalizeBonusStateModel(row))
    .sort((left, right) => left.player.localeCompare(right.player))
  const occupancies = occupancyRows
    .map((row) => normalizeSquareOccupancyModel(row))
    .sort((left, right) => left.square_ref - right.square_ref)

  const safe_track_square_refs = boardSquareRows
    .map((row) => normalizeBoardSquareModel(row))
    .filter((square) => square.is_safe)
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
    tokens,
    bonus_states,
    occupancies,
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

export const readLatestGameIdByPlayer = async (playerAddress: string): Promise<bigint | null> => {
  const client = await getToriiClient()
  const rows = await fetchModelsByMember(client, 'GamePlayer', 'player', playerAddress, 64)

  if (rows.length === 0) {
    return null
  }

  const latest = rows
    .map((row) => normalizeGamePlayerModel(row))
    .filter((row) => row.is_active)
    .sort((left, right) => Number(right.game_id - left.game_id))[0]

  return latest?.game_id ?? null
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

  const registerEntitySubscription = async (
    modelName: string,
    clause: ReturnType<typeof buildMemberEqClause>,
  ) => {
    const subscription = await client.onEntityUpdated(
      clause,
      worldAddresses,
      (...callbackArgs: unknown[]) => {
        const entity = readCallbackEntity(callbackArgs)

        if (!entity) {
          return
        }

        const models = extractModels([entity], modelName)

        if (models.length > 0) {
          params.onStateMutation()
        }
      },
    )

    subscriptions.push(subscription)
  }

  const registerEventSubscription = async (eventModelName: OnchainEventModelName) => {
    const subscription = await client.onEventMessageUpdated(
      buildMemberEqClause(eventModelName, 'game_id', params.gameId),
      worldAddresses,
      (...callbackArgs: unknown[]) => {
        const entity = readCallbackEntity(callbackArgs)

        if (!entity) {
          return
        }

        const model = extractModels([entity], eventModelName)[0]

        if (!model) {
          return
        }

        const parsedEvent = normalizeTrackedEvent(eventModelName, model)

        if (parsedEvent) {
          params.onTrackedEvent(parsedEvent)
        }

        params.onStateMutation()
      },
    )

    subscriptions.push(subscription)
  }

  try {
    await Promise.all([
      registerEntitySubscription('Game', buildKeysClause('Game', [params.gameId])),
      registerEntitySubscription('TurnState', buildKeysClause('TurnState', [params.gameId])),
      registerEntitySubscription('DiceState', buildKeysClause('DiceState', [params.gameId])),
      registerEntitySubscription('GameRuntimeConfig', buildKeysClause('GameRuntimeConfig', [params.gameId])),
      registerEntitySubscription('PendingQuestion', buildMemberEqClause('PendingQuestion', 'game_id', params.gameId)),
      registerEntitySubscription('GamePlayer', buildMemberEqClause('GamePlayer', 'game_id', params.gameId)),
      registerEntitySubscription('Token', buildMemberEqClause('Token', 'game_id', params.gameId)),
      registerEntitySubscription('BonusState', buildMemberEqClause('BonusState', 'game_id', params.gameId)),
      registerEntitySubscription('SquareOccupancy', buildMemberEqClause('SquareOccupancy', 'game_id', params.gameId)),
      ...(params.configId !== undefined
        ? [registerEntitySubscription('BoardSquare', buildMemberEqClause('BoardSquare', 'config_id', params.configId))]
        : []),
    ])

    await Promise.all(trackedEventModelNames.map((eventModelName) => registerEventSubscription(eventModelName)))
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
