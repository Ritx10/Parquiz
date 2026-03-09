import { create } from 'zustand'
import { normalizeBoardThemeId, type BoardThemeId } from '../lib/board-themes'
import { normalizeDiceSkinId, type DiceSkinId } from '../lib/dice-cosmetics'
import { normalizeTokenSkinId, type TokenSkinId } from '../lib/token-cosmetics'
import { normalizePlayerSkinId } from '../lib/player-skins'

export type AppLanguage = 'es' | 'en'
export type AiDifficulty = 'easy' | 'medium' | 'hard'
export type ExitHomeRule = 'FIVE' | 'EVEN' | 'SIX'

type AppSettingsState = {
  language: AppLanguage
  soundEnabled: boolean
  aiDifficulty: AiDifficulty
  questionDifficulty: AiDifficulty
  answerTimeLimitSecs: number
  turnTimeLimitSecs: number
  exitHomeRule: ExitHomeRule
  selectedConfigId: string
  selectedBoardThemeId: BoardThemeId
  selectedSkinId: null | string
  selectedDiceSkinId: DiceSkinId
  selectedTokenSkinId: TokenSkinId
  hydrateCustomizationState: (customization: {
    selectedBoardThemeId: BoardThemeId
    selectedDiceSkinId: DiceSkinId
    selectedSkinId: null | string
    selectedTokenSkinId: TokenSkinId
  }) => void
  setLanguage: (language: AppLanguage) => void
  setSoundEnabled: (enabled: boolean) => void
  setAiDifficulty: (difficulty: AiDifficulty) => void
  setQuestionDifficulty: (difficulty: AiDifficulty) => void
  setAnswerTimeLimitSecs: (seconds: number) => void
  setTurnTimeLimitSecs: (seconds: number) => void
  setExitHomeRule: (rule: ExitHomeRule) => void
  setSelectedConfigId: (configId: string) => void
  setSelectedBoardThemeId: (themeId: BoardThemeId) => void
  setSelectedSkinId: (skinId: null | string) => void
  setSelectedDiceSkinId: (skinId: DiceSkinId) => void
  setSelectedTokenSkinId: (skinId: TokenSkinId) => void
  toggleSound: () => void
}

type StoredSettings = {
  language?: AppLanguage
  soundEnabled?: boolean
  aiDifficulty?: AiDifficulty
  questionDifficulty?: AiDifficulty
  answerTimeLimitSecs?: number
  turnTimeLimitSecs?: number
  exitHomeRule?: ExitHomeRule
  selectedConfigId?: string
  selectedBoardThemeId?: BoardThemeId
  selectedSkinId?: null | string
  selectedDiceSkinId?: DiceSkinId
  selectedTokenColor?: TokenSkinId
  selectedTokenSkinId?: TokenSkinId
}

type PersistedSettings = Pick<
  AppSettingsState,
  | 'aiDifficulty'
  | 'answerTimeLimitSecs'
  | 'exitHomeRule'
  | 'language'
  | 'questionDifficulty'
  | 'selectedBoardThemeId'
  | 'selectedConfigId'
  | 'selectedDiceSkinId'
  | 'selectedSkinId'
  | 'selectedTokenSkinId'
  | 'soundEnabled'
  | 'turnTimeLimitSecs'
>

const STORAGE_KEY = 'parquiz.settings.v1'

const defaultSettings: PersistedSettings = {
  aiDifficulty: 'medium',
  answerTimeLimitSecs: 20,
  exitHomeRule: 'FIVE',
  language: 'es',
  questionDifficulty: 'medium',
  selectedBoardThemeId: 'theme-classic',
  selectedDiceSkinId: 'blue',
  selectedSkinId: null,
  selectedTokenSkinId: 'blue',
  soundEnabled: true,
  selectedConfigId: '1',
  turnTimeLimitSecs: 45,
}

const normalizeLanguage = (value: unknown): AppLanguage => (value === 'en' ? 'en' : 'es')

const normalizeAiDifficulty = (value: unknown): AiDifficulty => {
  if (value === 'easy' || value === 'hard') {
    return value
  }

  return 'medium'
}

const normalizeExitHomeRule = (value: unknown): ExitHomeRule => {
  if (value === 'EVEN' || value === 'SIX') {
    return value
  }

  return 'FIVE'
}

