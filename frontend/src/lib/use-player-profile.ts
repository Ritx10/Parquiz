import { useMemo } from 'react'
import { useControllerWallet } from './starknet/use-controller-wallet'

type PlayerProfile = {
  level: number
  prestige: number
}

const STORAGE_KEY = 'parquiz.player-profile.v1'

const defaultProfile: PlayerProfile = {
  level: 1,
  prestige: 0,
}

const readStoredProfiles = (): Record<string, PlayerProfile> => {
  if (typeof window === 'undefined') {
    return {}
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)

    if (!raw) {
      return {}
    }

    const parsed = JSON.parse(raw) as Record<string, Partial<PlayerProfile>>

    return Object.entries(parsed).reduce<Record<string, PlayerProfile>>((acc, [key, value]) => {
      acc[key] = {
        level: typeof value.level === 'number' && value.level > 0 ? Math.floor(value.level) : defaultProfile.level,
        prestige:
          typeof value.prestige === 'number' && value.prestige >= 0 ? Math.floor(value.prestige) : defaultProfile.prestige,
      }
      return acc
    }, {})
  } catch {
    return {}
  }
}

export function usePlayerProfile() {
  const { address, username } = useControllerWallet()

  return useMemo(() => {
    const profiles = readStoredProfiles()
    const normalizedKey = address?.toLowerCase() || username?.toLowerCase() || 'guest'
    const profile = profiles[normalizedKey] || defaultProfile

    return {
      level: profile.level,
      prestige: profile.prestige,
      username: username || 'PARQUIZ_PLAYER_77',
    }
  }, [address, username])
}
