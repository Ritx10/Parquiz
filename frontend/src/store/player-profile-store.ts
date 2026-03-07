import { create } from 'zustand'

export type PlayerProfile = {
  coins: number
  level: number
  prestige: number
}

type StoredProfiles = Record<string, Partial<PlayerProfile>>

type PlayerProfileState = {
  profiles: Record<string, PlayerProfile>
  awardCoins: (profileKey: string, amount: number) => void
  setCoins: (profileKey: string, coins: number) => void
}

const STORAGE_KEY = 'parquiz.player-profile.v1'

export const defaultPlayerProfile: PlayerProfile = {
  coins: 0,
  level: 1,
  prestige: 0,
}

const sanitizeInteger = (value: unknown, fallback: number, minimum = 0) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback
  }

  return Math.max(minimum, Math.floor(value))
}

const normalizeProfile = (value?: Partial<PlayerProfile>): PlayerProfile => ({
  coins: sanitizeInteger(value?.coins, defaultPlayerProfile.coins),
  level: sanitizeInteger(value?.level, defaultPlayerProfile.level, 1),
  prestige: sanitizeInteger(value?.prestige, defaultPlayerProfile.prestige),
})

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

const updateProfile = (
  profiles: Record<string, PlayerProfile>,
  profileKey: string,
  update: Partial<PlayerProfile>,
) => ({
  ...profiles,
  [profileKey]: normalizeProfile({
    ...(profiles[profileKey] || defaultPlayerProfile),
    ...update,
  }),
})

export const resolvePlayerProfileKey = (address?: null | string, username?: null | string) =>
  address?.toLowerCase() || username?.toLowerCase() || 'guest'

export const usePlayerProfileStore = create<PlayerProfileState>((set) => ({
  profiles: initialProfiles,
  awardCoins: (profileKey, amount) => {
    set((state) => {
      const nextProfiles = updateProfile(state.profiles, profileKey, {
        coins: (state.profiles[profileKey]?.coins || 0) + Math.max(0, Math.floor(amount)),
      })
      persistProfiles(nextProfiles)
      return { profiles: nextProfiles }
    })
  },
  setCoins: (profileKey, coins) => {
    set((state) => {
      const nextProfiles = updateProfile(state.profiles, profileKey, { coins })
      persistProfiles(nextProfiles)
      return { profiles: nextProfiles }
    })
  },
}))
