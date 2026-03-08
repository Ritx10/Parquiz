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
  selectedBoardThemeId: BoardThemeId
  selectedDiceSkinId: DiceSkinId
  selectedSkinId: null | PlayerSkinId
  selectedTokenSkinId: TokenSkinId
}

type StoredProfiles = Record<string, Partial<PlayerProfile>>

type PlayerProfileState = {
  profiles: Record<string, PlayerProfile>
  ensureProfile: (profileKey: string) => void
  awardCoins: (profileKey: string, amount: number) => void
  awardXp: (profileKey: string, amount: number) => void
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

export const getXpRequiredForLevel = (level: number) => 100 + Math.max(1, Math.floor(level)) * 50

export const defaultPlayerProfile: PlayerProfile = {
  coins: 1000,
  level: 1,
  prestige: 0,
  xp: 0,
  ownedBoardThemeIds: normalizeOwnedBoardThemeIds(undefined, 'theme-classic'),
  ownedDiceSkinIds: normalizeOwnedDiceSkinIds(undefined, 'blue'),
  ownedPlayerSkinIds: normalizeOwnedPlayerSkinIds(undefined, defaultOwnedPlayerSkinIds[0]),
  ownedTokenSkinIds: normalizeOwnedTokenSkinIds(undefined, 'blue'),
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
  profiles[profileKey] || defaultPlayerProfile

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

export const usePlayerProfileStore = create<PlayerProfileState>((set) => ({
  profiles: initialProfiles,
  ensureProfile: (profileKey) => {
    set((state) => {
      if (state.profiles[profileKey]) {
        return state
      }

      const nextProfiles = {
        ...state.profiles,
        [profileKey]: defaultPlayerProfile,
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

      const profile = getProfile(state.profiles, profileKey)
      let nextLevel = profile.level
      let nextXp = profile.xp + gainedXp
      let nextCoins = profile.coins

      while (nextXp >= getXpRequiredForLevel(nextLevel)) {
        nextXp -= getXpRequiredForLevel(nextLevel)
        nextLevel += 1
        nextCoins += LEVEL_REWARD_COINS
      }

      const nextProfiles = updateProfile(state.profiles, profileKey, () => ({
        coins: nextCoins,
        level: nextLevel,
        ownedPlayerSkinIds:
          specialRewardSkinId && nextLevel >= 10
            ? normalizeOwnedPlayerSkinIds(profile.ownedPlayerSkinIds, specialRewardSkinId)
            : profile.ownedPlayerSkinIds,
        xp: nextXp,
      }))
      persistProfiles(nextProfiles)
      return { profiles: nextProfiles }
    })
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
      const nextProfiles = updateProfile(state.profiles, profileKey, (profile) => ({
        ownedBoardThemeIds: normalizeOwnedBoardThemeIds(profile.ownedBoardThemeIds, themeId),
        selectedBoardThemeId: themeId,
      }))
      persistProfiles(nextProfiles)
      return { profiles: nextProfiles }
    })
  },
  setSelectedDiceSkinId: (profileKey, skinId) => {
    set((state) => {
      const nextProfiles = updateProfile(state.profiles, profileKey, (profile) => ({
        ownedDiceSkinIds: normalizeOwnedDiceSkinIds(profile.ownedDiceSkinIds, skinId),
        selectedDiceSkinId: skinId,
      }))
      persistProfiles(nextProfiles)
      return { profiles: nextProfiles }
    })
  },
  setSelectedSkinId: (profileKey, skinId) => {
    set((state) => {
      const normalizedSkinId = normalizePlayerSkinId(skinId)
      const nextProfiles = updateProfile(state.profiles, profileKey, (profile) => ({
        ownedPlayerSkinIds: normalizeOwnedPlayerSkinIds(profile.ownedPlayerSkinIds, normalizedSkinId),
        selectedSkinId: normalizedSkinId,
      }))
      persistProfiles(nextProfiles)
      return { profiles: nextProfiles }
    })
  },
  setSelectedTokenSkinId: (profileKey, skinId) => {
    set((state) => {
      const nextProfiles = updateProfile(state.profiles, profileKey, (profile) => ({
        ownedTokenSkinIds: normalizeOwnedTokenSkinIds(profile.ownedTokenSkinIds, skinId),
        selectedTokenSkinId: skinId,
      }))
      persistProfiles(nextProfiles)
      return { profiles: nextProfiles }
    })
  },
}))
