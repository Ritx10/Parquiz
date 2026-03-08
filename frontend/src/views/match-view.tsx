import { memo, type CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Board3D } from '../components/game/board3d'
import FinalRankingScreen from '../components/game/FinalRankingScreen'
import { GameAvatar } from '../components/game/game-avatar'
import { GameDie } from '../components/game/game-die'
import { LogDrawer } from '../components/game/log-drawer'
import { TriviaQuestionModal } from '../components/game/trivia-question-modal'
import { getBoardThemeDefinition, getBoardThemeSurfacePalette } from '../lib/board-themes'
import { assignDistinctDiceSkins, type DiceSkinId } from '../lib/dice-cosmetics'
import { getPlayerVisualThemeByColor } from '../lib/player-color-themes'
import { usePlayerProfileActions } from '../lib/use-player-profile'
import type { TokenSkinId } from '../lib/token-cosmetics'
import { drawTriviaQuestion, pickAiTriviaAnswer, type TriviaDifficulty, type TriviaQuestion } from '../lib/trivia-engine'
import { useControllerWallet } from '../lib/starknet/use-controller-wallet'
import type {
  MatchDiceState,
  MatchLegalMove,
  MatchLogEvent,
  MatchPlayer,
  ReadonlyGameState,
  MatchToken,
  MoveResource,
  PlayerColor,
  TokenHint,
} from '../components/game/match-types'
import { useAppSettingsStore } from '../store/app-settings-store'
import { useGameUiStore } from '../store/game-ui-store'
import { useReadonlyGameState } from '../store/game-state-store'

const TRACK_LENGTH = 68

const startSquareByColor = {
  red: 22,
  blue: 5,
  yellow: 56,
  green: 39,
} as const

const entrySquareByColor: Record<PlayerColor, number> = {
  red: 17,
  blue: 68,
  yellow: 51,
  green: 34,
}

const finalLaneByColor: Record<PlayerColor, number[]> = {
  green: [101, 102, 103, 104, 105, 106, 107, 108],
  red: [201, 202, 203, 204, 205, 206, 207, 208],
  blue: [301, 302, 303, 304, 305, 306, 307, 308],
  yellow: [401, 402, 403, 404, 405, 406, 407, 408],
}

const stepsToLaneEntryByColor: Record<PlayerColor, number> = {
  red: (entrySquareByColor.red - startSquareByColor.red + TRACK_LENGTH) % TRACK_LENGTH,
  blue: (entrySquareByColor.blue - startSquareByColor.blue + TRACK_LENGTH) % TRACK_LENGTH,
  yellow: (entrySquareByColor.yellow - startSquareByColor.yellow + TRACK_LENGTH) % TRACK_LENGTH,
  green: (entrySquareByColor.green - startSquareByColor.green + TRACK_LENGTH) % TRACK_LENGTH,
}

const hexToRgb = (hex: string) => {
  const sanitized = hex.replace('#', '')
  const normalized = sanitized.length === 3 ? sanitized.split('').map((char) => `${char}${char}`).join('') : sanitized
  const value = Number.parseInt(normalized, 16)

  return {
    b: value & 255,
    g: (value >> 8) & 255,
    r: (value >> 16) & 255,
  }
}

const mixHexColors = (hex: string, targetHex: string, ratio: number) => {
  const source = hexToRgb(hex)
  const target = hexToRgb(targetHex)
  const mix = (from: number, to: number) => Math.round(from + (to - from) * ratio)

  return {
    r: mix(source.r, target.r),
    g: mix(source.g, target.g),
    b: mix(source.b, target.b),
  }
}

