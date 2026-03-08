import { useAccount } from '@starknet-react/core'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createLobby, joinLobbyByCode, leaveLobby, readDojoGameSnapshot, readLatestGameIdByPlayer, setReady, startGame, subscribeDojoGame, type DojoGameSnapshot } from '../api'
import { GameAvatar } from '../components/game/game-avatar'
import { appEnv } from '../config/env'
import { getPlayerVisualTheme } from '../lib/player-color-themes'
import { getPlayerSkinSrc, playerSkinIdFromIndex } from '../lib/player-skins'
import { tokenSkinIdFromIndex } from '../lib/token-cosmetics'
import { hashLobbyCode, mapStarknetErrorToMessage, normalizeAddressForCompare, parseBigNumberish, waitForPrivateLobbyGameId } from '../lib/onchain-lobby'
import { useControllerUsernames } from '../lib/starknet/use-controller-usernames'
import { shortenAddress, useControllerWallet } from '../lib/starknet/use-controller-wallet'
import { useAppSettingsStore } from '../store/app-settings-store'

type LobbySeatCard = {
  id: string
  name: string
  avatar: string
  avatarToneClass: string
  isHost: boolean
  isReady: boolean
  isSelf: boolean
}

const generateRoomCode = () => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = 'PQ-'

  for (let index = 0; index < 5; index += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)]
  }

  return code
}

const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms))

const gameStatusLabel: Record<number, string> = {
  0: 'WAITING',
  1: 'IN_PROGRESS',
  2: 'FINISHED',
  3: 'CANCELLED',
}

