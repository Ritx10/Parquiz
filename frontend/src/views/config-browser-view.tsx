import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { readGameConfigs, readPublicLobbyIndex, type DojoGameConfigModel } from '../api'
import { isDojoConfigured } from '../config/dojo'
import { shortenAddress } from '../lib/starknet/use-controller-wallet'
import { useAppSettingsStore } from '../store/app-settings-store'

type ConfigEntry = DojoGameConfigModel & {
  publicLobbyGameId: bigint | null
}

const copy = {
  es: {
    backHome: 'VOLVER AL MENU',
    browseTitle: 'EXPLORADOR DE CONFIGS',
    browseSubtitle: 'Revisa las configuraciones on-chain, sus IDs y entra al lobby con la que quieras usar.',
    playableHint: 'Solo las configs con estado Bloqueada son validas para jugar partidas.',
    currentSelection: 'CONFIG ACTIVA',
    creator: 'CREADOR',
    status: 'ESTADO',
    answerTime: 'RESPUESTA',
    turnTime: 'TURNO',
    exitRule: 'SALIDA',
    publicLobby: 'LOBBY PUBLICO',
    publicLobbyActive: 'Activo',
    publicLobbyInactive: 'Sin cola',
    useConfig: 'USAR CONFIG',
    playPublic: 'IR A PUBLICO',
    playPrivate: 'IR A PRIVADO',
    loading: 'Cargando configuraciones on-chain...',
    empty: 'Todavia no hay configuraciones indexadas en Torii.',
    notConfigured: 'Dojo/Torii no esta configurado, asi que no puedo listar las configs on-chain.',
    draft: 'Borrador',
    locked: 'Bloqueada',
    disabled: 'Deshabilitada',
    exitFive: 'Sacar 5',
    exitEven: 'Par',
    exitSix: 'Sacar 6',
    noConfigSelected: 'Ninguna seleccionada',
    updated: 'ACTUALIZADA',
  },
  en: {
    backHome: 'BACK HOME',
    browseTitle: 'CONFIG BROWSER',
    browseSubtitle: 'Inspect the on-chain game configs, their IDs, and jump into the lobby with the one you want to use.',
    playableHint: 'Only configs marked Locked are valid for starting games.',
    currentSelection: 'ACTIVE CONFIG',
    creator: 'CREATOR',
    status: 'STATUS',
    answerTime: 'ANSWER',
    turnTime: 'TURN',
    exitRule: 'EXIT',
    publicLobby: 'PUBLIC LOBBY',
    publicLobbyActive: 'Active',
    publicLobbyInactive: 'No queue',
    useConfig: 'USE CONFIG',
    playPublic: 'GO PUBLIC',
    playPrivate: 'GO PRIVATE',
    loading: 'Loading on-chain configs...',
    empty: 'There are no configs indexed in Torii yet.',
    notConfigured: 'Dojo/Torii is not configured, so I cannot list the on-chain configs.',
    draft: 'Draft',
    locked: 'Locked',
    disabled: 'Disabled',
    exitFive: 'Roll 5',
    exitEven: 'Even',
    exitSix: 'Roll 6',
    noConfigSelected: 'None selected',
    updated: 'UPDATED',
  },
} as const

const statusToneByValue = {
  0: 'border-[#b78446] bg-[#fff2cc] text-[#7a4a0c]',
  1: 'border-[#4d8b56] bg-[#e0f4d7] text-[#1f5c2a]',
  2: 'border-[#a45a56] bg-[#fde0db] text-[#78271d]',
} as const

const formatTimestamp = (value: bigint) => {
  if (value <= 0n) {
    return '-'
  }

  const date = new Date(Number(value) * 1000)
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString()
}

