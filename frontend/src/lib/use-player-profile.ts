import { useMemo } from 'react'
import { defaultPlayerProfile, resolvePlayerProfileKey, usePlayerProfileStore } from '../store/player-profile-store'
import { useControllerWallet } from './starknet/use-controller-wallet'

export function usePlayerProfile() {
  const { address, username } = useControllerWallet()
  const profileKey = resolvePlayerProfileKey(address, username)
  const profile = usePlayerProfileStore((state) => state.profiles[profileKey] || defaultPlayerProfile)

  return useMemo(
    () => ({
      coins: profile.coins,
      level: profile.level,
      prestige: profile.prestige,
      profileKey,
      username: username || 'PARQUIZ_PLAYER_77',
    }),
    [profile, profileKey, username],
  )
}

export function usePlayerProfileActions() {
  const { address, username } = useControllerWallet()
  const profileKey = resolvePlayerProfileKey(address, username)
  const awardCoins = usePlayerProfileStore((state) => state.awardCoins)
  const setCoins = usePlayerProfileStore((state) => state.setCoins)

  return useMemo(
    () => ({
      awardCoins: (amount: number) => awardCoins(profileKey, amount),
      setCoins: (coins: number) => setCoins(profileKey, coins),
    }),
    [awardCoins, profileKey, setCoins],
  )
}
