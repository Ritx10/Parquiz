import { useAccount } from '@starknet-react/core'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { hash } from 'starknet'
import {
  createLobby,
  createGameConfig,
  joinLobbyByCode,
  joinPublicMatchmaking,
  leaveLobby,
  lockGameConfig,
  readDojoGameSnapshot,
  setReady,
  startGame,
  type DojoGameSnapshot,
} from '../api'
import { appEnv } from '../config/env'
import { shortenAddress, useControllerWallet } from '../lib/starknet/use-controller-wallet'

const gameStatusLabel: Record<number, string> = {
  0: 'WAITING',
  1: 'IN_PROGRESS',
  2: 'FINISHED',
  3: 'CANCELLED',
}

const parseBigNumberish = (value: string): bigint | null => {
  const normalized = value.trim()

  if (!normalized) {
    return null
  }

  if (!/^0x[0-9a-f]+$/i.test(normalized) && !/^\d+$/.test(normalized)) {
    return null
  }

  try {
    return BigInt(normalized)
  } catch {
    return null
  }
}

const mapErrorToUserMessage = (error: unknown): string => {
  if (error instanceof Error && error.message.trim()) {
    return error.message
  }

  if (typeof error === 'string' && error.trim()) {
    return error
  }

  return 'Unknown Starknet error.'
}