export function ConfigBrowserView() {
  const navigate = useNavigate()
  const language = useAppSettingsStore((state) => state.language)
  const selectedConfigId = useAppSettingsStore((state) => state.selectedConfigId)
  const setSelectedConfigId = useAppSettingsStore((state) => state.setSelectedConfigId)
  const ui = copy[language]

  const [configs, setConfigs] = useState<ConfigEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!isDojoConfigured) {
      setConfigs([])
      setErrorMessage(ui.notConfigured)
      setIsLoading(false)
      return
    }

    let cancelled = false

    const loadConfigs = async () => {
      setIsLoading(true)
      setErrorMessage(null)

      try {
        const nextConfigs = await readGameConfigs(48)
        const publicLobbyStates = await Promise.all(
          nextConfigs.map(async (config) => {
            const lobby = await readPublicLobbyIndex(config.config_id)
            return lobby?.is_active ? lobby.game_id : null
          }),
        )

        if (cancelled) {
          return
        }

        setConfigs(nextConfigs.map((config, index) => ({ ...config, publicLobbyGameId: publicLobbyStates[index] || null })))
      } catch (error) {
        if (!cancelled) {
          setConfigs([])
          setErrorMessage(error instanceof Error ? error.message : `${error}`)
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadConfigs()

    return () => {
      cancelled = true
    }
  }, [ui.notConfigured])

  const selectedConfig = useMemo(
    () => configs.find((config) => config.config_id.toString() === selectedConfigId) || null,
    [configs, selectedConfigId],
  )

  const exitRuleLabel = (value: number) => {
    if (value === 1) return ui.exitEven
    if (value === 2) return ui.exitSix
    return ui.exitFive
  }

  const statusLabel = (value: number) => {
    if (value === 0) return ui.draft
    if (value === 2) return ui.disabled
    return ui.locked
  }

  const chooseConfig = (configId: bigint) => {
    setSelectedConfigId(configId.toString())
  }

  const openLobby = (path: '/lobby' | '/lobby-friends', configId: bigint) => {
    chooseConfig(configId)
    navigate(path)
  }

  return (
    <section
      className="relative isolate min-h-screen overflow-hidden px-4 pb-8 pt-4 sm:px-6 lg:px-8"
      style={{
        backgroundImage: "url('/home-background.jpg')",
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover',
      }}
    >
      <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(34,18,9,0.24)_0%,rgba(24,12,7,0.3)_46%,rgba(17,9,6,0.48)_100%)]" />
      <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(255,241,210,0.22),transparent_54%),radial-gradient(circle_at_50%_108%,rgba(15,8,5,0.58),transparent_60%)]" />

      <div className="relative z-10 mx-auto max-w-[1320px]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-[760px] rounded-[28px] border border-[#7d4a2a] bg-gradient-to-b from-[#a86739] via-[#8a522f] to-[#6b4026] p-[4px] shadow-[0_18px_36px_rgba(34,15,6,0.35)]">
            <div className="rounded-[24px] border border-[#d0a36a]/60 bg-[linear-gradient(180deg,rgba(76,39,21,0.96),rgba(52,28,16,0.96))] px-5 py-5 text-[#ffe9c4]">
              <p className="font-display text-3xl uppercase tracking-[0.08em] sm:text-4xl">{ui.browseTitle}</p>
              <p className="mt-2 max-w-[640px] text-sm font-semibold leading-6 text-[#f6deba]">{ui.browseSubtitle}</p>
            </div>
          </div>

          <button
            className="rounded-full border border-[#8e5b32] bg-gradient-to-b from-[#fff0b4] to-[#d79224] px-6 py-3 text-sm font-black uppercase tracking-[0.12em] text-[#5a3110] shadow-[inset_0_2px_0_rgba(255,250,216,0.8),0_10px_20px_rgba(60,31,10,0.25)] transition hover:-translate-y-0.5"
            onClick={() => navigate('/')}
            type="button"
          >
            {ui.backHome}
          </button>
        </div>

        <div className="mt-5 rounded-[26px] border border-[#7a4628] bg-[linear-gradient(180deg,rgba(108,62,36,0.95),rgba(72,41,24,0.96))] p-4 text-[#ffeccf] shadow-[0_18px_34px_rgba(33,15,6,0.35)] sm:p-5">
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#ffdba5]">{ui.currentSelection}</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-[#c89a63] bg-[#f6e2be] px-4 py-1 text-xl font-display text-[#5b3212]">
              {selectedConfig ? `#${selectedConfig.config_id.toString()}` : ui.noConfigSelected}
            </span>
            {selectedConfig ? (
              <span className="rounded-full border border-[#8b613b] bg-[#5a311b] px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-[#ffdca7]">
                {ui.updated}: {formatTimestamp(selectedConfig.updated_at)}
              </span>
            ) : null}
          </div>
        </div>

        <div className="mt-4 rounded-[22px] border border-[#8c6239] bg-[linear-gradient(180deg,rgba(255,240,196,0.96),rgba(236,205,150,0.96))] px-5 py-4 text-sm font-black leading-6 text-[#6a3d16] shadow-[0_14px_28px_rgba(33,15,6,0.18)]">
          {ui.playableHint}
        </div>

        {isLoading ? (
          <div className="mt-6 rounded-[26px] border border-[#7a4628] bg-[linear-gradient(180deg,rgba(108,62,36,0.95),rgba(72,41,24,0.96))] px-6 py-10 text-center text-base font-black uppercase tracking-[0.12em] text-[#ffebc5] shadow-[0_18px_34px_rgba(33,15,6,0.35)]">
            {ui.loading}
          </div>
        ) : errorMessage ? (
          <div className="mt-6 rounded-[26px] border border-[#9b5d4b] bg-[linear-gradient(180deg,rgba(120,49,35,0.96),rgba(87,31,23,0.96))] px-6 py-10 text-center text-sm font-bold leading-6 text-[#ffe1d7] shadow-[0_18px_34px_rgba(33,15,6,0.35)]">
            {errorMessage}
          </div>
        ) : configs.length === 0 ? (
          <div className="mt-6 rounded-[26px] border border-[#7a4628] bg-[linear-gradient(180deg,rgba(108,62,36,0.95),rgba(72,41,24,0.96))] px-6 py-10 text-center text-sm font-bold leading-6 text-[#ffe1b5] shadow-[0_18px_34px_rgba(33,15,6,0.35)]">
            {ui.empty}
          </div>
        ) : (
          <div className="mt-6 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {configs.map((config) => {
              const isSelected = config.config_id.toString() === selectedConfigId
              const isPlayable = config.status === 1
              const statusTone = statusToneByValue[config.status as keyof typeof statusToneByValue] || statusToneByValue[1]

              return (
                <article
                  className={`rounded-[28px] border border-[#7f4b2b] bg-gradient-to-b from-[#f6e3bc] via-[#ecd0a3] to-[#ddb17f] p-[3px] shadow-[0_18px_28px_rgba(33,15,6,0.3)] ${
                    isPlayable ? '' : 'opacity-75 saturate-[0.78]'
                  }`}
                  key={config.config_id.toString()}
                >
                  <div className="rounded-[24px] border border-[#fff4dc]/60 bg-[linear-gradient(180deg,rgba(88,47,28,0.98),rgba(63,35,21,0.98))] p-4 text-[#ffeecf]">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#ffd59a]">Config ID</p>
                        <p className="mt-1 font-display text-3xl text-[#fff1d5]">#{config.config_id.toString()}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] ${statusTone}`}>
                          {statusLabel(config.status)}
                        </span>
                        {isSelected ? (
                          <span className="rounded-full border border-[#6f8e55] bg-[#e6f4ce] px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-[#31511c]">
                            {ui.currentSelection}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm font-bold text-[#fce7c1]">
                      <div className="rounded-[18px] border border-[#8d613d] bg-[#5d341f]/80 px-3 py-2">
                        <p className="text-[10px] uppercase tracking-[0.14em] text-[#ffcf92]">{ui.creator}</p>
                        <p className="mt-1 truncate">{shortenAddress(config.creator)}</p>
                      </div>
                      <div className="rounded-[18px] border border-[#8d613d] bg-[#5d341f]/80 px-3 py-2">
                        <p className="text-[10px] uppercase tracking-[0.14em] text-[#ffcf92]">{ui.answerTime}</p>
                        <p className="mt-1">{config.answer_time_limit_secs}s</p>
                      </div>
                      <div className="rounded-[18px] border border-[#8d613d] bg-[#5d341f]/80 px-3 py-2">
                        <p className="text-[10px] uppercase tracking-[0.14em] text-[#ffcf92]">{ui.turnTime}</p>
                        <p className="mt-1">{config.turn_time_limit_secs}s</p>
                      </div>
                      <div className="rounded-[18px] border border-[#8d613d] bg-[#5d341f]/80 px-3 py-2">
                        <p className="text-[10px] uppercase tracking-[0.14em] text-[#ffcf92]">{ui.exitRule}</p>
                        <p className="mt-1">{exitRuleLabel(config.exit_home_rule)}</p>
                      </div>
                      <div className="rounded-[18px] border border-[#8d613d] bg-[#5d341f]/80 px-3 py-2">
                        <p className="text-[10px] uppercase tracking-[0.14em] text-[#ffcf92]">{ui.publicLobby}</p>
                        <p className="mt-1">{config.publicLobbyGameId ? `${ui.publicLobbyActive} #${config.publicLobbyGameId.toString()}` : ui.publicLobbyInactive}</p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        className={`rounded-full border px-4 py-2 text-[11px] font-black uppercase tracking-[0.12em] transition ${
                          isPlayable
                            ? 'border-[#c89f58] bg-gradient-to-b from-[#fff0a6] to-[#d89925] text-[#5a3110] shadow-[inset_0_2px_0_rgba(255,250,216,0.8),0_8px_16px_rgba(60,31,10,0.25)] hover:-translate-y-0.5'
                            : 'cursor-not-allowed border-[#8e7559] bg-[#c5ab88] text-[#6b5744] opacity-80'
                        }`}
                        disabled={!isPlayable}
                        onClick={() => chooseConfig(config.config_id)}
                        type="button"
                      >
                        {ui.useConfig}
                      </button>
                      <button
                        className={`rounded-full border px-4 py-2 text-[11px] font-black uppercase tracking-[0.12em] transition ${
                          isPlayable
                            ? 'border-[#94b56c] bg-gradient-to-b from-[#eef9d5] to-[#8fbe4f] text-[#294416] shadow-[inset_0_2px_0_rgba(255,255,255,0.6),0_8px_16px_rgba(28,45,15,0.22)] hover:-translate-y-0.5'
                            : 'cursor-not-allowed border-[#7d8f69] bg-[#b8c6a4] text-[#526146] opacity-80'
                        }`}
                        disabled={!isPlayable}
                        onClick={() => openLobby('/lobby', config.config_id)}
                        type="button"
                      >
                        {ui.playPublic}
                      </button>
                      <button
                        className={`rounded-full border px-4 py-2 text-[11px] font-black uppercase tracking-[0.12em] transition ${
                          isPlayable
                            ? 'border-[#86aacd] bg-gradient-to-b from-[#edf6ff] to-[#76a8df] text-[#173354] shadow-[inset_0_2px_0_rgba(255,255,255,0.68),0_8px_16px_rgba(18,39,67,0.22)] hover:-translate-y-0.5'
                            : 'cursor-not-allowed border-[#7d93ac] bg-[#b8c7d8] text-[#4f6177] opacity-80'
                        }`}
                        disabled={!isPlayable}
                        onClick={() => openLobby('/lobby-friends', config.config_id)}
                        type="button"
                      >
                        {ui.playPrivate}
                      </button>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
