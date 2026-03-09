import { create } from 'zustand'
import {
  normalizeBoardThemeId,
  normalizeOwnedBoardThemeIds,
  type BoardThemeId,
} from '../lib/board-themes'
import {
  normalizeDiceSkinId,
  normalizeOwnedDiceSkinIds,
  type DiceSkinId,
} from '../lib/dice-cosmetics'
import {
  defaultOwnedPlayerSkinIds,
  normalizeOwnedPlayerSkinIds,
  normalizePlayerSkinId,
  specialRewardSkinId,
  type PlayerSkinId,
} from '../lib/player-skins'
import {
  defaultOwnedTokenSkinIds,
  normalizeOwnedTokenSkinIds,
  normalizeTokenSkinId,
  type TokenSkinId,
} from '../lib/token-cosmetics'

export type PlayerProfile = {
  coins: number
  level: number
  prestige: number
  xp: number
  ownedBoardThemeIds: BoardThemeId[]
  ownedDiceSkinIds: DiceSkinId[]
  ownedPlayerSkinIds: PlayerSkinId[]
  ownedTokenSkinIds: TokenSkinId[]
  processedRewardKeys: string[]
  selectedBoardThemeId: BoardThemeId
  selectedDiceSkinId: DiceSkinId
  selectedSkinId: null | PlayerSkinId
  selectedTokenSkinId: TokenSkinId
}

export type PlayerProfileRewardGrant = {
  coins?: number
  xp?: number
}

type StoredProfiles = Record<string, Partial<PlayerProfile>>

type PlayerProfileState = {
  profiles: Record<string, PlayerProfile>
  ensureProfile: (profileKey: string) => void
  replaceProfile: (profileKey: string, profile: Partial<PlayerProfile>) => void
  awardCoins: (profileKey: string, amount: number) => void
  awardXp: (profileKey: string, amount: number) => void
  claimRewardEvent: (profileKey: string, rewardKey: string, reward: PlayerProfileRewardGrant) => boolean
  purchaseBoardTheme: (profileKey: string, themeId: BoardThemeId, cost: number) => boolean
  purchaseDiceSkin: (profileKey: string, skinId: DiceSkinId, cost: number) => boolean
  purchasePlayerSkin: (profileKey: string, skinId: PlayerSkinId, cost: number) => boolean
  purchaseTokenSkin: (profileKey: string, skinId: TokenSkinId, cost: number) => boolean
  setCoins: (profileKey: string, coins: number) => void
  unlockBoardTheme: (profileKey: string, themeId: BoardThemeId) => void
  unlockDiceSkin: (profileKey: string, skinId: DiceSkinId) => void
  unlockPlayerSkin: (profileKey: string, skinId: PlayerSkinId) => void
  unlockTokenSkin: (profileKey: string, skinId: TokenSkinId) => void
  setSelectedBoardThemeId: (profileKey: string, themeId: BoardThemeId) => void
  setSelectedDiceSkinId: (profileKey: string, skinId: DiceSkinId) => void
  setSelectedSkinId: (profileKey: string, skinId: null | string) => void
  setSelectedTokenSkinId: (profileKey: string, skinId: TokenSkinId) => void
}

const STORAGE_KEY = 'parquiz.player-profile.v2'
const LEVEL_REWARD_COINS = 50
const MAX_PROCESSED_REWARD_KEYS = 400

export const getXpRequiredForLevel = (level: number) => 100 + Math.max(1, Math.floor(level)) * 50

export const defaultPlayerProfile: PlayerProfile = {
  coins: 1000,
  level: 1,
  prestige: 0,
  xp: 0,
  ownedBoardThemeIds: normalizeOwnedBoardThemeIds(undefined, 'theme-classic'),
  ownedDiceSkinIds: normalizeOwnedDiceSkinIds(undefined, 'blue'),
  ownedPlayerSkinIds: normalizeOwnedPlayerSkinIds(undefined, defaultOwnedPlayerSkinIds[0]),
  ownedTokenSkinIds: normalizeOwnedTokenSkinIds(defaultOwnedTokenSkinIds, 'blue'),
  processedRewardKeys: [],
  selectedBoardThemeId: 'theme-classic',
  selectedDiceSkinId: 'blue',
  selectedSkinId: null,
  selectedTokenSkinId: 'blue',
}