export function FriendsLobbyView() {
  const navigate = useNavigate()
  const { account } = useAccount()
  const { address, isConnected, username } = useControllerWallet()
  const selectedSkinId = useAppSettingsStore((state) => state.selectedSkinId)
  const selectedTokenSkinId = useAppSettingsStore((state) => state.selectedTokenSkinId)
  const selectedConfigId = useAppSettingsStore((state) => state.selectedConfigId)
  const setSelectedConfigId = useAppSettingsStore((state) => state.setSelectedConfigId)
  const selectedSkinSrc = getPlayerSkinSrc(selectedSkinId)

  const [configIdInput, setConfigIdInput] = useState(selectedConfigId)
  const [joinCode, setJoinCode] = useState('')
  const [activeRoomCode, setActiveRoomCode] = useState<null | string>(null)
  const [activeGameId, setActiveGameId] = useState<bigint | null>(null)
  const [snapshot, setSnapshot] = useState<DojoGameSnapshot | null>(null)
  const [statusMessage, setStatusMessage] = useState('Crea una sala privada o unete con codigo para jugar on-chain.')
  const [txPendingLabel, setTxPendingLabel] = useState<null | string>(null)
  const [isResolvingLobby, setIsResolvingLobby] = useState(false)
  const refreshDebounceRef = useRef<null | number>(null)

  useEffect(() => {
    setConfigIdInput(selectedConfigId)
  }, [selectedConfigId])

  const configId = useMemo(() => parseBigNumberish(configIdInput), [configIdInput])
  const normalizedWalletAddress = normalizeAddressForCompare(address)
  const normalizedRoomCode = useMemo(() => joinCode.trim().toUpperCase(), [joinCode])
  const roomCodeHash = useMemo(() => hashLobbyCode(normalizedRoomCode), [normalizedRoomCode])

  const refreshSnapshot = useCallback(async (gameId: bigint) => {
    try {
      const nextSnapshot = await readDojoGameSnapshot(gameId, { includePlayerCustomizations: true })
      setSnapshot(nextSnapshot)
      return nextSnapshot
    } catch (error) {
      setStatusMessage(mapStarknetErrorToMessage(error))
      throw error
    }
  }, [])

  const scheduleSnapshotRefresh = useCallback(
    (gameId: bigint) => {
      if (refreshDebounceRef.current !== null) {
        window.clearTimeout(refreshDebounceRef.current)
      }

      refreshDebounceRef.current = window.setTimeout(() => {
        refreshDebounceRef.current = null
        void refreshSnapshot(gameId).catch(() => undefined)
      }, 180)
    },
    [refreshSnapshot],
  )

  useEffect(() => {
    return () => {
      if (refreshDebounceRef.current !== null) {
        window.clearTimeout(refreshDebounceRef.current)
      }
    }
  }, [])

  const refreshSnapshotUntil = useCallback(
    async (gameId: bigint, predicate: (snapshot: DojoGameSnapshot) => boolean, attempts = 8, delayMs = 1200) => {
      let latestSnapshot: DojoGameSnapshot | null = null

      for (let attempt = 0; attempt < attempts; attempt += 1) {
        latestSnapshot = await refreshSnapshot(gameId)

        if (predicate(latestSnapshot)) {
          return latestSnapshot
        }

        if (attempt < attempts - 1) {
          await wait(delayMs)
        }
      }

      return latestSnapshot
    },
    [refreshSnapshot],
  )

  useEffect(() => {
    if (!address) {
      setActiveGameId(null)
      setSnapshot(null)
      return
    }

    let cancelled = false

    const restoreLobby = async () => {
      try {
        const latestGameId = await readLatestGameIdByPlayer(address)
        if (!latestGameId || cancelled) {
          return
        }

        const nextSnapshot = await readDojoGameSnapshot(latestGameId, { includePlayerCustomizations: true })
        if (cancelled || !nextSnapshot.game) {
          return
        }

        if (nextSnapshot.game.lobby_kind !== 0) {
          return
        }

        setActiveGameId(latestGameId)
        setSnapshot(nextSnapshot)
      } catch {
        // noop
      }
    }

    void restoreLobby()

    return () => {
      cancelled = true
    }
  }, [address])

  useEffect(() => {
    if (!activeGameId) {
      return
    }

    let cancelled = false
    let unsubscribe: (() => void) | undefined

    const startSubscription = async () => {
      try {
        unsubscribe = await subscribeDojoGame({
          gameId: activeGameId,
          configId: snapshot?.game?.config_id,
          onStateMutation: () => {
            scheduleSnapshotRefresh(activeGameId)
          },
          onTrackedEvent: () => undefined,
        })
      } catch {
        if (!cancelled) {
          setStatusMessage('No se pudo suscribir al lobby en tiempo real. Haz una accion para refrescar el estado.')
        }
      }
    }

    void startSubscription()

    return () => {
      cancelled = true
      unsubscribe?.()
    }
  }, [activeGameId, scheduleSnapshotRefresh, snapshot?.game?.config_id])

  useEffect(() => {
    if (!activeGameId) {
      return
    }

    const intervalId = window.setInterval(() => {
      if (document.visibilityState !== 'visible') {
        return
      }

      scheduleSnapshotRefresh(activeGameId)
    }, 5000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [activeGameId, scheduleSnapshotRefresh])

  useEffect(() => {
    if (snapshot?.game?.status === 1 && activeGameId) {
      navigate(`/board?gameId=${activeGameId.toString()}`, { replace: true })
    }
  }, [activeGameId, navigate, snapshot?.game?.status])

  const runTransaction = useCallback(
    async (label: string, action: () => Promise<string>, onSuccess?: () => Promise<void>) => {
      if (!account) {
        setStatusMessage('Conecta Controller Wallet primero.')
        return
      }

      setTxPendingLabel(label)
      setStatusMessage(`${label}...`)

      try {
        const txHash = await action()
        await account.waitForTransaction(txHash)
        await onSuccess?.()
      } catch (error) {
        setStatusMessage(mapStarknetErrorToMessage(error))
      } finally {
        setTxPendingLabel(null)
        setIsResolvingLobby(false)
      }
    },
    [account],
  )

  const onCreateRoom = useCallback(() => {
    if (!configId) {
      setStatusMessage('Ingresa un config id valido antes de crear la sala.')
      return
    }

    if (!address) {
      setStatusMessage('Conecta Controller Wallet antes de crear la sala.')
      return
    }

    const nextCode = generateRoomCode()
    const nextCodeHash = hashLobbyCode(nextCode)
    if (!nextCodeHash) {
      setStatusMessage('No se pudo generar un codigo de sala valido.')
      return
    }

    setSelectedConfigId(configId.toString())
    setActiveRoomCode(nextCode)
    setJoinCode(nextCode)
    setIsResolvingLobby(true)

    void runTransaction('Creando sala privada', () => createLobby(account!, nextCodeHash, configId), async () => {
      const resolvedGameId = await waitForPrivateLobbyGameId(nextCodeHash, address)
      if (!resolvedGameId) {
        setStatusMessage('La sala se creo, pero Torii aun no refleja el game_id. Espera un poco y reabre el lobby.')
        return
      }

      setActiveGameId(resolvedGameId)
      const nextSnapshot = await refreshSnapshot(resolvedGameId)
      setStatusMessage(`Sala ${nextCode} creada. game_id ${resolvedGameId.toString()} · jugadores ${nextSnapshot.players.length}/4.`)
    })
  }, [account, address, configId, refreshSnapshot, runTransaction, setSelectedConfigId])

  const onJoinRoom = useCallback(() => {
    if (!roomCodeHash || !normalizedRoomCode) {
      setStatusMessage('Ingresa un codigo valido para unirte.')
      return
    }

    if (!address) {
      setStatusMessage('Conecta Controller Wallet antes de unirte.')
      return
    }

    setActiveRoomCode(normalizedRoomCode)
    setIsResolvingLobby(true)

    void runTransaction('Uniendose a sala privada', () => joinLobbyByCode(account!, roomCodeHash), async () => {
      const resolvedGameId = await waitForPrivateLobbyGameId(roomCodeHash, address)
      if (!resolvedGameId) {
        setStatusMessage('La transaccion salio bien, pero Torii aun no refleja la sala. Espera unos segundos.')
        return
      }

      setActiveGameId(resolvedGameId)
      const nextSnapshot = await refreshSnapshot(resolvedGameId)
      setStatusMessage(`Te uniste a ${normalizedRoomCode}. game_id ${resolvedGameId.toString()} · jugadores ${nextSnapshot.players.length}/4.`)
    })
  }, [account, address, normalizedRoomCode, refreshSnapshot, roomCodeHash, runTransaction])

  const myPlayer = useMemo(
    () => snapshot?.players.find((player) => normalizeAddressForCompare(player.player) === normalizedWalletAddress) ?? null,
    [normalizedWalletAddress, snapshot?.players],
  )

  const { getUsername } = useControllerUsernames({
    addresses: (snapshot?.players ?? []).map((player) => player.player),
    selfAddress: address,
    selfUsername: username,
  })

  const lobbySeats = useMemo<LobbySeatCard[]>(() => {
    const players = snapshot?.players ?? []
    const customizationByPlayer = new Map(
      (snapshot?.player_customizations ?? []).map((customization) => [
        normalizeAddressForCompare(customization.player),
        customization,
      ]),
    )

    return players.map((player) => {
      const isSelf = normalizeAddressForCompare(player.player) === normalizedWalletAddress
      const resolvedName = getUsername(player.player)
      const customization = customizationByPlayer.get(normalizeAddressForCompare(player.player))
      const avatarSkinId = customization ? playerSkinIdFromIndex(customization.avatar_skin_id) : null
      const tokenSkinId = customization ? tokenSkinIdFromIndex(customization.token_skin_id) : selectedTokenSkinId

      return {
        id: `${player.game_id.toString()}-${player.player}`,
        name: resolvedName || (isSelf ? username || 'Tu jugador' : shortenAddress(player.player)),
        avatar:
          isSelf && selectedSkinSrc
            ? selectedSkinSrc
            : getPlayerSkinSrc(avatarSkinId) || shortenAddress(player.player).slice(2, 4).toUpperCase(),
        avatarToneClass: getPlayerVisualTheme(tokenSkinId).avatarToneClass,
        isHost: player.is_host,
        isReady: player.is_ready,
        isSelf,
      }
    })
  }, [getUsername, normalizedWalletAddress, selectedSkinSrc, selectedTokenSkinId, snapshot?.player_customizations, snapshot?.players, username])

  const onToggleReady = useCallback(() => {
    if (!myPlayer || !activeGameId) {
      return
    }

    const nextReadyValue = !myPlayer.is_ready

    setSnapshot((current) => {
      if (!current) {
        return current
      }

      return {
        ...current,
        players: current.players.map((player) =>
          normalizeAddressForCompare(player.player) === normalizedWalletAddress
            ? { ...player, is_ready: nextReadyValue }
            : player,
        ),
      }
    })

    void runTransaction(myPlayer.is_ready ? 'Quitando ready' : 'Marcando ready', () => setReady(account!, activeGameId, nextReadyValue), async () => {
      const nextSnapshot = await refreshSnapshotUntil(
        activeGameId,
        (candidate) => {
          if (candidate.game?.status === 1) {
            return true
          }

          const nextPlayer = candidate.players.find(
            (player) => normalizeAddressForCompare(player.player) === normalizedWalletAddress,
          )

          return nextPlayer?.is_ready === nextReadyValue
        },
      )

      if (!nextSnapshot) {
        setStatusMessage('La transaccion salio bien, pero Torii aun no refleja el ready. Espera unos segundos.')
        return
      }

      const readyPlayers = nextSnapshot.players.filter((player) => player.is_ready).length
      setStatusMessage(`Ready actualizado. ${readyPlayers}/${nextSnapshot.players.length} jugadores listos.`)
    })
  }, [account, activeGameId, myPlayer, normalizedWalletAddress, refreshSnapshotUntil, runTransaction])

  const onStartMatch = useCallback(() => {
    if (!activeGameId) {
      return
    }

    void runTransaction('Iniciando partida', () => startGame(account!, activeGameId), async () => {
      setStatusMessage('Partida iniciada. Entrando al tablero on-chain...')
      await refreshSnapshot(activeGameId)
    })
  }, [account, activeGameId, refreshSnapshot, runTransaction])

  const onLeaveLobby = useCallback(() => {
    if (!activeGameId) {
      navigate('/', { replace: true })
      return
    }

    void runTransaction('Saliendo del lobby', () => leaveLobby(account!, activeGameId), async () => {
      setActiveGameId(null)
      setSnapshot(null)
      setActiveRoomCode(null)
      setStatusMessage('Saliste del lobby privado.')
    })
  }, [account, activeGameId, navigate, runTransaction])

  const readyCount = snapshot?.players.filter((player) => player.is_ready).length ?? 0
  const canStart = Boolean(myPlayer?.is_host) && (snapshot?.players.length ?? 0) >= 2
  const readyButtonLabel =
    txPendingLabel === 'Marcando ready'
      ? 'ENVIANDO...'
      : txPendingLabel === 'Quitando ready'
        ? 'ACTUALIZANDO...'
        : myPlayer?.is_ready
          ? 'QUITAR READY'
          : 'READY'

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
          <h2 className="font-display text-4xl uppercase tracking-wide text-[#ffeac2] sm:text-5xl">Lobby privado con amigos</h2>
        </div>

        <article className="rounded-[30px] border-[4px] border-[#7a4727] bg-gradient-to-b from-[#f4e4c5] via-[#f0dfbd] to-[#e6cfa8] p-4 shadow-[0_20px_36px_rgba(31,18,7,0.48)] sm:p-5">
          <div className="grid gap-4 lg:grid-cols-2">
            <section className="rounded-[20px] border-2 border-[#aa7446] bg-[#f8edd9] p-4">
              <p className="font-display text-3xl uppercase tracking-wide text-[#4f2f19]">Crear sala</p>
              <p className="mt-2 text-base font-semibold text-[#6f4527]">Crea una sala privada on-chain y comparte el codigo con tus amigos.</p>

              <label className="mt-4 block text-xs font-black uppercase tracking-[0.18em] text-[#825432]" htmlFor="private-config-id">
                Config id
              </label>
              <input
                className="mt-2 w-full rounded-xl border-2 border-[#bf9263] bg-[#fff7ea] px-4 py-2 text-center font-display text-3xl text-[#674026] outline-none"
                id="private-config-id"
                inputMode="numeric"
                onChange={(event) => setConfigIdInput(event.target.value)}
                placeholder="1"
                value={configIdInput}
              />

              <button
                className="mt-4 w-full rounded-full border border-[#2a6719] bg-gradient-to-b from-[#73df58] to-[#3f9f22] px-4 py-2 font-display text-3xl uppercase tracking-wide text-white shadow-[inset_0_2px_0_rgba(210,255,195,0.8),0_6px_0_rgba(38,95,22,0.9)] disabled:cursor-not-allowed disabled:opacity-60"
                disabled={!isConnected || Boolean(txPendingLabel) || !configId}
                onClick={onCreateRoom}
                type="button"
              >
                {txPendingLabel === 'Creando sala privada' ? 'CREANDO...' : 'CREAR SALA'}
              </button>

              {activeRoomCode ? (
                <div className="mt-4 rounded-xl border border-[#c89f77] bg-[#f6e2ca] p-3 text-center">
                  <p className="text-base font-black uppercase tracking-wide text-[#8b5a2f]">Codigo de partida</p>
                  <p className="mt-1 rounded-lg border border-[#c9a06a] bg-[#fff6df] px-3 py-2 font-display text-3xl tracking-[0.2em] text-[#674026]">{activeRoomCode}</p>
                </div>
              ) : null}
            </section>

            <section className="rounded-[20px] border-2 border-[#aa7446] bg-[#f8edd9] p-4">
              <p className="font-display text-3xl uppercase tracking-wide text-[#4f2f19]">Unirse a sala</p>
              <p className="mt-2 text-base font-semibold text-[#6f4527]">Escribe el codigo privado para entrar al mismo game_id on-chain.</p>

              <input
                className="mt-4 w-full rounded-xl border-2 border-[#bf9263] bg-[#fff7ea] px-4 py-2 text-center font-display text-3xl uppercase tracking-[0.2em] text-[#674026] outline-none"
                onChange={(event) => setJoinCode(event.target.value)}
                placeholder="PQ-XXXXX"
                value={joinCode}
              />

              <button
                className="mt-4 w-full rounded-full border border-[#2a6719] bg-gradient-to-b from-[#73df58] to-[#3f9f22] px-4 py-2 font-display text-3xl uppercase tracking-wide text-white shadow-[inset_0_2px_0_rgba(210,255,195,0.8),0_6px_0_rgba(38,95,22,0.9)] disabled:cursor-not-allowed disabled:opacity-60"
                disabled={!isConnected || Boolean(txPendingLabel) || !roomCodeHash}
                onClick={onJoinRoom}
                type="button"
              >
                {txPendingLabel === 'Uniendose a sala privada' ? 'UNIENDOSE...' : 'UNIRME'}
              </button>
            </section>
          </div>

          {activeGameId ? (
            <section className="mt-4 rounded-[20px] border-2 border-[#aa7446] bg-[#f8edd9] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-display text-3xl uppercase tracking-wide text-[#4f2f19]">Jugadores en sala</p>
                <div className="flex flex-wrap gap-2">
                  {activeRoomCode ? (
                    <p className="rounded-full border border-[#c89f77] bg-[#f6e2ca] px-3 py-1 text-sm font-black uppercase tracking-wide text-[#8b5a2f]">
                      {activeRoomCode}
                    </p>
                  ) : null}
                  <p className="rounded-full border border-[#c89f77] bg-[#f6e2ca] px-3 py-1 text-sm font-black uppercase tracking-wide text-[#8b5a2f]">
                    {gameStatusLabel[snapshot?.game?.status ?? 0] || 'WAITING'}
                  </p>
                </div>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => {
                  const player = lobbySeats[index]

                  return (
                    <article
                      className={`rounded-xl border p-3 text-center ${player ? 'border-[#c89f77] bg-[#fff3dd]' : 'border-dashed border-[#c9a77b] bg-[#f7e7cb]/80'}`}
                      key={`slot-${index}`}
                    >
                      {player ? (
                        <>
                          <span className={`inline-flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border-2 border-[#8e5b32] shadow-[0_3px_8px_rgba(37,22,10,0.2)] bg-gradient-to-b ${player.avatarToneClass}`}>
                            <GameAvatar
                              alt={player.name}
                              avatar={player.avatar}
                              imageClassName="h-full w-full object-contain p-1"
                              textClassName="text-xl font-black text-[#40210f]"
                            />
                          </span>
                          <p className="mt-2 text-sm font-black uppercase tracking-wide text-[#5a3417]">{player.name}</p>
                          <div className="mt-1 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-wide">
                            {player.isHost ? (
                              <span className="rounded-full border border-[#9a6a2e] bg-gradient-to-b from-[#ffd98d] to-[#e8b75d] px-2 py-0.5 text-[#5a3511]">
                                Host
                              </span>
                            ) : null}
                            <span className={`rounded-full border px-2 py-0.5 ${player.isReady ? 'border-[#2f7a20] bg-[#dff4d0] text-[#20520f]' : 'border-[#c89f77] bg-[#f6e2ca] text-[#8b5a2f]'}`}>
                              {player.isReady ? 'Ready' : 'Waiting'}
                            </span>
                          </div>
                        </>
                      ) : (
                        <>
                          <span className="inline-flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#c5a376] border-dashed bg-[#f4dfbc] text-2xl text-[#936a43]">+</span>
                          <p className="mt-2 text-xs font-black uppercase tracking-wide text-[#8b5a2f]">Esperando jugador...</p>
                        </>
                      )}
                    </article>
                  )
                })}
              </div>

              <div className="mt-4 flex flex-wrap justify-center gap-3">
                {myPlayer ? (
                  <button
                    className="rounded-full border border-[#2a6719] bg-gradient-to-b from-[#73df58] to-[#3f9f22] px-6 py-2 font-display text-2xl uppercase tracking-wide text-white shadow-[inset_0_2px_0_rgba(210,255,195,0.8),0_6px_0_rgba(38,95,22,0.9)] disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={Boolean(txPendingLabel)}
                    onClick={onToggleReady}
                    type="button"
                  >
                    {readyButtonLabel}
                  </button>
                ) : null}

                {canStart ? (
                  <button
                    className="rounded-full border border-[#2a6719] bg-gradient-to-b from-[#73df58] to-[#3f9f22] px-6 py-2 font-display text-2xl uppercase tracking-wide text-white shadow-[inset_0_2px_0_rgba(210,255,195,0.8),0_6px_0_rgba(38,95,22,0.9)] disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={Boolean(txPendingLabel)}
                    onClick={onStartMatch}
                    type="button"
                  >
                    INICIAR
                  </button>
                ) : null}
              </div>
            </section>
          ) : null}

          <div className="mt-4 rounded-xl border border-[#9b6d43] bg-[#fff2dd] px-4 py-3 text-center text-lg font-bold text-[#5a3417]">
            {statusMessage || (isResolvingLobby ? 'Esperando indexacion de Torii...' : 'Lobby privado sincronizado.')}
            <div className="mt-1 text-sm uppercase tracking-wide text-[#8b5a2f]">Network {appEnv.defaultNetwork}</div>
            {snapshot?.players.length ? <div className="mt-1 text-sm">Ready {readyCount}/{snapshot.players.length}</div> : null}
          </div>

          <div className="mt-4 flex justify-center">
            <button
              className="rounded-full border-[3px] border-[#8f4b3c] bg-gradient-to-b from-[#dfd8ce] to-[#9ea3ab] px-8 py-2 font-display text-3xl uppercase tracking-wide text-[#323844] shadow-[inset_0_1px_0_rgba(255,255,255,0.78),0_6px_0_rgba(78,84,94,0.88)]"
              onClick={onLeaveLobby}
              type="button"
            >
              {activeGameId ? 'Salir del lobby' : 'Volver al inicio'}
            </button>
          </div>
        </article>
      </div>
    </section>
  )
}
