import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GameAvatar } from '../components/game/game-avatar'
import { getPlayerSkinSrc } from '../lib/player-skins'
import { useAppSettingsStore } from '../store/app-settings-store'

type LobbyParticipant = {
  id: string
  name: string
  avatar: string
  isHost: boolean
}

const friendCandidates: Omit<LobbyParticipant, 'isHost'>[] = [
  { id: 'friend-a', name: 'LunaDice', avatar: '👩' },
  { id: 'friend-b', name: 'TurboFox', avatar: '🦊' },
  { id: 'friend-c', name: 'NexoStar', avatar: '⭐' },
]

const remoteHost: LobbyParticipant = {
  id: 'remote-host',
  name: 'HOST_AMIGO',
  avatar: '🧔',
  isHost: true,
}

const generateRoomCode = () => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = 'FR-'

  for (let index = 0; index < 5; index += 1) {
    const randomIndex = Math.floor(Math.random() * alphabet.length)
    code += alphabet[randomIndex]
  }

  return code
}

export function FriendsLobbyView() {
  const navigate = useNavigate()
  const selectedSkinId = useAppSettingsStore((state) => state.selectedSkinId)
  const localAvatar = getPlayerSkinSrc(selectedSkinId) || '🧑'
  const hostPlayer = useMemo<LobbyParticipant>(
    () => ({
      id: 'host-local',
      name: 'PARQUIZ_PLAYER_77',
      avatar: localAvatar,
      isHost: true,
    }),
    [localAvatar],
  )
  const localJoinedPlayer = useMemo<LobbyParticipant>(
    () => ({
      id: 'local-joined',
      name: 'PARQUIZ_PLAYER_77',
      avatar: localAvatar,
      isHost: false,
    }),
    [localAvatar],
  )
  const [createdRoomCode, setCreatedRoomCode] = useState<null | string>(null)
  const [activeRoomCode, setActiveRoomCode] = useState<null | string>(null)
  const [players, setPlayers] = useState<LobbyParticipant[]>([])
  const [isHost, setIsHost] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [statusMessage, setStatusMessage] = useState('Crea una sala privada o unete con codigo.')

  const onCreateRoom = () => {
    const code = generateRoomCode()
    setCreatedRoomCode(code)
    setActiveRoomCode(code)
    setIsHost(true)
    setPlayers([hostPlayer])
    setStatusMessage(`Sala creada. Comparte el codigo ${code} con tus amigos.`)
  }

  const onJoinRoom = () => {
    const normalized = joinCode.trim().toUpperCase()

    if (!normalized) {
      setStatusMessage('Ingresa un codigo para unirte a una sala privada.')
      return
    }

    if (!activeRoomCode) {
      setCreatedRoomCode(null)
      setActiveRoomCode(normalized)
      setIsHost(false)
      setPlayers([remoteHost, localJoinedPlayer])
      setStatusMessage(`Te uniste a la sala ${normalized}. Esperando que el host inicie.`)
      return
    }

    if (!isHost || normalized !== activeRoomCode) {
      setStatusMessage(`Ya estas en la sala ${activeRoomCode}.`)
      return
    }

    if (players.length >= 4) {
      setStatusMessage('La sala ya esta completa (4/4).')
      return
    }

    let joinedFriendName = ''

    setPlayers((current) => {
      const existingGuests = current.filter((player) => !player.isHost).length
      const friendSlot = Math.min(existingGuests, friendCandidates.length - 1)
      const nextFriend = friendCandidates[friendSlot]

      joinedFriendName = nextFriend.name

      return [
        ...current,
        {
          id: `${nextFriend.id}-${current.length}`,
          name: nextFriend.name,
          avatar: nextFriend.avatar,
          isHost: false,
        },
      ]
    })
    setStatusMessage(`${joinedFriendName} se unio a la sala ${activeRoomCode}.`)
  }

  const onStartMatch = () => {
    navigate('/board-mock', { replace: true })
  }

  const onBackHome = () => {
    navigate('/', { replace: true })
  }

  const canStart = isHost && players.length >= 2

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
      <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(34,18,9,0.24)_0%,rgba(24,12,7,0.32)_46%,rgba(17,9,6,0.48)_100%)]" />

      <div className="relative z-10 mx-auto max-w-5xl space-y-4">
        <div className="mx-auto w-fit rounded-[22px] border-[3px] border-[#8f562f] bg-gradient-to-b from-[#b77445] via-[#915731] to-[#6d4327] px-7 py-2 shadow-[inset_0_1px_0_rgba(255,225,189,0.66),0_5px_0_rgba(102,58,29,0.88)] sm:px-10">
          <h2 className="font-display text-4xl uppercase tracking-wide text-[#ffeac2] sm:text-5xl">
            Lobby privado con amigos
          </h2>
        </div>

        <article className="rounded-[30px] border-[4px] border-[#7a4727] bg-gradient-to-b from-[#f4e4c5] via-[#f0dfbd] to-[#e6cfa8] p-4 shadow-[0_20px_36px_rgba(31,18,7,0.48)] sm:p-5">
          <div className="grid gap-4 lg:grid-cols-2">
            <section className="rounded-[20px] border-2 border-[#aa7446] bg-[#f8edd9] p-4">
              <p className="font-display text-3xl uppercase tracking-wide text-[#4f2f19]">Crear sala</p>
              <p className="mt-2 text-base font-semibold text-[#6f4527]">
                Crea una sala privada y comparte el codigo con tus amigos.
              </p>

              <button
                className="mt-4 w-full rounded-full border border-[#2a6719] bg-gradient-to-b from-[#73df58] to-[#3f9f22] px-4 py-2 font-display text-3xl uppercase tracking-wide text-white shadow-[inset_0_2px_0_rgba(210,255,195,0.8),0_6px_0_rgba(38,95,22,0.9)]"
                onClick={onCreateRoom}
                type="button"
              >
                Crear sala
              </button>

              {createdRoomCode ? (
                <div className="mt-4 rounded-xl border border-[#c89f77] bg-[#f6e2ca] p-3 text-center">
                  <p className="text-base font-black uppercase tracking-wide text-[#8b5a2f]">Codigo de partida</p>
                  <p className="mt-1 rounded-lg border border-[#c9a06a] bg-[#fff6df] px-3 py-2 font-display text-3xl tracking-[0.2em] text-[#674026]">
                    {createdRoomCode}
                  </p>
                </div>
              ) : null}
            </section>

            <section className="rounded-[20px] border-2 border-[#aa7446] bg-[#f8edd9] p-4">
              <p className="font-display text-3xl uppercase tracking-wide text-[#4f2f19]">Unirse a sala</p>
              <p className="mt-2 text-base font-semibold text-[#6f4527]">
                Escribe el codigo que te compartieron para entrar.
              </p>

              <input
                className="mt-4 w-full rounded-xl border-2 border-[#bf9263] bg-[#fff7ea] px-4 py-2 text-center font-display text-3xl uppercase tracking-[0.2em] text-[#674026] outline-none"
                onChange={(event) => setJoinCode(event.target.value)}
                placeholder="FR-XXXXX"
                value={joinCode}
              />

              <button
                className="mt-4 w-full rounded-full border border-[#2a6719] bg-gradient-to-b from-[#73df58] to-[#3f9f22] px-4 py-2 font-display text-3xl uppercase tracking-wide text-white shadow-[inset_0_2px_0_rgba(210,255,195,0.8),0_6px_0_rgba(38,95,22,0.9)]"
                onClick={onJoinRoom}
                type="button"
              >
                Unirme
              </button>
            </section>
          </div>

          {activeRoomCode ? (
            <section className="mt-4 rounded-[20px] border-2 border-[#aa7446] bg-[#f8edd9] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-display text-3xl uppercase tracking-wide text-[#4f2f19]">Jugadores en sala</p>
                <p className="rounded-full border border-[#c89f77] bg-[#f6e2ca] px-3 py-1 text-sm font-black uppercase tracking-wide text-[#8b5a2f]">
                  {activeRoomCode}
                </p>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => {
                  const player = players[index]

                  return (
                    <article
                      className={`rounded-xl border p-3 text-center ${
                        player
                          ? 'border-[#c89f77] bg-[#fff3dd]'
                          : 'border-dashed border-[#c9a77b] bg-[#f7e7cb]/80'
                      }`}
                      key={`slot-${index}`}
                    >
                      {player ? (
                        <>
                          <span className="inline-flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#8e5b32] bg-gradient-to-b from-[#fff2dc] to-[#efcda0] text-3xl shadow-[0_3px_8px_rgba(37,22,10,0.2)]">
                            <GameAvatar
                              alt={player.name}
                              avatar={player.avatar}
                              imageClassName="h-full w-full object-contain p-1"
                              textClassName="text-3xl"
                            />
                          </span>
                          <p className="mt-2 text-sm font-black uppercase tracking-wide text-[#5a3417]">
                            {player.name}
                          </p>
                          {player.isHost ? (
                            <span className="mt-1 inline-flex rounded-full border border-[#9a6a2e] bg-gradient-to-b from-[#ffd98d] to-[#e8b75d] px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-[#5a3511]">
                              Host
                            </span>
                          ) : null}
                        </>
                      ) : (
                        <>
                          <span className="inline-flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#c5a376] border-dashed bg-[#f4dfbc] text-2xl text-[#936a43]">
                            +
                          </span>
                          <p className="mt-2 text-xs font-black uppercase tracking-wide text-[#8b5a2f]">
                            Esperando jugador...
                          </p>
                        </>
                      )}
                    </article>
                  )
                })}
              </div>

              {canStart ? (
                <div className="mt-4 flex justify-center">
                  <button
                    className="w-full max-w-[380px] rounded-full border border-[#2a6719] bg-gradient-to-b from-[#73df58] to-[#3f9f22] px-4 py-2 font-display text-3xl uppercase tracking-wide text-white shadow-[inset_0_2px_0_rgba(210,255,195,0.8),0_6px_0_rgba(38,95,22,0.9)]"
                    onClick={onStartMatch}
                    type="button"
                  >
                    JUGAR
                  </button>
                </div>
              ) : null}
            </section>
          ) : null}

          <div className="mt-4 rounded-xl border border-[#9b6d43] bg-[#fff2dd] px-4 py-3 text-center text-lg font-bold text-[#5a3417]">
            {statusMessage}
          </div>

          <div className="mt-4 flex justify-center">
            <button
              className="rounded-full border-[3px] border-[#8f4b3c] bg-gradient-to-b from-[#dfd8ce] to-[#9ea3ab] px-8 py-2 font-display text-3xl uppercase tracking-wide text-[#323844] shadow-[inset_0_1px_0_rgba(255,255,255,0.78),0_6px_0_rgba(78,84,94,0.88)]"
              onClick={onBackHome}
              type="button"
            >
              Volver al inicio
            </button>
          </div>
        </article>
      </div>
    </section>
  )
}