const sanitizeInteger = (value: unknown, fallback: number, minimum = 0) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback
  }

  return Math.max(minimum, Math.floor(value))
}

const sanitizeProcessedRewardKeys = (value: unknown) => {
  const nextKeys = Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0)
    : []

  return Array.from(new Set(nextKeys)).slice(-MAX_PROCESSED_REWARD_KEYS)
}

const appendProcessedRewardKey = (keys: string[], rewardKey: string) => {
  if (!rewardKey) {
    return keys
  }

  const nextKeys = keys.includes(rewardKey) ? keys : [...keys, rewardKey]
  return nextKeys.slice(-MAX_PROCESSED_REWARD_KEYS)
}

const createDefaultPlayerProfile = (): PlayerProfile => ({
  ...defaultPlayerProfile,
  ownedBoardThemeIds: [...defaultPlayerProfile.ownedBoardThemeIds],
  ownedDiceSkinIds: [...defaultPlayerProfile.ownedDiceSkinIds],
  ownedPlayerSkinIds: [...defaultPlayerProfile.ownedPlayerSkinIds],
  ownedTokenSkinIds: [...defaultPlayerProfile.ownedTokenSkinIds],
  processedRewardKeys: [],
})

const applyProfileProgression = (profile: PlayerProfile, reward: PlayerProfileRewardGrant) => {
  let nextCoins = profile.coins + sanitizeInteger(reward.coins, 0)
  let nextLevel = profile.level
  let nextXp = profile.xp + sanitizeInteger(reward.xp, 0)

  while (nextXp >= getXpRequiredForLevel(nextLevel)) {
    nextXp -= getXpRequiredForLevel(nextLevel)
    nextLevel += 1
    nextCoins += LEVEL_REWARD_COINS
  }

  return {
    coins: nextCoins,
    level: nextLevel,
    ownedPlayerSkinIds:
      specialRewardSkinId && nextLevel >= 10
        ? normalizeOwnedPlayerSkinIds(profile.ownedPlayerSkinIds, specialRewardSkinId)
        : profile.ownedPlayerSkinIds,
    xp: nextXp,
  } satisfies Partial<PlayerProfile>
}

const sanitizeCost = (cost: number) => Math.max(0, Math.floor(cost))

