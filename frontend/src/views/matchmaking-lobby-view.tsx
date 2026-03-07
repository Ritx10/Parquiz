import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GameAvatar } from '../components/game/game-avatar'
import { getPlayerVisualTheme } from '../lib/player-color-themes'
import { getPlayerSkinSrc } from '../lib/player-skins'
import { useControllerWallet } from '../lib/starknet/use-controller-wallet'
import { useAppSettingsStore } from '../store/app-settings-store'

type MatchmakingStatus = 'connecting' | 'searching' | 'found'

type MatchmakingParticipant = {
  id: string
  name: string
  avatar: string
  role: 'you' | 'player'
}

const statusFlow: MatchmakingStatus[] = ['connecting', 'searching', 'found']

const statusLabel: Record<MatchmakingStatus, string> = {
  connecting: 'Conectando...',
  searching: 'Buscando jugadores...',
  found: 'Rival encontrado',
}

const rivalPool = [
  { id: 'rival-1', name: 'AventuraFox', avatar: '🦊' },
  { id: 'rival-2', name: 'SaberNova', avatar: '🧠' },
  { id: 'rival-3', name: 'TurboPanda', avatar: '🐼' },
  { id: 'rival-4', name: 'RayoStar', avatar: '⭐' },
] as const

export function MatchmakingLobbyView() {
  const navigate = useNavigate()
  const selectedSkinId = useAppSettingsStore((state) => state.selectedSkinId)
  const selectedTokenSkinId = useAppSettingsStore((state) => state.selectedTokenSkinId)
  const { username } = useControllerWallet()
  const selectedTokenTheme = getPlayerVisualTheme(selectedTokenSkinId)
  const localPlayer = useMemo<MatchmakingParticipant>(
    () => ({
      id: 'you-player',
      name: username || 'PARQUIZ_PLAYER_77',
      avatar: getPlayerSkinSrc(selectedSkinId) || 'TU',
      role: 'you',
    }),
    [selectedSkinId, username],
  )
  const [status, setStatus] = useState<MatchmakingStatus>('connecting')
  const [countdown, setCountdown] = useState<number | null>(null)
  const [matchedPlayers, setMatchedPlayers] = useState<MatchmakingParticipant[]>([localPlayer])

  const selectedOpponents = rivalPool.slice(0, 3)

  const statusStep = statusFlow.indexOf(status)

  useEffect(() => {
    const connectingTimer = window.setTimeout(() => {
      setStatus('searching')
      setMatchedPlayers([localPlayer, { ...selectedOpponents[0], role: 'player' }])
    }, 850)

    const foundTimer = window.setTimeout(() => {
      setStatus('found')
      setMatchedPlayers([
        localPlayer,
        { ...selectedOpponents[0], role: 'player' },
        { ...selectedOpponents[1], role: 'player' },
        { ...selectedOpponents[2], role: 'player' },
      ])
      setCountdown(3)
    }, 3000)

    return () => {
      window.clearTimeout(connectingTimer)
      window.clearTimeout(foundTimer)
    }
  }, [selectedOpponents])

  useEffect(() => {
    if (countdown === null) {
      return
    }

    if (countdown <= 0) {
      navigate('/board-mock', { replace: true })
      return
    }

    const timer = window.setTimeout(() => {
      setCountdown((current) => {
        if (current === null) {
          return current
        }

        return current - 1
      })
    }, 1000)

    return () => {
      window.clearTimeout(timer)
    }
  }, [countdown, navigate])

  const onCancel = () => {
    navigate('/', { replace: true })
  }

  return (
    <section
      className="relative isolate min-h-screen overflow-hidden px-4 pb-8 pt-6 sm:px-6"
      style={{
        backgroundImage: "url('/home-background.jpg')",
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover',
      }}
    >
      <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(34,18,9,0.24)_0%,rgba(24,12,7,0.36)_48%,rgba(17,9,6,0.5)_100%)]" />

      <div className="relative z-10 mx-auto max-w-5xl space-y-5">
        <header className="mx-auto w-fit rounded-[20px] border-[3px] border-[#8f562f] bg-gradient-to-b from-[#b77445] via-[#915731] to-[#6d4327] px-7 py-2 shadow-[inset_0_1px_0_rgba(255,225,189,0.66),0_5px_0_rgba(102,58,29,0.88)] sm:px-10">
          <h1 className="font-display text-4xl uppercase tracking-wide text-[#ffeac2] sm:text-5xl">
            Lobby Online
          </h1>
        </header>

        <article className="rounded-[30px] border-[4px] border-[#7a4727] bg-gradient-to-b from-[#f4e4c5] via-[#f0dfbd] to-[#e6cfa8] p-4 shadow-[0_20px_36px_rgba(31,18,7,0.48)] sm:p-6">
          <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-4">
              <p className="font-display text-4xl uppercase tracking-wide text-[#4f2f19] sm:text-5xl">
                {status === 'found' ? '!Jugadores encontrados!' : 'Buscando jugadores...'}
              </p>

              <div className="rounded-[22px] border-2 border-[#ae7b4f] bg-[#fdf3df] p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  {Array.from({ length: 4 }).map((_, index) => {
                    const player = matchedPlayers[index]

                    return (
                      <article
                        className="rounded-[16px] border border-[#d6b388] bg-gradient-to-b from-[#fff8e8] to-[#f3dfbb] p-3 text-center"
                        key={`match-slot-${index}`}
                      >
                        {player ? (
                          <>
                            <span
                              className={`inline-flex h-24 w-24 items-center justify-center rounded-full border-2 text-[40px] shadow-[0_4px_8px_rgba(18,18,18,0.2)] ${
                                player.role === 'you'
                                  ? `border-[#7e4e29] bg-gradient-to-b ${selectedTokenTheme.avatarToneClass} text-white`
                                  : 'border-[#2f74aa] bg-gradient-to-b from-[#8dd7ff] to-[#3d9fe1] text-white'
                              }`}
                            >
                              <GameAvatar
                                alt={player.name}
                                avatar={player.avatar}
                                imageClassName="h-full w-full object-contain p-2"
                                textClassName="text-[40px]"
                              />
                            </span>
                            <p className="mt-2 text-lg font-black uppercase tracking-wide text-[#5a3417]">
                              {player.name}
                            </p>
                          </>
                        ) : (
                          <>
                            <span className="inline-flex h-24 w-24 items-center justify-center rounded-full border-2 border-dashed border-[#c4a57d] bg-[#f2dfbf] text-[46px] text-[#8f6a3f]">
                              ?
                            </span>
                            <p className="mt-2 text-lg font-black uppercase tracking-wide text-[#8b5a2f]">
                              Esperando
                            </p>
                          </>
                        )}
                      </article>
                    )
                  })}
                </div>
              </div>

              {status === 'found' && countdown !== null ? (
                <div className="rounded-xl border border-[#2f7a20] bg-gradient-to-b from-[#e0f8d5] to-[#c8eaa8] px-4 py-3 text-center text-lg font-black uppercase tracking-wide text-[#1f4f10]">
                  Entrando a partida en {countdown}...
                </div>
              ) : (
                <div className="rounded-xl border border-[#ac7b52] bg-[#fff2dd] px-4 py-3 text-center text-lg font-bold text-[#5a3417]">
                  Lobby mock 4/4 para probar la experiencia visual y de espera.
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="rounded-[20px] border-2 border-[#aa7446] bg-[#f8edd9] p-3">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#825432]">
                  Estado de matchmaking
                </p>

                <ul className="mt-2 space-y-2">
                  {statusFlow.map((key, index) => {
                    const reached = statusStep >= index
                    const active = status === key

                    return (
                      <li
                        className={`flex items-center gap-3 rounded-xl border px-3 py-2 text-sm font-black uppercase tracking-wide ${
                          reached
                            ? 'border-[#3d8f2b] bg-[#e4f7d7] text-[#215410]'
                            : 'border-[#c9ab7f] bg-[#f7e7cb] text-[#825432]'
                        }`}
                        key={key}
                      >
                        <span
                          className={`inline-flex h-6 w-6 items-center justify-center rounded-full border text-xs ${
                            reached
                              ? 'border-[#2f7a20] bg-gradient-to-b from-[#8de75f] to-[#50b327] text-[#1d4a0f]'
                              : 'border-[#b69062] bg-[#f2dfbe] text-[#855432]'
                          }`}
                        >
                          {reached ? '✓' : index + 1}
                        </span>
                        <span>{statusLabel[key]}</span>
                        {active && status !== 'found' ? (
                          <span className="ml-auto flex items-center gap-1">
                            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#2f7a20] [animation-delay:0ms]" />
                            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#2f7a20] [animation-delay:140ms]" />
                            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#2f7a20] [animation-delay:280ms]" />
                          </span>
                        ) : null}
                      </li>
                    )
                  })}
                </ul>
              </div>

              <div className="rounded-[20px] border-2 border-[#aa7446] bg-[#f8edd9] p-4">
                {status === 'found' ? (
                  <div className="rounded-xl border border-[#3d8f2b] bg-[#e4f7d7] px-3 py-3 text-center text-lg font-black uppercase text-[#20520f]">
                    4 jugadores confirmados
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-3">
                    <span className="inline-flex h-16 w-16 animate-spin rounded-full border-4 border-[#bb9166] border-t-[#3c8de0]" />
                  </div>
                )}
              </div>

              <button
                className="w-full rounded-full border-[3px] border-[#8f4b3c] bg-gradient-to-b from-[#dfd8ce] to-[#9ea3ab] px-6 py-3 font-display text-3xl uppercase tracking-wide text-[#323844] shadow-[inset_0_1px_0_rgba(255,255,255,0.78),0_6px_0_rgba(78,84,94,0.88)]"
                onClick={onCancel}
                type="button"
              >
                Cancelar busqueda
              </button>
            </div>
          </div>
        </article>
      </div>
    </section>
  )
}
