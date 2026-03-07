import { useAccount } from '@starknet-react/core'
import { useMemo, useState } from 'react'
import { createGameConfig, lockGameConfig, readLatestGameConfigByCreator } from '../api'
import { shortenAddress, useControllerWallet } from '../lib/starknet/use-controller-wallet'
import { useAppSettingsStore } from '../store/app-settings-store'

type DifficultyPreset = 'easy' | 'medium' | 'hard'
type ExitHomeRule = 'FIVE' | 'EVEN' | 'SIX'

type ConfigDraft = {
  answerTimeLimitSecs: number
  turnTimeLimitSecs: number
  difficultyLevel: DifficultyPreset
  exitHomeRule: ExitHomeRule
  shopEnabledOnSafeSquares: boolean
}

const defaultDraft: ConfigDraft = {
  answerTimeLimitSecs: 20,
  turnTimeLimitSecs: 45,
  difficultyLevel: 'medium',
  exitHomeRule: 'FIVE',
  shopEnabledOnSafeSquares: true,
}

const difficultyToValue: Record<DifficultyPreset, 0 | 1 | 2> = {
  easy: 0,
  medium: 1,
  hard: 2,
}

const exitRuleToValue: Record<ExitHomeRule, 0 | 1 | 2> = {
  FIVE: 0,
  EVEN: 1,
  SIX: 2,
}

const difficultyButtonOrder: DifficultyPreset[] = ['easy', 'medium', 'hard']

const copy = {
  es: {
    title: 'CONFIGURACION GENERAL & DEL JUEGO',
    generalTitle: '1. CONFIGURACION GENERAL',
    gameTitle: '2. CONFIGURACION DEL JUEGO',
    gameSubtitle: '(CONFIG SMART CONTRACT)',
    language: 'IDIOMA',
    sound: 'SONIDO',
    walletTitle: 'INFORMACION DE LA WALLET',
    walletStatus: 'STATUS',
    walletAddress: 'ADDRESS',
    walletNetwork: 'NETWORK',
    walletBalance: 'BALANCE',
    walletUser: 'USER',
    responseTime: 'TIEMPO DE RESPUESTA (SEGUNDOS)',
    turnLimit: 'LIMITE DE TURNO (SEGUNDOS)',
    exitRule: 'REGLA PARA SALIR DE CASA',
    difficulty: 'DIFICULTAD GENERAL',
    safeShop: 'TIENDA EN PARTIDA / CASILLAS SEGURAS',
    save: 'GUARDAR CAMBIOS',
    saving: 'GUARDANDO...',
    cancel: 'CANCELAR',
    close: 'Cerrar configuracion',
    enabled: 'ACTIVADO',
    disabled: 'DESACTIVADO',
    connected: 'Connected',
    disconnected: 'Disconnected',
    unavailable: 'Unavailable',
    easy: 'FACIL',
    medium: 'MEDIO',
    hard: 'DIFICIL',
    exitFive: 'SACAR 5',
    exitEven: 'PAR',
    exitSix: 'SACAR 6',
    saved: 'Configuracion guardada y bloqueada',
    missingWallet: 'Conecta Controller Wallet para guardar una config.',
  },
  en: {
    title: 'GENERAL & GAME CONFIGURATION',
    generalTitle: '1. GENERAL SETTINGS',
    gameTitle: '2. GAME SETTINGS',
    gameSubtitle: '(SMART CONTRACT CONFIG)',
    language: 'LANGUAGE',
    sound: 'SOUND',
    walletTitle: 'WALLET INFORMATION',
    walletStatus: 'STATUS',
    walletAddress: 'ADDRESS',
    walletNetwork: 'NETWORK',
    walletBalance: 'BALANCE',
    walletUser: 'USER',
    responseTime: 'RESPONSE TIME (SECONDS)',
    turnLimit: 'TURN LIMIT (SECONDS)',
    exitRule: 'RULE TO EXIT HOME',
    difficulty: 'GENERAL DIFFICULTY',
    safeShop: 'SHOP IN MATCH / SAFE TILES',
    save: 'SAVE CHANGES',
    saving: 'SAVING...',
    cancel: 'CANCEL',
    close: 'Close configuration',
    enabled: 'ENABLED',
    disabled: 'DISABLED',
    connected: 'Connected',
    disconnected: 'Disconnected',
    unavailable: 'Unavailable',
    easy: 'EASY',
    medium: 'MEDIUM',
    hard: 'HARD',
    exitFive: 'EXIT 5',
    exitEven: 'EVEN',
    exitSix: 'EXIT 6',
    saved: 'Config saved and locked',
    missingWallet: 'Connect Controller Wallet to save a config.',
  },
} as const