const normalizeProfile = (value?: Partial<PlayerProfile>): PlayerProfile => {
  const selectedBoardThemeId = normalizeBoardThemeId(value?.selectedBoardThemeId)
  const selectedDiceSkinId = normalizeDiceSkinId(value?.selectedDiceSkinId)
  const selectedSkinId = normalizePlayerSkinId(value?.selectedSkinId ?? null)
  const selectedTokenSkinId = normalizeTokenSkinId(value?.selectedTokenSkinId)
  const level = sanitizeInteger(value?.level, defaultPlayerProfile.level, 1)

  const normalized: PlayerProfile = {
    coins: sanitizeInteger(value?.coins, defaultPlayerProfile.coins),
    level,
    prestige: sanitizeInteger(value?.prestige, defaultPlayerProfile.prestige),
    xp: sanitizeInteger(value?.xp, defaultPlayerProfile.xp),
    ownedBoardThemeIds: normalizeOwnedBoardThemeIds(value?.ownedBoardThemeIds, selectedBoardThemeId),
    ownedDiceSkinIds: normalizeOwnedDiceSkinIds(value?.ownedDiceSkinIds, selectedDiceSkinId),
    ownedPlayerSkinIds: normalizeOwnedPlayerSkinIds(value?.ownedPlayerSkinIds, selectedSkinId),
    ownedTokenSkinIds: normalizeOwnedTokenSkinIds(value?.ownedTokenSkinIds, selectedTokenSkinId),
    processedRewardKeys: sanitizeProcessedRewardKeys(value?.processedRewardKeys),
    selectedBoardThemeId,
    selectedDiceSkinId,
    selectedSkinId,
    selectedTokenSkinId,
  }

  if (specialRewardSkinId && normalized.level >= 10) {
    normalized.ownedPlayerSkinIds = normalizeOwnedPlayerSkinIds(normalized.ownedPlayerSkinIds, specialRewardSkinId)
  }

  while (normalized.xp >= getXpRequiredForLevel(normalized.level)) {
    normalized.xp -= getXpRequiredForLevel(normalized.level)
    normalized.level += 1
    normalized.coins += LEVEL_REWARD_COINS
  }

  return normalized
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

    const parsed = JSON.parse(raw) as StoredProfiles

    return Object.entries(parsed).reduce<Record<string, PlayerProfile>>((acc, [profileKey, profile]) => {
      acc[profileKey] = normalizeProfile(profile)
      return acc
    }, {})
  } catch {
    return {}
  }
}

const persistProfiles = (profiles: Record<string, PlayerProfile>) => {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles))
    } catch {
      // ignore localStorage errors in restricted environments
    }
  }
}

const initialProfiles = readStoredProfiles()
persistProfiles(initialProfiles)

const getProfile = (profiles: Record<string, PlayerProfile>, profileKey: string) =>
  profiles[profileKey] || createDefaultPlayerProfile()

const updateProfile = (
  profiles: Record<string, PlayerProfile>,
  profileKey: string,
  recipe: (profile: PlayerProfile) => Partial<PlayerProfile>,
) => ({
  ...profiles,
  [profileKey]: normalizeProfile({
    ...getProfile(profiles, profileKey),
    ...recipe(getProfile(profiles, profileKey)),
  }),
})

export const resolvePlayerProfileKey = (address?: null | string, username?: null | string) =>
  address?.toLowerCase() || username?.toLowerCase() || 'guest'

