import type { ReadonlyGameState } from '../components/game/match-types'

const gameStateSnapshot: ReadonlyGameState = {
  lobbyId: 'lobby-dojo-12',
  turnPlayerId: 'p-green',
  minPlayers: 2,
  blockedSquares: [],
  safeSquares: [12, 17, 29, 34, 46, 51, 63, 68],
  rules: {
    exitHomeRule: 'FIVE',
    allowSplitDice: true,
    allowTwoStepSameToken: true,
    allowSumDice: true,
    requiresExactHome: true,
    timePerTurn: 50,
  },
  players: [
    {
      id: 'p-green',
      name: 'Green',
      color: 'green',
      avatar: 'GR',
      tokensInBase: 4,
      tokensInGoal: 0,
      isHost: true,
    },
    {
      id: 'p-red',
      name: 'Red',
      color: 'red',
      avatar: 'RD',
      tokensInBase: 4,
      tokensInGoal: 0,
    },
    {
      id: 'p-blue',
      name: 'Blue',
      color: 'blue',
      avatar: 'BL',
      tokensInBase: 4,
      tokensInGoal: 0,
    },
    {
      id: 'p-yellow',
      name: 'Yellow',
      color: 'yellow',
      avatar: 'YW',
      tokensInBase: 4,
      tokensInGoal: 0,
    },
  ],
  tokens: [],
}

export function useReadonlyGameState() {
  return gameStateSnapshot
}
