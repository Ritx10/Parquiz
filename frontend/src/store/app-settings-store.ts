import { create } from 'zustand'
import { normalizePlayerSkinId } from '../lib/player-skins'

export type AppLanguage = 'es' | 'en'
export type AiDifficulty = 'easy' | 'medium' | 'hard'

type AppSettingsState = {
  language: AppLanguage
  soundEnabled: boolean
  aiDifficulty: AiDifficulty
  selectedConfigId: string
  selectedSkinId: null | string
  setLanguage: (language: AppLanguage) => void
  setSoundEnabled: (enabled: boolean) => void
  setAiDifficulty: (difficulty: AiDifficulty) => void
  setSelectedConfigId: (configId: string) => void
  setSelectedSkinId: (skinId: null | string) => void
  toggleSound: () => void
}

type StoredSettings = {
  language?: AppLanguage
  soundEnabled?: boolean
  aiDifficulty?: AiDifficulty
  selectedConfigId?: string
  selectedSkinId?: null | string
}

const STORAGE_KEY = 'parquiz.settings.v1'

const normalizeLanguage = (value: unknown): AppLanguage => (value === 'en' ? 'en' : 'es')

const normalizeAiDifficulty = (value: unknown): AiDifficulty => {
  if (value === 'easy' || value === 'hard') {
    return value
  }

  return 'medium'
}

const readStoredSettings = (): Pick<
  AppSettingsState,
  'aiDifficulty' | 'language' | 'selectedConfigId' | 'selectedSkinId' | 'soundEnabled'
> => {
  if (typeof window === 'undefined') {
    return {
      aiDifficulty: 'medium',
      language: 'es',
      selectedSkinId: null,
      soundEnabled: true,
      selectedConfigId: '1',
    }
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)

    if (!raw) {
      return {
        aiDifficulty: 'medium',
        language: 'es',
        selectedSkinId: null,
        soundEnabled: true,
        selectedConfigId: '1',
      }
    }

    const parsed = JSON.parse(raw) as StoredSettings

    return {
      aiDifficulty: normalizeAiDifficulty(parsed.aiDifficulty),
      language: normalizeLanguage(parsed.language),
      selectedSkinId: normalizePlayerSkinId(parsed.selectedSkinId ?? null),
      soundEnabled: parsed.soundEnabled ?? true,
      selectedConfigId: parsed.selectedConfigId || '1',
    }
  } catch {
    return {
      aiDifficulty: 'medium',
      language: 'es',
      selectedSkinId: null,
      soundEnabled: true,
      selectedConfigId: '1',
    }
  }
}

const persistSettings = (settings: {
  aiDifficulty: AiDifficulty
  language: AppLanguage
  selectedSkinId: null | string
  soundEnabled: boolean
  selectedConfigId: string
}) => {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        aiDifficulty: settings.aiDifficulty,
        language: settings.language,
        selectedSkinId: settings.selectedSkinId,
        soundEnabled: settings.soundEnabled,
        selectedConfigId: settings.selectedConfigId,
      }),
    )
  } catch {
    // ignore localStorage errors in restricted environments
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
  selectedSkinId: initialSettings.selectedSkinId,
  soundEnabled: initialSettings.soundEnabled,
  selectedConfigId: initialSettings.selectedConfigId,
  setLanguage: (language) => {
    set({ language })
    persistSettings({
      aiDifficulty: get().aiDifficulty,
      language,
      selectedSkinId: get().selectedSkinId,
      soundEnabled: get().soundEnabled,
      selectedConfigId: get().selectedConfigId,
    })
  },
  setSoundEnabled: (enabled) => {
    set({ soundEnabled: enabled })
    persistSettings({
      aiDifficulty: get().aiDifficulty,
      language: get().language,
      selectedSkinId: get().selectedSkinId,
      soundEnabled: enabled,
      selectedConfigId: get().selectedConfigId,
    })
  },
  setAiDifficulty: (difficulty) => {
    set({ aiDifficulty: difficulty })
    persistSettings({
      aiDifficulty: difficulty,
      language: get().language,
      selectedSkinId: get().selectedSkinId,
      soundEnabled: get().soundEnabled,
      selectedConfigId: get().selectedConfigId,
    })
  },
  setSelectedConfigId: (selectedConfigId) => {
    set({ selectedConfigId })
    persistSettings({
      aiDifficulty: get().aiDifficulty,
      language: get().language,
      selectedSkinId: get().selectedSkinId,
      soundEnabled: get().soundEnabled,
      selectedConfigId,
    })
  },
  setSelectedSkinId: (selectedSkinId) => {
    set({ selectedSkinId })
    persistSettings({
      aiDifficulty: get().aiDifficulty,
      language: get().language,
      selectedSkinId,
      soundEnabled: get().soundEnabled,
      selectedConfigId: get().selectedConfigId,
    })
  },
  toggleSound: () => {
    const nextEnabled = !get().soundEnabled
    set({ soundEnabled: nextEnabled })
    persistSettings({
      aiDifficulty: get().aiDifficulty,
      language: get().language,
      selectedSkinId: get().selectedSkinId,
      soundEnabled: nextEnabled,
      selectedConfigId: get().selectedConfigId,
    })
  },
}))
