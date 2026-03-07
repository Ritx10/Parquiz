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
  normalizeOwnedTokenSkinIds,
  normalizeTokenSkinId,
  type TokenSkinId,
} from '../lib/token-cosmetics'
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
  shopEnabledOnSafeSquares: boolean
  selectedConfigId: string
  selectedBoardThemeId: BoardThemeId
  selectedSkinId: null | string
  selectedDiceSkinId: DiceSkinId
  ownedBoardThemeIds: BoardThemeId[]
  selectedTokenSkinId: TokenSkinId
  ownedDiceSkinIds: DiceSkinId[]
  ownedTokenSkinIds: TokenSkinId[]
  setLanguage: (language: AppLanguage) => void
  setSoundEnabled: (enabled: boolean) => void
  setAiDifficulty: (difficulty: AiDifficulty) => void
  setQuestionDifficulty: (difficulty: AiDifficulty) => void
  setAnswerTimeLimitSecs: (seconds: number) => void
  setTurnTimeLimitSecs: (seconds: number) => void
  setExitHomeRule: (rule: ExitHomeRule) => void
  setShopEnabledOnSafeSquares: (enabled: boolean) => void
  setSelectedConfigId: (configId: string) => void
  setSelectedBoardThemeId: (themeId: BoardThemeId) => void
  setSelectedSkinId: (skinId: null | string) => void
  setSelectedDiceSkinId: (skinId: DiceSkinId) => void
  unlockBoardTheme: (themeId: BoardThemeId) => void
  setSelectedTokenSkinId: (skinId: TokenSkinId) => void
  unlockDiceSkin: (skinId: DiceSkinId) => void
  unlockTokenSkin: (skinId: TokenSkinId) => void
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
  shopEnabledOnSafeSquares?: boolean
  selectedConfigId?: string
  selectedBoardThemeId?: BoardThemeId
  selectedSkinId?: null | string
  selectedDiceSkinId?: DiceSkinId
  selectedTokenColor?: TokenSkinId
  selectedTokenSkinId?: TokenSkinId
  ownedBoardThemeIds?: BoardThemeId[]
  ownedDiceSkinIds?: DiceSkinId[]
  ownedTokenSkinIds?: TokenSkinId[]
}

type PersistedSettings = Pick<
  AppSettingsState,
  | 'aiDifficulty'
  | 'answerTimeLimitSecs'
  | 'exitHomeRule'
  | 'language'
  | 'ownedBoardThemeIds'
  | 'ownedDiceSkinIds'
  | 'ownedTokenSkinIds'
  | 'questionDifficulty'
  | 'selectedBoardThemeId'
  | 'selectedConfigId'
  | 'selectedDiceSkinId'
  | 'selectedSkinId'
  | 'selectedTokenSkinId'
  | 'shopEnabledOnSafeSquares'
  | 'soundEnabled'
  | 'turnTimeLimitSecs'
>

const STORAGE_KEY = 'parquiz.settings.v1'