export function DevBootstrapView() {
  const { account } = useAccount()
  const { address, chainId, isConnected, connectController, disconnectController, isPending, username } = useControllerWallet()

  const [configIdInput, setConfigIdInput] = useState('')
  const [gameIdInput, setGameIdInput] = useState('')
  const [privateLobbyCode, setPrivateLobbyCode] = useState('dev-room-1')
  const [snapshot, setSnapshot] = useState<DojoGameSnapshot | null>(null)
  const [txPendingLabel, setTxPendingLabel] = useState<null | string>(null)
  const [txHash, setTxHash] = useState<null | string>(null)
  const [statusMessage, setStatusMessage] = useState<null | string>(null)
  const [isLoadingState, setIsLoadingState] = useState(false)

  const configId = useMemo(() => parseBigNumberish(configIdInput), [configIdInput])
  const gameId = useMemo(() => parseBigNumberish(gameIdInput), [gameIdInput])
  const privateLobbyCodeHash = useMemo(() => {
    const normalized = privateLobbyCode.trim()

    if (!normalized) {
      return null
    }

    return hash.starknetKeccak(normalized)
  }, [privateLobbyCode])

  const refreshState = useCallback(async () => {
    setIsLoadingState(true)

    try {
      const nextSnapshot = gameId
        ? await readDojoGameSnapshot(gameId, {
            includeBoardSquares: true,
            includePlayerCustomizations: true,
          })
        : null
      setSnapshot(nextSnapshot)
    } catch (error) {
      setStatusMessage(mapErrorToUserMessage(error))
    } finally {
      setIsLoadingState(false)
    }
  }, [gameId])

  useEffect(() => {
    void refreshState()
  }, [refreshState])

  const runTransaction = useCallback(
    async (label: string, action: () => Promise<string>, afterSuccess?: () => Promise<void>) => {
      if (!account) {
        setStatusMessage('Connect Controller first.')
        return
      }

      setStatusMessage(null)
      setTxPendingLabel(label)
      setTxHash(null)

      try {
        const submittedHash = await action()
        setTxHash(submittedHash)

        await account.waitForTransaction(submittedHash)

        if (afterSuccess) {
          await afterSuccess()
        }

        await refreshState()
      } catch (error) {
        setStatusMessage(mapErrorToUserMessage(error))
      } finally {
        setTxPendingLabel(null)
      }
    },
    [account, refreshState],
  )

  const onCreateDefaultConfig = useCallback(() => {
    void runTransaction(
      'Create config',
        () =>
        createGameConfig(account!, {
          answerTimeLimitSecs: 30,
          turnTimeLimitSecs: 45,
          exitHomeRule: 0,
          difficultyLevel: 1,
        }),
      async () => {
        setStatusMessage(
          'Config created. If this local world only had katana0 config 1 before, your first Controller config is likely 2. Confirm with `sozo model get ... parquiz-GlobalState 1` if needed, then lock it.',
        )
      },
    )
  }, [account, runTransaction])

  const onLockConfig = useCallback(() => {
    if (configId === null) {
      setStatusMessage('Enter a valid config id.')
      return
    }

    void runTransaction('Lock config', () => lockGameConfig(account!, configId))
  }, [account, configId, runTransaction])

  const onJoinPublic = useCallback(() => {
    if (configId === null) {
      setStatusMessage('Enter a valid config id.')
      return
    }

    void runTransaction(
      'Join public matchmaking',
      () => joinPublicMatchmaking(account!, configId),
      async () => {
        setStatusMessage(
          gameId
            ? `Joined public matchmaking. If game_id ${gameId.toString()} is the active lobby, press Ready now.`
            : 'Joined public matchmaking. If you need the game id, inspect `parquiz-PublicLobbyIndex` for this config from CLI, then enter it here and press Ready.',
        )
      },
    )
  }, [account, configId, gameId, runTransaction])

  const onCreatePrivateLobby = useCallback(() => {
    if (configId === null || !privateLobbyCodeHash) {
      setStatusMessage('Enter a valid config id and private lobby code.')
      return
    }

    void runTransaction(
      'Create private lobby',
      () => createLobby(account!, privateLobbyCodeHash, configId),
      async () => {
        setStatusMessage(
          'Private lobby created. If you need the game id, inspect `parquiz-LobbyCodeIndex` with the code hash from this page, then enter it here and wait for player two.',
        )
      },
    )
  }, [account, configId, privateLobbyCodeHash, runTransaction])

  const onJoinPrivateLobby = useCallback(() => {
    if (!privateLobbyCodeHash) {
      setStatusMessage('Enter a private lobby code first.')
      return
    }

    void runTransaction(
      'Join private lobby',
      () => joinLobbyByCode(account!, privateLobbyCodeHash),
      async () => {
        setStatusMessage(
          'Joined private lobby. Enter the known game id here, then both players press Ready and the host presses Start private.',
        )
      },
    )
  }, [account, privateLobbyCodeHash, runTransaction])

  const onSetReady = useCallback(
    (ready: boolean) => {
      if (gameId === null) {
        setStatusMessage('Enter a valid game id.')
        return
      }

      void runTransaction(ready ? 'Set ready' : 'Unset ready', () => setReady(account!, gameId, ready))
    },
    [account, gameId, runTransaction],
  )

  const onLeaveLobby = useCallback(() => {
    if (gameId === null) {
      setStatusMessage('Enter a valid game id.')
      return
    }

    void runTransaction('Leave lobby', () => leaveLobby(account!, gameId))
  }, [account, gameId, runTransaction])

  const onStartPrivateGame = useCallback(() => {
    if (gameId === null) {
      setStatusMessage('Enter a valid game id.')
      return
    }

    void runTransaction('Start private game', () => startGame(account!, gameId))
  }, [account, gameId, runTransaction])

  const players = snapshot?.players || []

  return (
    <section className="min-h-screen bg-[radial-gradient(circle_at_top,#244e82_0%,#10233f_45%,#08111f_100%)] px-4 py-6 text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-4">
        <header className="rounded-3xl border border-white/15 bg-white/10 p-5 shadow-2xl backdrop-blur">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-[#9fd7ff]">Local Dev Tools</p>
          <h1 className="mt-2 text-3xl font-black uppercase tracking-wide">Bootstrap Lobby</h1>
          <p className="mt-2 max-w-3xl text-sm text-[#d9ebff]">
            Use this temporary screen to create or join a real on-chain lobby with Controller, set ready,
            and jump into `/board` once the public game starts.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link className="rounded-full border border-white/25 px-4 py-2 text-sm font-bold" to="/board">
              Open board
            </Link>
            <Link className="rounded-full border border-white/25 px-4 py-2 text-sm font-bold" to="/">
              Home
            </Link>
          </div>
        </header>

        <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
          <article className="rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#9fd7ff]">Controller</p>
            <div className="mt-3 space-y-2 text-sm font-semibold text-[#d9ebff]">
              <p>Status: {isConnected && address ? 'Connected' : isPending ? 'Connecting...' : 'Disconnected'}</p>
              <p>Username: {username || '-'}</p>
              <p>Address: {address ? shortenAddress(address) : '-'}</p>
              <p>Selected game: {gameId ? gameId.toString() : '-'}</p>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                className="rounded-full bg-[#88df76] px-4 py-2 text-sm font-black uppercase text-[#17350f] disabled:opacity-50"
                disabled={isConnected || isPending}
                onClick={connectController}
                type="button"
              >
                Connect Controller
              </button>
              <button
                className="rounded-full bg-[#d8dee8] px-4 py-2 text-sm font-black uppercase text-[#263244] disabled:opacity-50"
                disabled={!isConnected}
                onClick={disconnectController}
                type="button"
              >
                Disconnect
              </button>
              <button
                className="rounded-full border border-white/25 px-4 py-2 text-sm font-black uppercase disabled:opacity-50"
                disabled={!isConnected}
                onClick={() => void refreshState()}
                type="button"
              >
                Refresh state
              </button>
            </div>
          </article>

          <article className="rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#9fd7ff]">Quick Start</p>
            <ol className="mt-3 space-y-2 text-sm font-semibold text-[#d9ebff]">
              <li>1. Connect Controller in browser A.</li>
              <li>2. Use config `1` if you already created and locked it via CLI.</li>
              <li>3. Press `Join public` in browser A.</li>
              <li>4. Open an incognito/browser B and repeat `Join public` with another Controller.</li>
              <li>5. Press `Ready` in both sessions. Public matchmaking auto-starts.</li>
              <li>6. Open `/board?gameId=&lt;id&gt;` from the button below.</li>
            </ol>
          </article>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#9fd7ff]">Config</p>
            <label className="mt-3 block text-xs font-black uppercase tracking-[0.18em] text-[#d9ebff]">
              Config ID
              <input
                className="mt-2 w-full rounded-2xl border border-white/20 bg-[#091729] px-3 py-2 text-sm font-bold text-white"
                onChange={(event) => setConfigIdInput(event.target.value)}
                value={configIdInput}
              />
            </label>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                className="rounded-full bg-[#ffe08a] px-4 py-2 text-sm font-black uppercase text-[#4f3900] disabled:opacity-50"
                disabled={!isConnected || Boolean(txPendingLabel)}
                onClick={onCreateDefaultConfig}
                type="button"
              >
                Create default config
              </button>
              <button
                className="rounded-full bg-[#7ec8ff] px-4 py-2 text-sm font-black uppercase text-[#053458] disabled:opacity-50"
                disabled={!isConnected || configId === null || Boolean(txPendingLabel)}
                onClick={onLockConfig}
                type="button"
              >
                Lock config
              </button>
            </div>
          </article>

          <article className="rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#9fd7ff]">Lobby</p>
            <label className="mt-3 block text-xs font-black uppercase tracking-[0.18em] text-[#d9ebff]">
              Game ID
              <input
                className="mt-2 w-full rounded-2xl border border-white/20 bg-[#091729] px-3 py-2 text-sm font-bold text-white"
                onChange={(event) => setGameIdInput(event.target.value)}
                value={gameIdInput}
              />
            </label>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                className="rounded-full bg-[#8ce1a3] px-4 py-2 text-sm font-black uppercase text-[#0d4424] disabled:opacity-50"
                disabled={!isConnected || configId === null || Boolean(txPendingLabel)}
                onClick={onJoinPublic}
                type="button"
              >
                Join public
              </button>
              <button
                className="rounded-full bg-[#b79dff] px-4 py-2 text-sm font-black uppercase text-[#271650] disabled:opacity-50"
                disabled={!isConnected || configId === null || !privateLobbyCodeHash || Boolean(txPendingLabel)}
                onClick={onCreatePrivateLobby}
                type="button"
              >
                Create private
              </button>
              <button
                className="rounded-full bg-[#c7b6ff] px-4 py-2 text-sm font-black uppercase text-[#2f1f55] disabled:opacity-50"
                disabled={!isConnected || !privateLobbyCodeHash || Boolean(txPendingLabel)}
                onClick={onJoinPrivateLobby}
                type="button"
              >
                Join private
              </button>
              <button
                className="rounded-full bg-[#d2f08b] px-4 py-2 text-sm font-black uppercase text-[#334700] disabled:opacity-50"
                disabled={!isConnected || gameId === null || Boolean(txPendingLabel)}
                onClick={() => onSetReady(true)}
                type="button"
              >
                Ready
              </button>
              <button
                className="rounded-full bg-[#f3d387] px-4 py-2 text-sm font-black uppercase text-[#503700] disabled:opacity-50"
                disabled={!isConnected || gameId === null || Boolean(txPendingLabel)}
                onClick={() => onSetReady(false)}
                type="button"
              >
                Unready
              </button>
              <button
                className="rounded-full bg-[#ffe08a] px-4 py-2 text-sm font-black uppercase text-[#4f3900] disabled:opacity-50"
                disabled={!isConnected || gameId === null || Boolean(txPendingLabel)}
                onClick={onStartPrivateGame}
                type="button"
              >
                Start private
              </button>
              <button
                className="rounded-full bg-[#e3b0b0] px-4 py-2 text-sm font-black uppercase text-[#581f1f] disabled:opacity-50"
                disabled={!isConnected || gameId === null || Boolean(txPendingLabel)}
                onClick={onLeaveLobby}
                type="button"
              >
                Leave
              </button>
            </div>

            <label className="mt-4 block text-xs font-black uppercase tracking-[0.18em] text-[#d9ebff]">
              Private lobby code
              <input
                className="mt-2 w-full rounded-2xl border border-white/20 bg-[#091729] px-3 py-2 text-sm font-bold text-white"
                onChange={(event) => setPrivateLobbyCode(event.target.value)}
                value={privateLobbyCode}
              />
            </label>

            <p className="mt-2 rounded-2xl border border-white/10 bg-[#091729] px-3 py-2 text-xs font-bold text-[#d9ebff]">
              code hash: {privateLobbyCodeHash ? privateLobbyCodeHash.toString() : '-'}
            </p>

            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                className={`rounded-full border border-white/25 px-4 py-2 text-sm font-black uppercase ${gameId === null ? 'pointer-events-none opacity-50' : ''}`}
                to={gameId === null ? '/dev/bootstrap' : `/board?gameId=${gameId.toString()}`}
              >
                Open board for game
              </Link>
            </div>
          </article>
        </div>

        {txPendingLabel ? (
          <p className="rounded-2xl border border-[#7ec8ff]/50 bg-[#0b2036] px-4 py-3 text-sm font-bold text-[#b9e4ff]">
            Pending: {txPendingLabel}
            {txHash ? ` · ${txHash}` : ''}
          </p>
        ) : null}

        {statusMessage ? (
          <p className="rounded-2xl border border-[#ffbfbf]/30 bg-[#371919] px-4 py-3 text-sm font-bold text-[#ffd9d9]">
            {statusMessage}
          </p>
        ) : null}

        <article className="rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#9fd7ff]">Live Lobby State</p>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#d9ebff]">
              {isLoadingState ? 'Loading...' : 'Ready'}
            </p>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-[#091729] p-3">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#9fd7ff]">Game</p>
              <p className="mt-2 text-lg font-black">{snapshot?.game?.game_id.toString() || gameIdInput || '-'}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#091729] p-3">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#9fd7ff]">Status</p>
              <p className="mt-2 text-lg font-black">{gameStatusLabel[snapshot?.game?.status || 0] || '-'}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#091729] p-3">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#9fd7ff]">Players</p>
              <p className="mt-2 text-lg font-black">{snapshot?.game?.player_count || 0}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#091729] p-3">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#9fd7ff]">Active Player</p>
              <p className="mt-2 text-sm font-black">{snapshot?.game?.active_player ? shortenAddress(snapshot.game.active_player) : '-'}</p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {players.length > 0 ? (
              players.map((player) => (
                <article className="rounded-2xl border border-white/10 bg-[#091729] p-4" key={`${player.game_id}-${player.player}`}>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[#9fd7ff]">Seat {player.seat}</p>
                  <p className="mt-2 text-sm font-black text-white">{shortenAddress(player.player)}</p>
                  <p className="mt-2 text-xs font-bold uppercase text-[#d9ebff]">
                    Host: {player.is_host ? 'yes' : 'no'}
                  </p>
                  <p className="mt-1 text-xs font-bold uppercase text-[#d9ebff]">
                    Ready: {player.is_ready ? 'yes' : 'no'}
                  </p>
                  <p className="mt-1 text-xs font-bold uppercase text-[#d9ebff]">
                    Coins: {player.coins.toString()}
                  </p>
                </article>
              ))
            ) : (
              <p className="rounded-2xl border border-white/10 bg-[#091729] p-4 text-sm font-bold text-[#d9ebff] md:col-span-2 xl:col-span-4">
                No player rows loaded yet. Join a public lobby first, then refresh.
              </p>
            )}
          </div>
        </article>

        <article className="rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-[#9fd7ff]">Debug</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-[#091729] p-3">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#9fd7ff]">Network</p>
              <p className="mt-2 text-sm font-black">{appEnv.defaultNetwork}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#091729] p-3">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#9fd7ff]">Active RPC</p>
              <p className="mt-2 break-all text-xs font-bold">{appEnv.activeRpcUrl}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#091729] p-3">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#9fd7ff]">Wallet Chain ID</p>
              <p className="mt-2 break-all text-xs font-bold">{chainId ? `0x${chainId.toString(16)}` : '-'}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#091729] p-3">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#9fd7ff]">Controller Default</p>
              <p className="mt-2 break-all text-xs font-bold">{appEnv.controllerDefaultChainId}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#091729] p-3">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#9fd7ff]">World</p>
              <p className="mt-2 break-all text-xs font-bold">{appEnv.dojoWorldAddress || '-'}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#091729] p-3">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#9fd7ff]">Lobby System</p>
              <p className="mt-2 break-all text-xs font-bold">{appEnv.lobbySystemAddress || '-'}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#091729] p-3">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#9fd7ff]">Config System</p>
              <p className="mt-2 break-all text-xs font-bold">{appEnv.configSystemAddress || '-'}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#091729] p-3">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#9fd7ff]">Turn System</p>
              <p className="mt-2 break-all text-xs font-bold">{appEnv.turnSystemAddress || '-'}</p>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-[#091729] p-4 text-xs font-bold text-[#d9ebff]">
            <p className="font-black uppercase tracking-[0.18em] text-[#9fd7ff]">Useful CLI checks</p>
            <div className="mt-3 space-y-2 break-all">
              <p>{`sozo model get --rpc-url http://127.0.0.1:5050 --world ${appEnv.dojoWorldAddress} parquiz-GlobalState 1`}</p>
              <p>{`sozo model get --rpc-url http://127.0.0.1:5050 --world ${appEnv.dojoWorldAddress} parquiz-PublicLobbyIndex <config_id>`}</p>
              <p>{`sozo model get --rpc-url http://127.0.0.1:5050 --world ${appEnv.dojoWorldAddress} parquiz-LobbyCodeIndex ${privateLobbyCodeHash ? privateLobbyCodeHash.toString() : '<code_hash>'}`}</p>
            </div>
          </div>
        </article>
      </div>
    </section>
  )
}