type GameConfigViewProps = {
  embedded?: boolean
  onClose?: () => void
}

export function GameConfigView({ embedded = false, onClose }: GameConfigViewProps) {
  const language = useAppSettingsStore((state) => state.language)
  const soundEnabled = useAppSettingsStore((state) => state.soundEnabled)
  const setLanguage = useAppSettingsStore((state) => state.setLanguage)
  const setSoundEnabled = useAppSettingsStore((state) => state.setSoundEnabled)
  const setSelectedConfigId = useAppSettingsStore((state) => state.setSelectedConfigId)
  const text = copy[language]

  const [draft, setDraft] = useState<ConfigDraft>(defaultDraft)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const { account, address } = useAccount()
  const { isConnected, status, username } = useControllerWallet()

  const walletLabel = useMemo(() => {
    if (!address) {
      return '-'
    }

    return shortenAddress(address)
  }, [address])

  const userLabel = username || status || '-'

  const difficultyLabel = {
    easy: text.easy,
    medium: text.medium,
    hard: text.hard,
  }

  const updateDraft = <K extends keyof ConfigDraft>(field: K, value: ConfigDraft[K]) => {
    setDraft((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const onSave = async () => {
    if (!account || !address) {
      setStatusMessage(text.missingWallet)
      return
    }

    setIsSaving(true)
    setStatusMessage(null)

    try {
      const createHash = await createGameConfig(account, {
        answerTimeLimitSecs: draft.answerTimeLimitSecs,
        turnTimeLimitSecs: draft.turnTimeLimitSecs,
        difficultyLevel: difficultyToValue[draft.difficultyLevel],
        exitHomeRule: exitRuleToValue[draft.exitHomeRule],
        shopEnabledOnSafeSquares: draft.shopEnabledOnSafeSquares,
      })

      await account.waitForTransaction(createHash)

      const latestConfig = await readLatestGameConfigByCreator(address)
      if (!latestConfig) {
        throw new Error('No se pudo leer la nueva config desde Torii.')
      }

      const lockHash = await lockGameConfig(account, latestConfig.config_id)
      await account.waitForTransaction(lockHash)

      setSelectedConfigId(latestConfig.config_id.toString())
      setStatusMessage(`${text.saved}: #${latestConfig.config_id.toString()}`)
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : `${error}`)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    onClose?.()
  }

  return (
    <section className="relative isolate mx-auto mt-8 w-full max-w-[1000px] rounded-[32px] border-[8px] border-[#7f4b2e] bg-[#d4986a] p-2 shadow-[0_25px_50px_rgba(0,0,0,0.6)] sm:p-4">
      <div className="relative rounded-[24px] border-[4px] border-[#5e3219] bg-[#fdf5e6] px-4 pb-6 pt-10 shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] sm:px-8 sm:pb-8 sm:pt-12">
        <div className="absolute left-1/2 top-0 z-20 w-[90%] max-w-[700px] -translate-x-1/2 -translate-y-1/2">
          <div className="relative rounded-[16px] border-[6px] border-[#8c522b] bg-gradient-to-b from-[#f5d480] via-[#eab044] to-[#d59128] px-4 py-3 text-center shadow-[0_8px_16px_rgba(0,0,0,0.4),inset_0_2px_0_rgba(255,255,255,0.6)]">
            <div className="absolute -left-3 top-1/2 h-8 w-6 -translate-y-1/2 rounded-l-md border-[3px] border-[#5e3219] bg-[#a8b2c1]" />
            <div className="absolute -right-3 top-1/2 h-8 w-6 -translate-y-1/2 rounded-r-md border-[3px] border-[#5e3219] bg-[#a8b2c1]" />
            <h2 className="font-display text-[24px] uppercase leading-tight tracking-wide text-[#5c3214] drop-shadow-[0_1px_0_rgba(255,255,255,0.4)] sm:text-[34px]">
              {text.title}
            </h2>
          </div>
        </div>

        {embedded ? (
          <button
            aria-label={text.close}
            className="absolute -right-4 -top-4 z-30 flex h-12 w-12 items-center justify-center rounded-full border-[4px] border-[#5e3219] bg-gradient-to-b from-[#eab044] to-[#c9842f] text-[24px] font-black text-[#5c3214] shadow-[0_4px_8px_rgba(0,0,0,0.4),inset_0_2px_0_rgba(255,255,255,0.4)] transition hover:brightness-110 active:translate-y-[2px]"
            onClick={handleCancel}
            type="button"
          >
            x
          </button>
        ) : null}

        <div className="relative z-10 mt-4 grid gap-6 xl:grid-cols-2">
          <article className="rounded-[20px] border-[3px] border-[#cbaa85] bg-[#f7ecd6] p-4 shadow-[inset_0_2px_4px_rgba(255,255,255,0.8)] sm:p-6">
            <h3 className="mb-6 font-display text-[26px] uppercase tracking-wide text-[#5c3214] drop-shadow-sm sm:text-[30px]">
              {text.generalTitle}
            </h3>

            <div className="space-y-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[18px] font-black uppercase text-[#5c3214] sm:text-[20px]">{text.language} 🌐</p>
                <div className="relative w-full sm:w-[220px]">
                  <select
                    className="w-full appearance-none rounded-full border-[3px] border-[#a96639] bg-gradient-to-b from-[#d48f5b] to-[#ae6130] px-4 py-2 pr-10 text-center text-[16px] font-black uppercase text-[#fff2d7] shadow-[inset_0_2px_0_rgba(255,255,255,0.3),0_4px_6px_rgba(0,0,0,0.2)] outline-none"
                    onChange={(event) => setLanguage(event.target.value as 'es' | 'en')}
                    value={language}
                  >
                    <option value="es">ESPANOL</option>
                    <option value="en">ENGLISH</option>
                  </select>
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[14px] font-black text-[#fff2d7]">▼</span>
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[18px] font-black uppercase text-[#5c3214] sm:text-[20px]">{text.sound} 🔊</p>
                  <p className="text-[11px] font-bold uppercase text-[#88624b]">ACTIVADO / DESACTIVADO</p>
                </div>
                <button
                  className={`relative flex h-[44px] w-[176px] items-center rounded-full border-[3px] p-[4px] shadow-[inset_0_3px_6px_rgba(0,0,0,0.2)] transition-colors ${
                    soundEnabled
                      ? 'border-[#3d8f38] bg-gradient-to-b from-[#71d659] to-[#45aa34]'
                      : 'border-[#a96639] bg-[#e8d1b1]'
                  }`}
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  type="button"
                >
                  <div className={`flex w-full items-center ${soundEnabled ? 'justify-between' : 'justify-between flex-row-reverse'}`}>
                    <span className={`px-2 text-[11px] font-black tracking-wide ${soundEnabled ? 'text-white' : 'text-[#88624b]'}`}>
                      {soundEnabled ? text.enabled : text.disabled}
                    </span>
                    <div
                      className={`h-[30px] w-[30px] flex-shrink-0 rounded-full border-[2px] ${
                        soundEnabled
                          ? 'border-[#f2deba] bg-[#fff2d7] shadow-[-2px_0_4px_rgba(0,0,0,0.2)]'
                          : 'border-[#a96639] bg-gradient-to-b from-[#f2deba] to-[#d1ac7f] shadow-[2px_0_4px_rgba(0,0,0,0.2)]'
                      }`}
                    />
                  </div>
                </button>
              </div>

              <div className="mt-8 border-t-[3px] border-[#cbaa85] pt-6">
                <h4 className="mb-4 font-display text-[22px] uppercase tracking-wide text-[#5c3214] sm:text-[24px]">
                  {text.walletTitle} 👛
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[15px] font-black uppercase text-[#5c3214]">{text.walletUser}</span>
                    <div className="rounded-lg border border-[#d5c2a5] bg-[#eae0c9] px-3 py-1 shadow-inner">
                      <span className="text-[14px] font-bold text-[#5c3214]">{userLabel}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[15px] font-black uppercase text-[#5c3214]">{text.walletStatus}</span>
                    <div className="rounded-lg border border-[#d5c2a5] bg-[#eae0c9] px-3 py-1 shadow-inner">
                      <span className="text-[14px] font-bold text-[#5c3214]">{isConnected ? text.connected : text.disconnected}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[15px] font-black uppercase text-[#5c3214]">{text.walletAddress}</span>
                    <div className="flex items-center gap-2 rounded-lg border border-[#d5c2a5] bg-[#eae0c9] px-3 py-1 shadow-inner">
                      <span className="font-mono text-[14px] font-bold text-[#5c3214]">{isConnected ? walletLabel : '-'}</span>
                      <span className="text-sm text-gray-500">📋</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </article>

          <article className="rounded-[20px] border-[3px] border-[#cbaa85] bg-[#f7ecd6] p-4 shadow-[inset_0_2px_4px_rgba(255,255,255,0.8)] sm:p-6">
            <h3 className="font-display text-[26px] uppercase tracking-wide text-[#5c3214] drop-shadow-sm sm:text-[30px]">
              {text.gameTitle}
            </h3>
            <p className="mb-6 mt-[-4px] text-[13px] font-black uppercase text-[#88624b]">{text.gameSubtitle}</p>

            <div className="space-y-5">
              <div className="flex items-center justify-between border-b-[2px] border-[#e8d4b7] pb-4">
                <p className="max-w-[180px] text-[15px] font-black uppercase leading-tight text-[#5c3214] sm:text-[17px]">{text.responseTime}</p>
                <div className="rounded-[12px] border-[2px] border-[#cbaa85] bg-[#eae0c9] px-5 py-1.5 shadow-inner">
                  <input
                    className="w-[40px] bg-transparent text-center text-[18px] font-black text-[#5c3214] outline-none"
                    min={5}
                    onChange={(event) => updateDraft('answerTimeLimitSecs', Number(event.target.value))}
                    type="number"
                    value={draft.answerTimeLimitSecs}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between border-b-[2px] border-[#e8d4b7] pb-4">
                <p className="max-w-[180px] text-[15px] font-black uppercase leading-tight text-[#5c3214] sm:text-[17px]">{text.turnLimit}</p>
                <div className="rounded-[12px] border-[2px] border-[#cbaa85] bg-[#eae0c9] px-5 py-1.5 shadow-inner">
                  <input
                    className="w-[40px] bg-transparent text-center text-[18px] font-black text-[#5c3214] outline-none"
                    min={10}
                    onChange={(event) => updateDraft('turnTimeLimitSecs', Number(event.target.value))}
                    type="number"
                    value={draft.turnTimeLimitSecs}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between border-b-[2px] border-[#e8d4b7] pb-4">
                <p className="max-w-[150px] text-[15px] font-black uppercase leading-tight text-[#5c3214] sm:text-[17px]">{text.exitRule}</p>
                <div className="relative w-[150px]">
                  <select
                    className="w-full appearance-none rounded-full border-[3px] border-[#a96639] bg-gradient-to-b from-[#d48f5b] to-[#ae6130] px-4 py-2 pr-8 text-center text-[14px] font-black uppercase text-[#fff2d7] shadow-[0_4px_6px_rgba(0,0,0,0.2)] outline-none"
                    onChange={(event) => updateDraft('exitHomeRule', event.target.value as ExitHomeRule)}
                    value={draft.exitHomeRule}
                  >
                    <option value="FIVE">{text.exitFive}</option>
                    <option value="EVEN">{text.exitEven}</option>
                    <option value="SIX">{text.exitSix}</option>
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[12px] font-black text-[#fff2d7]">▼</span>
                </div>
              </div>

              <div className="border-b-[2px] border-[#e8d4b7] pb-4 pt-1">
                <p className="mb-3 text-center text-[16px] font-black uppercase tracking-wide text-[#5c3214]">{text.difficulty}</p>
                <div className="flex w-full overflow-hidden rounded-full border-[3px] border-[#a96639] bg-[#cbaa85] shadow-[0_4px_6px_rgba(0,0,0,0.2)]">
                  {difficultyButtonOrder.map((difficulty) => {
                    const isActive = draft.difficultyLevel === difficulty
                    return (
                      <button
                        className={`flex-1 py-1.5 text-[14px] font-black uppercase transition-colors ${
                          isActive
                            ? 'bg-gradient-to-b from-[#f5d480] to-[#eab044] text-[#5c3214] shadow-inner'
                            : 'bg-[#cbaa85] text-[#5c3214]/60 hover:bg-[#d5b896]'
                        }`}
                        key={difficulty}
                        onClick={() => updateDraft('difficultyLevel', difficulty)}
                        type="button"
                      >
                        {difficultyLabel[difficulty]}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div>
                  <p className="text-[16px] font-black uppercase text-[#5c3214]">{text.safeShop}</p>
                  <p className="text-[11px] font-bold uppercase text-[#88624b]">TIENDA HABILITADA EN<br />CASILLAS SEGURAS</p>
                </div>
                <button
                  className={`relative flex h-[44px] w-[176px] items-center rounded-full border-[3px] p-[4px] shadow-[inset_0_3px_6px_rgba(0,0,0,0.2)] transition-colors ${
                    draft.shopEnabledOnSafeSquares
                      ? 'border-[#3d8f38] bg-gradient-to-b from-[#71d659] to-[#45aa34]'
                      : 'border-[#a96639] bg-[#e8d1b1]'
                  }`}
                  onClick={() => updateDraft('shopEnabledOnSafeSquares', !draft.shopEnabledOnSafeSquares)}
                  type="button"
                >
                  <div className={`flex w-full items-center ${draft.shopEnabledOnSafeSquares ? 'justify-between' : 'justify-between flex-row-reverse'}`}>
                    <span className={`px-2 text-[11px] font-black tracking-wide ${draft.shopEnabledOnSafeSquares ? 'text-white' : 'text-[#88624b]'}`}>
                      {draft.shopEnabledOnSafeSquares ? 'HABILITADO' : 'DESHABILITADO'}
                    </span>
                    <div
                      className={`h-[30px] w-[30px] flex-shrink-0 rounded-full border-[2px] ${
                        draft.shopEnabledOnSafeSquares
                          ? 'border-[#f2deba] bg-[#fff2d7] shadow-[-2px_0_4px_rgba(0,0,0,0.2)]'
                          : 'border-[#a96639] bg-gradient-to-b from-[#f2deba] to-[#d1ac7f] shadow-[2px_0_4px_rgba(0,0,0,0.2)]'
                      }`}
                    />
                  </div>
                </button>
              </div>
            </div>
          </article>
        </div>

        {statusMessage ? (
          <div className="mx-auto mt-4 max-w-[880px] rounded-[16px] border-[2px] border-[#cbaa85] bg-[#f7ecd6] px-4 py-3 text-center text-[16px] font-black text-[#5c3214] shadow-inner">
            {statusMessage}
          </div>
        ) : null}

        <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
          <button
            className="w-[260px] rounded-full border-[4px] border-[#3d8f38] bg-gradient-to-b from-[#71d659] via-[#54be3d] to-[#39a322] px-4 py-3 font-display text-[26px] uppercase tracking-wide text-white shadow-[0_8px_0_#2b6627,0_12px_20px_rgba(0,0,0,0.4),inset_0_3px_0_rgba(255,255,255,0.5)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSaving}
            onClick={() => void onSave()}
            type="button"
            style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}
          >
            {isSaving ? text.saving : 'GUARDAR CAMBIOS'}
          </button>

          <button
            className="w-[220px] rounded-full border-[4px] border-[#697a8d] bg-gradient-to-b from-[#bdc6d2] via-[#9eaab8] to-[#808f9f] px-4 py-3 font-display text-[26px] uppercase tracking-wide text-white shadow-[0_8px_0_#4d5a6a,0_12px_20px_rgba(0,0,0,0.4),inset_0_3px_0_rgba(255,255,255,0.5)] transition hover:brightness-110"
            onClick={handleCancel}
            type="button"
            style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}
          >
            {text.cancel}
          </button>
        </div>
      </div>
    </section>
  )
}
