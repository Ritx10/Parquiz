import { useAccount } from '@starknet-react/core'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import {
  ensurePlayerProfile,
  purchaseCosmetic,
  readPlayerProfileBundle,
  setPlayerLoadout,
} from '../api'
import { isDojoConfigured } from '../config/dojo'
import { appEnv } from '../config/env'
import {
  boardThemeIdFromIndex,
  boardThemeIndexFromId,
  normalizeBoardThemeId,
  type BoardThemeId,
} from '../lib/board-themes'
import {
  diceSkinIdFromIndex,
  diceSkinIndexFromId,
  normalizeDiceSkinId,
  type DiceSkinId,
} from '../lib/dice-cosmetics'
import {
  normalizePlayerSkinId,
  playerSkinIdFromIndex,
  playerSkinIndexFromId,
} from '../lib/player-skins'
import { useAppSettingsStore } from '../store/app-settings-store'
import {
  defaultPlayerProfile,
  getXpRequiredForLevel,
  type PlayerProfileRewardGrant,
  resolvePlayerProfileKey,
  usePlayerProfileStore,
} from '../store/player-profile-store'
import {
  normalizeTokenSkinId,
  tokenSkinIdFromIndex,
  tokenSkinIndexFromId,
  type TokenSkinId,
} from './token-cosmetics'
import { useControllerWallet } from './starknet/use-controller-wallet'

const COSMETIC_KIND_AVATAR = 0
const COSMETIC_KIND_DICE = 1
const COSMETIC_KIND_TOKEN = 2
const COSMETIC_KIND_BOARD = 3

const canUseOnchainProfile = Boolean(appEnv.profileSystemAddress) && isDojoConfigured

const syncProfileFromChain = async ({
  address,
  profileKey,
  replaceProfile,
}: {
  address: string
  profileKey: string
  replaceProfile: (profileKey: string, profile: Partial<typeof defaultPlayerProfile>) => void
}) => {
  const bundle = await readPlayerProfileBundle(address)

  if (!bundle.profile) {
    return false
  }

  const ownedBoardThemeIds = bundle.inventory
    .filter((item) => item.kind === COSMETIC_KIND_BOARD && item.owned)
    .map((item) => boardThemeIdFromIndex(item.item_id))
  const ownedDiceSkinIds = bundle.inventory
    .filter((item) => item.kind === COSMETIC_KIND_DICE && item.owned)
    .map((item) => diceSkinIdFromIndex(item.item_id))
  const ownedPlayerSkinIds = bundle.inventory
    .filter((item) => item.kind === COSMETIC_KIND_AVATAR && item.owned)
    .map((item) => playerSkinIdFromIndex(item.item_id))
  const ownedTokenSkinIds = bundle.inventory
    .filter((item) => item.kind === COSMETIC_KIND_TOKEN && item.owned)
    .map((item) => tokenSkinIdFromIndex(item.item_id))

  replaceProfile(profileKey, {
    coins: bundle.profile.coins,
    level: bundle.profile.level,
    prestige: 0,
    xp: bundle.profile.xp,
    ownedBoardThemeIds,
    ownedDiceSkinIds,
    ownedPlayerSkinIds,
    ownedTokenSkinIds,
    processedRewardKeys: [],
    selectedBoardThemeId: normalizeBoardThemeId(
      typeof bundle.customization?.board_theme_id === 'number'
        ? boardThemeIdFromIndex(bundle.customization.board_theme_id)
        : defaultPlayerProfile.selectedBoardThemeId,
    ),
    selectedDiceSkinId: normalizeDiceSkinId(
      typeof bundle.customization?.dice_skin_id === 'number'
        ? diceSkinIdFromIndex(bundle.customization.dice_skin_id)
        : defaultPlayerProfile.selectedDiceSkinId,
    ),
    selectedSkinId: normalizePlayerSkinId(
      typeof bundle.customization?.avatar_skin_id === 'number'
        ? playerSkinIdFromIndex(bundle.customization.avatar_skin_id)
        : defaultPlayerProfile.selectedSkinId,
    ),
    selectedTokenSkinId: normalizeTokenSkinId(
      typeof bundle.customization?.token_skin_id === 'number'
        ? tokenSkinIdFromIndex(bundle.customization.token_skin_id)
        : defaultPlayerProfile.selectedTokenSkinId,
    ),
  })

  return true
}

