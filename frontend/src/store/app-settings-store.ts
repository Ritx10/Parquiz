import { create } from 'zustand'
import {
  normalizeOwnedTokenSkinIds,
  normalizeTokenSkinId,
  type TokenSkinId,
} from '../lib/token-cosmetics'
import { normalizePlayerSkinId } from '../lib/player-skins'

export type AppLanguage = 'es' | 'en'
export type AiDifficulty = 'easy' | 'medium' | 'hard'

type AppSettingsState = {
  language: AppLanguage
  soundEnabled: boolean
  aiDifficulty: AiDifficulty
  questionDifficulty: AiDifficulty
  selectedConfigId: string
  selectedSkinId: null | string
  selectedTokenSkinId: TokenSkinId
  ownedTokenSkinIds: TokenSkinId[]
  setLanguage: (language: AppLanguage) => void
  setSoundEnabled: (enabled: boolean) => void
  setAiDifficulty: (difficulty: AiDifficulty) => void
  setQuestionDifficulty: (difficulty: AiDifficulty) => void
  setSelectedConfigId: (configId: string) => void
  setSelectedSkinId: (skinId: null | string) => void
  setSelectedTokenSkinId: (skinId: TokenSkinId) => void
  unlockTokenSkin: (skinId: TokenSkinId) => void
  toggleSound: () => void
}

type StoredSettings = {
  language?: AppLanguage
  soundEnabled?: boolean
  aiDifficulty?: AiDifficulty
  questionDifficulty?: AiDifficulty
  selectedConfigId?: string
  selectedSkinId?: null | string
  selectedTokenColor?: TokenSkinId
  selectedTokenSkinId?: TokenSkinId
  ownedTokenSkinIds?: TokenSkinId[]
}

type PersistedSettings = Pick<
  AppSettingsState,
  | 'aiDifficulty'
  | 'language'
  | 'ownedTokenSkinIds'
  | 'questionDifficulty'
  | 'selectedConfigId'
  | 'selectedSkinId'
  | 'selectedTokenSkinId'
  | 'soundEnabled'
>

const STORAGE_KEY = 'parquiz.settings.v1'

const defaultSettings: PersistedSettings = {
  aiDifficulty: 'medium',
  language: 'es',
  ownedTokenSkinIds: normalizeOwnedTokenSkinIds(undefined, 'blue'),
  questionDifficulty: 'medium',
  selectedSkinId: null,
  selectedTokenSkinId: 'blue',
  soundEnabled: true,
  selectedConfigId: '1',
}

const normalizeLanguage = (value: unknown): AppLanguage => (value === 'en' ? 'en' : 'es')

const normalizeAiDifficulty = (value: unknown): AiDifficulty => {
  if (value === 'easy' || value === 'hard') {
    return value
  }

  return 'medium'
}

const readStoredSettings = (): PersistedSettings => {
  if (typeof window === 'undefined') {
    return defaultSettings
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)

    if (!raw) {
      return defaultSettings
    }

    const parsed = JSON.parse(raw) as StoredSettings
    const selectedTokenSkinId = normalizeTokenSkinId(parsed.selectedTokenSkinId ?? parsed.selectedTokenColor)

    return {
      aiDifficulty: normalizeAiDifficulty(parsed.aiDifficulty),
      language: normalizeLanguage(parsed.language),
      ownedTokenSkinIds: normalizeOwnedTokenSkinIds(parsed.ownedTokenSkinIds, selectedTokenSkinId),
      questionDifficulty: normalizeAiDifficulty(parsed.questionDifficulty),
      selectedSkinId: normalizePlayerSkinId(parsed.selectedSkinId ?? null),
      selectedTokenSkinId,
      soundEnabled: parsed.soundEnabled ?? true,
      selectedConfigId: parsed.selectedConfigId || '1',
    }
  } catch {
    return defaultSettings
  }
}

const toPersistedSettings = (state: AppSettingsState): PersistedSettings => ({
  aiDifficulty: state.aiDifficulty,
  language: state.language,
  ownedTokenSkinIds: state.ownedTokenSkinIds,
  questionDifficulty: state.questionDifficulty,
  selectedConfigId: state.selectedConfigId,
  selectedSkinId: state.selectedSkinId,
  selectedTokenSkinId: state.selectedTokenSkinId,
  soundEnabled: state.soundEnabled,
})

const persistSettings = (settings: PersistedSettings) => {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    } catch {
      // ignore localStorage errors in restricted environments
    }
  }

  if (typeof document !== 'undefined') {
    document.documentElement.lang = settings.language
  }
}

const initialSettings = readStoredSettings()
persistSettings(initialSettings)

export const useAppSettingsStore = create<AppSettingsState>((set, get) => ({
  aiDifficulty: initialSettings.aiDifficulty,
  language: initialSettings.language,
  ownedTokenSkinIds: initialSettings.ownedTokenSkinIds,
  questionDifficulty: initialSettings.questionDifficulty,
  selectedSkinId: initialSettings.selectedSkinId,
  selectedTokenSkinId: initialSettings.selectedTokenSkinId,
  soundEnabled: initialSettings.soundEnabled,
  selectedConfigId: initialSettings.selectedConfigId,
  setLanguage: (language) => {
    set({ language })
    persistSettings(toPersistedSettings(get()))
  },
  setSoundEnabled: (soundEnabled) => {
    set({ soundEnabled })
    persistSettings(toPersistedSettings(get()))
  },
  setAiDifficulty: (aiDifficulty) => {
    set({ aiDifficulty })
    persistSettings(toPersistedSettings(get()))
  },
  setQuestionDifficulty: (questionDifficulty) => {
    set({ questionDifficulty })
    persistSettings(toPersistedSettings(get()))
  },
  setSelectedConfigId: (selectedConfigId) => {
    set({ selectedConfigId })
    persistSettings(toPersistedSettings(get()))
  },
  setSelectedSkinId: (selectedSkinId) => {
    set({ selectedSkinId })
    persistSettings(toPersistedSettings(get()))
  },
  setSelectedTokenSkinId: (selectedTokenSkinId) => {
    const ownedTokenSkinIds = normalizeOwnedTokenSkinIds(get().ownedTokenSkinIds, selectedTokenSkinId)
    set({ ownedTokenSkinIds, selectedTokenSkinId })
    persistSettings(toPersistedSettings(get()))
  },
  unlockTokenSkin: (skinId) => {
    const ownedTokenSkinIds = normalizeOwnedTokenSkinIds(get().ownedTokenSkinIds, skinId)
    set({ ownedTokenSkinIds })
    persistSettings(toPersistedSettings(get()))
  },
  toggleSound: () => {
    set({ soundEnabled: !get().soundEnabled })
    persistSettings(toPersistedSettings(get()))
  },
}))
