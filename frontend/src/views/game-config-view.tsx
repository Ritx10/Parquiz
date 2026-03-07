import { useAccount } from '@starknet-react/core'
import { useMemo, useState } from 'react'
import { createGameConfig, lockGameConfig, readLatestGameConfigByCreator } from '../api'
import { formatChain, shortenAddress, useControllerWallet } from '../lib/starknet/use-controller-wallet'
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
const contractRuleItems = [
  { key: 'allowSplitDice', value: true },
  { key: 'allowTwoStepSameToken', value: true },
  { key: 'allowSumDice', value: true },
  { key: 'requiresExactHome', value: true },
] as const

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

function ArcadeValueField({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[146px_minmax(0,1fr)] items-center gap-3">
      <p className="text-[18px] font-black uppercase tracking-[0.02em] text-[#5d3418] sm:text-[20px]">{label}</p>
      <div className="min-w-0 rounded-[14px] border border-[#dcc29a] bg-[#e8d8b8] px-4 py-3 text-[20px] font-black text-[#432510] shadow-[inset_0_1px_0_rgba(255,247,227,0.7)] sm:text-[21px]">
        <span className="block truncate">{value}</span>
      </div>
    </div>
  )
}

function RuleChip({ label, value }: { label: string; value: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[16px] border border-[#dcc29a] bg-[#fbf3e4] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]">
      <span className="text-[14px] font-black uppercase tracking-[0.02em] text-[#6e4325] sm:text-[16px]">{label}</span>
      <span className="rounded-full border border-[#4ea42c] bg-gradient-to-b from-[#88ea50] to-[#57c930] px-4 py-1 text-[12px] font-black uppercase tracking-wide text-[#215412] shadow-[inset_0_1px_0_rgba(223,255,198,0.9)] sm:text-[14px]">
        {value ? 'TRUE' : 'FALSE'}
      </span>
    </div>
  )
}

export function GameConfigView({ embedded = false, onClose }: GameConfigViewProps) {
  const language = useAppSettingsStore((state) => state.language)
  const soundEnabled = useAppSettingsStore((state) => state.soundEnabled)
  const selectedConfigId = useAppSettingsStore((state) => state.selectedConfigId)
  const setLanguage = useAppSettingsStore((state) => state.setLanguage)
  const setSoundEnabled = useAppSettingsStore((state) => state.setSoundEnabled)
  const setSelectedConfigId = useAppSettingsStore((state) => state.setSelectedConfigId)
  const text = copy[language]

  const [draft, setDraft] = useState<ConfigDraft>(defaultDraft)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const { account, address } = useAccount()
  const { chainId, isConnected, status, username } = useControllerWallet()

  const walletLabel = useMemo(() => {
    if (!address) {
      return '-'
    }

    return shortenAddress(address)
  }, [address])

  const userLabel = username || status || '-'
  const balanceLabel = text.unavailable

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
    <section className="relative isolate rounded-[42px] border-[6px] border-[#8d532c] bg-[#a66738] p-2 shadow-[0_28px_60px_rgba(24,10,4,0.62)] sm:p-3">
      <span className="pointer-events-none absolute inset-[8px] rounded-[34px] border border-[#dfb181]/35" />
      <span className="pointer-events-none absolute inset-0 rounded-[36px] bg-[linear-gradient(180deg,rgba(255,208,154,0.12),rgba(84,44,19,0.1))]" />

      <div className="relative rounded-[34px] border-[3px] border-[#c0895a] bg-[#f3e4c5] px-5 pb-6 pt-7 shadow-[inset_0_1px_0_rgba(255,245,219,0.9)] sm:px-8 sm:pb-8 sm:pt-8">
        <span className="pointer-events-none absolute inset-[3px] rounded-[29px] bg-[#f3e4c5]" />
        {embedded ? (
          <button
            aria-label={text.close}
            className="absolute right-5 top-5 z-20 inline-flex h-11 w-11 items-center justify-center rounded-full border-2 border-[#bb8d60] bg-gradient-to-b from-[#f8ddb4] to-[#ddb171] text-[28px] font-black leading-none text-[#7f4b24] shadow-[inset_0_1px_0_rgba(255,249,236,0.75),0_3px_0_rgba(143,93,48,0.9)]"
            onClick={handleCancel}
            type="button"
          >
            ×
          </button>
        ) : null}

        <div className="relative z-10 mx-auto w-fit max-w-full px-12">
          <div className="rounded-[24px] border-[4px] border-[#9a6336] bg-gradient-to-b from-[#f6de82] via-[#efc45b] to-[#d89d39] px-8 py-3 shadow-[inset_0_1px_0_rgba(255,248,211,0.75),0_5px_0_rgba(145,92,35,0.95)] sm:min-w-[520px] sm:px-12 sm:py-4">
            <h2 className="text-center font-display text-[34px] uppercase tracking-[0.03em] text-[#62371a] drop-shadow-[0_1px_0_rgba(255,234,180,0.8)] sm:text-[56px]">
              {text.title}
            </h2>
          </div>
        </div>

        <div className="relative z-10 mt-6 grid gap-4 xl:grid-cols-2 xl:gap-5">
          <article className="rounded-[28px] border-[3px] border-[#be8a5b] bg-[#f7efdf] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.66)] sm:p-5">
            <h3 className="font-display text-[38px] uppercase tracking-[0.03em] text-[#55311a] sm:text-[56px]">{text.generalTitle}</h3>

            <div className="mt-4 space-y-3">
              <div className="rounded-[20px] border border-[#ddc39e] bg-[#fbf4e7] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                <div className="grid gap-2 sm:grid-cols-[200px_minmax(0,1fr)] sm:items-center sm:gap-5">
                  <p className="text-[20px] font-black uppercase tracking-[0.03em] text-[#5f3618] sm:text-[26px]">{text.language}</p>
                  <div className="relative">
                    <select
                      className="w-full appearance-none rounded-full border border-[#aa693b] bg-gradient-to-r from-[#bc7a46] to-[#91542d] px-6 py-3 pr-14 text-[22px] font-black uppercase tracking-[0.04em] text-[#fff1d0] shadow-[inset_0_1px_0_rgba(255,225,181,0.36)] outline-none sm:text-[24px]"
                      onChange={(event) => setLanguage(event.target.value as 'es' | 'en')}
                      value={language}
                    >
                      <option value="es">ESPANOL</option>
                      <option value="en">ENGLISH</option>
                    </select>
                    <span className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-[18px] font-black text-[#ffe8bf]">v</span>
                  </div>
                </div>
              </div>

              <div className="rounded-[20px] border border-[#ddc39e] bg-[#fbf4e7] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                <div className="grid gap-2 sm:grid-cols-[200px_minmax(0,1fr)] sm:items-center sm:gap-5">
                  <p className="text-[20px] font-black uppercase tracking-[0.03em] text-[#5f3618] sm:text-[26px]">{text.sound}</p>
                  <button
                    className="flex w-full items-center justify-between rounded-full border border-[#aa693b] bg-gradient-to-r from-[#bc7a46] to-[#91542d] px-4 py-2.5 text-left shadow-[inset_0_1px_0_rgba(255,225,181,0.36)]"
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    type="button"
                  >
                    <span className="text-[18px] font-black uppercase tracking-[0.04em] text-[#f9e4bf] sm:text-[20px]">&nbsp;</span>
                    <span
                      className={`rounded-full border px-6 py-2 text-[16px] font-black uppercase tracking-[0.05em] shadow-[inset_0_1px_0_rgba(221,255,191,0.84)] sm:text-[18px] ${
                        soundEnabled
                          ? 'border-[#4ca62b] bg-gradient-to-b from-[#81e94a] to-[#56c930] text-[#235611]'
                          : 'border-[#8f5a34] bg-gradient-to-b from-[#efe5d3] to-[#d4c0a0] text-[#71411e]'
                      }`}
                    >
                      {soundEnabled ? text.enabled : text.disabled}
                    </span>
                  </button>
                </div>
              </div>

              <div className="rounded-[20px] border border-[#ddc39e] bg-[#fbf4e7] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] sm:px-5">
                <h4 className="font-display text-[26px] uppercase tracking-[0.03em] text-[#56311a] sm:text-[32px]">{text.walletTitle}</h4>

                <div className="mt-3 space-y-3">
                  <ArcadeValueField label={text.walletStatus} value={isConnected ? text.connected : text.disconnected} />
                  <ArcadeValueField label={text.walletAddress} value={isConnected ? walletLabel : '-'} />
                  <ArcadeValueField label={text.walletNetwork} value={formatChain(chainId)} />
                  <ArcadeValueField label={text.walletBalance} value={balanceLabel} />
                  <ArcadeValueField label={text.walletUser} value={userLabel} />
                </div>
              </div>
            </div>
          </article>

          <article className="rounded-[28px] border-[3px] border-[#be8a5b] bg-[#f7efdf] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.66)] sm:p-5">
            <h3 className="font-display text-[38px] uppercase tracking-[0.03em] text-[#55311a] sm:text-[56px]">{text.gameTitle}</h3>
            <p className="mt-[-2px] text-[18px] font-black uppercase tracking-[0.03em] text-[#764526] sm:text-[21px]">{text.gameSubtitle}</p>

            <div className="mt-3 space-y-3">
              <div className="rounded-[18px] border border-[#ddc39e] bg-[#fbf4e7] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_170px] sm:items-center">
                  <p className="text-[18px] font-black uppercase tracking-[0.03em] text-[#56311a] sm:text-[22px]">{text.responseTime}</p>
                  <input
                    className="w-full rounded-[14px] border border-[#dcc29a] bg-[#ead8b7] px-4 py-3 text-center text-[22px] font-black text-[#472814] outline-none shadow-[inset_0_1px_0_rgba(255,247,227,0.7)]"
                    min={5}
                    onChange={(event) => updateDraft('answerTimeLimitSecs', Number(event.target.value))}
                    type="number"
                    value={draft.answerTimeLimitSecs}
                  />
                </div>
              </div>

              <div className="rounded-[18px] border border-[#ddc39e] bg-[#fbf4e7] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_170px] sm:items-center">
                  <p className="text-[18px] font-black uppercase tracking-[0.03em] text-[#56311a] sm:text-[22px]">{text.turnLimit}</p>
                  <input
                    className="w-full rounded-[14px] border border-[#dcc29a] bg-[#ead8b7] px-4 py-3 text-center text-[22px] font-black text-[#472814] outline-none shadow-[inset_0_1px_0_rgba(255,247,227,0.7)]"
                    min={10}
                    onChange={(event) => updateDraft('turnTimeLimitSecs', Number(event.target.value))}
                    type="number"
                    value={draft.turnTimeLimitSecs}
                  />
                </div>
              </div>

              <div className="rounded-[18px] border border-[#ddc39e] bg-[#fbf4e7] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_300px] sm:items-center">
                  <p className="text-[18px] font-black uppercase tracking-[0.03em] text-[#56311a] sm:text-[22px]">{text.exitRule}</p>
                  <div className="relative">
                    <select
                      className="w-full appearance-none rounded-full border border-[#aa693b] bg-gradient-to-r from-[#bc7a46] to-[#91542d] px-6 py-3 pr-14 text-[22px] font-black uppercase tracking-[0.04em] text-[#fff1d0] shadow-[inset_0_1px_0_rgba(255,225,181,0.36)] outline-none"
                      onChange={(event) => updateDraft('exitHomeRule', event.target.value as ExitHomeRule)}
                      value={draft.exitHomeRule}
                    >
                      <option value="FIVE">{text.exitFive}</option>
                      <option value="EVEN">{text.exitEven}</option>
                      <option value="SIX">{text.exitSix}</option>
                    </select>
                    <span className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-[18px] font-black text-[#ffe8bf]">v</span>
                  </div>
                </div>
              </div>

              <div className="rounded-[20px] border border-[#ddc39e] bg-[#fbf4e7] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                <p className="text-center text-[20px] font-black uppercase tracking-[0.03em] text-[#5c3418] sm:text-[22px]">{text.difficulty}</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  {difficultyButtonOrder.map((difficulty) => {
                    const isActive = draft.difficultyLevel === difficulty
                    return (
                      <button
                        className={`rounded-full border px-5 py-3 text-[20px] font-black uppercase tracking-[0.04em] shadow-[inset_0_1px_0_rgba(255,225,181,0.36)] transition ${
                          isActive
                            ? 'border-[#c49c3a] bg-gradient-to-b from-[#ffd86a] to-[#e7ae39] text-[#5a3416]'
                            : 'border-[#aa693b] bg-gradient-to-r from-[#bc7a46] to-[#91542d] text-[#fff0d2]'
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

              <div className="rounded-[18px] border border-[#ddc39e] bg-[#fbf4e7] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_300px] sm:items-center">
                  <p className="text-[18px] font-black uppercase tracking-[0.03em] text-[#56311a] sm:text-[22px]">{text.safeShop}</p>
                  <button
                    className="flex w-full items-center justify-between rounded-full border border-[#aa693b] bg-gradient-to-r from-[#bc7a46] to-[#91542d] px-4 py-2.5 text-left shadow-[inset_0_1px_0_rgba(255,225,181,0.36)]"
                    onClick={() => updateDraft('shopEnabledOnSafeSquares', !draft.shopEnabledOnSafeSquares)}
                    type="button"
                  >
                    <span className="text-[18px] font-black uppercase tracking-[0.04em] text-[#f9e4bf] sm:text-[20px]">&nbsp;</span>
                    <span
                      className={`rounded-full border px-6 py-2 text-[16px] font-black uppercase tracking-[0.05em] shadow-[inset_0_1px_0_rgba(223,255,198,0.84)] sm:text-[18px] ${
                        draft.shopEnabledOnSafeSquares
                          ? 'border-[#4ca62b] bg-gradient-to-b from-[#81e94a] to-[#56c930] text-[#235611]'
                          : 'border-[#8f5a34] bg-gradient-to-b from-[#efe5d3] to-[#d4c0a0] text-[#71411e]'
                      }`}
                    >
                      {draft.shopEnabledOnSafeSquares ? text.enabled : text.disabled}
                    </span>
                  </button>
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                {contractRuleItems.map((item) => (
                  <RuleChip key={item.key} label={item.key} value={item.value} />
                ))}
              </div>
            </div>
          </article>
        </div>

        {statusMessage ? (
          <div className="mx-auto mt-4 max-w-[880px] rounded-[16px] border border-[#d6b184] bg-[#f8ecd0] px-4 py-3 text-center text-base font-bold text-[#58311a] shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]">
            {statusMessage}
          </div>
        ) : null}

        <div className="relative z-10 mt-6 flex flex-wrap items-center justify-center gap-4">
          <button
            className="min-w-[280px] rounded-full border-[3px] border-[#2f7b1f] bg-gradient-to-b from-[#80ea4d] to-[#4cb92a] px-8 py-3 font-display text-[34px] uppercase tracking-[0.03em] text-[#234e15] shadow-[inset_0_2px_0_rgba(223,255,198,0.9),0_7px_0_rgba(38,109,26,0.95)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60 sm:text-[40px]"
            disabled={isSaving}
            onClick={() => void onSave()}
            type="button"
          >
            {isSaving ? text.saving : text.save}
          </button>

          <button
            className="min-w-[230px] rounded-full border-[3px] border-[#8d939d] bg-gradient-to-b from-[#eff1f6] to-[#aeb5c0] px-8 py-3 font-display text-[34px] uppercase tracking-[0.03em] text-[#38404d] shadow-[inset_0_2px_0_rgba(255,255,255,0.92),0_7px_0_rgba(112,119,130,0.95)] transition hover:brightness-105"
            onClick={handleCancel}
            type="button"
          >
            {text.cancel}
          </button>
        </div>

        <div className="relative z-10 mt-4 text-center text-xs font-black uppercase tracking-[0.14em] text-[#9c7247]">
          CONFIG #{selectedConfigId}
        </div>
      </div>
    </section>
  )
}
