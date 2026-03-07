import { CallData, RpcProvider, type AccountInterface } from 'starknet'
import { appEnv } from '../config/env'
import type {
  ApplyMoveApiPayload,
  AnswerApiPayload,
  BuyItemApiPayload,
  GameConfigApiPayload,
  LegalMoveApi,
  MoveApiPlan,
  UseItemApiPayload,
} from './types'

type FeltLike = bigint | number | string

const asBigInt = (value: FeltLike): bigint => {
  if (typeof value === 'bigint') {
    return value
  }

  if (typeof value === 'number') {
    return BigInt(value)
  }

  const normalized = value.trim()
  return normalized.startsWith('0x') ? BigInt(normalized) : BigInt(Number(normalized))
}

const toCairoBool = (value: boolean): 0 | 1 => (value ? 1 : 0)

const requireAddress = (label: string, value: string): string => {
  const normalized = value.trim()
  if (!normalized) {
    throw new Error(`Missing ${label} address in env`)
  }
  return normalized
}

const executeCall = async (account: AccountInterface, call: Parameters<AccountInterface['execute']>[0]) => {
  const result = await account.execute(call)
  return result.transaction_hash
}

const rpcProvider = new RpcProvider({ nodeUrl: appEnv.activeRpcUrl })

const parseLegalMoves = (serialized: string[]): LegalMoveApi[] => {
  if (serialized.length === 0) {
    return []
  }

  const length = Number(asBigInt(serialized[0]))

  if (length <= 0) {
    return []
  }

  const values = serialized.slice(1)
  const result: LegalMoveApi[] = []

  for (let index = 0; index < length; index += 1) {
    const offset = index * 4
    const moveTypeRaw = values[offset]
    const tokenIdRaw = values[offset + 1]
    const stepsRaw = values[offset + 2]
    const targetSquareRaw = values[offset + 3]

    if (
      moveTypeRaw === undefined ||
      tokenIdRaw === undefined ||
      stepsRaw === undefined ||
      targetSquareRaw === undefined
    ) {
      break
    }

    result.push({
      move_type: Number(asBigInt(moveTypeRaw)) as LegalMoveApi['move_type'],
      token_id: Number(asBigInt(tokenIdRaw)),
      steps: Number(asBigInt(stepsRaw)),
      target_square_ref: Number(asBigInt(targetSquareRaw)),
    })
  }

  return result
}

const configSystem = () => requireAddress('config system', appEnv.configSystemAddress)
const lobbySystem = () => requireAddress('lobby system', appEnv.lobbySystemAddress)
const turnSystem = () => requireAddress('turn system', appEnv.turnSystemAddress)
const shopSystem = () => requireAddress('shop system', appEnv.shopSystemAddress)

export const createGameConfig = async (
  account: AccountInterface,
  payload: GameConfigApiPayload,
) => {
  return executeCall(account, {
    contractAddress: configSystem(),
    entrypoint: 'create_game_config',
    calldata: CallData.compile({
      payload: {
        answer_time_limit_secs: payload.answerTimeLimitSecs,
        turn_time_limit_secs: payload.turnTimeLimitSecs,
        exit_home_rule: payload.exitHomeRule,
        difficulty_level: payload.difficultyLevel,
        shop_enabled_on_safe_squares: toCairoBool(payload.shopEnabledOnSafeSquares),
      },
    }),
  })
}

export const lockGameConfig = async (account: AccountInterface, configId: FeltLike) => {
  return executeCall(account, {
    contractAddress: configSystem(),
    entrypoint: 'lock_game_config',
    calldata: CallData.compile({ config_id: asBigInt(configId) }),
  })
}

export const createLobby = async (account: AccountInterface, codeHash: FeltLike, configId: FeltLike) => {
  return executeCall(account, {
    contractAddress: lobbySystem(),
    entrypoint: 'create_lobby',
    calldata: CallData.compile({ code_hash: asBigInt(codeHash), config_id: asBigInt(configId) }),
  })
}

export const joinLobbyByCode = async (account: AccountInterface, codeHash: FeltLike) => {
  return executeCall(account, {
    contractAddress: lobbySystem(),
    entrypoint: 'join_lobby_by_code',
    calldata: CallData.compile({ code_hash: asBigInt(codeHash) }),
  })
}

export const joinPublicMatchmaking = async (account: AccountInterface, configId: FeltLike) => {
  return executeCall(account, {
    contractAddress: lobbySystem(),
    entrypoint: 'join_public_matchmaking',
    calldata: CallData.compile({ config_id: asBigInt(configId) }),
  })
}

export const setReady = async (account: AccountInterface, gameId: FeltLike, ready: boolean) => {
  return executeCall(account, {
    contractAddress: lobbySystem(),
    entrypoint: 'set_ready',
    calldata: CallData.compile({ game_id: asBigInt(gameId), ready: toCairoBool(ready) }),
  })
}

export const startGame = async (account: AccountInterface, gameId: FeltLike) => {
  return executeCall(account, {
    contractAddress: lobbySystem(),
    entrypoint: 'start_game',
    calldata: CallData.compile({ game_id: asBigInt(gameId) }),
  })
}

export const leaveLobby = async (account: AccountInterface, gameId: FeltLike) => {
  return executeCall(account, {
    contractAddress: lobbySystem(),
    entrypoint: 'leave_lobby',
    calldata: CallData.compile({ game_id: asBigInt(gameId) }),
  })
}

