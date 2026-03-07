export type PlayerColor = 'red' | 'blue' | 'yellow' | 'green'

export type MoveResource = 'dieA' | 'dieB' | 'sum' | 'bonus'

export type MatchPlayer = {
  id: string
  name: string
  color: PlayerColor
  avatar: string
  tokensInBase: number
  tokensInGoal: number
  isHost?: boolean
}

export type MatchToken = {
  id: string
  label: string
  ownerId: string
  color: PlayerColor
  position: number
}

export type MatchLegalMove = {
  id: string
  tokenId: string
  from: number
  to: number
  resource: MoveResource
  path: number[]
  blockedAt?: number
}

export type MatchLogEventType = 'roll' | 'move' | 'capture' | 'home' | 'bridge'

export type MatchLogEvent = {
  id: string
  type: MatchLogEventType
  message: string
  createdAt: number
}

export type MatchDiceState = {
  dieA: number | null
  dieB: number | null
  rolled: boolean
  consumed: {
    dieA: boolean
    dieB: boolean
    sum: boolean
    bonus: boolean
  }
}

export type MatchRuleConfig = {
  exitHomeRule: 'FIVE' | 'EVEN' | 'SIX'
  allowSplitDice: boolean
  allowTwoStepSameToken: boolean
  allowSumDice: boolean
  requiresExactHome: boolean
  timePerTurn: number
}

export type ReadonlyGameState = Readonly<{
  lobbyId: string
  players: ReadonlyArray<Readonly<MatchPlayer>>
  tokens: ReadonlyArray<Readonly<MatchToken>>
  turnPlayerId: string
  blockedSquares: ReadonlyArray<number>
  safeSquares: ReadonlyArray<number>
  rules: Readonly<MatchRuleConfig>
  minPlayers: number
}>

export type TokenHint = {
  tokenId: string
  tokenLabel: string
  position: number
  movesByResource: Partial<Record<MoveResource, number[]>>
}