const defaultSettings: PersistedSettings = {
  aiDifficulty: 'medium',
  answerTimeLimitSecs: 20,
  exitHomeRule: 'FIVE',
  language: 'es',
  ownedBoardThemeIds: normalizeOwnedBoardThemeIds(undefined, 'theme-classic'),
  ownedDiceSkinIds: normalizeOwnedDiceSkinIds(undefined, 'blue'),
  ownedTokenSkinIds: normalizeOwnedTokenSkinIds(undefined, 'blue'),
  questionDifficulty: 'medium',
  selectedBoardThemeId: 'theme-classic',
  selectedDiceSkinId: 'blue',
  selectedSkinId: null,
  selectedTokenSkinId: 'blue',
  shopEnabledOnSafeSquares: true,
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
    const selectedTokenSkinId = normalizeTokenSkinId(parsed.selectedTokenSkinId ?? parsed.selectedTokenColor)

    return {
      aiDifficulty: normalizeAiDifficulty(parsed.aiDifficulty),
      answerTimeLimitSecs: normalizeSeconds(parsed.answerTimeLimitSecs, defaultSettings.answerTimeLimitSecs, 5),
      exitHomeRule: normalizeExitHomeRule(parsed.exitHomeRule),
      language: normalizeLanguage(parsed.language),
      ownedBoardThemeIds: normalizeOwnedBoardThemeIds(parsed.ownedBoardThemeIds, selectedBoardThemeId),
      ownedDiceSkinIds: normalizeOwnedDiceSkinIds(parsed.ownedDiceSkinIds, selectedDiceSkinId),
      ownedTokenSkinIds: normalizeOwnedTokenSkinIds(parsed.ownedTokenSkinIds, selectedTokenSkinId),
      questionDifficulty: normalizeAiDifficulty(parsed.questionDifficulty),
      selectedBoardThemeId,
      selectedSkinId: normalizePlayerSkinId(parsed.selectedSkinId ?? null),
      selectedDiceSkinId,
      selectedTokenSkinId,
      shopEnabledOnSafeSquares: parsed.shopEnabledOnSafeSquares ?? true,
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
  ownedBoardThemeIds: state.ownedBoardThemeIds,
  ownedDiceSkinIds: state.ownedDiceSkinIds,
  ownedTokenSkinIds: state.ownedTokenSkinIds,
  questionDifficulty: state.questionDifficulty,
  selectedBoardThemeId: state.selectedBoardThemeId,
  selectedConfigId: state.selectedConfigId,
  selectedDiceSkinId: state.selectedDiceSkinId,
  selectedSkinId: state.selectedSkinId,
  selectedTokenSkinId: state.selectedTokenSkinId,
  shopEnabledOnSafeSquares: state.shopEnabledOnSafeSquares,
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
  ownedBoardThemeIds: initialSettings.ownedBoardThemeIds,
  ownedDiceSkinIds: initialSettings.ownedDiceSkinIds,
  ownedTokenSkinIds: initialSettings.ownedTokenSkinIds,
  questionDifficulty: initialSettings.questionDifficulty,
  selectedBoardThemeId: initialSettings.selectedBoardThemeId,
  selectedDiceSkinId: initialSettings.selectedDiceSkinId,
  selectedSkinId: initialSettings.selectedSkinId,
  selectedTokenSkinId: initialSettings.selectedTokenSkinId,
  shopEnabledOnSafeSquares: initialSettings.shopEnabledOnSafeSquares,
  soundEnabled: initialSettings.soundEnabled,
  selectedConfigId: initialSettings.selectedConfigId,
  turnTimeLimitSecs: initialSettings.turnTimeLimitSecs,
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
  setShopEnabledOnSafeSquares: (shopEnabledOnSafeSquares) => {
    set({ shopEnabledOnSafeSquares })
    persistSettings(toPersistedSettings(get()))
  },
  setSelectedConfigId: (selectedConfigId) => {
    set({ selectedConfigId })
    persistSettings(toPersistedSettings(get()))
  },
  setSelectedBoardThemeId: (selectedBoardThemeId) => {
    const ownedBoardThemeIds = normalizeOwnedBoardThemeIds(get().ownedBoardThemeIds, selectedBoardThemeId)
    set({ ownedBoardThemeIds, selectedBoardThemeId })
    persistSettings(toPersistedSettings(get()))
  },
  setSelectedSkinId: (selectedSkinId) => {
    set({ selectedSkinId })
    persistSettings(toPersistedSettings(get()))
  },
  setSelectedDiceSkinId: (selectedDiceSkinId) => {
    const ownedDiceSkinIds = normalizeOwnedDiceSkinIds(get().ownedDiceSkinIds, selectedDiceSkinId)
    set({ ownedDiceSkinIds, selectedDiceSkinId })
    persistSettings(toPersistedSettings(get()))
  },
  setSelectedTokenSkinId: (selectedTokenSkinId) => {
    const ownedTokenSkinIds = normalizeOwnedTokenSkinIds(get().ownedTokenSkinIds, selectedTokenSkinId)
    set({ ownedTokenSkinIds, selectedTokenSkinId })
    persistSettings(toPersistedSettings(get()))
  },
  unlockDiceSkin: (skinId) => {
    const ownedDiceSkinIds = normalizeOwnedDiceSkinIds(get().ownedDiceSkinIds, skinId)
    set({ ownedDiceSkinIds })
    persistSettings(toPersistedSettings(get()))
  },
  unlockBoardTheme: (themeId) => {
    const ownedBoardThemeIds = normalizeOwnedBoardThemeIds(get().ownedBoardThemeIds, themeId)
    set({ ownedBoardThemeIds })
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