const rgbaFromHex = (hex: string, alpha: number) => {
  const { r, g, b } = hexToRgb(hex)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

const rgbaFromRgb = (rgb: { b: number; g: number; r: number }, alpha: number) => `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`

const buildAnnouncementGlassTint = (baseColor: string) => ({
  border: rgbaFromRgb(mixHexColors(baseColor, '#ffffff', 0.76), 0.4),
  glow: rgbaFromHex(baseColor, 0.34),
  highlight: rgbaFromRgb(mixHexColors(baseColor, '#ffffff', 0.88), 0.44),
  shadow: rgbaFromRgb(mixHexColors(baseColor, '#120a06', 0.7), 0.34),
  tintA: rgbaFromRgb(mixHexColors(baseColor, '#ffffff', 0.22), 0.46),
  tintB: rgbaFromRgb(mixHexColors(baseColor, '#0f172a', 0.12), 0.26),
})

const lanePositionSet = new Set(Object.values(finalLaneByColor).flat())
const protectedColorTrackSquares = new Set<number>(Object.values(startSquareByColor))

const isTrackPosition = (position: number) => position >= 1 && position <= TRACK_LENGTH
const isLanePosition = (position: number) => lanePositionSet.has(position)

const randomDieValue = () => Math.floor(Math.random() * 6) + 1

const wrapPosition = (position: number) => {
  const normalized = ((position - 1) % TRACK_LENGTH + TRACK_LENGTH) % TRACK_LENGTH
  return normalized + 1
}

const nextId = (prefix: string) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10_000)}`

type PracticeDifficulty = 'easy' | 'medium' | 'hard'

type TriviaFeedbackState = 'correct' | 'incorrect' | 'idle' | 'timeout'

type TurnTriviaState = {
  expiresAt: null | number
  movementUnlocked: boolean
  phase: 'closed' | 'feedback' | 'open'
  question: null | TriviaQuestion
  result: TriviaFeedbackState
  selectedOption: null | number
}

const defaultTurnTriviaState: TurnTriviaState = {
  expiresAt: null,
  movementUnlocked: false,
  phase: 'closed',
  question: null,
  result: 'idle',
  selectedOption: null,
}

const aiThinkDelayByDifficulty: Record<PracticeDifficulty, number> = {
  easy: 980,
  medium: 640,
  hard: 420,
}

const BOT_WATCHDOG_INTERVAL_MS = 450
const BOT_IDLE_FAILSAFE_MS = 3_200
const BOT_MAX_TURN_MS = 9_000

const NON_CRITICAL_EXTERNAL_ERROR_PATTERNS = [
  'Insufficient liquidity',
  'Failed to fetch price',
  'overlaysContent is only supported from the top level browsing context',
  'message channel closed before a response was received',
]

const toErrorMessage = (error: unknown) => {
  if (typeof error === 'string') {
    return error
  }

  if (error instanceof Error) {
    return error.message
  }

  if (error && typeof error === 'object' && 'message' in error) {
    const maybeMessage = (error as { message?: unknown }).message
    if (typeof maybeMessage === 'string') {
      return maybeMessage
    }
  }

  return String(error)
}

const isNonCriticalExternalError = (error: unknown) => {
  const message = toErrorMessage(error)
  return NON_CRITICAL_EXTERNAL_ERROR_PATTERNS.some((pattern) => message.includes(pattern))
}

type BotRuntimeState = {
  bonusConsumed: boolean
  bonusPending: boolean
  diceConsumedA: boolean
  diceConsumedB: boolean
  diceRolled: boolean
  isAiTurn: boolean
  winnerLocked: boolean
}

type PodiumPlace = 1 | 2 | 3 | 4

type FinalPlacement = {
  id: string
  avatar: string
  color: PlayerColor
  goalCount: number
  name: string
  place: PodiumPlace
  progressScore: number
  reward: number
  tag: string
  visualSkinId?: TokenSkinId
}

type MatchViewProps = {
  showVictoryPreviewControl?: boolean
}

const matchCopyByLanguage = {
  es: {
    activeBridge: 'bloqueo/puente activo',
    boardTitle: 'Board 3D',
    botLabelByDifficulty: {
      easy: 'BOT FACIL',
      medium: 'BOT MEDIO',
      hard: 'BOT DIFICIL',
    } as Record<PracticeDifficulty, string>,
    clickToRoll: 'Click para tirar',
    colorLabel: {
      red: 'ROJO',
      blue: 'AZUL',
      yellow: 'AMARILLO',
      green: 'VERDE',
    } as Record<PlayerColor, string>,
    congrats: 'Enhorabuena',
    diceAlreadyUsed: 'Dados ya usados',
    fallbackPlayer: 'Jugador',
    initialBridgeLog: 'Puente detectado en casilla 22 (ROJO + ROJO).',
    mockBoard: 'Mock board',
    placeAnnouncementLabel: {
      1: 'ES 1ER LUGAR',
      2: 'ES 2DO LUGAR',
      3: 'ES 3ER LUGAR',
      4: 'ES 4TO LUGAR',
    } as Record<PodiumPlace, string>,
    placeLabel: {
      1: '1er lugar',
      2: '2do lugar',
      3: '3er lugar',
      4: '4to lugar',
    } as Record<PodiumPlace, string>,
    previewVictoryFor: (name: string) => `Forzar preview de victoria para ${name}.`,
    questionAnsweredCorrectly: (name: string, dieA: null | number, dieB: null | number) => `${name} respondio correctamente y puede mover ${dieA}/${dieB}.`,
    questionAnsweredIncorrectly: (name: string) => `${name} respondio incorrectamente y pierde el turno.`,
    questionReceived: (name: string, difficulty: TriviaDifficulty) => `${name} recibio una pregunta ${difficulty}.`,
    questionTimedOut: (name: string) => `${name} se quedo sin tiempo y pierde el turno.`,
    reset: 'Reset',
    rolling: 'Lanzando...',
    rolledLog: (name: string, dieA: number, dieB: number) => `${name} tiro ${dieA} y ${dieB}.`,
    securePlace: (name: string, place: string) => `${name} asegura el ${place}.`,
    skip: 'Saltar',
    tokenLabel: 'ficha',
    turnTimedOut: (name: string) => `${name} agoto el tiempo del turno y lo pierde.`,
    turnWaiting: 'En espera',
    yourTurn: 'Tu turno',
    viewVictory: 'Ver victoria',
  },
  en: {
    activeBridge: 'active block/bridge',
    boardTitle: '3D Board',
    botLabelByDifficulty: {
      easy: 'EASY BOT',
      medium: 'MEDIUM BOT',
      hard: 'HARD BOT',
    } as Record<PracticeDifficulty, string>,
    clickToRoll: 'Click to roll',
    colorLabel: {
      red: 'RED',
      blue: 'BLUE',
      yellow: 'YELLOW',
      green: 'GREEN',
    } as Record<PlayerColor, string>,
    congrats: 'Congratulations',
    diceAlreadyUsed: 'Dice already used',
    fallbackPlayer: 'Player',
    initialBridgeLog: 'Bridge detected on square 22 (RED + RED).',
    mockBoard: 'Mock board',
    placeAnnouncementLabel: {
      1: 'IS 1ST PLACE',
      2: 'IS 2ND PLACE',
      3: 'IS 3RD PLACE',
      4: 'IS 4TH PLACE',
    } as Record<PodiumPlace, string>,
    placeLabel: {
      1: '1st place',
      2: '2nd place',
      3: '3rd place',
      4: '4th place',
    } as Record<PodiumPlace, string>,
    previewVictoryFor: (name: string) => `Force victory preview for ${name}.`,
    questionAnsweredCorrectly: (name: string, dieA: null | number, dieB: null | number) => `${name} answered correctly and can move ${dieA}/${dieB}.`,
    questionAnsweredIncorrectly: (name: string) => `${name} answered incorrectly and loses the turn.`,
    questionReceived: (name: string, difficulty: TriviaDifficulty) => `${name} received a ${difficulty} trivia question.`,
    questionTimedOut: (name: string) => `${name} ran out of time and loses the turn.`,
    reset: 'Reset',
    rolling: 'Rolling...',
    rolledLog: (name: string, dieA: number, dieB: number) => `${name} rolled ${dieA} and ${dieB}.`,
    securePlace: (name: string, place: string) => `${name} secures ${place}.`,
    skip: 'Skip',
    tokenLabel: 'token',
    turnTimedOut: (name: string) => `${name} ran out of turn time and loses the turn.`,
    turnWaiting: 'Waiting',
    yourTurn: 'Your turn',
    viewVictory: 'View victory',
  },
} as const

const rewardByPlace: Record<PodiumPlace, number> = {
  1: 1000,
  2: 500,
  3: 250,
  4: 100,
}

const computePlayerProgressScore = (params: {
  playerId: string
  tokenTrackSteps: Record<string, number>
  tokens: MatchToken[]
}) => {
  const ownTokens = params.tokens.filter((token) => token.ownerId === params.playerId)

  return ownTokens.reduce((sum, token) => {
    if (token.position <= 0) {
      return sum
    }

    const laneIndex = finalLaneByColor[token.color].indexOf(token.position)

    if (laneIndex >= 0) {
      return sum + TRACK_LENGTH + laneIndex + 1
    }

    if (isTrackPosition(token.position)) {
      return sum + Math.max(params.tokenTrackSteps[token.id] || 0, 1)
    }

    return sum
  }, 0)
}

const buildPlacementEntry = (params: {
  player: MatchPlayer
  place: PodiumPlace
  tokenTrackSteps: Record<string, number>
  tokens: MatchToken[]
}): FinalPlacement => {
  const goalCount = params.tokens.filter(
    (token) =>
      token.ownerId === params.player.id &&
      token.position === finalLaneByColor[token.color][finalLaneByColor[token.color].length - 1],
  ).length

  return {
    id: params.player.id,
    avatar: params.player.avatar,
    color: params.player.color,
    goalCount,
    name: params.player.name,
    place: params.place,
    progressScore: computePlayerProgressScore({
      playerId: params.player.id,
      tokenTrackSteps: params.tokenTrackSteps,
      tokens: params.tokens,
    }),
    reward: rewardByPlace[params.place],
    tag: params.player.name,
    visualSkinId: params.player.visualSkinId,
  }
}

const parsePracticeDifficulty = (value: null | string): PracticeDifficulty => {
  if (value === 'easy' || value === 'hard') {
    return value
  }

  return 'medium'
}

const withAiPracticeState = (
  state: ReadonlyGameState,
  difficulty: PracticeDifficulty,
  humanName: string,
  language: 'es' | 'en',
): ReadonlyGameState => {
  const aiNamePrefix = matchCopyByLanguage[language].botLabelByDifficulty[difficulty]

  return {
    ...state,
    lobbyId: `practice-ai-${difficulty}`,
    players: state.players.map((player, index) => {
      if (index === 0) {
        return {
          ...player,
          name: humanName,
        }
      }

      return {
        ...player,
        name: `${aiNamePrefix} ${index}`,
      }
    }),
  }
}

const pickAiMove = (params: {
  difficulty: PracticeDifficulty
  legalMoves: MatchLegalMove[]
  safeSquares: readonly number[]
  tokens: MatchToken[]
}) => {
  if (params.legalMoves.length === 0) {
    return null
  }

  if (params.difficulty === 'easy') {
    return params.legalMoves[Math.floor(Math.random() * params.legalMoves.length)]
  }

  const safeSet = new Set<number>([...params.safeSquares, ...protectedColorTrackSquares])

  const scoredMoves = params.legalMoves.map((move) => {
    const movedToken = params.tokens.find((token) => token.id === move.tokenId)

    if (!movedToken) {
      return {
        move,
        score: -1,
      }
    }

    const captureTarget = params.tokens.find(
      (token) =>
        token.id !== movedToken.id &&
        token.ownerId !== movedToken.ownerId &&
        token.position === move.to,
    )
    const isExitCapture =
      move.from <= 0 && move.to === startSquareByColor[movedToken.color] && isTrackPosition(move.to)
    const isCapture = Boolean(captureTarget) && (!safeSet.has(move.to) || isExitCapture)
    const reachesGoal = laneGoalPositionSet.has(move.to)
    const exitsHome = move.from <= 0
    const advancesLane = isLanePosition(move.to)

    let score = 0

    if (reachesGoal) {
      score += params.difficulty === 'hard' ? 170 : 120
    }

    if (isCapture) {
      score += params.difficulty === 'hard' ? 120 : 80
    }

    if (exitsHome) {
      score += params.difficulty === 'hard' ? 40 : 22
    }

    if (advancesLane) {
      score += params.difficulty === 'hard' ? 24 : 14
    }

    score += move.path.length * (params.difficulty === 'hard' ? 7 : 5)

    if (params.difficulty === 'hard' && move.resource === 'sum') {
      score += 10
    }

    score += Math.random() * 3

    return {
      move,
      score,
    }
  })

  scoredMoves.sort((left, right) => right.score - left.score)
  return scoredMoves[0]?.move || null
}

const getBlockedSquares = (tokens: MatchToken[]) => {
  const bySquare = tokens.reduce<Record<number, MatchToken[]>>((acc, token) => {
    if (!acc[token.position]) {
      acc[token.position] = []
    }

    acc[token.position].push(token)
    return acc
  }, {})

  return Object.entries(bySquare)
    .filter(([, grouped]) => grouped.length === 2 && grouped[0].color === grouped[1].color)
    .map(([position]) => Number(position))
}

const canExitHomeWithSteps = (rule: 'FIVE' | 'EVEN' | 'SIX', steps: number) => {
  if (rule === 'EVEN') {
    return steps % 2 === 0
  }

  if (rule === 'SIX') {
    return steps === 6
  }

  return steps === 5
}

const buildLegalMoves = (params: {
  tokens: MatchToken[]
  turnPlayerId: string
  blockedSquares: number[]
  safeSquares: number[]
  tokenTrackSteps: Record<string, number>
  dice: MatchDiceState
  allowSumDice: boolean
  exitHomeRule: 'FIVE' | 'EVEN' | 'SIX'
  requiresExactHome: boolean
  bonusPending: number | null
}): MatchLegalMove[] => {
  if (!params.dice.rolled || !params.dice.dieA || !params.dice.dieB) {
    return []
  }

  const resources: Array<{ resource: MoveResource; steps: number }> = []

  if (!params.dice.consumed.dieA) {
    resources.push({ resource: 'dieA', steps: params.dice.dieA })
  }

  if (!params.dice.consumed.dieB) {
    resources.push({ resource: 'dieB', steps: params.dice.dieB })
  }

  if (params.allowSumDice && !params.dice.consumed.sum) {
    resources.push({ resource: 'sum', steps: params.dice.dieA + params.dice.dieB })
  }

  if (params.bonusPending && !params.dice.consumed.bonus) {
    resources.push({ resource: 'bonus', steps: params.bonusPending })
  }

  const turnTokens = params.tokens.filter((token) => token.ownerId === params.turnPlayerId)
  const blockedSet = new Set(params.blockedSquares)
  const safeSet = new Set<number>([...params.safeSquares, ...protectedColorTrackSquares])
  const tokensByPosition = params.tokens.reduce<Record<number, MatchToken[]>>((acc, token) => {
    if (!acc[token.position]) {
      acc[token.position] = []
    }

    acc[token.position].push(token)
    return acc
  }, {})

  const isIllegalDestination = (
    tokenColor: PlayerColor,
    destination: number,
    exitFromHome: boolean,
  ) => {
    const occupants = (tokensByPosition[destination] || []).filter(
      (occupant) => occupant.color !== tokenColor,
    )

    if (occupants.length === 0) {
      return false
    }

    if (exitFromHome && destination === startSquareByColor[tokenColor]) {
      return false
    }

    if (safeSet.has(destination) || isLanePosition(destination)) {
      return true
    }

    return false
  }

  const legalMoves: MatchLegalMove[] = []

  for (const token of turnTokens) {
    for (const { resource, steps } of resources) {
      if (token.position <= 0) {
        if (resource !== 'dieA' && resource !== 'dieB') {
          continue
        }

        if (!canExitHomeWithSteps(params.exitHomeRule, steps)) {
          continue
        }

        const startSquare = startSquareByColor[token.color]

        if (params.blockedSquares.includes(startSquare)) {
          continue
        }

        if (isIllegalDestination(token.color, startSquare, true)) {
          continue
        }

        legalMoves.push({
          id: nextId('mv'),
          tokenId: token.id,
          from: 0,
          to: startSquare,
          resource,
          path: [startSquare],
        })
        continue
      }

      if (isLanePosition(token.position)) {
        const lane = finalLaneByColor[token.color]
        const laneIndex = lane.indexOf(token.position)

        if (laneIndex < 0) {
          continue
        }

        const nextIndex = laneIndex + steps

        if (nextIndex >= lane.length) {
          if (params.requiresExactHome) {
            continue
          }

          const moveToEndPath = lane.slice(laneIndex + 1)

          if (moveToEndPath.length === 0) {
            continue
          }

          const laneDestination = moveToEndPath[moveToEndPath.length - 1]

          if (isIllegalDestination(token.color, laneDestination, false)) {
            continue
          }

          legalMoves.push({
            id: nextId('mv'),
            tokenId: token.id,
            from: token.position,
            to: laneDestination,
            resource,
            path: moveToEndPath,
          })
          continue
        }

        const path = lane.slice(laneIndex + 1, nextIndex + 1)

        if (path.length === 0) {
          continue
        }

        const laneDestination = path[path.length - 1]

        if (isIllegalDestination(token.color, laneDestination, false)) {
          continue
        }

        legalMoves.push({
          id: nextId('mv'),
          tokenId: token.id,
          from: token.position,
          to: laneDestination,
          resource,
          path,
        })
        continue
      }

      if (!isTrackPosition(token.position)) {
        continue
      }

      const path: number[] = []
      let blockedAt: number | undefined
      let remaining = steps
      let current = token.position
      let trackStepsDelta = 0

      while (remaining > 0) {
        const canEnterLane =
          current === entrySquareByColor[token.color] &&
          (params.tokenTrackSteps[token.id] || 0) + trackStepsDelta >= stepsToLaneEntryByColor[token.color]

        if (canEnterLane) {
          const lane = finalLaneByColor[token.color]
          const lanePath = lane.slice(0, remaining)

          if (lanePath.length < remaining) {
            if (params.requiresExactHome) {
              path.length = 0
              break
            }
          }

          for (const nextLanePosition of lanePath) {
            if (blockedSet.has(nextLanePosition) && nextLanePosition !== token.position) {
              blockedAt = nextLanePosition
              break
            }

            path.push(nextLanePosition)
            current = nextLanePosition
          }

          remaining -= lanePath.length
          break
        }

        const next = wrapPosition(current + 1)

        if (blockedSet.has(next) && next !== token.position) {
          blockedAt = next
          break
        }

        path.push(next)
        current = next
        trackStepsDelta += 1
        remaining -= 1
      }

      if (path.length === 0) {
        continue
      }

      if (remaining > 0 && !blockedAt) {
        continue
      }

      if (isIllegalDestination(token.color, current, false)) {
        continue
      }

      legalMoves.push({
        id: nextId('mv'),
        tokenId: token.id,
        from: token.position,
        to: current,
        resource,
        path,
        blockedAt,
      })
    }
  }

  return legalMoves
}

const getResourceValue = (resource: MoveResource, dice: MatchDiceState, bonus: number | null) => {
  if (resource === 'dieA') {
    return dice.dieA || 0
  }

  if (resource === 'dieB') {
    return dice.dieB || 0
  }

  if (resource === 'sum') {
    return (dice.dieA || 0) + (dice.dieB || 0)
  }

  return bonus || 0
}

type PlayerHudCardProps = {
  player: MatchPlayer
  isTurn: boolean
}

const PlayerHudCard = memo(function PlayerHudCard({ player, isTurn }: PlayerHudCardProps) {
  const language = useAppSettingsStore((state) => state.language)
  const selectedBoardThemeId = useAppSettingsStore((state) => state.selectedBoardThemeId)
  const ui = matchCopyByLanguage[language]
  const surfacePalette = getBoardThemeSurfacePalette(selectedBoardThemeId)
  const theme = getPlayerVisualThemeByColor(player.color, player.visualSkinId)

  return (
    <article
      className="w-[132px] rounded-2xl border px-3 py-2 text-center shadow-[0_8px_24px_rgba(0,0,0,0.35)] backdrop-blur-sm"
      style={{
        background: surfacePalette.hudCardBackground,
        borderColor: surfacePalette.hudCardBorder,
        color: surfacePalette.hudCardText,
      }}
    >
      <div className={`mx-auto mb-2 h-1.5 w-full rounded-full ${theme.stripClass}`} />
      <span
        className="mx-auto mb-2 inline-flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border-2 border-white/45 shadow-[0_4px_10px_rgba(0,0,0,0.2)]"
        style={{ background: surfacePalette.hudAvatarBackground }}
      >
        <GameAvatar
          alt={player.name}
          avatar={player.avatar}
          imageClassName="h-full w-full object-contain p-1"
          textClassName="text-sm font-black text-[#2c190d]"
        />
      </span>
      <p className="truncate font-display text-lg leading-none">{player.name}</p>

      <div
        className="mt-2 inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-black uppercase tracking-wide"
        style={{
          background: surfacePalette.hudPillBackground,
          borderColor: surfacePalette.hudPillBorder,
          color: surfacePalette.hudPillText,
        }}
      >
        <span className={`inline-flex h-4 w-4 items-center justify-center rounded-full ${theme.hudAccentClass}`}>
          D
        </span>
        {isTurn ? ui.yourTurn : ui.turnWaiting}
      </div>

      <div className="mt-2 flex items-center justify-center gap-1.5">
        {Array.from({ length: 4 }).map((_, index) => (
          <span
            className={`h-2.5 w-2.5 rounded-full border border-white/15 ${
              index < player.tokensInGoal ? theme.hudAccentClass : 'bg-white/20'
            }`}
            key={`${player.id}-progress-${index}`}
          />
        ))}
      </div>
    </article>
  )
})
PlayerHudCard.displayName = 'MockPlayerHudCard'

type DiceFaceValue = 1 | 2 | 3 | 4 | 5 | 6

const HudDie = memo(function HudDie({ skinId, value, rolling }: { skinId: DiceSkinId; value: null | number; rolling: boolean }) {
  return (
    <GameDie className="h-11 w-11" rolling={rolling} skinId={skinId} value={value} />
  )
})
HudDie.displayName = 'MockHudDie'

type TurnDiceLauncherProps = {
  isActive: boolean
  canRoll: boolean
  diceSkinId: DiceSkinId
  rolling: boolean
  dieA: null | number
  dieB: null | number
  preview: { dieA: DiceFaceValue; dieB: DiceFaceValue }
  onRoll: () => void
}

const TurnDiceLauncher = memo(function TurnDiceLauncher({
  isActive,
  canRoll,
  diceSkinId,
  rolling,
  dieA,
  dieB,
  preview,
  onRoll,
}: TurnDiceLauncherProps) {
  const language = useAppSettingsStore((state) => state.language)
  const selectedBoardThemeId = useAppSettingsStore((state) => state.selectedBoardThemeId)
  const ui = matchCopyByLanguage[language]
  const surfacePalette = getBoardThemeSurfacePalette(selectedBoardThemeId)
  const isEnabled = isActive && canRoll && !rolling

  return (
    <div className="pointer-events-none mt-2 flex flex-col items-center gap-1.5">
      <button
        className={`pointer-events-auto flex items-center gap-2 rounded-2xl border px-2 py-2 transition-all ${
          isEnabled
            ? 'hover:-translate-y-0.5'
            : isActive
              ? 'cursor-not-allowed opacity-80'
              : 'cursor-not-allowed opacity-60'
        } ${rolling && isActive ? 'animate-pulse' : ''}`}
        disabled={!isEnabled}
        onClick={onRoll}
        style={{
          background: isEnabled ? surfacePalette.diceLauncherActiveBackground : surfacePalette.diceLauncherIdleBackground,
          borderColor: surfacePalette.diceLauncherBorder,
          boxShadow: isEnabled ? surfacePalette.diceLauncherRing : 'none',
        }}
        type="button"
      >
        <HudDie rolling={rolling && isActive} skinId={diceSkinId} value={rolling && isActive ? preview.dieA : dieA} />
        <HudDie rolling={rolling && isActive} skinId={diceSkinId} value={rolling && isActive ? preview.dieB : dieB} />
      </button>

      <span
        className="rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wide"
        style={{
          background: surfacePalette.hudPillBackground,
          borderColor: surfacePalette.hudPillBorder,
          color: surfacePalette.diceLauncherText,
        }}
      >
        {rolling && isActive
          ? ui.rolling
          : isActive
            ? canRoll
              ? ui.clickToRoll
              : ui.diceAlreadyUsed
            : ui.turnWaiting}
      </span>
    </div>
  )
})
TurnDiceLauncher.displayName = 'MockTurnDiceLauncher'

type PlayerHudSlotProps = {
  player?: MatchPlayer
  turnPlayerId: string
  canRoll: boolean
  diceSkinId: DiceSkinId
  rolling: boolean
  dieA: null | number
  dieB: null | number
  preview: { dieA: DiceFaceValue; dieB: DiceFaceValue }
  onRoll: () => void
}

const PlayerHudSlot = memo(function PlayerHudSlot({
  player,
  turnPlayerId,
  canRoll,
  diceSkinId,
  rolling,
  dieA,
  dieB,
  preview,
  onRoll,
}: PlayerHudSlotProps) {
  if (!player) {
    return null
  }

  const isTurn = turnPlayerId === player.id

  return (
    <div className="pointer-events-none flex flex-col items-center">
      <PlayerHudCard isTurn={isTurn} player={player} />
      <TurnDiceLauncher
        canRoll={canRoll}
        diceSkinId={diceSkinId}
        dieA={dieA}
        dieB={dieB}
        isActive={isTurn}
        onRoll={onRoll}
        preview={preview}
        rolling={rolling}
      />
    </div>
  )
})
PlayerHudSlot.displayName = 'MockPlayerHudSlot'

const hudSlotColors: PlayerColor[] = ['green', 'red', 'yellow', 'blue']

const hudSlotPositionClassByColor: Record<PlayerColor, string> = {
  green: 'left-2 top-2 lg:left-4 lg:top-[17%] lg:-translate-y-1/2',
  red: 'right-2 top-2 lg:right-4 lg:top-[17%] lg:-translate-y-1/2',
  yellow: 'bottom-2 left-2 lg:bottom-[17%] lg:left-4 lg:translate-y-1/2',
  blue: 'bottom-2 right-2 lg:bottom-[17%] lg:right-4 lg:translate-y-1/2',
}

type MockBoardStageProps = {
  activeExpandedTokenId: null | string
  animatingTokenIds: string[]
  blockedSquares: number[]
  boardTokenDiceChoices: Record<string, Array<{ id: string; label: string; value: number }>>
  canRollAction: boolean
  currentTurnPlayerId: string
  dice: MatchDiceState
  diceSkinByPlayerId: Partial<Record<string, DiceSkinId>>
  highlightedSquares: number[]
  highlightedTokenIds: string[]
  hudDicePreview: { dieA: DiceFaceValue; dieB: DiceFaceValue }
  hudDiceRolling: boolean
  onTokenClick: (tokenId: string) => void
  onTokenDiceChoiceHover: (tokenId: string, choiceId: null | string) => void
  onTokenDiceChoiceSelect: (tokenId: string, choiceId: string) => void
  onTokenHover: (tokenId: string | null) => void
  players: MatchPlayer[]
  playersByColor: Partial<Record<PlayerColor, MatchPlayer>>
  safeSquares: readonly number[]
  selectedDiceSkinId: DiceSkinId
  selectedTokenId: null | string
  surfacePalette: ReturnType<typeof getBoardThemeSurfacePalette>
  tokens: MatchToken[]
  tooltipByTokenId: Record<string, string>
  triggerHudDiceRoll: () => void
  visualSkinByColor: Partial<Record<PlayerColor, MatchPlayer['visualSkinId']>>
}

const MockBoardStage = memo(function MockBoardStage({
  activeExpandedTokenId,
  animatingTokenIds,
  blockedSquares,
  boardTokenDiceChoices,
  canRollAction,
  currentTurnPlayerId,
  dice,
  diceSkinByPlayerId,
  highlightedSquares,
  highlightedTokenIds,
  hudDicePreview,
  hudDiceRolling,
  onTokenClick,
  onTokenDiceChoiceHover,
  onTokenDiceChoiceSelect,
  onTokenHover,
  players,
  playersByColor,
  safeSquares,
  selectedDiceSkinId,
  selectedTokenId,
  surfacePalette,
  tokens,
  tooltipByTokenId,
  triggerHudDiceRoll,
  visualSkinByColor,
}: MockBoardStageProps) {
  return (
    <div className="relative mx-auto max-w-[980px] pb-16 pt-16 lg:px-[150px] lg:pb-0 lg:pt-0">
      <Board3D
        animatingTokenIds={animatingTokenIds}
        blockedSquares={blockedSquares}
        expandedTokenId={activeExpandedTokenId}
        highlightedSquares={highlightedSquares}
        movableTokenIds={highlightedTokenIds}
        onTokenClick={onTokenClick}
        onTokenDiceChoiceHover={onTokenDiceChoiceHover}
        onTokenDiceChoiceSelect={onTokenDiceChoiceSelect}
        onTokenHover={onTokenHover}
        players={players}
        safeSquares={safeSquares}
        selectedTokenId={selectedTokenId}
        surfacePalette={surfacePalette}
        tokenDiceChoices={boardTokenDiceChoices}
        tokenHints={tooltipByTokenId}
        tokens={tokens}
        visualSkinByColor={visualSkinByColor}
      />

      <div className="pointer-events-none absolute inset-0">
        {hudSlotColors.map((color) => {
          const player = playersByColor[color]

          return (
            <div className={`absolute ${hudSlotPositionClassByColor[color]}`} key={`hud-slot-${color}`}>
              <PlayerHudSlot
                canRoll={canRollAction}
                diceSkinId={player ? diceSkinByPlayerId[player.id] || selectedDiceSkinId : selectedDiceSkinId}
                dieA={dice.dieA}
                dieB={dice.dieB}
                onRoll={triggerHudDiceRoll}
                player={player}
                preview={hudDicePreview}
                rolling={hudDiceRolling}
                turnPlayerId={currentTurnPlayerId}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
})
MockBoardStage.displayName = 'MockBoardStage'

type TokenDiceChoiceWithMove = {
  id: MoveResource
  value: number
  label: string
  move: MatchLegalMove
}

type HoveredChoicePreview = {
  tokenId: string
  choiceId: string
  steps: number
}

const TOKEN_STEP_ANIMATION_MS = 105

const laneGoalPositionSet = new Set(
  Object.values(finalLaneByColor).map((lane) => lane[lane.length - 1]),
)

const tokenMovedToGoal = (token: MatchToken) => laneGoalPositionSet.has(token.position)

const createInitialLogEvents = (language: 'es' | 'en'): MatchLogEvent[] => [
  {
    id: 'log-bootstrap-1',
    type: 'bridge',
    message: matchCopyByLanguage[language].initialBridgeLog,
    createdAt: Date.now() - 90_000,
  },
]

const TOKENS_PER_PLAYER = 4

const createInitialTokens = (state: ReadonlyGameState, language: 'es' | 'en') => {
  const usedIds = new Set(state.tokens.map((token) => token.id))

  return state.players.flatMap((player) => {
    const ownerTokens = state.tokens
      .filter((token) => token.ownerId === player.id)
      .slice(0, TOKENS_PER_PLAYER)
      .map((token) => ({
        ...token,
        position: token.position > 0 ? token.position : 0,
      }))

    const missingCount = TOKENS_PER_PLAYER - ownerTokens.length

    const generatedTokens = Array.from({ length: missingCount }, (_, index) => {
      let nextId = `${player.id}-home-${index + 1}`

      while (usedIds.has(nextId)) {
        nextId = `${nextId}-x`
      }

      usedIds.add(nextId)

      return {
        id: nextId,
        label: `${player.name.toUpperCase()} ${matchCopyByLanguage[language].tokenLabel} ${ownerTokens.length + index + 1}`,
        ownerId: player.id,
        color: player.color,
        position: 0,
      }
    })

    return [...ownerTokens, ...generatedTokens]
  })
}

const createInitialTokenTrackSteps = (inputTokens: MatchToken[]) => {
  return inputTokens.reduce<Record<string, number>>((acc, token) => {
    acc[token.id] = 0
    return acc
  }, {})
}


export function MatchView({ showVictoryPreviewControl = false }: MatchViewProps) {
  const [searchParams] = useSearchParams()
  const { username } = useControllerWallet()
  const { awardCoins } = usePlayerProfileActions()
  const language = useAppSettingsStore((state) => state.language)
  const questionDifficulty = useAppSettingsStore((state) => state.questionDifficulty)
  const selectedBoardThemeId = useAppSettingsStore((state) => state.selectedBoardThemeId)
  const selectedDiceSkinId = useAppSettingsStore((state) => state.selectedDiceSkinId)
  const selectedTokenSkinId = useAppSettingsStore((state) => state.selectedTokenSkinId)
  const gameState = useReadonlyGameState()
  const isAiPracticeMode = searchParams.get('mode') === 'ai'
  const practiceDifficulty = parsePracticeDifficulty(searchParams.get('difficulty'))
  const humanDisplayName = username || 'PARQUIZ_PLAYER_77'
  const ui = matchCopyByLanguage[language]
  const activeTriviaDifficulty: TriviaDifficulty = isAiPracticeMode ? practiceDifficulty : questionDifficulty
  const boardTheme = getBoardThemeDefinition(selectedBoardThemeId)
  const surfacePalette = getBoardThemeSurfacePalette(selectedBoardThemeId)

  const activeSessionState = useMemo(
    () => (isAiPracticeMode ? withAiPracticeState(gameState, practiceDifficulty, humanDisplayName, language) : gameState),
    [gameState, humanDisplayName, isAiPracticeMode, language, practiceDifficulty],
  )

  const humanPlayerId = activeSessionState.players[0]?.id || activeSessionState.turnPlayerId

  const initialTokens = useMemo(
    () =>
      createInitialTokens(activeSessionState, language).map((token) =>
        token.ownerId === humanPlayerId
          ? {
              ...token,
              cosmeticId: selectedTokenSkinId,
            }
          : token,
      ),
    [activeSessionState, humanPlayerId, language, selectedTokenSkinId],
  )
  const [tokens, setTokens] = useState<MatchToken[]>(() => initialTokens)
  const [tokenTrackSteps, setTokenTrackSteps] = useState<Record<string, number>>(() =>
    createInitialTokenTrackSteps(initialTokens),
  )
  const [dice, setDice] = useState<MatchDiceState>({
    dieA: null,
    dieB: null,
    rolled: false,
    consumed: {
      dieA: false,
      dieB: false,
      sum: false,
      bonus: false,
    },
  })
  const [bonusPending, setBonusPending] = useState<number | null>(null)
  const [logEvents, setLogEvents] = useState<MatchLogEvent[]>(() => createInitialLogEvents(language))
  const [currentTurnPlayerId, setCurrentTurnPlayerId] = useState(activeSessionState.turnPlayerId)
  const [, setWinnerPlayerId] = useState<null | string>(null)
  const [selectedTokenId, setSelectedTokenId] = useState<null | string>(null)
  const [expandedTokenId, setExpandedTokenId] = useState<null | string>(null)
  const [hoveredChoicePreview, setHoveredChoicePreview] = useState<null | HoveredChoicePreview>(null)
  const [finalPlacements, setFinalPlacements] = useState<FinalPlacement[]>([])
  const [announcementIndex, setAnnouncementIndex] = useState(0)
  const [showFinalClassification, setShowFinalClassification] = useState(false)
  const [, setShowPlacementDetails] = useState(false)
  const [isTokenMoving, setIsTokenMoving] = useState(false)
  const [hudDiceRolling, setHudDiceRolling] = useState(false)
  const [hudDicePreview, setHudDicePreview] = useState<{ dieA: DiceFaceValue; dieB: DiceFaceValue }>({
    dieA: 1,
    dieB: 1,
  })
  const [turnTrivia, setTurnTrivia] = useState<TurnTriviaState>(defaultTurnTriviaState)
  const [triviaSecondsLeft, setTriviaSecondsLeft] = useState(0)
  const hudRollIntervalRef = useRef<null | number>(null)
  const hudRollTimeoutRef = useRef<null | number>(null)
  const turnTimeoutRef = useRef<null | number>(null)
  const victoryPreviewTimeoutRef = useRef<null | number>(null)
  const aiActionTimeoutRef = useRef<null | number>(null)
  const botWatchdogIntervalRef = useRef<null | number>(null)
  const triviaCountdownIntervalRef = useRef<null | number>(null)
  const triviaFeedbackTimeoutRef = useRef<null | number>(null)
  const botTurnStartedAtRef = useRef(0)
  const botHeartbeatRef = useRef(0)
  const botForceAdvanceRef = useRef(false)
  const rewardsGrantedRef = useRef(false)
  const runtimeStateRef = useRef({
    currentTurnPlayerId,
    hudDiceRolling: false,
    isPlacementFlowBlocking: false,
    isTokenMoving: false,
    showFinalClassification: false,
  })
  const usedTriviaQuestionIdsRef = useRef<Set<string>>(new Set())
  const finalPlacementsRef = useRef<FinalPlacement[]>([])
  const botRuntimeRef = useRef<BotRuntimeState>({
    bonusConsumed: false,
    bonusPending: false,
    diceConsumedA: false,
    diceConsumedB: false,
    diceRolled: false,
    isAiTurn: false,
    winnerLocked: false,
  })
  const advancingTurnRef = useRef(false)
  const applyMoveRef = useRef<(move: MatchLegalMove) => Promise<void>>(() => Promise.resolve())

  const highlightedSquares = useGameUiStore((state) => state.highlightedSquares)
  const highlightedTokenIds = useGameUiStore((state) => state.highlightedTokenIds)
  const isLogOpen = useGameUiStore((state) => state.isLogOpen)
  const animatingTokenIds = useGameUiStore((state) => state.animatingTokenIds)

  const setMoveHints = useGameUiStore((state) => state.setMoveHints)
  const setAnimatingTokenIds = useGameUiStore((state) => state.setAnimatingTokenIds)
  const setIsLogOpen = useGameUiStore((state) => state.setIsLogOpen)
  const pushTurnAction = useGameUiStore((state) => state.pushTurnAction)
  const resetTurnVisuals = useGameUiStore((state) => state.resetTurnVisuals)

  const blockedSquares = useMemo(() => getBlockedSquares(tokens), [tokens])
  const players = useMemo(() => {
    return activeSessionState.players.map<MatchPlayer>((player) => {
      const playerTokens = tokens.filter((token) => token.ownerId === player.id)

      return {
        ...player,
        tokensInBase: playerTokens.filter((token) => token.position <= 0).length,
        tokensInGoal: playerTokens.filter((token) => tokenMovedToGoal(token)).length,
      }
    })
  }, [activeSessionState.players, tokens])

  const playersById = useMemo(() => {
    return players.reduce<Record<string, MatchPlayer>>((acc, player) => {
      acc[player.id] = { ...player }
      return acc
    }, {})
  }, [players])

  const playersByColor = useMemo(() => {
    return players.reduce<Partial<Record<PlayerColor, MatchPlayer>>>((acc, player) => {
      acc[player.color] = { ...player }
      return acc
    }, {})
  }, [players])

  const visualSkinByColor = useMemo(() => {
    return players.reduce<Partial<Record<PlayerColor, TokenSkinId>>>((acc, player) => {
      if (player.visualSkinId) {
        acc[player.color] = player.visualSkinId
      }

      return acc
    }, {})
  }, [players])
  const diceSkinByPlayerId = useMemo(() => {
    return assignDistinctDiceSkins(
      players.map((player) => ({
        playerId: player.id,
        color: player.color,
        preferredSkinId: player.id === humanPlayerId ? selectedDiceSkinId : undefined,
      })),
    )
  }, [humanPlayerId, players, selectedDiceSkinId])

  const currentTurnTokens = useMemo(
    () => tokens.filter((token) => token.ownerId === currentTurnPlayerId),
    [currentTurnPlayerId, tokens],
  )
  const currentPlayerHasTokenOutsideHome = useMemo(
    () => currentTurnTokens.some((token) => token.position > 0),
    [currentTurnTokens],
  )

  const fullTurnOrder = useMemo(() => players.map((player) => player.id), [players])
  const placedPlayerIds = useMemo(() => finalPlacements.map((placement) => placement.id), [finalPlacements])
  const placedPlayerIdSet = useMemo(() => new Set(placedPlayerIds), [placedPlayerIds])
  const activeTurnOrder = useMemo(
    () => fullTurnOrder.filter((playerId) => !placedPlayerIdSet.has(playerId)),
    [fullTurnOrder, placedPlayerIdSet],
  )
  const announcementCount = finalPlacements.length
  const isPlacementAnnouncementActive = !showFinalClassification && announcementIndex < announcementCount
  const isMatchComplete = players.length > 0 && finalPlacements.length === players.length
  const isPlacementFlowBlocking = isPlacementAnnouncementActive || isMatchComplete

  useEffect(() => {
    finalPlacementsRef.current = finalPlacements
  }, [finalPlacements])

  useEffect(() => {
    runtimeStateRef.current = {
      currentTurnPlayerId,
      hudDiceRolling,
      isPlacementFlowBlocking,
      isTokenMoving,
      showFinalClassification,
    }
  }, [currentTurnPlayerId, hudDiceRolling, isPlacementFlowBlocking, isTokenMoving, showFinalClassification])

  const clearTriviaTimers = useCallback(() => {
    if (triviaCountdownIntervalRef.current !== null) {
      window.clearInterval(triviaCountdownIntervalRef.current)
      triviaCountdownIntervalRef.current = null
    }

    if (triviaFeedbackTimeoutRef.current !== null) {
      window.clearTimeout(triviaFeedbackTimeoutRef.current)
      triviaFeedbackTimeoutRef.current = null
    }
  }, [])

  const resetTriviaState = useCallback(() => {
    clearTriviaTimers()
    setTurnTrivia(defaultTurnTriviaState)
    setTriviaSecondsLeft(0)
  }, [clearTriviaTimers])

  const openTriviaQuestion = useCallback(
    (question: TriviaQuestion) => {
      clearTriviaTimers()

      const responseWindowSeconds = activeSessionState.rules.answerTimeLimitSecs
      const expiresAt = Date.now() + responseWindowSeconds * 1000

      setTurnTrivia({
        expiresAt,
        movementUnlocked: false,
        phase: 'open',
        question,
        result: 'idle',
        selectedOption: null,
      })
      setTriviaSecondsLeft(responseWindowSeconds)
    },
    [activeSessionState.rules.answerTimeLimitSecs, clearTriviaTimers],
  )

  const isTriviaBlockingTurn = turnTrivia.phase !== 'closed' || (Boolean(turnTrivia.question) && !turnTrivia.movementUnlocked)
  const movementEnabled = dice.rolled && turnTrivia.movementUnlocked && turnTrivia.phase === 'closed'

  useEffect(() => {
    if (victoryPreviewTimeoutRef.current !== null) {
      window.clearTimeout(victoryPreviewTimeoutRef.current)
      victoryPreviewTimeoutRef.current = null
    }

    usedTriviaQuestionIdsRef.current = new Set()

    setCurrentTurnPlayerId(activeSessionState.turnPlayerId)
    setTokens(initialTokens)
    setTokenTrackSteps(createInitialTokenTrackSteps(initialTokens))
    setDice({
      dieA: null,
      dieB: null,
      rolled: false,
      consumed: {
        dieA: false,
        dieB: false,
        sum: false,
        bonus: false,
      },
    })
    setSelectedTokenId(null)
    setExpandedTokenId(null)
    setHoveredChoicePreview(null)
    setWinnerPlayerId(null)
    setIsTokenMoving(false)
    setBonusPending(null)
    setLogEvents(createInitialLogEvents(language))
    setFinalPlacements([])
    finalPlacementsRef.current = []
    rewardsGrantedRef.current = false
    setAnnouncementIndex(0)
    setShowFinalClassification(false)
    setShowPlacementDetails(false)
    resetTriviaState()
    resetTurnVisuals()
  }, [activeSessionState, initialTokens, language, resetTriviaState, resetTurnVisuals])

  const findNextActivePlayerId = useCallback(
    (fromPlayerId: string, excludedIds: ReadonlySet<string>) => {
      if (fullTurnOrder.length === 0) {
        return null
      }

      const fallback = fullTurnOrder.find((playerId) => !excludedIds.has(playerId)) || null
      const currentIndex = fullTurnOrder.indexOf(fromPlayerId)

      if (currentIndex < 0) {
        return fallback
      }

      for (let step = 1; step <= fullTurnOrder.length; step += 1) {
        const candidate = fullTurnOrder[(currentIndex + step) % fullTurnOrder.length]

        if (!excludedIds.has(candidate)) {
          return candidate
        }
      }

      return fallback
    },
    [fullTurnOrder],
  )

  const startNextTurn = useCallback(
    (nextTurnPlayerId: null | string) => {
      if (!nextTurnPlayerId) {
        return
      }

      advancingTurnRef.current = true
      setCurrentTurnPlayerId(nextTurnPlayerId)
      resetTurnVisuals()
      resetTriviaState()
      setSelectedTokenId(null)
      setExpandedTokenId(null)
      setHoveredChoicePreview(null)
      setBonusPending(null)
      setIsTokenMoving(false)
      setHudDiceRolling(false)
      setDice({
        dieA: null,
        dieB: null,
        rolled: false,
        consumed: {
          dieA: false,
          dieB: false,
          sum: false,
          bonus: false,
        },
      })

      window.setTimeout(() => {
        advancingTurnRef.current = false
      }, 0)
    },
    [resetTriviaState, resetTurnVisuals],
  )

  const createPlacementForPlayerId = useCallback(
    (playerId: string, place: PodiumPlace, snapshotTokens: MatchToken[], snapshotTokenTrackSteps: Record<string, number>) => {
      const player = playersById[playerId]

      if (!player) {
        return null
      }

      return buildPlacementEntry({
        player,
        place,
        tokenTrackSteps: snapshotTokenTrackSteps,
        tokens: snapshotTokens,
      })
    },
    [playersById],
  )

  const buildPlacementProgression = useCallback(
    (securedPlayerId: string, snapshotTokens: MatchToken[], snapshotTokenTrackSteps: Record<string, number>) => {
      const currentPlacements = finalPlacementsRef.current

      if (currentPlacements.some((placement) => placement.id === securedPlayerId)) {
        return currentPlacements
      }

      const nextPlacements = [...currentPlacements]
      const securedPlace = Math.min(nextPlacements.length + 1, 4) as PodiumPlace
      const securedPlacement = createPlacementForPlayerId(
        securedPlayerId,
        securedPlace,
        snapshotTokens,
        snapshotTokenTrackSteps,
      )

      if (!securedPlacement) {
        return currentPlacements
      }

      nextPlacements.push(securedPlacement)

      if (nextPlacements.length === players.length - 1) {
        const placedIds = new Set(nextPlacements.map((placement) => placement.id))
        const remainingPlayer = players.find((player) => !placedIds.has(player.id))

        if (remainingPlayer) {
          const lastPlace = Math.min(nextPlacements.length + 1, 4) as PodiumPlace
          const remainingPlacement = createPlacementForPlayerId(
            remainingPlayer.id,
            lastPlace,
            snapshotTokens,
            snapshotTokenTrackSteps,
          )

          if (remainingPlacement) {
            nextPlacements.push(remainingPlacement)
          }
        }
      }

      return nextPlacements
    },
    [createPlacementForPlayerId, players],
  )

  const legalMoves = useMemo(
    () =>
      buildLegalMoves({
        tokens,
        turnPlayerId: currentTurnPlayerId,
        blockedSquares,
        safeSquares: [...activeSessionState.safeSquares],
        tokenTrackSteps,
        dice,
        allowSumDice: activeSessionState.rules.allowSumDice,
        exitHomeRule: activeSessionState.rules.exitHomeRule,
        requiresExactHome: activeSessionState.rules.requiresExactHome,
        bonusPending,
      }),
    [
      tokens,
      currentTurnPlayerId,
      blockedSquares,
      activeSessionState.safeSquares,
      tokenTrackSteps,
      dice,
      activeSessionState.rules.allowSumDice,
      activeSessionState.rules.exitHomeRule,
      activeSessionState.rules.requiresExactHome,
      bonusPending,
    ],
  )

  const primaryLegalMoves = useMemo(
    () => legalMoves.filter((move) => move.resource === 'dieA' || move.resource === 'dieB'),
    [legalMoves],
  )

  const interactiveLegalMoves = useMemo(() => (movementEnabled ? legalMoves : []), [legalMoves, movementEnabled])

  const tokenDiceChoices = useMemo(() => {
    return interactiveLegalMoves.reduce<Record<string, TokenDiceChoiceWithMove[]>>((acc, move) => {
      if (!acc[move.tokenId]) {
        acc[move.tokenId] = []
      }

      const value = getResourceValue(move.resource, dice, bonusPending)
      const primaryChoice = move.resource === 'dieA' || move.resource === 'dieB'
      const label = primaryChoice
        ? `${value}`
        : move.resource === 'sum'
          ? `SUM ${value}`
          : `+${value}`
      const nextChoice = {
        id: move.resource,
        value,
        label,
        move,
      }

      const alreadyExists = acc[move.tokenId].some((choice) => choice.id === move.resource)

      if (!alreadyExists) {
        acc[move.tokenId].push(nextChoice)
      }

      return acc
    }, {})
  }, [interactiveLegalMoves, dice, bonusPending])

  const boardTokenDiceChoices = useMemo(() => {
    return Object.entries(tokenDiceChoices).reduce<
      Record<
        string,
        Array<{
          id: MoveResource
          value: number
          label: string
        }>
      >
    >((acc, [tokenId, choices]) => {
      acc[tokenId] = choices
        .filter((choice) => choice.id === 'dieA' || choice.id === 'dieB')
        .map((choice) => ({
          id: choice.id,
          value: choice.value,
          label: choice.label,
        }))
      return acc
    }, {})
  }, [tokenDiceChoices])

  const activeExpandedTokenId = useMemo(() => {
    if (!expandedTokenId) {
      return null
    }

    const primaryChoices = boardTokenDiceChoices[expandedTokenId] || []
    return primaryChoices.length > 1 ? expandedTokenId : null
  }, [expandedTokenId, boardTokenDiceChoices])

  const filteredMoves = useMemo(() => {
    if (hoveredChoicePreview) {
      return interactiveLegalMoves.filter(
        (move) =>
          move.tokenId === hoveredChoicePreview.tokenId && move.resource === hoveredChoicePreview.choiceId,
      )
    }

    if (activeExpandedTokenId) {
      return interactiveLegalMoves.filter((move) => move.tokenId === activeExpandedTokenId)
    }

    return interactiveLegalMoves
  }, [activeExpandedTokenId, interactiveLegalMoves, hoveredChoicePreview])

  const moveHints = useMemo(() => {
    const ownTokens = tokens.filter((token) => token.ownerId === currentTurnPlayerId)

    return ownTokens.map<TokenHint>((token) => {
      const movesByResource: TokenHint['movesByResource'] = {}

      interactiveLegalMoves
        .filter((move) => move.tokenId === token.id)
        .forEach((move) => {
          const current = movesByResource[move.resource] || []
          movesByResource[move.resource] = [...current, move.to]
        })

      return {
        tokenId: token.id,
        tokenLabel: token.label,
        position: token.position,
        movesByResource,
      }
    })
  }, [tokens, interactiveLegalMoves, currentTurnPlayerId])

  const tooltipByTokenId = useMemo(() => {
    const result: Record<string, string> = {}

    moveHints.forEach((hint) => {
      const dieA = hint.movesByResource.dieA?.join('/') || '-'
      const dieB = hint.movesByResource.dieB?.join('/') || '-'
      const sum = hint.movesByResource.sum?.join('/') || '-'
      const bonus = hint.movesByResource.bonus?.join('/') || '-'

      result[hint.tokenId] = `Posicion ${hint.position}. dieA: ${dieA}. dieB: ${dieB}. SUM: ${sum}. bonus: ${bonus}.`
    })

    return result
  }, [moveHints])

  useEffect(() => {
    const tokenIds = Array.from(new Set(filteredMoves.map((move) => move.tokenId)))
    const targetSquares = Array.from(new Set(filteredMoves.map((move) => move.to)))
    setMoveHints(tokenIds, targetSquares)
  }, [filteredMoves, setMoveHints])

  useEffect(() => {
    return () => {
      if (hudRollIntervalRef.current !== null) {
        window.clearInterval(hudRollIntervalRef.current)
        hudRollIntervalRef.current = null
      }

      if (hudRollTimeoutRef.current !== null) {
        window.clearTimeout(hudRollTimeoutRef.current)
        hudRollTimeoutRef.current = null
      }

      if (victoryPreviewTimeoutRef.current !== null) {
        window.clearTimeout(victoryPreviewTimeoutRef.current)
        victoryPreviewTimeoutRef.current = null
      }

      if (aiActionTimeoutRef.current !== null) {
        window.clearTimeout(aiActionTimeoutRef.current)
        aiActionTimeoutRef.current = null
      }

      if (botWatchdogIntervalRef.current !== null) {
        window.clearInterval(botWatchdogIntervalRef.current)
        botWatchdogIntervalRef.current = null
      }

      clearTriviaTimers()
    }
  }, [clearTriviaTimers])

  const logEvent = useCallback(
    (type: MatchLogEvent['type'], message: string, tone: 'info' | 'success' | 'warning') => {
      setLogEvents((current) => [
        {
          id: nextId('event'),
          type,
          message,
          createdAt: Date.now(),
        },
        ...current,
      ])

      if (import.meta.env.DEV) {
        console.debug(`[match:${tone}] ${message}`)
      }
    },
    [],
  )

  const debugBot = useCallback((message: string, details?: Record<string, unknown>) => {
    if (!import.meta.env.DEV) {
      return
    }

    if (details) {
      console.debug(`[bot] ${message}`, details)
      return
    }

    console.debug(`[bot] ${message}`)
  }, [])

  const markBotHeartbeat = useCallback(
    (message: string, details?: Record<string, unknown>) => {
      botHeartbeatRef.current = Date.now()
      debugBot(message, details)
    },
    [debugBot],
  )

  const advanceTurn = useCallback(() => {
    if (isPlacementFlowBlocking || advancingTurnRef.current || activeTurnOrder.length === 0) {
      return
    }

    const nextTurnPlayerId = findNextActivePlayerId(currentTurnPlayerId, placedPlayerIdSet)

    if (isAiPracticeMode && currentTurnPlayerId !== humanPlayerId) {
      markBotHeartbeat('bot endTurn', {
        fromPlayerId: currentTurnPlayerId,
        toPlayerId: nextTurnPlayerId,
      })
    }

    startNextTurn(nextTurnPlayerId)
  }, [
    activeTurnOrder.length,
    currentTurnPlayerId,
    findNextActivePlayerId,
    humanPlayerId,
    isAiPracticeMode,
    isPlacementFlowBlocking,
    markBotHeartbeat,
    placedPlayerIdSet,
    startNextTurn,
  ])

  const allConsumablesUsed = dice.consumed.dieA && dice.consumed.dieB

  const canRoll = !isTriviaBlockingTurn && (!dice.rolled || allConsumablesUsed || (dice.rolled && primaryLegalMoves.length === 0))
  const isAiControlledTurn = isAiPracticeMode && currentTurnPlayerId !== humanPlayerId
  const canRollAction =
    canRoll && !isPlacementFlowBlocking && !hudDiceRolling && !isTokenMoving && !isAiControlledTurn

  const endBotTurnSafely = useCallback(
    (reason: string) => {
      if (!isAiPracticeMode || currentTurnPlayerId === humanPlayerId || isPlacementFlowBlocking) {
        return
      }

      if (botForceAdvanceRef.current) {
        return
      }

      botForceAdvanceRef.current = true
      markBotHeartbeat('bot endTurn', {
        playerId: currentTurnPlayerId,
        reason,
      })

      try {
        advanceTurn()
      } catch (error) {
        debugBot('bot endTurn forced after error', {
          error: toErrorMessage(error),
          reason,
        })
      } finally {
        window.setTimeout(() => {
          botForceAdvanceRef.current = false
        }, 120)
      }
    },
    [
      advanceTurn,
      currentTurnPlayerId,
      debugBot,
      humanPlayerId,
      isAiPracticeMode,
      isPlacementFlowBlocking,
      markBotHeartbeat,
    ],
  )

  const resolveTriviaAnswer = useCallback(
    (selectedOption: null | number, source: 'ai' | 'player' | 'timeout') => {
      if (!turnTrivia.question || turnTrivia.phase !== 'open') {
        return
      }

      clearTriviaTimers()

      const currentPlayerName = playersById[currentTurnPlayerId]?.name || ui.fallbackPlayer
      const answeredCorrectly = selectedOption === turnTrivia.question.correctIndex
      const result: TriviaFeedbackState = source === 'timeout' ? 'timeout' : answeredCorrectly ? 'correct' : 'incorrect'

      setTurnTrivia((current) => {
        if (!current.question) {
          return current
        }

        return {
          ...current,
          expiresAt: null,
          movementUnlocked: answeredCorrectly,
          phase: 'feedback',
          result,
          selectedOption,
        }
      })

      if (answeredCorrectly) {
        logEvent(
          'question',
          ui.questionAnsweredCorrectly(currentPlayerName, dice.dieA, dice.dieB),
          'success',
        )

        if (isAiControlledTurn) {
          markBotHeartbeat('bot trivia correct', {
            playerId: currentTurnPlayerId,
            selectedOption,
          })
        }

        triviaFeedbackTimeoutRef.current = window.setTimeout(() => {
          setTurnTrivia({
            expiresAt: null,
            movementUnlocked: true,
            phase: 'closed',
            question: null,
            result: 'correct',
            selectedOption,
          })
          triviaFeedbackTimeoutRef.current = null
        }, 920)

        return
      }

      logEvent(
        'question',
        source === 'timeout' ? ui.questionTimedOut(currentPlayerName) : ui.questionAnsweredIncorrectly(currentPlayerName),
        'warning',
      )

      if (isAiControlledTurn) {
        markBotHeartbeat('bot trivia failed', {
          playerId: currentTurnPlayerId,
          result,
          selectedOption,
        })
      }

      triviaFeedbackTimeoutRef.current = window.setTimeout(() => {
        triviaFeedbackTimeoutRef.current = null
        advanceTurn()
      }, 1150)
    },
    [
      advanceTurn,
      clearTriviaTimers,
      currentTurnPlayerId,
      dice.dieA,
      dice.dieB,
      isAiControlledTurn,
      logEvent,
      markBotHeartbeat,
      playersById,
      turnTrivia.phase,
      turnTrivia.question,
      ui,
    ],
  )

  useEffect(() => {
    if (turnTrivia.phase !== 'open' || !turnTrivia.question || !turnTrivia.expiresAt) {
      return
    }

    setTriviaSecondsLeft(Math.max(0, Math.ceil((turnTrivia.expiresAt - Date.now()) / 1000)))

    triviaCountdownIntervalRef.current = window.setInterval(() => {
      const remainingSeconds = Math.max(0, Math.ceil((turnTrivia.expiresAt! - Date.now()) / 1000))
      setTriviaSecondsLeft(remainingSeconds)

      if (remainingSeconds <= 0) {
        resolveTriviaAnswer(null, 'timeout')
      }
    }, 1000)

    return () => {
      if (triviaCountdownIntervalRef.current !== null) {
        window.clearInterval(triviaCountdownIntervalRef.current)
        triviaCountdownIntervalRef.current = null
      }
    }
  }, [resolveTriviaAnswer, turnTrivia.expiresAt, turnTrivia.phase, turnTrivia.question])

  useEffect(() => {
    setWinnerPlayerId(isMatchComplete ? finalPlacements[0]?.id || currentTurnPlayerId : null)
  }, [currentTurnPlayerId, finalPlacements, isMatchComplete])

  useEffect(() => {
    if (showVictoryPreviewControl || rewardsGrantedRef.current || !showFinalClassification || finalPlacements.length === 0) {
      return
    }

    const localPlacement = finalPlacements.find((placement) => placement.id === humanPlayerId)

    if (localPlacement) {
      awardCoins(localPlacement.reward)
    }

    rewardsGrantedRef.current = true
  }, [awardCoins, finalPlacements, humanPlayerId, showFinalClassification, showVictoryPreviewControl])

  useEffect(() => {
    if (turnTimeoutRef.current !== null) {
      window.clearTimeout(turnTimeoutRef.current)
      turnTimeoutRef.current = null
    }

    if (isPlacementFlowBlocking || activeSessionState.rules.timePerTurn <= 0) {
      return
    }

    const scheduledTurnPlayerId = currentTurnPlayerId
    const scheduledPlayerName = playersById[scheduledTurnPlayerId]?.name || ui.fallbackPlayer

    const handleTurnTimeout = () => {
      const runtimeState = runtimeStateRef.current

      if (
        runtimeState.currentTurnPlayerId !== scheduledTurnPlayerId ||
        runtimeState.isPlacementFlowBlocking ||
        runtimeState.showFinalClassification
      ) {
        return
      }

      if (advancingTurnRef.current || runtimeState.hudDiceRolling || runtimeState.isTokenMoving) {
        turnTimeoutRef.current = window.setTimeout(handleTurnTimeout, 250)
        return
      }

      logEvent('question', ui.turnTimedOut(scheduledPlayerName), 'warning')
      advanceTurn()
    }

    turnTimeoutRef.current = window.setTimeout(handleTurnTimeout, activeSessionState.rules.timePerTurn * 1000)

    return () => {
      if (turnTimeoutRef.current !== null) {
        window.clearTimeout(turnTimeoutRef.current)
        turnTimeoutRef.current = null
      }
    }
  }, [activeSessionState.rules.timePerTurn, advanceTurn, currentTurnPlayerId, isPlacementFlowBlocking, logEvent, playersById, ui])

  useEffect(() => {
    if (!isMatchComplete || finalPlacements.length === 0 || showFinalClassification || announcementIndex < announcementCount) {
      return
    }

    const finalRevealTimer = window.setTimeout(() => {
      setShowFinalClassification(true)
    }, 650)

    return () => {
      window.clearTimeout(finalRevealTimer)
    }
  }, [announcementCount, announcementIndex, finalPlacements.length, isMatchComplete, showFinalClassification])

  useEffect(() => {
    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (!isNonCriticalExternalError(event.reason)) {
        return
      }

      debugBot('external non-critical error ignored', {
        error: toErrorMessage(event.reason),
      })
      event.preventDefault()
    }

    window.addEventListener('unhandledrejection', onUnhandledRejection)

    return () => {
      window.removeEventListener('unhandledrejection', onUnhandledRejection)
    }
  }, [debugBot])

  useEffect(() => {
    botRuntimeRef.current = {
      bonusConsumed: dice.consumed.bonus,
      bonusPending: Boolean(bonusPending),
      diceConsumedA: dice.consumed.dieA,
      diceConsumedB: dice.consumed.dieB,
      diceRolled: dice.rolled,
      isAiTurn: isAiControlledTurn,
      winnerLocked: isPlacementFlowBlocking,
    }
  }, [
    isAiControlledTurn,
    isPlacementFlowBlocking,
    bonusPending,
    dice.rolled,
    dice.consumed.dieA,
    dice.consumed.dieB,
    dice.consumed.bonus,
  ])

  useEffect(() => {
    botForceAdvanceRef.current = false
  }, [currentTurnPlayerId])

  useEffect(() => {
    if (botWatchdogIntervalRef.current !== null) {
      window.clearInterval(botWatchdogIntervalRef.current)
      botWatchdogIntervalRef.current = null
    }

    if (!isAiControlledTurn || isPlacementFlowBlocking) {
      return
    }

    const turnStartedAt = Date.now()
    botTurnStartedAtRef.current = turnStartedAt
    botHeartbeatRef.current = turnStartedAt

    debugBot('bot turn started', {
      difficulty: practiceDifficulty,
      playerId: currentTurnPlayerId,
    })

    botWatchdogIntervalRef.current = window.setInterval(() => {
      const runtime = botRuntimeRef.current

      if (!runtime.isAiTurn || runtime.winnerLocked || advancingTurnRef.current) {
        return
      }

      const now = Date.now()
      const turnElapsedMs = now - botTurnStartedAtRef.current
      const idleElapsedMs = now - botHeartbeatRef.current
      const diceAlreadyUsed = runtime.diceRolled && runtime.diceConsumedA && runtime.diceConsumedB
      const bonusResolved = !runtime.bonusPending || runtime.bonusConsumed

      if (diceAlreadyUsed && bonusResolved) {
        debugBot('bot failsafe: dice used -> endTurn', {
          idleElapsedMs,
          turnElapsedMs,
        })
        endBotTurnSafely('dice-used-failsafe')
        return
      }

      if (idleElapsedMs >= BOT_IDLE_FAILSAFE_MS || turnElapsedMs >= BOT_MAX_TURN_MS) {
        debugBot('bot failsafe timeout -> endTurn', {
          idleElapsedMs,
          turnElapsedMs,
        })
        endBotTurnSafely('timeout-failsafe')
      }
    }, BOT_WATCHDOG_INTERVAL_MS)

    return () => {
      if (botWatchdogIntervalRef.current !== null) {
        window.clearInterval(botWatchdogIntervalRef.current)
        botWatchdogIntervalRef.current = null
      }
    }
  }, [
    isAiControlledTurn,
    isPlacementFlowBlocking,
    currentTurnPlayerId,
    practiceDifficulty,
    debugBot,
    endBotTurnSafely,
  ])

  useEffect(() => {
    if (isPlacementFlowBlocking || !dice.rolled || hudDiceRolling || isTokenMoving || advancingTurnRef.current || isTriviaBlockingTurn) {
      return
    }

    if (!bonusPending || dice.consumed.bonus) {
      return
    }

    const bonusMoves = legalMoves
      .filter((move) => move.resource === 'bonus')
      .sort((left, right) => left.tokenId.localeCompare(right.tokenId))

    if (bonusMoves.length === 0) {
      setDice((current) => ({
        ...current,
        consumed: {
          ...current.consumed,
          bonus: true,
        },
      }))
      return
    }

    void applyMoveRef.current(bonusMoves[0])
  }, [isPlacementFlowBlocking, bonusPending, dice.rolled, dice.consumed.bonus, hudDiceRolling, isTokenMoving, isTriviaBlockingTurn, legalMoves])

  useEffect(() => {
    if (isPlacementFlowBlocking || !dice.rolled || hudDiceRolling || isTokenMoving || advancingTurnRef.current || isTriviaBlockingTurn) {
      return
    }

    const noDiceRemaining = dice.consumed.dieA && dice.consumed.dieB
    const noMovesWithRemainingDice = !noDiceRemaining && primaryLegalMoves.length === 0
    const hasPendingBonus = Boolean(bonusPending) && !dice.consumed.bonus

    if ((!noDiceRemaining && !noMovesWithRemainingDice) || hasPendingBonus) {
      return
    }

    advanceTurn()
  }, [advanceTurn, isPlacementFlowBlocking, dice.rolled, dice.consumed.dieA, dice.consumed.dieB, dice.consumed.bonus, hudDiceRolling, isTokenMoving, isTriviaBlockingTurn, bonusPending, primaryLegalMoves.length])

  const rollDice = useCallback(() => {
    if (hudRollIntervalRef.current !== null) {
      window.clearInterval(hudRollIntervalRef.current)
      hudRollIntervalRef.current = null
    }

    if (hudRollTimeoutRef.current !== null) {
      window.clearTimeout(hudRollTimeoutRef.current)
      hudRollTimeoutRef.current = null
    }

    setHudDiceRolling(false)

    if (isPlacementFlowBlocking || !canRoll) {
      return
    }

    const nextRoll = {
      dieA: randomDieValue(),
      dieB: randomDieValue(),
    }

    resetTurnVisuals()
    resetTriviaState()
    setSelectedTokenId(null)
    setExpandedTokenId(null)
    setHoveredChoicePreview(null)
    setBonusPending(null)

    setDice({
      dieA: nextRoll.dieA,
      dieB: nextRoll.dieB,
      rolled: true,
      consumed: {
        dieA: false,
        dieB: false,
        sum: false,
        bonus: false,
      },
    })

    const currentPlayerName = playersById[currentTurnPlayerId]?.name || ui.fallbackPlayer
    logEvent('roll', ui.rolledLog(currentPlayerName, nextRoll.dieA, nextRoll.dieB), 'info')

    const canAttemptHomeExit =
      !currentPlayerHasTokenOutsideHome &&
      (canExitHomeWithSteps(activeSessionState.rules.exitHomeRule, nextRoll.dieA) ||
        canExitHomeWithSteps(activeSessionState.rules.exitHomeRule, nextRoll.dieB))

    if (currentPlayerHasTokenOutsideHome || canAttemptHomeExit) {
      const nextQuestion = drawTriviaQuestion(activeTriviaDifficulty, usedTriviaQuestionIdsRef.current, language)
      usedTriviaQuestionIdsRef.current.add(nextQuestion.id)
      openTriviaQuestion(nextQuestion)
      logEvent('question', ui.questionReceived(currentPlayerName, activeTriviaDifficulty), 'info')
    }

    if (isAiControlledTurn) {
      markBotHeartbeat('bot rolled', {
        dieA: nextRoll.dieA,
        dieB: nextRoll.dieB,
        playerId: currentTurnPlayerId,
      })
    }
  }, [
    canRoll,
    currentTurnPlayerId,
    currentPlayerHasTokenOutsideHome,
    isAiControlledTurn,
    activeTriviaDifficulty,
    activeSessionState.rules.exitHomeRule,
    language,
    logEvent,
    markBotHeartbeat,
    openTriviaQuestion,
    playersById,
    resetTriviaState,
    resetTurnVisuals,
    isPlacementFlowBlocking,
    ui,
  ])

  const triggerHudDiceRoll = useCallback(
    (source: 'ai' | 'user' = 'user') => {
      if (source === 'user' && !canRollAction) {
        return
      }

      if (source === 'ai' && (isPlacementFlowBlocking || !canRoll || hudDiceRolling || isTokenMoving)) {
        return
      }

      setHudDiceRolling(true)

      if (source === 'ai') {
        markBotHeartbeat('bot roll started', {
          playerId: currentTurnPlayerId,
        })
      }

      if (hudRollIntervalRef.current !== null) {
        window.clearInterval(hudRollIntervalRef.current)
      }

      hudRollIntervalRef.current = window.setInterval(() => {
        setHudDicePreview({
          dieA: (Math.floor(Math.random() * 6) + 1) as DiceFaceValue,
          dieB: (Math.floor(Math.random() * 6) + 1) as DiceFaceValue,
        })
      }, 90)

      if (hudRollTimeoutRef.current !== null) {
        window.clearTimeout(hudRollTimeoutRef.current)
      }

      hudRollTimeoutRef.current = window.setTimeout(() => {
        if (hudRollIntervalRef.current !== null) {
          window.clearInterval(hudRollIntervalRef.current)
          hudRollIntervalRef.current = null
        }

        try {
          rollDice()
        } catch (error) {
          debugBot('bot roll failed', {
            error: toErrorMessage(error),
            source,
          })

          if (source === 'ai') {
            endBotTurnSafely('roll-error')
          }
        }
      }, 620)
    },
    [
      canRoll,
      canRollAction,
      currentTurnPlayerId,
      debugBot,
      endBotTurnSafely,
      hudDiceRolling,
      isTokenMoving,
      markBotHeartbeat,
      rollDice,
      isPlacementFlowBlocking,
    ],
  )

  const animateTokenPath = (tokenId: string, path: number[]) => {
    return new Promise<void>((resolve) => {
      if (path.length === 0) {
        resolve()
        return
      }

      let index = 0

      const stepForward = () => {
        const nextPosition = path[index]

        setTokens((current) =>
          current.map((token) =>
            token.id === tokenId
              ? {
                  ...token,
                  position: nextPosition,
                }
              : token,
          ),
        )

        index += 1

        if (index >= path.length) {
          resolve()
          return
        }

        window.setTimeout(stepForward, TOKEN_STEP_ANIMATION_MS)
      }

      stepForward()
    })
  }

  const applyMove = async (move: MatchLegalMove) => {
    if (isPlacementFlowBlocking || isTokenMoving || !movementEnabled) {
      return
    }

    const activeToken = tokens.find((token) => token.id === move.tokenId)

    if (!activeToken) {
      return
    }

    const botMoveContext = isAiControlledTurn
      ? {
          destination: move.to,
          playerId: currentTurnPlayerId,
          resource: move.resource,
          tokenId: move.tokenId,
        }
      : null

    if (botMoveContext) {
      markBotHeartbeat('bot move started', botMoveContext)
    }

    setIsTokenMoving(true)

    try {
      const tokensBeforeMove = tokens.map((token) => ({ ...token }))
      const previousBlockedSquares = getBlockedSquares(tokensBeforeMove)

      setExpandedTokenId(null)
      setHoveredChoicePreview(null)

      if (move.path.length > 0) {
        await animateTokenPath(move.tokenId, move.path)
      }

      const nextTokens = tokensBeforeMove.map((token) =>
        token.id === move.tokenId
          ? {
              ...token,
              position: move.to,
            }
          : { ...token },
      )

      const movedToken = nextTokens.find((token) => token.id === move.tokenId)

      if (!movedToken) {
        return
      }

      const consumedNext = {
        ...dice.consumed,
        [move.resource]: true,
      }

      const nextTokenTrackSteps = { ...tokenTrackSteps }

      if (move.from <= 0) {
        nextTokenTrackSteps[movedToken.id] = 0
      } else if (isTrackPosition(move.from)) {
        const trackStepCount = move.path.filter((position) => isTrackPosition(position)).length
        nextTokenTrackSteps[movedToken.id] = (nextTokenTrackSteps[movedToken.id] || 0) + trackStepCount
      }

      let nextBonusPendingValue = move.resource === 'bonus' ? 0 : (bonusPending || 0)

      const capturedToken = nextTokens.find(
        (token) =>
          token.id !== movedToken.id &&
          token.position === movedToken.position &&
          token.ownerId !== movedToken.ownerId,
      )

      const isExitCapture =
        move.from <= 0 && move.to === startSquareByColor[movedToken.color] && isTrackPosition(move.to)
      const isSafeCaptureSquare =
        activeSessionState.safeSquares.includes(movedToken.position) ||
        protectedColorTrackSquares.has(movedToken.position) ||
        isLanePosition(movedToken.position)
      let securedPlacement: FinalPlacement | null = null
      let resolvedPlayerIdSet: null | Set<string> = null

      if (capturedToken && (!isSafeCaptureSquare || isExitCapture)) {
        capturedToken.position = 0
        nextTokenTrackSteps[capturedToken.id] = 0
        nextBonusPendingValue += 20
        consumedNext.bonus = false

        logEvent(
          'capture',
          language === 'es'
            ? `${ui.colorLabel[movedToken.color]} obtiene 20 porque capturo una ficha ${ui.colorLabel[capturedToken.color]}.`
            : `${ui.colorLabel[movedToken.color]} gets 20 for capturing a ${ui.colorLabel[capturedToken.color]} token.`,
          'success',
        )
      }

      if (tokenMovedToGoal(movedToken)) {
        nextBonusPendingValue += 10
        consumedNext.bonus = false

        logEvent(
          'home',
          language === 'es'
            ? `${ui.colorLabel[movedToken.color]} obtiene 10 por llegar a meta.`
            : `${ui.colorLabel[movedToken.color]} gets 10 for reaching home.`,
          'success',
        )

        const movedPlayerGoalCount = nextTokens.filter(
          (token) => token.ownerId === movedToken.ownerId && tokenMovedToGoal(token),
        ).length

        if (movedPlayerGoalCount >= TOKENS_PER_PLAYER) {
          const resolvedPlacements = buildPlacementProgression(
            movedToken.ownerId,
            nextTokens,
            nextTokenTrackSteps,
          )

          securedPlacement = resolvedPlacements.find((placement) => placement.id === movedToken.ownerId) || null
          nextBonusPendingValue = 0
          finalPlacementsRef.current = resolvedPlacements
          setFinalPlacements(resolvedPlacements)

          if (securedPlacement) {
            logEvent('home', ui.securePlace(securedPlacement.name, ui.placeLabel[securedPlacement.place]), 'success')
          }

          resolvedPlayerIdSet = new Set(resolvedPlacements.map((placement) => placement.id))
        }
      }

      const nextBlockedSquares = getBlockedSquares(nextTokens)
      const createdBridge = nextBlockedSquares.find((square) => !previousBlockedSquares.includes(square))
      const brokenBridge = previousBlockedSquares.find((square) => !nextBlockedSquares.includes(square))

      if (createdBridge) {
        logEvent('bridge', language === 'es' ? `Puente creado en la casilla ${createdBridge}.` : `Bridge created on square ${createdBridge}.`, 'info')
      }

      if (brokenBridge) {
        logEvent('bridge', language === 'es' ? `Puente removido de la casilla ${brokenBridge}.` : `Bridge removed from square ${brokenBridge}.`, 'warning')
      }

      setAnimatingTokenIds([movedToken.id])
      window.setTimeout(() => {
        setAnimatingTokenIds([])
      }, 350)

      setTokens(nextTokens)
      setTokenTrackSteps(nextTokenTrackSteps)
      if (securedPlacement) {
        setDice({
          dieA: null,
          dieB: null,
          rolled: false,
          consumed: {
            dieA: false,
            dieB: false,
            sum: false,
            bonus: false,
          },
        })
        setBonusPending(null)
        setSelectedTokenId(null)
      } else {
        setDice((current) => ({
          ...current,
          consumed: consumedNext,
        }))
        setBonusPending(nextBonusPendingValue > 0 ? nextBonusPendingValue : null)
        setSelectedTokenId(movedToken.id)
      }

      pushTurnAction({
        id: nextId('action'),
        resource: move.resource,
        value: getResourceValue(move.resource, dice, bonusPending),
        tokenId: movedToken.id,
        tokenLabel: movedToken.label,
        origin: move.from,
        destination: move.to,
      })

      logEvent(
        'move',
        language === 'es'
          ? `${ui.colorLabel[movedToken.color]} movio ${movedToken.label} de ${move.from} a ${move.to}.`
          : `${ui.colorLabel[movedToken.color]} moved ${movedToken.label} from ${move.from} to ${move.to}.`,
        'info',
      )

      if (botMoveContext) {
        markBotHeartbeat('bot moved', botMoveContext)
      }

      if (move.blockedAt) {
        logEvent('bridge', language === 'es' ? `El movimiento fue detenido por un puente en la casilla ${move.blockedAt}.` : `Movement stopped by a bridge on square ${move.blockedAt}.`, 'warning')
      }

      if (securedPlacement) {
        const nextTurnPlayerId = findNextActivePlayerId(movedToken.ownerId, resolvedPlayerIdSet || new Set(placedPlayerIds))
        startNextTurn(nextTurnPlayerId)
      }
    } finally {
      setIsTokenMoving(false)
    }
  }

  applyMoveRef.current = applyMove

  useEffect(() => {
    if (!isAiControlledTurn || isPlacementFlowBlocking || hudDiceRolling || isTokenMoving || advancingTurnRef.current) {
      return
    }

    if (bonusPending && !dice.consumed.bonus) {
      return
    }

    const thinkDelay = aiThinkDelayByDifficulty[practiceDifficulty]

    aiActionTimeoutRef.current = window.setTimeout(() => {
      try {
        if (isPlacementFlowBlocking || advancingTurnRef.current || isTokenMoving) {
          return
        }

        if (!dice.rolled) {
          triggerHudDiceRoll('ai')
          return
        }

        if (turnTrivia.phase === 'open' && turnTrivia.question) {
          const selectedOption = pickAiTriviaAnswer(turnTrivia.question, practiceDifficulty)

          markBotHeartbeat('bot selected trivia answer', {
            playerId: currentTurnPlayerId,
            selectedOption,
          })

          resolveTriviaAnswer(selectedOption, 'ai')
          return
        }

        if (isTriviaBlockingTurn) {
          return
        }

        const diceAlreadyUsed = dice.consumed.dieA && dice.consumed.dieB
        const bonusResolved = !bonusPending || dice.consumed.bonus

        if (diceAlreadyUsed && bonusResolved) {
          endBotTurnSafely('dice-already-used')
          return
        }

        if (legalMoves.length === 0) {
          markBotHeartbeat('bot no legal moves -> skip', {
            playerId: currentTurnPlayerId,
          })
          endBotTurnSafely('no-legal-moves')
          return
        }

        const selectedMove =
          pickAiMove({
            difficulty: practiceDifficulty,
            legalMoves,
            safeSquares: activeSessionState.safeSquares,
            tokens,
          }) || legalMoves[0]

        if (!selectedMove) {
          markBotHeartbeat('bot no legal moves -> skip', {
            playerId: currentTurnPlayerId,
            reason: 'no-selected-move',
          })
          endBotTurnSafely('no-selected-move')
          return
        }

        markBotHeartbeat('bot selected move', {
          destination: selectedMove.to,
          playerId: currentTurnPlayerId,
          resource: selectedMove.resource,
          tokenId: selectedMove.tokenId,
        })

        void applyMoveRef
          .current(selectedMove)
          .catch((error) => {
            debugBot('bot move error', {
              error: toErrorMessage(error),
            })
            endBotTurnSafely('move-error')
          })
      } catch (error) {
        if (!isNonCriticalExternalError(error)) {
          debugBot('bot turn handler error', {
            error: toErrorMessage(error),
          })
        }

        endBotTurnSafely('handler-error')
      }
    }, thinkDelay)

    return () => {
      if (aiActionTimeoutRef.current !== null) {
        window.clearTimeout(aiActionTimeoutRef.current)
        aiActionTimeoutRef.current = null
      }
    }
  }, [
    isAiControlledTurn,
    isPlacementFlowBlocking,
    hudDiceRolling,
    isTokenMoving,
    bonusPending,
    dice.rolled,
    dice.consumed.bonus,
    legalMoves,
    tokens,
    practiceDifficulty,
    activeSessionState.safeSquares,
    triggerHudDiceRoll,
    currentTurnPlayerId,
    endBotTurnSafely,
    markBotHeartbeat,
    debugBot,
    dice.consumed.dieA,
    dice.consumed.dieB,
    isTriviaBlockingTurn,
    resolveTriviaAnswer,
    turnTrivia.phase,
    turnTrivia.question,
  ])

  useEffect(() => {
    if (isPlacementFlowBlocking || !dice.rolled || hudDiceRolling || isTokenMoving || advancingTurnRef.current || isTriviaBlockingTurn) {
      return
    }

    const fiveResources: MoveResource[] = []

    if (!dice.consumed.dieA && dice.dieA === 5) {
      fiveResources.push('dieA')
    }

    if (!dice.consumed.dieB && dice.dieB === 5) {
      fiveResources.push('dieB')
    }

    if (fiveResources.length === 0) {
      return
    }

    const homeTokens = tokens
      .filter((token) => token.ownerId === currentTurnPlayerId && token.position <= 0)
      .sort((left, right) => left.id.localeCompare(right.id))

    for (const token of homeTokens) {
      const tokenChoices = tokenDiceChoices[token.id] || []

      for (const resource of fiveResources) {
        const choice = tokenChoices.find((item) => item.id === resource && item.value === 5)

        if (choice) {
          void applyMoveRef.current(choice.move)
          return
        }
      }
    }
  }, [isPlacementFlowBlocking, dice.rolled, dice.dieA, dice.dieB, dice.consumed.dieA, dice.consumed.dieB, hudDiceRolling, isTokenMoving, isTriviaBlockingTurn, tokens, currentTurnPlayerId, tokenDiceChoices])

  const onTokenClick = (tokenId: string) => {
    if (isPlacementFlowBlocking || isTokenMoving || isAiControlledTurn || !movementEnabled) {
      return
    }

    setSelectedTokenId(tokenId)

    const primaryChoices = boardTokenDiceChoices[tokenId] || []

    if (primaryChoices.length === 0) {
      if (import.meta.env.DEV) {
        console.debug('[match] Esta ficha no tiene movimientos legales disponibles.')
      }
      return
    }

    if (primaryChoices.length === 1) {
      const selectedChoice = tokenDiceChoices[tokenId]?.find(
        (choice) => choice.id === primaryChoices[0].id,
      )

      if (selectedChoice) {
        void applyMove(selectedChoice.move)
      }

      return
    }

    if (primaryChoices.length > 1) {
      setExpandedTokenId(tokenId)
    }
  }

  const onTokenHover = (tokenId: string | null) => {
    if (!movementEnabled) {
      setExpandedTokenId(null)
      setHoveredChoicePreview(null)
      return
    }

    if (!tokenId) {
      setExpandedTokenId(null)
      setHoveredChoicePreview(null)
      return
    }

    const primaryChoices = boardTokenDiceChoices[tokenId] || []

    if (primaryChoices.length > 1) {
      setExpandedTokenId(tokenId)
      return
    }

    setExpandedTokenId(null)
    setHoveredChoicePreview(null)
  }

  const onTokenDiceChoiceHover = (tokenId: string, choiceId: string | null) => {
    if (!movementEnabled) {
      setHoveredChoicePreview(null)
      return
    }

    if (!choiceId) {
      setHoveredChoicePreview(null)
      return
    }

    const selectedChoice = tokenDiceChoices[tokenId]?.find((choice) => choice.id === choiceId)

    if (!selectedChoice) {
      setHoveredChoicePreview(null)
      return
    }

    setHoveredChoicePreview({
      tokenId,
      choiceId,
      steps: selectedChoice.value,
    })
  }

  const onTokenDiceChoiceSelect = (tokenId: string, choiceId: string) => {
    if (isPlacementFlowBlocking || isTokenMoving || isAiControlledTurn || !movementEnabled) {
      return
    }

    const choices = tokenDiceChoices[tokenId] || []
    const selectedChoice = choices.find((choice) => choice.id === choiceId)

    if (!selectedChoice) {
      if (import.meta.env.DEV) {
        console.debug('[match] La opcion de dado ya no esta disponible.')
      }
      return
    }

    void applyMove(selectedChoice.move)
  }

  const activeAnnouncementPlacement =
    !showFinalClassification && announcementIndex < announcementCount
      ? finalPlacements[announcementIndex]
      : null
  const activeAnnouncementTheme = activeAnnouncementPlacement
    ? getPlayerVisualThemeByColor(activeAnnouncementPlacement.color, activeAnnouncementPlacement.visualSkinId)
    : null
  const announcementBaseColor = activeAnnouncementTheme?.boardCenterColor || '#d2ab4b'
  const announcementGlassTint = buildAnnouncementGlassTint(announcementBaseColor)
  const announcementAccentColors = [
    rgbaFromHex(announcementBaseColor, 0.92),
    rgbaFromRgb(mixHexColors(announcementBaseColor, '#ffffff', 0.35), 0.88),
    rgbaFromRgb(mixHexColors(announcementBaseColor, '#ffe9a8', 0.4), 0.84),
    rgbaFromRgb(mixHexColors(announcementBaseColor, '#fff7da', 0.6), 0.78),
  ]
  const announcementGlassPanelStyle = {
    backdropFilter: 'blur(28px) saturate(145%)',
    background: `linear-gradient(180deg, ${announcementGlassTint.highlight} 0%, rgba(255,255,255,0.16) 16%, rgba(255,255,255,0.05) 100%), linear-gradient(135deg, ${announcementGlassTint.tintA} 0%, ${announcementGlassTint.tintB} 100%)`,
    borderColor: announcementGlassTint.border,
    boxShadow: `inset 0 1px 0 rgba(255,255,255,0.32), inset 0 -18px 28px rgba(255,255,255,0.05), 0 26px 48px ${announcementGlassTint.shadow}, 0 0 42px ${announcementGlassTint.glow}`,
  } satisfies CSSProperties
  const announcementGlassSheenStyle = {
    background:
      'linear-gradient(180deg, rgba(255,255,255,0.34) 0%, rgba(255,255,255,0.12) 38%, rgba(255,255,255,0.02) 100%)',
  } satisfies CSSProperties
  const announcementGlassButtonStyle = {
    backdropFilter: 'blur(22px) saturate(145%)',
    background: `linear-gradient(180deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.12) 20%, rgba(255,255,255,0.05) 100%), linear-gradient(135deg, ${announcementGlassTint.tintA} 0%, ${announcementGlassTint.tintB} 100%)`,
    borderColor: announcementGlassTint.border,
    boxShadow: `inset 0 1px 0 rgba(255,255,255,0.34), inset 0 -10px 18px rgba(255,255,255,0.05), 0 14px 24px ${announcementGlassTint.shadow}`,
  } satisfies CSSProperties
  const activeTriviaPlayer = playersById[currentTurnPlayerId] ?? null

  const skipToFinalClassification = () => {
    if (finalPlacements.length === 0) {
      return
    }

    const nextAnnouncementIndex = Math.min(announcementIndex + 1, announcementCount)
    setAnnouncementIndex(nextAnnouncementIndex)

    if (!isMatchComplete || nextAnnouncementIndex < announcementCount) {
      return
    }

    setShowFinalClassification(true)
  }

  const activeAnnouncementTitle = activeAnnouncementPlacement
    ? language === 'es'
      ? `¡${activeAnnouncementPlacement.name} ${ui.placeAnnouncementLabel[activeAnnouncementPlacement.place]}!`
      : `${activeAnnouncementPlacement.name} ${ui.placeAnnouncementLabel[activeAnnouncementPlacement.place]}!`
    : ''
  const activeAnnouncementPlaceNumber = activeAnnouncementPlacement ? activeAnnouncementPlacement.place : null
  const activeAnnouncementSubtitle = activeAnnouncementPlacement
    ? language === 'es'
      ? `${ui.congrats}, ${activeAnnouncementPlacement.name}.`
      : `${ui.congrats}, ${activeAnnouncementPlacement.name}.`
    : ''

  const previewWinnerPlayer = playersById[currentTurnPlayerId] ?? players[0] ?? null

  const clearVictoryPreview = useCallback(() => {
    if (victoryPreviewTimeoutRef.current !== null) {
      window.clearTimeout(victoryPreviewTimeoutRef.current)
      victoryPreviewTimeoutRef.current = null
    }

    setWinnerPlayerId(null)
    setFinalPlacements([])
    finalPlacementsRef.current = []
    rewardsGrantedRef.current = false
    setAnnouncementIndex(0)
    setShowFinalClassification(false)
    setShowPlacementDetails(false)
  }, [])

  const triggerVictoryPreview = useCallback(() => {
    if (!previewWinnerPlayer) {
      return
    }

    clearVictoryPreview()
    victoryPreviewTimeoutRef.current = window.setTimeout(() => {
      const previewOrder = [previewWinnerPlayer.id, ...players.map((player) => player.id).filter((playerId) => playerId !== previewWinnerPlayer.id)]
      const previewPlacements = previewOrder
        .map((playerId, index) =>
          createPlacementForPlayerId(
            playerId,
            Math.min(index + 1, 4) as PodiumPlace,
            tokens,
            tokenTrackSteps,
          ),
        )
        .filter((placement): placement is FinalPlacement => placement !== null)

      finalPlacementsRef.current = previewPlacements
      setFinalPlacements(previewPlacements)
      victoryPreviewTimeoutRef.current = null
    }, 40)
  }, [clearVictoryPreview, createPlacementForPlayerId, players, previewWinnerPlayer, tokenTrackSteps, tokens])

  return (
    <section
      className="min-h-screen bg-cover bg-center bg-no-repeat px-3 py-4 sm:px-4 sm:py-6"
      style={{ backgroundColor: boardTheme.backgroundColor, backgroundImage: boardTheme.backgroundImage }}
    >
      <div className="mx-auto w-full max-w-[1480px]">
        <article
          className="game-panel mx-auto p-3 xl:p-4"
          style={{ backgroundImage: surfacePalette.mainPanelBackground, borderColor: surfacePalette.mainPanelBorder }}
        >
          <div
            className="mb-3 flex items-center justify-between rounded-2xl border px-3 py-2 shadow-wood"
            style={{
              backgroundImage: surfacePalette.headerBackground,
              borderColor: surfacePalette.headerBorder,
            }}
          >
            <p className="font-display text-xl uppercase tracking-[0.08em]" style={{ color: surfacePalette.headerText }}>{ui.boardTitle}</p>
            <span
              className="rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em]"
              style={{
                backgroundImage: surfacePalette.badgeBackground,
                borderColor: surfacePalette.badgeBorder,
                color: surfacePalette.badgeText,
              }}
            >
              {ui.activeBridge}
            </span>
          </div>

          <MockBoardStage
            activeExpandedTokenId={activeExpandedTokenId}
            animatingTokenIds={animatingTokenIds}
            blockedSquares={blockedSquares}
            boardTokenDiceChoices={boardTokenDiceChoices}
            canRollAction={canRollAction}
            currentTurnPlayerId={currentTurnPlayerId}
            dice={dice}
            diceSkinByPlayerId={diceSkinByPlayerId}
            highlightedSquares={highlightedSquares}
            highlightedTokenIds={highlightedTokenIds}
            hudDicePreview={hudDicePreview}
            hudDiceRolling={hudDiceRolling}
            onTokenClick={onTokenClick}
            onTokenDiceChoiceHover={onTokenDiceChoiceHover}
            onTokenDiceChoiceSelect={onTokenDiceChoiceSelect}
            onTokenHover={onTokenHover}
            players={players}
            playersByColor={playersByColor}
            safeSquares={activeSessionState.safeSquares}
            selectedDiceSkinId={selectedDiceSkinId}
            selectedTokenId={selectedTokenId}
            surfacePalette={surfacePalette}
            tokens={tokens}
            tooltipByTokenId={tooltipByTokenId}
            triggerHudDiceRoll={triggerHudDiceRoll}
            visualSkinByColor={visualSkinByColor}
          />
        </article>
      </div>

      {showVictoryPreviewControl && previewWinnerPlayer ? (
        <div className="fixed right-3 top-3 z-[240] w-[min(260px,calc(100vw-1.5rem))] rounded-2xl border border-[#4f2f16] bg-[#2c170d]/92 p-3 shadow-[0_14px_28px_rgba(0,0,0,0.35)] backdrop-blur-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#f7d79b]">{ui.mockBoard}</p>
          <p className="mt-1 text-xs font-semibold text-[#ffeac5]">{ui.previewVictoryFor(previewWinnerPlayer.name)}</p>
          <div className="mt-3 flex gap-2">
            <button
              className="flex-1 rounded-full border border-[#f0bf68] bg-gradient-to-b from-[#f5c76d] to-[#d88c2f] px-3 py-2 text-[11px] font-black uppercase tracking-[0.08em] text-[#4a2409] transition hover:brightness-105"
              onClick={triggerVictoryPreview}
              type="button"
            >
              {ui.viewVictory}
            </button>
            <button
              className="rounded-full border border-[#9a7c59] bg-white/8 px-3 py-2 text-[11px] font-black uppercase tracking-[0.08em] text-[#fff1d4] transition hover:bg-white/14"
              onClick={clearVictoryPreview}
              type="button"
            >
              {ui.reset}
            </button>
          </div>
        </div>
      ) : null}

      {turnTrivia.question ? (
        <TriviaQuestionModal
          answerState={turnTrivia.result}
          difficulty={turnTrivia.question.difficulty}
          isAiTurn={isAiControlledTurn}
          onSelectOption={(optionIndex) => resolveTriviaAnswer(optionIndex, 'player')}
          player={activeTriviaPlayer || undefined}
          question={turnTrivia.question}
          secondsLeft={triviaSecondsLeft}
          selectedOption={turnTrivia.selectedOption}
        />
      ) : null}

      {activeAnnouncementPlacement ? (
        <div className="fixed inset-0 z-[220] flex items-center justify-center px-3 py-6">
          <div
            className="absolute inset-0 backdrop-blur-[16px]"
            style={{
              background: `radial-gradient(circle at 50% 50%, ${rgbaFromHex(announcementBaseColor, 0.18)} 0%, rgba(255,255,255,0.04) 26%, rgba(12,6,3,0.22) 100%)`,
            }}
          />

          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {Array.from({ length: 20 }).map((_, index) => (
              <span
                className="victory-confetti absolute h-3 w-2 rounded-[2px]"
                key={`confetti-${index}`}
                style={{
                  animationDelay: `${(index % 6) * 140}ms`,
                  animationDuration: `${2400 + (index % 5) * 260}ms`,
                  background: announcementAccentColors[index % announcementAccentColors.length],
                  left: `${4 + ((index * 11) % 92)}%`,
                  top: `${-14 - (index % 6) * 8}%`,
                }}
              />
            ))}

            {Array.from({ length: 8 }).map((_, index) => (
              <span
                className="victory-pulse absolute h-4 w-4 rounded-full"
                key={`spark-${index}`}
                style={{
                  animationDelay: `${index * 150}ms`,
                  background: announcementAccentColors[index % announcementAccentColors.length],
                  boxShadow: `0 0 24px ${rgbaFromHex(announcementBaseColor, 0.52)}`,
                  left: `${14 + ((index * 10) % 70)}%`,
                  top: `${16 + ((index * 8) % 52)}%`,
                }}
              />
            ))}
          </div>

          <div className="relative w-full max-w-[640px] text-center">
            <div className="relative mx-auto flex flex-col items-center pt-24 sm:pt-28">
              <div className="absolute left-1/2 top-0 z-20 -translate-x-1/2 sm:top-1">
                <div className="relative flex h-[164px] w-[164px] items-center justify-center sm:h-[184px] sm:w-[184px]">
                  <div className="absolute left-1/2 top-0 z-30 -translate-x-1/2 text-[#f8d777] drop-shadow-[0_5px_0_rgba(115,62,18,0.55)]">
                    <svg aria-hidden="true" className="h-16 w-16 sm:h-20 sm:w-20" fill="none" viewBox="0 0 64 64">
                      <path d="M12 46h40l-3.8 8H15.8L12 46Zm4-24 10 9 6-13 6 13 10-9-4 20H20l-4-20Z" fill="url(#crownFill)" stroke="#8a4e17" strokeLinejoin="round" strokeWidth="3" />
                      <circle cx="16" cy="22" r="4" fill="#ffeaa0" stroke="#8a4e17" strokeWidth="3" />
                      <circle cx="32" cy="16" r="4" fill="#ffeaa0" stroke="#8a4e17" strokeWidth="3" />
                      <circle cx="48" cy="22" r="4" fill="#ffeaa0" stroke="#8a4e17" strokeWidth="3" />
                      <defs>
                        <linearGradient id="crownFill" x1="32" x2="32" y1="16" y2="54" gradientUnits="userSpaceOnUse">
                          <stop stopColor="#fff0a8" />
                          <stop offset="0.58" stopColor="#f5c248" />
                          <stop offset="1" stopColor="#cb842b" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>

                  <div className="absolute left-1/2 top-[34px] z-20 -translate-x-1/2 rounded-full border-[4px] border-[#874d26] bg-gradient-to-b from-[#fff1b6] via-[#edb546] to-[#b86b1e] px-4 py-1 text-[32px] font-display leading-none text-[#5a2d10] shadow-[0_8px_14px_rgba(0,0,0,0.34),inset_0_2px_0_rgba(255,247,203,0.85)] sm:top-[38px] sm:text-[38px]">
                    {activeAnnouncementPlaceNumber}
                  </div>

                  <div className="absolute bottom-0 left-1/2 z-20 flex h-[132px] w-[132px] -translate-x-1/2 items-center justify-center rounded-full border-[6px] border-[#7b4528] bg-gradient-to-b from-[#ffe7ab] via-[#f8bf56] to-[#cd8335] shadow-[0_26px_42px_rgba(0,0,0,0.44)] sm:h-[146px] sm:w-[146px]">
                    <span
                      className={`inline-flex h-[104px] w-[104px] items-center justify-center rounded-full border-[4px] border-[#7c3f21] bg-gradient-to-b text-3xl font-black text-[#2c190d] sm:h-[116px] sm:w-[116px] ${activeAnnouncementTheme?.avatarToneClass || ''}`}
                    >
                      <GameAvatar
                        alt={activeAnnouncementPlacement.name}
                        avatar={activeAnnouncementPlacement.avatar}
                        imageClassName="h-full w-full object-contain p-2"
                        textClassName="text-3xl font-black text-[#2c190d]"
                      />
                    </span>
                  </div>
                </div>
              </div>

              <div
                className="victory-pop relative w-full overflow-hidden rounded-[32px] border bg-white/20 px-5 pb-6 pt-[96px] shadow-2xl backdrop-blur-xl sm:px-8 sm:pb-8 sm:pt-[108px]"
                style={announcementGlassPanelStyle}
              >
                <div className="absolute inset-x-[4%] top-[2%] h-[22%] rounded-[26px] opacity-90 blur-sm" style={announcementGlassSheenStyle} />
                <div className="absolute inset-0 opacity-[0.06] mix-blend-screen" style={{ backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.16) 0, rgba(255,255,255,0.16) 1px, transparent 1px, transparent 3px), repeating-linear-gradient(90deg, rgba(255,255,255,0.08) 0, rgba(255,255,255,0.08) 1px, transparent 1px, transparent 4px)' }} />

                <div className="pointer-events-none absolute inset-0">
                  <span className="absolute left-[10%] top-[18%] h-20 w-20 rounded-full blur-2xl" style={{ background: rgbaFromHex(announcementBaseColor, 0.28) }} />
                  <span className="absolute right-[10%] bottom-[14%] h-24 w-24 rounded-full blur-2xl" style={{ background: rgbaFromRgb(mixHexColors(announcementBaseColor, '#ffffff', 0.52), 0.22) }} />
                </div>

                <div className="relative">
                  <p className="font-display text-[28px] uppercase leading-[1.05] tracking-[0.04em] text-[#ffe8be] drop-shadow-[0_3px_0_rgba(67,31,12,0.82)] sm:text-[46px]">
                    {activeAnnouncementTitle}
                  </p>
                  <p className="mt-3 text-sm font-black uppercase tracking-[0.14em] text-[#ffefc8] sm:text-lg">
                    {activeAnnouncementSubtitle}
                  </p>

                  <div className="mt-6 flex justify-center">
                    <button
                      className="rounded-[22px] border px-8 py-2.5 font-display text-[22px] uppercase tracking-[0.12em] text-[#fff4de] transition hover:brightness-105 active:translate-y-[2px]"
                      style={{
                        ...announcementGlassButtonStyle,
                        textShadow: '0 2px 8px rgba(52,31,16,0.34)',
                      }}
                      onClick={skipToFinalClassification}
                      type="button"
                    >
                      {ui.skip}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {showFinalClassification && finalPlacements.length > 0 ? <FinalRankingScreen placements={finalPlacements} /> : null}

      <style>{`
        @keyframes victoryConfettiFall {
          0% {
            opacity: 0;
            transform: translate3d(0, -35px, 0) rotate(0deg);
          }
          15% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translate3d(0, 115vh, 0) rotate(420deg);
          }
        }

        @keyframes victoryPop {
          0% {
            opacity: 0;
            transform: translate3d(0, 26px, 0) scale(0.85);
          }
          100% {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1);
          }
        }

        @keyframes victoryPulse {
          0% {
            opacity: 0;
            transform: scale(0.2);
          }
          35% {
            opacity: 1;
            transform: scale(1);
          }
          100% {
            opacity: 0;
            transform: scale(1.8);
          }
        }

        @keyframes podiumRise {
          0% {
            opacity: 0;
            transform: translate3d(0, 32px, 0) scale(0.96);
          }
          100% {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1);
          }
        }

        .victory-confetti {
          animation-name: victoryConfettiFall;
          animation-iteration-count: infinite;
          animation-timing-function: linear;
        }

        .victory-pop {
          animation: victoryPop 360ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        .victory-pulse {
          animation: victoryPulse 1800ms ease-out infinite;
        }

        .podium-rise {
          animation: podiumRise 440ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }
      `}</style>

      <LogDrawer events={logEvents} onClose={() => setIsLogOpen(false)} open={isLogOpen} />
    </section>
  )
}