export const rollTwoDiceAndDrawQuestion = async (account: AccountInterface, gameId: FeltLike) => {
  const vrfProvider = requireAddress('VRF provider', appEnv.vrfProviderAddress)
  const turnSystemAddress = turnSystem()

  const vrfCall = {
    contractAddress: vrfProvider,
    entrypoint: 'request_random',
    calldata: CallData.compile({
      caller: turnSystemAddress,
      source: [0, account.address],
    }),
  }

  const rollCall = {
    contractAddress: turnSystemAddress,
    entrypoint: 'roll_two_dice_and_draw_question',
    calldata: CallData.compile({ game_id: asBigInt(gameId) }),
  }

  return executeCall(account, [vrfCall, rollCall])
}

export const submitAnswerAndMoves = async (
  account: AccountInterface,
  gameId: FeltLike,
  answerPayload: AnswerApiPayload,
  movePlan: MoveApiPlan,
) => {
  return executeCall(account, {
    contractAddress: turnSystem(),
    entrypoint: 'submit_answer_and_moves',
    calldata: CallData.compile({
      game_id: asBigInt(gameId),
      answer_payload: {
        question_id: asBigInt(answerPayload.questionId),
        question_index: answerPayload.questionIndex,
        category: answerPayload.category,
        difficulty: answerPayload.difficulty,
        correct_option: answerPayload.correctOption,
        selected_option: answerPayload.selectedOption,
        merkle_proof: answerPayload.merkleProof.map((value) => asBigInt(value)),
        merkle_directions: answerPayload.merkleDirections,
      },
      move_plan: {
        use_step_1: toCairoBool(movePlan.useStep1),
        step_1: {
          token_id: movePlan.step1.tokenId,
          die_value: movePlan.step1.dieValue,
          action_type: movePlan.step1.actionType,
        },
        use_step_2: toCairoBool(movePlan.useStep2),
        step_2: {
          token_id: movePlan.step2.tokenId,
          die_value: movePlan.step2.dieValue,
          action_type: movePlan.step2.actionType,
        },
      },
    }),
  })
}

export const submitAnswer = async (
  account: AccountInterface,
  gameId: FeltLike,
  answerPayload: AnswerApiPayload,
) => {
  return executeCall(account, {
    contractAddress: turnSystem(),
    entrypoint: 'submit_answer',
    calldata: CallData.compile({
      game_id: asBigInt(gameId),
      answer_payload: {
        question_id: asBigInt(answerPayload.questionId),
        question_index: answerPayload.questionIndex,
        category: answerPayload.category,
        difficulty: answerPayload.difficulty,
        correct_option: answerPayload.correctOption,
        selected_option: answerPayload.selectedOption,
        merkle_proof: answerPayload.merkleProof.map((value) => asBigInt(value)),
        merkle_directions: answerPayload.merkleDirections,
      },
    }),
  })
}

export const applyMove = async (
  account: AccountInterface,
  gameId: FeltLike,
  payload: ApplyMoveApiPayload,
) => {
  return executeCall(account, {
    contractAddress: turnSystem(),
    entrypoint: 'apply_move',
    calldata: CallData.compile({
      game_id: asBigInt(gameId),
      move_input: {
        move_type: payload.moveType,
        token_id: payload.tokenId,
        steps: payload.steps,
      },
    }),
  })
}

export const endTurn = async (account: AccountInterface, gameId: FeltLike) => {
  return executeCall(account, {
    contractAddress: turnSystem(),
    entrypoint: 'end_turn',
    calldata: CallData.compile({ game_id: asBigInt(gameId) }),
  })
}

export const skipShop = async (account: AccountInterface, gameId: FeltLike) => {
  return executeCall(account, {
    contractAddress: turnSystem(),
    entrypoint: 'skip_shop',
    calldata: CallData.compile({ game_id: asBigInt(gameId) }),
  })
}

export const forceSkipTurn = async (account: AccountInterface, gameId: FeltLike) => {
  return executeCall(account, {
    contractAddress: turnSystem(),
    entrypoint: 'force_skip_turn',
    calldata: CallData.compile({ game_id: asBigInt(gameId) }),
  })
}

export const computeLegalMoves = async (gameId: FeltLike): Promise<LegalMoveApi[]> => {
  const serialized = await rpcProvider.callContract({
    contractAddress: turnSystem(),
    entrypoint: 'compute_legal_moves',
    calldata: CallData.compile({ game_id: asBigInt(gameId) }),
  })

  return parseLegalMoves(serialized)
}

export const buyItem = async (
  account: AccountInterface,
  gameId: FeltLike,
  payload: BuyItemApiPayload,
) => {
  return executeCall(account, {
    contractAddress: shopSystem(),
    entrypoint: 'buy_item',
    calldata: CallData.compile({
      game_id: asBigInt(gameId),
      payload: {
        item_id: payload.itemId,
        target_token_id: payload.targetTokenId ?? 0,
        has_target_token: toCairoBool(payload.targetTokenId !== undefined),
      },
    }),
  })
}

export const consumeItem = async (
  account: AccountInterface,
  payload: UseItemApiPayload,
) => {
  return executeCall(account, {
    contractAddress: shopSystem(),
    entrypoint: 'use_item',
    calldata: CallData.compile({
      payload: {
        item_id: payload.itemId,
        game_id: asBigInt(payload.gameId),
        target_player: payload.targetPlayer,
        target_token_id: payload.targetTokenId,
        effect_value: payload.effectValue,
      },
    }),
  })
}