const normalizeSeconds = (value: unknown, fallback: number, minimum: number) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback
  }

  return Math.max(minimum, Math.floor(value))
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
    const selectedBoardThemeId = normalizeBoardThemeId(parsed.selectedBoardThemeId)
    const selectedDiceSkinId = normalizeDiceSkinId(parsed.selectedDiceSkinId)
    const selectedSkinId = normalizePlayerSkinId(parsed.selectedSkinId ?? null)
    const selectedTokenSkinId = normalizeTokenSkinId(parsed.selectedTokenSkinId ?? parsed.selectedTokenColor)

    return {
      aiDifficulty: normalizeAiDifficulty(parsed.aiDifficulty),
      answerTimeLimitSecs: normalizeSeconds(parsed.answerTimeLimitSecs, defaultSettings.answerTimeLimitSecs, 5),
      exitHomeRule: normalizeExitHomeRule(parsed.exitHomeRule),
      language: normalizeLanguage(parsed.language),
      questionDifficulty: normalizeAiDifficulty(parsed.questionDifficulty),
      selectedBoardThemeId,
      selectedSkinId,
      selectedDiceSkinId,
      selectedTokenSkinId,
      soundEnabled: parsed.soundEnabled ?? true,
      selectedConfigId: parsed.selectedConfigId || '1',
      turnTimeLimitSecs: normalizeSeconds(parsed.turnTimeLimitSecs, defaultSettings.turnTimeLimitSecs, 10),
    }
  } catch {
    return defaultSettings
  }
}

const toPersistedSettings = (state: AppSettingsState): PersistedSettings => ({
  aiDifficulty: state.aiDifficulty,
  answerTimeLimitSecs: state.answerTimeLimitSecs,
  exitHomeRule: state.exitHomeRule,
  language: state.language,
  questionDifficulty: state.questionDifficulty,
  selectedBoardThemeId: state.selectedBoardThemeId,
  selectedConfigId: state.selectedConfigId,
  selectedDiceSkinId: state.selectedDiceSkinId,
  selectedSkinId: state.selectedSkinId,
  selectedTokenSkinId: state.selectedTokenSkinId,
  soundEnabled: state.soundEnabled,
  turnTimeLimitSecs: state.turnTimeLimitSecs,
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
  answerTimeLimitSecs: initialSettings.answerTimeLimitSecs,
  exitHomeRule: initialSettings.exitHomeRule,
  language: initialSettings.language,
  questionDifficulty: initialSettings.questionDifficulty,
  selectedBoardThemeId: initialSettings.selectedBoardThemeId,
  selectedDiceSkinId: initialSettings.selectedDiceSkinId,
  selectedSkinId: initialSettings.selectedSkinId,
  selectedTokenSkinId: initialSettings.selectedTokenSkinId,
  soundEnabled: initialSettings.soundEnabled,
  selectedConfigId: initialSettings.selectedConfigId,
  turnTimeLimitSecs: initialSettings.turnTimeLimitSecs,
  hydrateCustomizationState: (customization) => {
    set({
      selectedBoardThemeId: normalizeBoardThemeId(customization.selectedBoardThemeId),
      selectedDiceSkinId: normalizeDiceSkinId(customization.selectedDiceSkinId),
      selectedSkinId: normalizePlayerSkinId(customization.selectedSkinId),
      selectedTokenSkinId: normalizeTokenSkinId(customization.selectedTokenSkinId),
    })
    persistSettings(toPersistedSettings(get()))
  },
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
  setAnswerTimeLimitSecs: (answerTimeLimitSecs) => {
    set({ answerTimeLimitSecs: normalizeSeconds(answerTimeLimitSecs, get().answerTimeLimitSecs, 5) })
    persistSettings(toPersistedSettings(get()))
  },
  setTurnTimeLimitSecs: (turnTimeLimitSecs) => {
    set({ turnTimeLimitSecs: normalizeSeconds(turnTimeLimitSecs, get().turnTimeLimitSecs, 10) })
    persistSettings(toPersistedSettings(get()))
  },
  setExitHomeRule: (exitHomeRule) => {
    set({ exitHomeRule: normalizeExitHomeRule(exitHomeRule) })
    persistSettings(toPersistedSettings(get()))
  },
  setSelectedConfigId: (selectedConfigId) => {
    set({ selectedConfigId })
    persistSettings(toPersistedSettings(get()))
  },
  setSelectedBoardThemeId: (selectedBoardThemeId) => {
    set({ selectedBoardThemeId })
    persistSettings(toPersistedSettings(get()))
  },
  setSelectedSkinId: (selectedSkinId) => {
    set({ selectedSkinId: normalizePlayerSkinId(selectedSkinId) })
    persistSettings(toPersistedSettings(get()))
  },
  setSelectedDiceSkinId: (selectedDiceSkinId) => {
    set({ selectedDiceSkinId })
    persistSettings(toPersistedSettings(get()))
  },
  setSelectedTokenSkinId: (selectedTokenSkinId) => {
    set({ selectedTokenSkinId })
    persistSettings(toPersistedSettings(get()))
  },
  toggleSound: () => {
    set({ soundEnabled: !get().soundEnabled })
    persistSettings(toPersistedSettings(get()))
  },
}))
