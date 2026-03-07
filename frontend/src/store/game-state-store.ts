import { useMemo } from 'react'
import type { ReadonlyGameState } from '../components/game/match-types'
import { getPlayerSkinSrc } from '../lib/player-skins'
import { useAppSettingsStore } from './app-settings-store'

const botAvatarByPlayerId: Record<string, string> = {
  'p-red': '/skins/parquiz/capi-ninja.png',
  'p-blue': '/skins/parquiz/capi-astronaut.png',
  'p-yellow': '/skins/parquiz/capi-dino.png',
}

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
  const selectedSkinId = useAppSettingsStore((state) => state.selectedSkinId)
  const selectedSkinSrc = getPlayerSkinSrc(selectedSkinId)

  return useMemo(() => {
    return {
      ...gameStateSnapshot,
      players: gameStateSnapshot.players.map((player) =>
        player.id === 'p-green'
          ? {
              ...player,
              avatar: selectedSkinSrc || '/skins/parquiz/capi-princess.png',
            }
          : {
              ...player,
              avatar: botAvatarByPlayerId[player.id] || player.avatar,
            },
      ),
    }
  }, [selectedSkinSrc])
}
