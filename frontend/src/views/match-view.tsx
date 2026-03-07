import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Board3D } from '../components/game/board3d'
import { LogDrawer } from '../components/game/log-drawer'
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
import { useReadonlyGameState } from '../store/game-state-store'
import { useGameUiStore } from '../store/game-ui-store'
import FinalRankingScreen from '../components/game/FinalRankingScreen'

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
  avatar: string
  color: PlayerColor
  goalCount: number
  name: string
  place: PodiumPlace
  progressScore: number
  reward: number
  tag: string
}

type MatchViewProps = {
  showVictoryPreviewControl?: boolean
}

const rewardByPlace: Record<PodiumPlace, number> = {
  1: 1000,
  2: 500,
  3: 250,
  4: 100,
}

const placeOrdinalLabel: Record<PodiumPlace, string> = {
  1: '1º',
  2: '2º',
  3: '3º',
  4: '4º',
}

const placeResultLabel: Record<PodiumPlace, string> = {
  1: 'GANADOR',
  2: '2° LUGAR',
  3: '3° LUGAR',
  4: '4° LUGAR',
}

const placeAnnouncementLabel: Record<1 | 2 | 3, string> = {
  1: 'HA GANADO',
  2: 'ES 2DO LUGAR',
  3: 'ES 3ER LUGAR',
}

const placePodiumHeightClass: Record<PodiumPlace, string> = {
  1: 'h-[248px] sm:h-[268px]',
  2: 'h-[186px] sm:h-[206px]',
  3: 'h-[158px] sm:h-[178px]',
  4: 'h-[132px] sm:h-[152px]',
}

const placeRibbonClass: Record<PodiumPlace, string> = {
  1: 'border-[#ba4432] bg-gradient-to-b from-[#f1725a] to-[#c4452d] text-[#fff5d7]',
  2: 'border-[#3d8f38] bg-gradient-to-b from-[#68cb64] to-[#3ea645] text-[#efffe8]',
  3: 'border-[#356da8] bg-gradient-to-b from-[#5bb3ff] to-[#3f7fcf] text-[#eaf6ff]',
  4: 'border-[#b08d33] bg-gradient-to-b from-[#ebcd6b] to-[#c79f3b] text-[#fff8da]',
}

const placeMedalClass: Record<PodiumPlace, string> = {
  1: 'border-[#d89b16] bg-gradient-to-b from-[#ffe186] via-[#f8c74b] to-[#d99c1d] text-[#70450f]',
  2: 'border-[#8fa4bb] bg-gradient-to-b from-[#edf4ff] via-[#cad9eb] to-[#95aac4] text-[#395069]',
  3: 'border-[#b9783d] bg-gradient-to-b from-[#f3c190] via-[#dd9554] to-[#b56a33] text-[#5d3217]',
  4: 'border-[#a87038] bg-gradient-to-b from-[#f0bf8d] via-[#cd8d53] to-[#ab6d38] text-[#5c3014]',
}

const avatarToneByColor: Record<PlayerColor, string> = {
  blue: 'from-[#d6edff] via-[#8fd4ff] to-[#3e93df]',
  green: 'from-[#dcffe6] via-[#9ef0b4] to-[#4caf6b]',
  red: 'from-[#ffd9d9] via-[#ff9f95] to-[#d85d4f]',
  yellow: 'from-[#fff6d6] via-[#ffe48a] to-[#d2ae3e]',
}

