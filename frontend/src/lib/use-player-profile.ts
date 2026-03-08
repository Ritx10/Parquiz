import { useEffect, useMemo } from 'react'
import { useAppSettingsStore } from '../store/app-settings-store'
import {
  defaultPlayerProfile,
  getXpRequiredForLevel,
  resolvePlayerProfileKey,
  usePlayerProfileStore,
} from '../store/player-profile-store'
import { useControllerWallet } from './starknet/use-controller-wallet'

export function usePlayerProfile() {
  const { address, username } = useControllerWallet()
  const profileKey = resolvePlayerProfileKey(address, username)
  const ensureProfile = usePlayerProfileStore((state) => state.ensureProfile)
  const profile = usePlayerProfileStore((state) => state.profiles[profileKey] || defaultPlayerProfile)

  useEffect(() => {
    ensureProfile(profileKey)
  }, [ensureProfile, profileKey])

  return useMemo(() => {
    const xpForNextLevel = getXpRequiredForLevel(profile.level)
    const xpProgressPercent = Math.max(0, Math.min(100, (profile.xp / xpForNextLevel) * 100))

    return {
      ...profile,
      profileKey,
      username: username || 'PARQUIZ_PLAYER_77',
      xpForNextLevel,
      xpProgressPercent,
    }
  }, [profile, profileKey, username])
}

export function useSyncPlayerProfileCustomization() {
  const profile = usePlayerProfile()
  const hydrateCustomizationState = useAppSettingsStore((state) => state.hydrateCustomizationState)

  useEffect(() => {
    hydrateCustomizationState({
      ownedBoardThemeIds: profile.ownedBoardThemeIds,
      ownedDiceSkinIds: profile.ownedDiceSkinIds,
      ownedPlayerSkinIds: profile.ownedPlayerSkinIds,
      ownedTokenSkinIds: profile.ownedTokenSkinIds,
      selectedBoardThemeId: profile.selectedBoardThemeId,
      selectedDiceSkinId: profile.selectedDiceSkinId,
      selectedSkinId: profile.selectedSkinId,
      selectedTokenSkinId: profile.selectedTokenSkinId,
    })
  }, [hydrateCustomizationState, profile])
}

export function usePlayerProfileActions() {
  const { address, username } = useControllerWallet()
  const profileKey = resolvePlayerProfileKey(address, username)
  const awardCoins = usePlayerProfileStore((state) => state.awardCoins)
  const awardXp = usePlayerProfileStore((state) => state.awardXp)
  const setCoins = usePlayerProfileStore((state) => state.setCoins)
  const setSelectedBoardThemeId = usePlayerProfileStore((state) => state.setSelectedBoardThemeId)
  const setSelectedDiceSkinId = usePlayerProfileStore((state) => state.setSelectedDiceSkinId)
  const setSelectedSkinId = usePlayerProfileStore((state) => state.setSelectedSkinId)
  const setSelectedTokenSkinId = usePlayerProfileStore((state) => state.setSelectedTokenSkinId)
  const unlockBoardTheme = usePlayerProfileStore((state) => state.unlockBoardTheme)
  const unlockDiceSkin = usePlayerProfileStore((state) => state.unlockDiceSkin)
  const unlockPlayerSkin = usePlayerProfileStore((state) => state.unlockPlayerSkin)
  const unlockTokenSkin = usePlayerProfileStore((state) => state.unlockTokenSkin)

  return useMemo(
    () => ({
      awardCoins: (amount: number) => awardCoins(profileKey, amount),
      awardXp: (amount: number) => awardXp(profileKey, amount),
      setCoins: (coins: number) => setCoins(profileKey, coins),
      setSelectedBoardThemeId: (themeId: Parameters<typeof setSelectedBoardThemeId>[1]) =>
        setSelectedBoardThemeId(profileKey, themeId),
      setSelectedDiceSkinId: (skinId: Parameters<typeof setSelectedDiceSkinId>[1]) =>
        setSelectedDiceSkinId(profileKey, skinId),
      setSelectedSkinId: (skinId: null | string) => setSelectedSkinId(profileKey, skinId),
      setSelectedTokenSkinId: (skinId: Parameters<typeof setSelectedTokenSkinId>[1]) =>
        setSelectedTokenSkinId(profileKey, skinId),
      unlockBoardTheme: (themeId: Parameters<typeof unlockBoardTheme>[1]) => unlockBoardTheme(profileKey, themeId),
      unlockDiceSkin: (skinId: Parameters<typeof unlockDiceSkin>[1]) => unlockDiceSkin(profileKey, skinId),
      unlockPlayerSkin: (skinId: Parameters<typeof unlockPlayerSkin>[1]) => unlockPlayerSkin(profileKey, skinId),
      unlockTokenSkin: (skinId: Parameters<typeof unlockTokenSkin>[1]) => unlockTokenSkin(profileKey, skinId),
    }),
    [
      awardCoins,
      awardXp,
      profileKey,
      setCoins,
      setSelectedBoardThemeId,
      setSelectedDiceSkinId,
      setSelectedSkinId,
      setSelectedTokenSkinId,
      unlockBoardTheme,
      unlockDiceSkin,
      unlockPlayerSkin,
      unlockTokenSkin,
    ],
  )
}