export const usePlayerProfileStore = create<PlayerProfileState>((set, get) => ({
  profiles: initialProfiles,
  ensureProfile: (profileKey) => {
    set((state) => {
      if (state.profiles[profileKey]) {
        return state
      }

      const nextProfiles = {
        ...state.profiles,
        [profileKey]: createDefaultPlayerProfile(),
      }
      persistProfiles(nextProfiles)
      return { profiles: nextProfiles }
    })
  },
  replaceProfile: (profileKey, profile) => {
    set((state) => {
      const nextProfiles = {
        ...state.profiles,
        [profileKey]: normalizeProfile({
          ...createDefaultPlayerProfile(),
          ...profile,
        }),
      }
      persistProfiles(nextProfiles)
      return { profiles: nextProfiles }
    })
  },
  awardCoins: (profileKey, amount) => {
    set((state) => {
      const nextProfiles = updateProfile(state.profiles, profileKey, (profile) => ({
        coins: profile.coins + Math.max(0, Math.floor(amount)),
      }))
      persistProfiles(nextProfiles)
      return { profiles: nextProfiles }
    })
  },
  awardXp: (profileKey, amount) => {
    set((state) => {
      const gainedXp = Math.max(0, Math.floor(amount))

      if (gainedXp <= 0) {
        return state
      }

      const nextProfiles = updateProfile(state.profiles, profileKey, (profile) =>
        applyProfileProgression(profile, { xp: gainedXp }),
      )
      persistProfiles(nextProfiles)
      return { profiles: nextProfiles }
    })
  },
  claimRewardEvent: (profileKey, rewardKey, reward) => {
    const normalizedRewardKey = rewardKey.trim()

    if (!normalizedRewardKey) {
      return false
    }

    const state = get()
    const profile = getProfile(state.profiles, profileKey)

    if (profile.processedRewardKeys.includes(normalizedRewardKey)) {
      return false
    }

    const nextProfiles = updateProfile(state.profiles, profileKey, (currentProfile) => ({
      ...applyProfileProgression(currentProfile, reward),
      processedRewardKeys: appendProcessedRewardKey(currentProfile.processedRewardKeys, normalizedRewardKey),
    }))

    persistProfiles(nextProfiles)
    set({ profiles: nextProfiles })
    return true
  },
  purchaseBoardTheme: (profileKey, themeId, cost) => {
    const normalizedThemeId = normalizeBoardThemeId(themeId)
    const state = get()
    const profile = getProfile(state.profiles, profileKey)
    const price = sanitizeCost(cost)

    if (profile.ownedBoardThemeIds.includes(normalizedThemeId)) {
      return true
    }

    if (profile.coins < price) {
      return false
    }

    const nextProfiles = updateProfile(state.profiles, profileKey, (currentProfile) => ({
      coins: currentProfile.coins - price,
      ownedBoardThemeIds: normalizeOwnedBoardThemeIds(currentProfile.ownedBoardThemeIds, normalizedThemeId),
    }))

    persistProfiles(nextProfiles)
    set({ profiles: nextProfiles })
    return true
  },
  purchaseDiceSkin: (profileKey, skinId, cost) => {
    const normalizedSkinId = normalizeDiceSkinId(skinId)
    const state = get()
    const profile = getProfile(state.profiles, profileKey)
    const price = sanitizeCost(cost)

    if (profile.ownedDiceSkinIds.includes(normalizedSkinId)) {
      return true
    }

    if (profile.coins < price) {
      return false
    }

    const nextProfiles = updateProfile(state.profiles, profileKey, (currentProfile) => ({
      coins: currentProfile.coins - price,
      ownedDiceSkinIds: normalizeOwnedDiceSkinIds(currentProfile.ownedDiceSkinIds, normalizedSkinId),
    }))

    persistProfiles(nextProfiles)
    set({ profiles: nextProfiles })
    return true
  },
  purchasePlayerSkin: (profileKey, skinId, cost) => {
    const normalizedSkinId = normalizePlayerSkinId(skinId)

    if (!normalizedSkinId) {
      return false
    }

    const state = get()
    const profile = getProfile(state.profiles, profileKey)
    const price = sanitizeCost(cost)

    if (profile.ownedPlayerSkinIds.includes(normalizedSkinId)) {
      return true
    }

    if (profile.coins < price) {
      return false
    }

    const nextProfiles = updateProfile(state.profiles, profileKey, (currentProfile) => ({
      coins: currentProfile.coins - price,
      ownedPlayerSkinIds: normalizeOwnedPlayerSkinIds(currentProfile.ownedPlayerSkinIds, normalizedSkinId),
    }))

    persistProfiles(nextProfiles)
    set({ profiles: nextProfiles })
    return true
  },
  purchaseTokenSkin: (profileKey, skinId, cost) => {
    const normalizedSkinId = normalizeTokenSkinId(skinId)
    const state = get()
    const profile = getProfile(state.profiles, profileKey)
    const price = sanitizeCost(cost)

    if (profile.ownedTokenSkinIds.includes(normalizedSkinId)) {
      return true
    }

    if (profile.coins < price) {
      return false
    }

    const nextProfiles = updateProfile(state.profiles, profileKey, (currentProfile) => ({
      coins: currentProfile.coins - price,
      ownedTokenSkinIds: normalizeOwnedTokenSkinIds(currentProfile.ownedTokenSkinIds, normalizedSkinId),
    }))

    persistProfiles(nextProfiles)
    set({ profiles: nextProfiles })
    return true
  },
  setCoins: (profileKey, coins) => {
    set((state) => {
      const nextProfiles = updateProfile(state.profiles, profileKey, () => ({ coins }))
      persistProfiles(nextProfiles)
      return { profiles: nextProfiles }
    })
  },
  unlockBoardTheme: (profileKey, themeId) => {
    set((state) => {
      const nextProfiles = updateProfile(state.profiles, profileKey, (profile) => ({
        ownedBoardThemeIds: normalizeOwnedBoardThemeIds(profile.ownedBoardThemeIds, themeId),
      }))
      persistProfiles(nextProfiles)
      return { profiles: nextProfiles }
    })
  },
  unlockDiceSkin: (profileKey, skinId) => {
    set((state) => {
      const nextProfiles = updateProfile(state.profiles, profileKey, (profile) => ({
        ownedDiceSkinIds: normalizeOwnedDiceSkinIds(profile.ownedDiceSkinIds, skinId),
      }))
      persistProfiles(nextProfiles)
      return { profiles: nextProfiles }
    })
  },
  unlockPlayerSkin: (profileKey, skinId) => {
    set((state) => {
      const nextProfiles = updateProfile(state.profiles, profileKey, (profile) => ({
        ownedPlayerSkinIds: normalizeOwnedPlayerSkinIds(profile.ownedPlayerSkinIds, skinId),
      }))
      persistProfiles(nextProfiles)
      return { profiles: nextProfiles }
    })
  },
  unlockTokenSkin: (profileKey, skinId) => {
    set((state) => {
      const nextProfiles = updateProfile(state.profiles, profileKey, (profile) => ({
        ownedTokenSkinIds: normalizeOwnedTokenSkinIds(profile.ownedTokenSkinIds, skinId),
      }))
      persistProfiles(nextProfiles)
      return { profiles: nextProfiles }
    })
  },
  setSelectedBoardThemeId: (profileKey, themeId) => {
    set((state) => {
      const normalizedThemeId = normalizeBoardThemeId(themeId)
      const nextProfiles = updateProfile(state.profiles, profileKey, (profile) => ({
        selectedBoardThemeId: profile.ownedBoardThemeIds.includes(normalizedThemeId)
          ? normalizedThemeId
          : profile.selectedBoardThemeId,
      }))
      persistProfiles(nextProfiles)
      return { profiles: nextProfiles }
    })
  },
  setSelectedDiceSkinId: (profileKey, skinId) => {
    set((state) => {
      const normalizedSkinId = normalizeDiceSkinId(skinId)
      const nextProfiles = updateProfile(state.profiles, profileKey, (profile) => ({
        selectedDiceSkinId: profile.ownedDiceSkinIds.includes(normalizedSkinId)
          ? normalizedSkinId
          : profile.selectedDiceSkinId,
      }))
      persistProfiles(nextProfiles)
      return { profiles: nextProfiles }
    })
  },
  setSelectedSkinId: (profileKey, skinId) => {
    set((state) => {
      const normalizedSkinId = normalizePlayerSkinId(skinId)
      const nextProfiles = updateProfile(state.profiles, profileKey, (profile) => ({
        selectedSkinId:
          !normalizedSkinId || profile.ownedPlayerSkinIds.includes(normalizedSkinId)
            ? normalizedSkinId
            : profile.selectedSkinId,
      }))
      persistProfiles(nextProfiles)
      return { profiles: nextProfiles }
    })
  },
  setSelectedTokenSkinId: (profileKey, skinId) => {
    set((state) => {
      const normalizedSkinId = normalizeTokenSkinId(skinId)
      const nextProfiles = updateProfile(state.profiles, profileKey, (profile) => ({
        selectedTokenSkinId: profile.ownedTokenSkinIds.includes(normalizedSkinId)
          ? normalizedSkinId
          : profile.selectedTokenSkinId,
      }))
      persistProfiles(nextProfiles)
      return { profiles: nextProfiles }
    })
  },
}))