const buildFinalPlacements = (params: {
  players: MatchPlayer[]
  tokenTrackSteps: Record<string, number>
  tokens: MatchToken[]
  winnerPlayerId: string
}): FinalPlacement[] => {
  const playerTagById = new Map(params.players.map((player, index) => [player.id, `P${index + 1}`]))

  const scoredPlayers = params.players.map((player) => {
    const ownTokens = params.tokens.filter((token) => token.ownerId === player.id)

    const progressScore = ownTokens.reduce((sum, token) => {
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

    const score = player.tokensInGoal * 10_000 + progressScore * 8 - player.tokensInBase * 5

    return {
      player,
      progressScore,
      score,
    }
  })

  const winnerEntry = scoredPlayers.find((entry) => entry.player.id === params.winnerPlayerId)
  const others = scoredPlayers
    .filter((entry) => entry.player.id !== params.winnerPlayerId)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score
      }

      if (right.player.tokensInGoal !== left.player.tokensInGoal) {
        return right.player.tokensInGoal - left.player.tokensInGoal
      }

      return left.player.id.localeCompare(right.player.id)
    })

  const ordered = [...(winnerEntry ? [winnerEntry] : []), ...others]

  return ordered.slice(0, 4).map((entry, index) => {
    const place = Math.min(index + 1, 4) as PodiumPlace

    return {
      avatar: entry.player.avatar,
      color: entry.player.color,
      goalCount: entry.player.tokensInGoal,
      name: entry.player.name,
      place,
      progressScore: entry.progressScore,
      reward: rewardByPlace[place],
      tag: playerTagById.get(entry.player.id) || `P${index + 1}`,
    }
  })
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
): ReadonlyGameState => {
  const aiNamePrefix =
    difficulty === 'easy' ? 'BOT FACIL' : difficulty === 'hard' ? 'BOT DIFICIL' : 'BOT MEDIO'

  return {
    ...state,
    lobbyId: `practice-ai-${difficulty}`,
    players: state.players.map((player, index) => {
      if (index === 0) {
        return {
          ...player,
          name: 'PARQUIZ_PLAYER_77',
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

const colorLabel = {
  red: 'RED',
  blue: 'BLUE',
  yellow: 'YELLOW',
  green: 'GREEN',
} as const

const hudAccentClass: Record<PlayerColor, string> = {
  green: 'bg-[#2bc58d] text-[#0b3d2d]',
  red: 'bg-[#ff6d5e] text-[#4a1008]',
  blue: 'bg-[#4a9bff] text-[#0d3058]',
  yellow: 'bg-[#f4cc4e] text-[#4a3404]',
}

type PlayerHudCardProps = {
  player: MatchPlayer
  isTurn: boolean
}

function PlayerHudCard({ player, isTurn }: PlayerHudCardProps) {
  return (
    <article className="w-[132px] rounded-2xl border border-white/20 bg-[#082944]/78 px-3 py-2 text-center text-white shadow-[0_8px_24px_rgba(0,0,0,0.35)] backdrop-blur-sm">
      <div className={`mx-auto mb-2 h-1.5 w-full rounded-full ${hudAccentClass[player.color]}`} />
      <p className="truncate font-display text-lg leading-none">{player.name}</p>

      <div className="mt-2 inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-2 py-1 text-[10px] font-black uppercase tracking-wide">
        <span className={`inline-flex h-4 w-4 items-center justify-center rounded-full ${hudAccentClass[player.color]}`}>
          D
        </span>
        {isTurn ? 'Tu turno' : 'En espera'}
      </div>

      <div className="mt-2 flex items-center justify-center gap-1.5">
        {Array.from({ length: 4 }).map((_, index) => (
          <span
            className={`h-2.5 w-2.5 rounded-full border border-white/15 ${
              index < player.tokensInGoal ? hudAccentClass[player.color] : 'bg-white/20'
            }`}
            key={`${player.id}-progress-${index}`}
          />
        ))}
      </div>
    </article>
  )
}

type DiceFaceValue = 1 | 2 | 3 | 4 | 5 | 6

const dicePipLayout: Record<DiceFaceValue, Array<{ left: string; top: string }>> = {
  1: [{ left: '50%', top: '50%' }],
  2: [
    { left: '28%', top: '28%' },
    { left: '72%', top: '72%' },
  ],
  3: [
    { left: '28%', top: '28%' },
    { left: '50%', top: '50%' },
    { left: '72%', top: '72%' },
  ],
  4: [
    { left: '28%', top: '28%' },
    { left: '72%', top: '28%' },
    { left: '28%', top: '72%' },
    { left: '72%', top: '72%' },
  ],
  5: [
    { left: '28%', top: '28%' },
    { left: '72%', top: '28%' },
    { left: '50%', top: '50%' },
    { left: '28%', top: '72%' },
    { left: '72%', top: '72%' },
  ],
  6: [
    { left: '28%', top: '24%' },
    { left: '72%', top: '24%' },
    { left: '28%', top: '50%' },
    { left: '72%', top: '50%' },
    { left: '28%', top: '76%' },
    { left: '72%', top: '76%' },
  ],
}

const normalizeDiceFace = (value: null | number, fallback: DiceFaceValue): DiceFaceValue => {
  if (!value || value < 1 || value > 6) {
    return fallback
  }

  return value as DiceFaceValue
}

function HudDie({ value, rolling }: { value: null | number; rolling: boolean }) {
  const face = normalizeDiceFace(value, 1)

  return (
    <span
      className={`relative inline-flex h-11 w-11 items-center justify-center rounded-[11px] border border-[#aeb9ca] bg-gradient-to-b from-[#fefefe] to-[#dce6f4] shadow-[0_5px_0_rgba(53,74,107,0.45)] ${rolling ? 'animate-spin' : ''}`}
    >
      {dicePipLayout[face].map((pip, index) => (
        <span
          className="absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#1e3553]"
          key={`${face}-${index}`}
          style={{
            left: pip.left,
            top: pip.top,
          }}
        />
      ))}
    </span>
  )
}

type TurnDiceLauncherProps = {
  isActive: boolean
  canRoll: boolean
  rolling: boolean
  dieA: null | number
  dieB: null | number
  preview: { dieA: DiceFaceValue; dieB: DiceFaceValue }
  onRoll: () => void
}

function TurnDiceLauncher({
  isActive,
  canRoll,
  rolling,
  dieA,
  dieB,
  preview,
  onRoll,
}: TurnDiceLauncherProps) {
  const isEnabled = isActive && canRoll && !rolling

  return (
    <div className="pointer-events-none mt-2 flex flex-col items-center gap-1.5">
      <button
        className={`pointer-events-auto flex items-center gap-2 rounded-2xl border px-2 py-2 transition-all ${
          isEnabled
            ? 'border-[#7cd5ff] bg-[#0d3358]/88 shadow-[0_0_0_3px_rgba(124,213,255,0.35)] hover:-translate-y-0.5'
            : isActive
              ? 'cursor-not-allowed border-[#5e738f] bg-[#0d3358]/55 opacity-80'
              : 'cursor-not-allowed border-white/12 bg-[#0d3358]/45 opacity-60'
        } ${rolling && isActive ? 'animate-pulse' : ''}`}
        disabled={!isEnabled}
        onClick={onRoll}
        type="button"
      >
        <HudDie rolling={rolling && isActive} value={rolling && isActive ? preview.dieA : dieA} />
        <HudDie rolling={rolling && isActive} value={rolling && isActive ? preview.dieB : dieB} />
      </button>

      <span className="rounded-full border border-white/20 bg-black/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-[#dbf4ff]">
        {rolling && isActive
          ? 'Lanzando...'
          : isActive
            ? canRoll
              ? 'Click para tirar'
              : 'Dados ya usados'
            : 'En espera'}
      </span>
    </div>
  )
}

type PlayerHudSlotProps = {
  player?: MatchPlayer
  turnPlayerId: string
  canRoll: boolean
  rolling: boolean
  dieA: null | number
  dieB: null | number
  preview: { dieA: DiceFaceValue; dieB: DiceFaceValue }
  onRoll: () => void
}

function PlayerHudSlot({
  player,
  turnPlayerId,
  canRoll,
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
        dieA={dieA}
        dieB={dieB}
        isActive={isTurn}
        onRoll={onRoll}
        preview={preview}
        rolling={rolling}
      />
    </div>
  )
}

type TokenDiceChoiceWithMove = {
  id: MoveResource
  value: number
  label: string
  move: MatchLegalMove
}

type HoveredChoicePreview = {
  tokenId: string
  choiceId: MoveResource
  steps: number
}

const TOKEN_STEP_ANIMATION_MS = 105

const laneGoalPositionSet = new Set(
  Object.values(finalLaneByColor).map((lane) => lane[lane.length - 1]),
)

const tokenMovedToGoal = (token: MatchToken) => laneGoalPositionSet.has(token.position)

const createInitialLogEvents = (): MatchLogEvent[] => [
  {
    id: 'log-bootstrap-1',
    type: 'bridge',
    message: 'Puente detectado en casilla 22 (RED + RED).',
    createdAt: Date.now() - 90_000,
  },
]

const TOKENS_PER_PLAYER = 4

const createInitialTokens = (state: ReadonlyGameState) => {
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
        label: `${player.name.toUpperCase()} token ${ownerTokens.length + index + 1}`,
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


const placePodiumHeightClassNew: Record<PodiumPlace, string> = {
  1: 'h-[320px]',
  2: 'h-[240px]',
  3: 'h-[180px]',
  4: 'h-[130px]',
}

const placeMedalColors: Record<PodiumPlace, { bg: string, border: string }> = {
  1: { bg: 'from-[#FFDF73] via-[#F4B41A] to-[#D48900]', border: '#FFEA99' },
  2: { bg: 'from-[#E2E8F0] via-[#A0AEC0] to-[#718096]', border: '#F7FAFC' },
  3: { bg: 'from-[#F6AD55] via-[#DD6B20] to-[#9C4221]', border: '#FBD38D' },
  4: { bg: 'from-[#D69E2E] via-[#B7791F] to-[#975A16]', border: '#F6E05E' },
}

const placeRibbonClassNew: Record<PodiumPlace, string> = {
  1: 'bg-[#E74C3C] border-[#C0392B]',
  2: 'bg-[#2ECC71] border-[#27AE60]',
  3: 'bg-[#3498DB] border-[#2980B9]',
  4: 'bg-[#F1C40F] border-[#D68910]',
}

const placeMedalRibbons = (place: PodiumPlace) => {
  const common = "w-[18px] h-[54px] rounded-b-sm border-x-2 border-b-2 shadow-sm origin-top";
  if (place === 1) return (
    <>
      <div className={`${common} -rotate-[30deg] bg-gradient-to-b from-[#EF5350] to-[#C62828] border-[#8E0000]`} />
      <div className={`${common} rotate-[30deg] bg-gradient-to-b from-[#EF5350] to-[#C62828] border-[#8E0000]`} />
    </>
  );
  if (place === 2) return (
    <>
      <div className={`${common} -rotate-[30deg] bg-gradient-to-b from-[#42A5F5] to-[#1565C0] border-[#0D47A1]`} />
      <div className={`${common} rotate-[30deg] bg-gradient-to-b from-[#42A5F5] to-[#1565C0] border-[#0D47A1]`} />
    </>
  );
  if (place === 3) return (
    <>
      <div className={`${common} -rotate-[30deg] bg-gradient-to-b from-[#EF5350] to-[#C62828] border-[#8E0000]`} />
      <div className={`${common} rotate-[30deg] bg-gradient-to-b from-[#42A5F5] to-[#1565C0] border-[#0D47A1]`} />
    </>
  );
  return (
    <>
      <div className={`${common} -rotate-[30deg] bg-gradient-to-b from-[#FFA726] to-[#EF6C00] border-[#E65100]`} />
      <div className={`${common} rotate-[30deg] bg-gradient-to-b from-[#FFA726] to-[#EF6C00] border-[#E65100]`} />
    </>
  );
}

export function MatchView({ showVictoryPreviewControl = false }: MatchViewProps) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const gameState = useReadonlyGameState()
  const isAiPracticeMode = searchParams.get('mode') === 'ai'
  const practiceDifficulty = parsePracticeDifficulty(searchParams.get('difficulty'))

  const activeSessionState = useMemo(
    () => (isAiPracticeMode ? withAiPracticeState(gameState, practiceDifficulty) : gameState),
    [gameState, isAiPracticeMode, practiceDifficulty],
  )

  const humanPlayerId = activeSessionState.players[0]?.id || activeSessionState.turnPlayerId

  const initialTokens = useMemo(() => createInitialTokens(activeSessionState), [activeSessionState])
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
  const [logEvents, setLogEvents] = useState<MatchLogEvent[]>(createInitialLogEvents)
  const [currentTurnPlayerId, setCurrentTurnPlayerId] = useState(activeSessionState.turnPlayerId)
  const [winnerPlayerId, setWinnerPlayerId] = useState<null | string>(null)
  const [selectedTokenId, setSelectedTokenId] = useState<null | string>(null)
  const [expandedTokenId, setExpandedTokenId] = useState<null | string>(null)
  const [hoveredChoicePreview, setHoveredChoicePreview] = useState<null | HoveredChoicePreview>(null)
  const [finalPlacements, setFinalPlacements] = useState<FinalPlacement[] | null>(null)
  const [announcementIndex, setAnnouncementIndex] = useState(0)
  const [showFinalClassification, setShowFinalClassification] = useState(false)
  const [showPlacementDetails, setShowPlacementDetails] = useState(false)
  const [isTokenMoving, setIsTokenMoving] = useState(false)
  const [hudDiceRolling, setHudDiceRolling] = useState(false)
  const [hudDicePreview, setHudDicePreview] = useState<{ dieA: DiceFaceValue; dieB: DiceFaceValue }>({
    dieA: 1,
    dieB: 1,
  })
  const hudRollIntervalRef = useRef<null | number>(null)
  const hudRollTimeoutRef = useRef<null | number>(null)
  const victoryPreviewTimeoutRef = useRef<null | number>(null)
  const aiActionTimeoutRef = useRef<null | number>(null)
  const botWatchdogIntervalRef = useRef<null | number>(null)
  const botTurnStartedAtRef = useRef(0)
  const botHeartbeatRef = useRef(0)
  const botForceAdvanceRef = useRef(false)
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

  const turnOrder = useMemo(() => players.map((player) => player.id), [players])

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

  useEffect(() => {
    if (victoryPreviewTimeoutRef.current !== null) {
      window.clearTimeout(victoryPreviewTimeoutRef.current)
      victoryPreviewTimeoutRef.current = null
    }

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
    setFinalPlacements(null)
    setAnnouncementIndex(0)
    setShowFinalClassification(false)
    setShowPlacementDetails(false)
    resetTurnVisuals()
  }, [activeSessionState, initialTokens, resetTurnVisuals])

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

  const tokenDiceChoices = useMemo(() => {
    return legalMoves.reduce<Record<string, TokenDiceChoiceWithMove[]>>((acc, move) => {
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
  }, [legalMoves, dice, bonusPending])

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
      return legalMoves.filter(
        (move) =>
          move.tokenId === hoveredChoicePreview.tokenId && move.resource === hoveredChoicePreview.choiceId,
      )
    }

    if (activeExpandedTokenId) {
      return legalMoves.filter((move) => move.tokenId === activeExpandedTokenId)
    }

    return legalMoves
  }, [activeExpandedTokenId, legalMoves, hoveredChoicePreview])

  const moveHints = useMemo(() => {
    const ownTokens = tokens.filter((token) => token.ownerId === currentTurnPlayerId)

    return ownTokens.map<TokenHint>((token) => {
      const movesByResource: TokenHint['movesByResource'] = {}

      legalMoves
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
  }, [tokens, legalMoves, currentTurnPlayerId])

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
    }
  }, [])

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
    if (winnerPlayerId || advancingTurnRef.current || turnOrder.length === 0) {
      return
    }

    advancingTurnRef.current = true

    const currentIndex = turnOrder.indexOf(currentTurnPlayerId)
    const nextTurnPlayerId =
      currentIndex < 0 ? turnOrder[0] : turnOrder[(currentIndex + 1) % turnOrder.length]

    if (isAiPracticeMode && currentTurnPlayerId !== humanPlayerId) {
      markBotHeartbeat('bot endTurn', {
        fromPlayerId: currentTurnPlayerId,
        toPlayerId: nextTurnPlayerId,
      })
    }

    setCurrentTurnPlayerId(nextTurnPlayerId)

    resetTurnVisuals()
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
  }, [
    currentTurnPlayerId,
    humanPlayerId,
    isAiPracticeMode,
    markBotHeartbeat,
    resetTurnVisuals,
    turnOrder,
    winnerPlayerId,
  ])

  const allConsumablesUsed = dice.consumed.dieA && dice.consumed.dieB

  const canRoll = !dice.rolled || allConsumablesUsed || (dice.rolled && primaryLegalMoves.length === 0)
  const isAiControlledTurn = isAiPracticeMode && currentTurnPlayerId !== humanPlayerId
  const canRollAction =
    canRoll && !winnerPlayerId && !hudDiceRolling && !isTokenMoving && !isAiControlledTurn

  const endBotTurnSafely = useCallback(
    (reason: string) => {
      if (!isAiPracticeMode || currentTurnPlayerId === humanPlayerId || winnerPlayerId) {
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
      markBotHeartbeat,
      winnerPlayerId,
    ],
  )

  useEffect(() => {
    if (!winnerPlayerId) {
      setFinalPlacements(null)
      setAnnouncementIndex(0)
      setShowFinalClassification(false)
      setShowPlacementDetails(false)
      return
    }

    setFinalPlacements((current) => {
      if (current) {
        return current
      }

      return buildFinalPlacements({
        players,
        tokenTrackSteps,
        tokens,
        winnerPlayerId,
      })
    })
  }, [winnerPlayerId, players, tokens, tokenTrackSteps])

  const announcementCount = finalPlacements ? Math.min(3, finalPlacements.length) : 0

  useEffect(() => {
    if (!finalPlacements || showFinalClassification) {
      return
    }

    if (announcementIndex >= announcementCount) {
      const finalRevealTimer = window.setTimeout(() => {
        setShowFinalClassification(true)
      }, 420)

      return () => {
        window.clearTimeout(finalRevealTimer)
      }
    }

    const nextAnnouncementTimer = window.setTimeout(() => {
      setAnnouncementIndex((current) => current + 1)
    }, 2_450)

    return () => {
      window.clearTimeout(nextAnnouncementTimer)
    }
  }, [announcementCount, announcementIndex, finalPlacements, showFinalClassification])

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
      winnerLocked: Boolean(winnerPlayerId),
    }
  }, [
    isAiControlledTurn,
    winnerPlayerId,
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

    if (!isAiControlledTurn || winnerPlayerId) {
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
    winnerPlayerId,
    currentTurnPlayerId,
    practiceDifficulty,
    debugBot,
    endBotTurnSafely,
  ])

  useEffect(() => {
    if (winnerPlayerId || !dice.rolled || hudDiceRolling || isTokenMoving || advancingTurnRef.current) {
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
  }, [
    winnerPlayerId,
    bonusPending,
    dice.rolled,
    dice.consumed.bonus,
    hudDiceRolling,
    isTokenMoving,
    legalMoves,
  ])

  useEffect(() => {
    if (winnerPlayerId || !dice.rolled || hudDiceRolling || isTokenMoving || advancingTurnRef.current) {
      return
    }

    const noDiceRemaining = dice.consumed.dieA && dice.consumed.dieB
    const noMovesWithRemainingDice = !noDiceRemaining && primaryLegalMoves.length === 0
    const hasPendingBonus = Boolean(bonusPending) && !dice.consumed.bonus

    if ((!noDiceRemaining && !noMovesWithRemainingDice) || hasPendingBonus) {
      return
    }

    advanceTurn()
  }, [
    advanceTurn,
    winnerPlayerId,
    dice.rolled,
    dice.consumed.dieA,
    dice.consumed.dieB,
    dice.consumed.bonus,
    hudDiceRolling,
    isTokenMoving,
    bonusPending,
    primaryLegalMoves.length,
  ])

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

    if (winnerPlayerId || !canRoll) {
      return
    }

    const nextRoll = {
      dieA: randomDieValue(),
      dieB: randomDieValue(),
    }

    resetTurnVisuals()
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

    const currentPlayerName = playersById[currentTurnPlayerId]?.name || 'Player'
    logEvent('roll', `${currentPlayerName} rolled ${nextRoll.dieA} and ${nextRoll.dieB}.`, 'info')

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
    isAiControlledTurn,
    logEvent,
    markBotHeartbeat,
    playersById,
    resetTurnVisuals,
    winnerPlayerId,
  ])

  const triggerHudDiceRoll = useCallback(
    (source: 'ai' | 'user' = 'user') => {
      if (source === 'user' && !canRollAction) {
        return
      }

      if (source === 'ai' && (winnerPlayerId || !canRoll || hudDiceRolling || isTokenMoving)) {
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
      winnerPlayerId,
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
    if (winnerPlayerId || isTokenMoving) {
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

      if (capturedToken && (!isSafeCaptureSquare || isExitCapture)) {
        capturedToken.position = 0
        nextTokenTrackSteps[capturedToken.id] = 0
        nextBonusPendingValue += 20
        consumedNext.bonus = false

        logEvent(
          'capture',
          `${colorLabel[movedToken.color]} gets 20 because it captured ${colorLabel[capturedToken.color]} token.`,
          'success',
        )
      }

      if (tokenMovedToGoal(movedToken)) {
        nextBonusPendingValue += 10
        consumedNext.bonus = false

        logEvent(
          'home',
          `${colorLabel[movedToken.color]} gets 10 because it reached home.`,
          'success',
        )

        const movedPlayerGoalCount = nextTokens.filter(
          (token) => token.ownerId === movedToken.ownerId && tokenMovedToGoal(token),
        ).length

        if (movedPlayerGoalCount >= TOKENS_PER_PLAYER) {
          nextBonusPendingValue = 0
          setWinnerPlayerId(movedToken.ownerId)
          logEvent('home', `${colorLabel[movedToken.color]} wins by reaching center with 4 tokens.`, 'success')
        }
      }

      const nextBlockedSquares = getBlockedSquares(nextTokens)
      const createdBridge = nextBlockedSquares.find((square) => !previousBlockedSquares.includes(square))
      const brokenBridge = previousBlockedSquares.find((square) => !nextBlockedSquares.includes(square))

      if (createdBridge) {
        logEvent('bridge', `Bridge created on square ${createdBridge}.`, 'info')
      }

      if (brokenBridge) {
        logEvent('bridge', `Bridge removed from square ${brokenBridge}.`, 'warning')
      }

      setAnimatingTokenIds([movedToken.id])
      window.setTimeout(() => {
        setAnimatingTokenIds([])
      }, 350)

      setTokens(nextTokens)
      setTokenTrackSteps(nextTokenTrackSteps)
      setDice((current) => ({
        ...current,
        consumed: consumedNext,
      }))
      setBonusPending(nextBonusPendingValue > 0 ? nextBonusPendingValue : null)
      setSelectedTokenId(movedToken.id)

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
        `${colorLabel[movedToken.color]} moved ${movedToken.label} from ${move.from} to ${move.to}.`,
        'info',
      )

      if (botMoveContext) {
        markBotHeartbeat('bot moved', botMoveContext)
      }

      if (move.blockedAt) {
        logEvent('bridge', `Movement stopped by bridge on square ${move.blockedAt}.`, 'warning')
      }
    } finally {
      setIsTokenMoving(false)
    }
  }

  applyMoveRef.current = applyMove

  useEffect(() => {
    if (!isAiControlledTurn || winnerPlayerId || hudDiceRolling || isTokenMoving || advancingTurnRef.current) {
      return
    }

    if (bonusPending && !dice.consumed.bonus) {
      return
    }

    const thinkDelay = aiThinkDelayByDifficulty[practiceDifficulty]

    aiActionTimeoutRef.current = window.setTimeout(() => {
      try {
        if (winnerPlayerId || advancingTurnRef.current || isTokenMoving) {
          return
        }

        if (!dice.rolled) {
          triggerHudDiceRoll('ai')
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
    winnerPlayerId,
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
  ])

  useEffect(() => {
    if (winnerPlayerId || !dice.rolled || hudDiceRolling || isTokenMoving || advancingTurnRef.current) {
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
  }, [
    winnerPlayerId,
    dice.rolled,
    dice.dieA,
    dice.dieB,
    dice.consumed.dieA,
    dice.consumed.dieB,
    hudDiceRolling,
    isTokenMoving,
    tokens,
    currentTurnPlayerId,
    tokenDiceChoices,
  ])

  const onTokenClick = (tokenId: string) => {
    if (winnerPlayerId || isTokenMoving || isAiControlledTurn) {
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

  const onTokenDiceChoiceHover = (tokenId: string, choiceId: MoveResource | null) => {
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

  const onTokenDiceChoiceSelect = (tokenId: string, choiceId: MoveResource) => {
    if (winnerPlayerId || isTokenMoving || isAiControlledTurn) {
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
    finalPlacements && !showFinalClassification && announcementIndex < announcementCount
      ? finalPlacements[announcementIndex]
      : null

  const podiumPlacementByPlace = useMemo(() => {
    if (!finalPlacements) {
      return {} as Partial<Record<PodiumPlace, FinalPlacement>>
    }

    return finalPlacements.reduce<Partial<Record<PodiumPlace, FinalPlacement>>>((acc, placement) => {
      acc[placement.place] = placement
      return acc
    }, {})
  }, [finalPlacements])

  const skipToFinalClassification = () => {
    if (!finalPlacements) {
      return
    }

    setAnnouncementIndex(Math.min(announcementCount, finalPlacements.length))
    setShowFinalClassification(true)
  }

  const goBackToMenu = () => {
    navigate('/')
  }

  const activeAnnouncementTitle = activeAnnouncementPlacement
    ? `¡${activeAnnouncementPlacement.tag} ${
        placeAnnouncementLabel[Math.min(activeAnnouncementPlacement.place, 3) as 1 | 2 | 3]
      }!`
    : ''

  const previewWinnerPlayer = playersById[currentTurnPlayerId] ?? players[0] ?? null

  const clearVictoryPreview = useCallback(() => {
    if (victoryPreviewTimeoutRef.current !== null) {
      window.clearTimeout(victoryPreviewTimeoutRef.current)
      victoryPreviewTimeoutRef.current = null
    }

    setWinnerPlayerId(null)
    setFinalPlacements(null)
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
      setWinnerPlayerId(previewWinnerPlayer.id)
      victoryPreviewTimeoutRef.current = null
    }, 40)
  }, [clearVictoryPreview, previewWinnerPlayer])

  return (
    <section
      className="min-h-screen bg-cover bg-center bg-no-repeat px-3 py-4 sm:px-4 sm:py-6"
      style={{ backgroundImage: "url('/home-background.jpg')" }}
    >
      <div className="mx-auto w-full max-w-[1480px]">
        <article className="game-panel mx-auto bg-gradient-to-b from-[#efcd9a] via-[#e6bf86] to-[#d6a86d] p-3 xl:p-4">
          <div className="mb-3 flex items-center justify-between rounded-2xl border border-[#4e2f14] bg-gradient-to-r from-[#845223] via-[#9b632e] to-[#7b4b1e] px-3 py-2 shadow-wood">
            <p className="font-display text-xl uppercase tracking-[0.08em] text-[#fff0c7]">Board 3D</p>
            <span className="rounded-full border border-[#7a4e12] bg-gradient-to-b from-[#f8d772] to-[#e4b23a] px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#603d0b]">
              bloqueo/puente activo
            </span>
          </div>

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
              safeSquares={[...activeSessionState.safeSquares]}
              selectedTokenId={selectedTokenId}
              tokenDiceChoices={boardTokenDiceChoices}
              tokenHints={tooltipByTokenId}
              tokens={tokens}
            />

            <div className="pointer-events-none absolute inset-x-0 top-2 flex items-start justify-between px-2 lg:hidden">
              <PlayerHudSlot
                canRoll={canRollAction}
                dieA={dice.dieA}
                dieB={dice.dieB}
                onRoll={triggerHudDiceRoll}
                player={playersByColor.green}
                preview={hudDicePreview}
                rolling={hudDiceRolling}
                turnPlayerId={currentTurnPlayerId}
              />
              <PlayerHudSlot
                canRoll={canRollAction}
                dieA={dice.dieA}
                dieB={dice.dieB}
                onRoll={triggerHudDiceRoll}
                player={playersByColor.red}
                preview={hudDicePreview}
                rolling={hudDiceRolling}
                turnPlayerId={currentTurnPlayerId}
              />
            </div>

            <div className="pointer-events-none absolute inset-x-0 bottom-2 flex items-end justify-between px-2 lg:hidden">
              <PlayerHudSlot
                canRoll={canRollAction}
                dieA={dice.dieA}
                dieB={dice.dieB}
                onRoll={triggerHudDiceRoll}
                player={playersByColor.yellow}
                preview={hudDicePreview}
                rolling={hudDiceRolling}
                turnPlayerId={currentTurnPlayerId}
              />
              <PlayerHudSlot
                canRoll={canRollAction}
                dieA={dice.dieA}
                dieB={dice.dieB}
                onRoll={triggerHudDiceRoll}
                player={playersByColor.blue}
                preview={hudDicePreview}
                rolling={hudDiceRolling}
                turnPlayerId={currentTurnPlayerId}
              />
            </div>

            <div className="pointer-events-none absolute inset-0 hidden lg:block">
              <div className="absolute left-4 top-[17%] -translate-y-1/2">
                <PlayerHudSlot
                  canRoll={canRollAction}
                  dieA={dice.dieA}
                  dieB={dice.dieB}
                  onRoll={triggerHudDiceRoll}
                  player={playersByColor.green}
                  preview={hudDicePreview}
                  rolling={hudDiceRolling}
                  turnPlayerId={currentTurnPlayerId}
                />
              </div>

              <div className="absolute right-4 top-[17%] -translate-y-1/2">
                <PlayerHudSlot
                  canRoll={canRollAction}
                  dieA={dice.dieA}
                  dieB={dice.dieB}
                  onRoll={triggerHudDiceRoll}
                  player={playersByColor.red}
                  preview={hudDicePreview}
                  rolling={hudDiceRolling}
                  turnPlayerId={currentTurnPlayerId}
                />
              </div>

              <div className="absolute bottom-[17%] left-4 translate-y-1/2">
                <PlayerHudSlot
                  canRoll={canRollAction}
                  dieA={dice.dieA}
                  dieB={dice.dieB}
                  onRoll={triggerHudDiceRoll}
                  player={playersByColor.yellow}
                  preview={hudDicePreview}
                  rolling={hudDiceRolling}
                  turnPlayerId={currentTurnPlayerId}
                />
              </div>

              <div className="absolute bottom-[17%] right-4 translate-y-1/2">
                <PlayerHudSlot
                  canRoll={canRollAction}
                  dieA={dice.dieA}
                  dieB={dice.dieB}
                  onRoll={triggerHudDiceRoll}
                  player={playersByColor.blue}
                  preview={hudDicePreview}
                  rolling={hudDiceRolling}
                  turnPlayerId={currentTurnPlayerId}
                />
              </div>
            </div>
          </div>
        </article>
      </div>

      {showVictoryPreviewControl && previewWinnerPlayer ? (
        <div className="fixed right-3 top-3 z-[240] w-[min(260px,calc(100vw-1.5rem))] rounded-2xl border border-[#4f2f16] bg-[#2c170d]/92 p-3 shadow-[0_14px_28px_rgba(0,0,0,0.35)] backdrop-blur-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#f7d79b]">Mock board</p>
          <p className="mt-1 text-xs font-semibold text-[#ffeac5]">Forzar preview de victoria para {previewWinnerPlayer.name}.</p>
          <div className="mt-3 flex gap-2">
            <button
              className="flex-1 rounded-full border border-[#f0bf68] bg-gradient-to-b from-[#f5c76d] to-[#d88c2f] px-3 py-2 text-[11px] font-black uppercase tracking-[0.08em] text-[#4a2409] transition hover:brightness-105"
              onClick={triggerVictoryPreview}
              type="button"
            >
              Ver victoria
            </button>
            <button
              className="rounded-full border border-[#9a7c59] bg-white/8 px-3 py-2 text-[11px] font-black uppercase tracking-[0.08em] text-[#fff1d4] transition hover:bg-white/14"
              onClick={clearVictoryPreview}
              type="button"
            >
              Reset
            </button>
          </div>
        </div>
      ) : null}

      {activeAnnouncementPlacement ? (
        <div className="fixed inset-0 z-[220] flex items-center justify-center px-3 py-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,rgba(255,236,173,0.32),rgba(20,10,6,0.84)_62%,rgba(10,5,2,0.9)_100%)] backdrop-blur-[7px]" />

          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {Array.from({ length: 20 }).map((_, index) => (
              <span
                className="victory-confetti absolute h-3 w-2 rounded-[2px]"
                key={`confetti-${index}`}
                style={{
                  animationDelay: `${(index % 6) * 140}ms`,
                  animationDuration: `${2400 + (index % 5) * 260}ms`,
                  background:
                    index % 4 === 0
                      ? '#ffe188'
                      : index % 4 === 1
                        ? '#ff8f7b'
                        : index % 4 === 2
                          ? '#89dbff'
                          : '#9effb8',
                  left: `${4 + ((index * 11) % 92)}%`,
                  top: `${-14 - (index % 6) * 8}%`,
                }}
              />
            ))}

            <span className="absolute left-[8%] top-[17%] text-6xl opacity-80 drop-shadow-[0_6px_12px_rgba(0,0,0,0.4)] sm:text-7xl">
              🎆
            </span>
            <span className="absolute right-[8%] top-[17%] text-6xl opacity-80 drop-shadow-[0_6px_12px_rgba(0,0,0,0.4)] sm:text-7xl">
              🎇
            </span>

            {Array.from({ length: 8 }).map((_, index) => (
              <span
                className="victory-pulse absolute h-4 w-4 rounded-full"
                key={`spark-${index}`}
                style={{
                  animationDelay: `${index * 150}ms`,
                  background: index % 2 === 0 ? '#ffd760' : '#ff89be',
                  boxShadow: '0 0 24px rgba(255,215,96,0.7)',
                  left: `${14 + ((index * 10) % 70)}%`,
                  top: `${16 + ((index * 8) % 52)}%`,
                }}
              />
            ))}
          </div>

          <div className="relative w-full max-w-[860px] text-center">
            <div className="victory-pop relative mx-auto mb-3 flex h-[164px] w-[164px] items-center justify-center rounded-full border-[6px] border-[#7b4528] bg-gradient-to-b from-[#ffe7ab] via-[#f8bf56] to-[#cd8335] shadow-[0_26px_42px_rgba(0,0,0,0.44)]">
              <span className="absolute -top-8 text-5xl drop-shadow-[0_4px_5px_rgba(0,0,0,0.4)]">👑</span>
              <span
                className={`inline-flex h-[118px] w-[118px] items-center justify-center rounded-full border-[4px] border-[#7c3f21] bg-gradient-to-b text-3xl font-black text-[#2c190d] ${avatarToneByColor[activeAnnouncementPlacement.color]}`}
              >
                {activeAnnouncementPlacement.avatar}
              </span>
              <span className="absolute -bottom-2 rounded-full border border-[#8f532d] bg-gradient-to-b from-[#7e4c2d] to-[#5b341f] px-3 py-1 text-[11px] font-black tracking-[0.15em] text-[#ffe8bf]">
                {activeAnnouncementPlacement.tag}
              </span>
            </div>

            <div className="relative mx-auto w-full max-w-[760px] px-5">
              <span className="absolute left-1 top-1/2 h-[66px] w-[74px] -translate-y-1/2 rounded-l-[20px] border border-[#86512f] bg-gradient-to-b from-[#cb7f47] to-[#9d562e] shadow-[inset_0_1px_0_rgba(255,218,165,0.6)]" />
              <span className="absolute right-1 top-1/2 h-[66px] w-[74px] -translate-y-1/2 rounded-r-[20px] border border-[#86512f] bg-gradient-to-b from-[#cb7f47] to-[#9d562e] shadow-[inset_0_1px_0_rgba(255,218,165,0.6)]" />

              <div className="relative rounded-[34px] border-[4px] border-[#6f3f21] bg-gradient-to-b from-[#b56e3d] via-[#8f522f] to-[#734125] px-6 py-5 shadow-[inset_0_2px_0_rgba(255,216,168,0.65),0_14px_30px_rgba(24,11,3,0.55)]">
                <p className="font-display text-[34px] uppercase tracking-[0.06em] text-[#ffe8be] drop-shadow-[0_2px_0_rgba(67,31,12,0.7)] sm:text-[56px]">
                  {activeAnnouncementTitle}
                </p>
              </div>
            </div>

            <p className="mt-4 text-base font-black uppercase tracking-[0.08em] text-[#ffebb8] sm:text-xl">
              Enhorabuena, {activeAnnouncementPlacement.name}
            </p>

            <button
              className="mt-5 rounded-full border border-[#f9df9a] bg-black/30 px-4 py-1 text-xs font-black uppercase tracking-[0.15em] text-[#ffe8a8] transition hover:bg-black/45"
              onClick={skipToFinalClassification}
              type="button"
            >
              Saltar
            </button>
          </div>
        </div>
      ) : null}

      {showFinalClassification && finalPlacements ? <FinalRankingScreen /> : null}

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