export function usePlayerProfile() {
  const { account } = useAccount()
  const { address, username } = useControllerWallet()
  const profileKey = resolvePlayerProfileKey(address, username)
  const ensureProfile = usePlayerProfileStore((state) => state.ensureProfile)
  const replaceProfile = usePlayerProfileStore((state) => state.replaceProfile)
  const profile = usePlayerProfileStore((state) => state.profiles[profileKey] || defaultPlayerProfile)
  const ensureAttemptedRef = useRef<Record<string, boolean>>({})

  useEffect(() => {
    ensureProfile(profileKey)
  }, [ensureProfile, profileKey])

  useEffect(() => {
    if (!address || !canUseOnchainProfile) {
      return
    }

    let cancelled = false

    const load = async () => {
      const synced = await syncProfileFromChain({ address, profileKey, replaceProfile })

      if (cancelled || synced || !account || ensureAttemptedRef.current[address]) {
        return
      }

      ensureAttemptedRef.current[address] = true

      try {
        const transactionHash = await ensurePlayerProfile(account)
        await account.waitForTransaction(transactionHash)
        if (!cancelled) {
          await syncProfileFromChain({ address, profileKey, replaceProfile })
        }
      } catch {
        // Ignore initialization failures here and keep local fallback state.
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [account, address, profileKey, replaceProfile])

  return useMemo(() => {
    const xpForNextLevel = getXpRequiredForLevel(profile.level)
    const xpProgressPercent = Math.max(0, Math.min(100, (profile.xp / xpForNextLevel) * 100))

    return {
      ...profile,
      isOnchainBacked: Boolean(address) && canUseOnchainProfile,
      profileKey,
      username: username || 'PARQUIZ_PLAYER_77',
      xpForNextLevel,
      xpProgressPercent,
    }
  }, [address, profile, profileKey, username])
}

export function useSyncPlayerProfileCustomization() {
  const profile = usePlayerProfile()
  const hydrateCustomizationState = useAppSettingsStore((state) => state.hydrateCustomizationState)

  useEffect(() => {
    hydrateCustomizationState({
      selectedBoardThemeId: profile.selectedBoardThemeId,
      selectedDiceSkinId: profile.selectedDiceSkinId,
      selectedSkinId: profile.selectedSkinId,
      selectedTokenSkinId: profile.selectedTokenSkinId,
    })
  }, [hydrateCustomizationState, profile])
}

export function usePlayerProfileActions() {
  const { account } = useAccount()
  const { address, username } = useControllerWallet()
  const profileKey = resolvePlayerProfileKey(address, username)
  const awardCoins = usePlayerProfileStore((state) => state.awardCoins)
  const awardXp = usePlayerProfileStore((state) => state.awardXp)
  const claimRewardEvent = usePlayerProfileStore((state) => state.claimRewardEvent)
  const purchaseBoardThemeLocal = usePlayerProfileStore((state) => state.purchaseBoardTheme)
  const purchaseDiceSkinLocal = usePlayerProfileStore((state) => state.purchaseDiceSkin)
  const purchasePlayerSkinLocal = usePlayerProfileStore((state) => state.purchasePlayerSkin)
  const purchaseTokenSkinLocal = usePlayerProfileStore((state) => state.purchaseTokenSkin)
  const replaceProfile = usePlayerProfileStore((state) => state.replaceProfile)
  const setCoins = usePlayerProfileStore((state) => state.setCoins)
  const setSelectedBoardThemeIdLocal = usePlayerProfileStore((state) => state.setSelectedBoardThemeId)
  const setSelectedDiceSkinIdLocal = usePlayerProfileStore((state) => state.setSelectedDiceSkinId)
  const setSelectedSkinIdLocal = usePlayerProfileStore((state) => state.setSelectedSkinId)
  const setSelectedTokenSkinIdLocal = usePlayerProfileStore((state) => state.setSelectedTokenSkinId)
  const unlockBoardTheme = usePlayerProfileStore((state) => state.unlockBoardTheme)
  const unlockDiceSkin = usePlayerProfileStore((state) => state.unlockDiceSkin)
  const unlockPlayerSkin = usePlayerProfileStore((state) => state.unlockPlayerSkin)
  const unlockTokenSkin = usePlayerProfileStore((state) => state.unlockTokenSkin)
  const profile = usePlayerProfileStore((state) => state.profiles[profileKey] || defaultPlayerProfile)

  const refreshProfile = useCallback(async () => {
    if (!address || !canUseOnchainProfile) {
      return false
    }

    return syncProfileFromChain({ address, profileKey, replaceProfile })
  }, [address, profileKey, replaceProfile])

  const ensureOnchainProfile = useCallback(async () => {
    if (!address || !account || !canUseOnchainProfile) {
      return false
    }

    const existing = await syncProfileFromChain({ address, profileKey, replaceProfile })
    if (existing) {
      return true
    }

    const transactionHash = await ensurePlayerProfile(account)
    await account.waitForTransaction(transactionHash)
    await syncProfileFromChain({ address, profileKey, replaceProfile })
    return true
  }, [account, address, profileKey, replaceProfile])

  const pushLoadout = useCallback(
    async (next: {
      boardThemeId?: BoardThemeId
      diceSkinId?: DiceSkinId
      skinId?: null | string
      tokenSkinId?: TokenSkinId
    }) => {
      if (!account || !address || !canUseOnchainProfile) {
        return
      }

      await ensureOnchainProfile()

      const transactionHash = await setPlayerLoadout(
        account,
        playerSkinIndexFromId(normalizePlayerSkinId(next.skinId ?? profile.selectedSkinId ?? playerSkinIdFromIndex(0))),
        diceSkinIndexFromId(next.diceSkinId ?? profile.selectedDiceSkinId),
        tokenSkinIndexFromId(next.tokenSkinId ?? profile.selectedTokenSkinId),
        boardThemeIndexFromId(next.boardThemeId ?? profile.selectedBoardThemeId),
      )
      await account.waitForTransaction(transactionHash)
      await refreshProfile()
    },
    [account, address, ensureOnchainProfile, profile, refreshProfile],
  )

  return useMemo(
    () => ({
      awardCoins: (amount: number) => awardCoins(profileKey, amount),
      awardXp: (amount: number) => awardXp(profileKey, amount),
      claimRewardEvent: (rewardKey: string, reward: PlayerProfileRewardGrant) =>
        claimRewardEvent(profileKey, rewardKey, reward),
      ensureOnchainProfile,
      purchaseBoardTheme: async (themeId: BoardThemeId, cost: number) => {
        const optimistic = purchaseBoardThemeLocal(profileKey, themeId, cost)
        if (!optimistic) {
          return false
        }
        if (!account || !address || !canUseOnchainProfile) {
          return true
        }
        try {
          await ensureOnchainProfile()
          const transactionHash = await purchaseCosmetic(account, COSMETIC_KIND_BOARD, boardThemeIndexFromId(themeId))
          await account.waitForTransaction(transactionHash)
          await refreshProfile()
          return true
        } catch {
          await refreshProfile()
          return false
        }
      },
      purchaseDiceSkin: async (skinId: DiceSkinId, cost: number) => {
        const optimistic = purchaseDiceSkinLocal(profileKey, skinId, cost)
        if (!optimistic) {
          return false
        }
        if (!account || !address || !canUseOnchainProfile) {
          return true
        }
        try {
          await ensureOnchainProfile()
          const transactionHash = await purchaseCosmetic(account, COSMETIC_KIND_DICE, diceSkinIndexFromId(skinId))
          await account.waitForTransaction(transactionHash)
          await refreshProfile()
          return true
        } catch {
          await refreshProfile()
          return false
        }
      },
      purchasePlayerSkin: async (skinId: string, cost: number) => {
        const normalizedSkinId = normalizePlayerSkinId(skinId)
        if (!normalizedSkinId) {
          return false
        }

        const optimistic = purchasePlayerSkinLocal(profileKey, normalizedSkinId, cost)
        if (!optimistic) {
          return false
        }
        if (!account || !address || !canUseOnchainProfile) {
          return true
        }
        try {
          await ensureOnchainProfile()
          const transactionHash = await purchaseCosmetic(account, COSMETIC_KIND_AVATAR, playerSkinIndexFromId(normalizedSkinId))
          await account.waitForTransaction(transactionHash)
          await refreshProfile()
          return true
        } catch {
          await refreshProfile()
          return false
        }
      },
      purchaseTokenSkin: async (skinId: TokenSkinId, cost: number) => {
        const optimistic = purchaseTokenSkinLocal(profileKey, skinId, cost)
        if (!optimistic) {
          return false
        }
        if (!account || !address || !canUseOnchainProfile) {
          return true
        }
        try {
          await ensureOnchainProfile()
          const transactionHash = await purchaseCosmetic(account, COSMETIC_KIND_TOKEN, tokenSkinIndexFromId(skinId))
          await account.waitForTransaction(transactionHash)
          await refreshProfile()
          return true
        } catch {
          await refreshProfile()
          return false
        }
      },
      refreshProfile,
      setCoins: (coins: number) => setCoins(profileKey, coins),
      setSelectedBoardThemeId: async (themeId: BoardThemeId) => {
        setSelectedBoardThemeIdLocal(profileKey, themeId)
        try {
          await pushLoadout({ boardThemeId: themeId })
        } catch {
          await refreshProfile()
        }
      },
      setSelectedDiceSkinId: async (skinId: DiceSkinId) => {
        setSelectedDiceSkinIdLocal(profileKey, skinId)
        try {
          await pushLoadout({ diceSkinId: skinId })
        } catch {
          await refreshProfile()
        }
      },
      setSelectedSkinId: async (skinId: null | string) => {
        setSelectedSkinIdLocal(profileKey, skinId)
        try {
          await pushLoadout({ skinId })
        } catch {
          await refreshProfile()
        }
      },
      setSelectedTokenSkinId: async (skinId: TokenSkinId) => {
        setSelectedTokenSkinIdLocal(profileKey, skinId)
        try {
          await pushLoadout({ tokenSkinId: skinId })
        } catch {
          await refreshProfile()
        }
      },
      unlockBoardTheme: (themeId: BoardThemeId) => unlockBoardTheme(profileKey, themeId),
      unlockDiceSkin: (skinId: DiceSkinId) => unlockDiceSkin(profileKey, skinId),
      unlockPlayerSkin: (skinId: string) => unlockPlayerSkin(profileKey, skinId),
      unlockTokenSkin: (skinId: TokenSkinId) => unlockTokenSkin(profileKey, skinId),
    }),
    [
      account,
      address,
      awardCoins,
      awardXp,
      claimRewardEvent,
      ensureOnchainProfile,
      profileKey,
      purchaseBoardThemeLocal,
      purchaseDiceSkinLocal,
      purchasePlayerSkinLocal,
      purchaseTokenSkinLocal,
      pushLoadout,
      refreshProfile,
      setCoins,
      setSelectedBoardThemeIdLocal,
      setSelectedDiceSkinIdLocal,
      setSelectedSkinIdLocal,
      setSelectedTokenSkinIdLocal,
      unlockBoardTheme,
      unlockDiceSkin,
      unlockPlayerSkin,
      unlockTokenSkin,
    ],
  )
}
