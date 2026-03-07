import { useAccount } from '@starknet-react/core'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { computeLegalMoves, rollTwoDiceAndDrawQuestion } from '../api'
import {
  readDojoGameSnapshot,
  readEgsTokenGameLink,
  subscribeDojoGame,
  type DojoGameSnapshot,
} from '../api/dojo-state'
import type { DojoTrackedEvent, LegalMoveApi, MoveType } from '../api/types'
import { Board3D } from '../components/game/board3d'
import { GameAvatar } from '../components/game/game-avatar'
import { LogDrawer } from '../components/game/log-drawer'
import type { MatchLogEvent, MatchPlayer, MatchToken, PlayerColor } from '../components/game/match-types'
import { isDojoConfigured } from '../config/dojo'
import { getPlayerSkinSrc } from '../lib/player-skins'
import { shortenAddress, useControllerWallet } from '../lib/starknet/use-controller-wallet'
import { useAppSettingsStore } from '../store/app-settings-store'

const TRACK_SQUARE_UI_OFFSET = 4
const TRACK_LENGTH = 68
const BOARD_DEFAULT_SAFE_TRACK_REFS = [12, 17, 29, 34, 46, 51, 63, 68]

type DiceFaceValue = 1 | 2 | 3 | 4 | 5 | 6

const seatColorMap: Record<number, PlayerColor> = {
  0: 'blue',
  1: 'red',
  2: 'green',
  3: 'yellow',
}

const hudAccentClass: Record<PlayerColor, string> = {
  green: 'bg-[#2bc58d] text-[#0b3d2d]',
  red: 'bg-[#ff6d5e] text-[#4a1008]',
  blue: 'bg-[#4a9bff] text-[#0d3058]',
  yellow: 'bg-[#f4cc4e] text-[#4a3404]',
}

const dicePipLayout: Record<DiceFaceValue, Array<{ left: string; top: string }>> = {
  1: [{ left: '50%', top: '50%' }],
  2: [
    { left: '28%', top: '28%' },
    { left: '72%', top: '72%' },
  ],
  3: [
    { left: '28%', top: '28%' },
    { left: '50%', top: '50%' },
    { left: '72%', top: '72%' },
  ],
  4: [
    { left: '28%', top: '28%' },
    { left: '72%', top: '28%' },
    { left: '28%', top: '72%' },
    { left: '72%', top: '72%' },
  ],
  5: [
    { left: '28%', top: '28%' },
    { left: '72%', top: '28%' },
    { left: '50%', top: '50%' },
    { left: '28%', top: '72%' },
    { left: '72%', top: '72%' },
  ],
  6: [
    { left: '28%', top: '24%' },
    { left: '72%', top: '24%' },
    { left: '28%', top: '50%' },
    { left: '72%', top: '50%' },
    { left: '28%', top: '76%' },
    { left: '72%', top: '76%' },
  ],
}

const laneBaseByColor: Record<PlayerColor, number> = {
  green: 100,
  red: 200,
  blue: 300,
  yellow: 400,
}

const moveTypeLabel: Record<MoveType, string> = {
  0: 'DIE_A',
  1: 'DIE_B',
  2: 'SUM',
  3: 'BONUS_10',
  4: 'BONUS_20',
  5: 'EXIT_HOME',
}

const parseBigNumberish = (value: string): bigint | null => {
  const normalized = value.trim()

  if (normalized.length === 0) {
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

const normalizeAddressForCompare = (value: null | string | undefined) => {
  if (!value) {
    return '0x0'
  }

  const trimmed = value.trim()

  if (!trimmed) {
    return '0x0'
  }

  if (trimmed.startsWith('0x') || trimmed.startsWith('0X')) {
    try {
      return `0x${BigInt(trimmed).toString(16)}`
    } catch {
      return trimmed.toLowerCase()
    }
  }

  if (/^\d+$/.test(trimmed)) {
    return `0x${BigInt(trimmed).toString(16)}`
  }

  return trimmed.toLowerCase()
}

const nextId = (prefix: string) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10_000)}`

const mapTrackSquareRefToUi = (trackSquareRef: number) => {
  if (trackSquareRef <= 0 || trackSquareRef > TRACK_LENGTH) {
    return 0
  }

  const zeroBased = trackSquareRef - 1
  const shifted = (zeroBased + TRACK_SQUARE_UI_OFFSET) % TRACK_LENGTH
  return shifted + 1
}

const mapSquareRefToUiPosition = (squareRef: number, colorBySeat: Record<number, PlayerColor>) => {
  if (squareRef >= 1 && squareRef <= TRACK_LENGTH) {
    return mapTrackSquareRefToUi(squareRef)
  }

  if (squareRef >= 1000 && squareRef < 2000) {
    const relative = squareRef - 1000
    const seat = Math.floor(relative / 32)
    const homeLanePos = relative % 32
    const color = colorBySeat[seat]

    if (!color || homeLanePos < 0 || homeLanePos > 6) {
      return 0
    }

    return laneBaseByColor[color] + homeLanePos + 1
  }

  if (squareRef >= 9000 && squareRef <= 9003) {
    const seat = squareRef - 9000
    const color = colorBySeat[seat]

    if (!color) {
      return 0
    }

    return laneBaseByColor[color] + 8
  }

  return 0
}

const mapErrorToUserMessage = (error: unknown) => {
  const raw = error instanceof Error ? error.message : `${error}`
  const normalized = raw.toLowerCase()

  if (normalized.includes('not_active')) {
    return 'No eres el jugador activo. Espera tu turno.'
  }

  if (normalized.includes('phase')) {
    return 'La accion no coincide con la fase actual del turno.'
  }

  if (normalized.includes('illegal_move')) {
    return 'Movimiento ilegal. Usa solo jugadas devueltas por compute_legal_moves.'
  }

  if (normalized.includes('deadline')) {
    return 'El deadline del turno aun no expiro.'
  }

  if (normalized.includes('moves_pending')) {
    return 'Aun existen movimientos legales pendientes. Debes agotarlos o usar el flujo correcto.'
  }

  if (normalized.includes('q_proof')) {
    return 'Prueba Merkle invalida para la respuesta enviada.'
  }

  if (normalized.includes('q_id') || normalized.includes('q_index')) {
    return 'La respuesta enviada no coincide con la pregunta pendiente on-chain.'
  }

  if (normalized.includes('user rejected') || normalized.includes('rejected')) {
    return 'Transaccion cancelada en wallet.'
  }

  return raw
}

const normalizeDiceFace = (value: null | number, fallback: DiceFaceValue): DiceFaceValue => {
  if (!value || value < 1 || value > 6) {
    return fallback
  }

  return value as DiceFaceValue
}

function HudDie({ value, rolling }: { value: null | number; rolling: boolean }) {
  const face = normalizeDiceFace(value, 1)

  return (
    <span
      className={`relative inline-flex h-11 w-11 items-center justify-center rounded-[11px] border border-[#aeb9ca] bg-gradient-to-b from-[#fefefe] to-[#dce6f4] shadow-[0_5px_0_rgba(53,74,107,0.45)] ${rolling ? 'animate-spin' : ''}`}
    >
      {dicePipLayout[face].map((pip, index) => (
        <span
          className="absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#1e3553]"
          key={`${face}-${index}`}
          style={{ left: pip.left, top: pip.top }}
        />
      ))}
    </span>
  )
}

function PlayerHudCard({ player, isTurn }: { player: MatchPlayer; isTurn: boolean }) {
  return (
    <article className="w-[132px] rounded-2xl border border-white/20 bg-[#082944]/78 px-3 py-2 text-center text-white shadow-[0_8px_24px_rgba(0,0,0,0.35)] backdrop-blur-sm">
      <div className={`mx-auto mb-2 h-1.5 w-full rounded-full ${hudAccentClass[player.color]}`} />
      <span className="mx-auto mb-2 inline-flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border-2 border-white/45 bg-[#fff4dc] shadow-[0_4px_10px_rgba(0,0,0,0.2)]">
        <GameAvatar
          alt={player.name}
          avatar={player.avatar}
          imageClassName="h-full w-full object-contain p-1"
          textClassName="text-sm font-black text-[#2c190d]"
        />
      </span>
      <p className="truncate font-display text-lg leading-none">{player.name}</p>

      <div className="mt-2 inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-2 py-1 text-[10px] font-black uppercase tracking-wide">
        <span className={`inline-flex h-4 w-4 items-center justify-center rounded-full ${hudAccentClass[player.color]}`}>
          D
        </span>
        {isTurn ? 'Tu turno' : 'En espera'}
      </div>

      <div className="mt-2 flex items-center justify-center gap-1.5">
        {Array.from({ length: 4 }).map((_, index) => (
          <span
            className={`h-2.5 w-2.5 rounded-full border border-white/15 ${
              index < player.tokensInGoal ? hudAccentClass[player.color] : 'bg-white/20'
            }`}
            key={`${player.id}-progress-${index}`}
          />
        ))}
      </div>
    </article>
  )
}

function TurnDiceLauncher({
  isActive,
  canRoll,
  rolling,
  dieA,
  dieB,
  preview,
  onRoll,
}: {
  isActive: boolean
  canRoll: boolean
  rolling: boolean
  dieA: null | number
  dieB: null | number
  preview: { dieA: DiceFaceValue; dieB: DiceFaceValue }
  onRoll: () => void
}) {
  const isEnabled = isActive && canRoll && !rolling

  return (
    <div className="pointer-events-none mt-2 flex flex-col items-center gap-1.5">
      <button
        className={`pointer-events-auto flex items-center gap-2 rounded-2xl border px-2 py-2 transition-all ${
          isEnabled
            ? 'border-[#7cd5ff] bg-[#0d3358]/88 shadow-[0_0_0_3px_rgba(124,213,255,0.35)] hover:-translate-y-0.5'
            : isActive
              ? 'cursor-not-allowed border-[#5e738f] bg-[#0d3358]/55 opacity-80'
              : 'cursor-not-allowed border-white/12 bg-[#0d3358]/45 opacity-60'
        } ${rolling && isActive ? 'animate-pulse' : ''}`}
        disabled={!isEnabled}
        onClick={onRoll}
        type="button"
      >
        <HudDie rolling={rolling && isActive} value={rolling && isActive ? preview.dieA : dieA} />
        <HudDie rolling={rolling && isActive} value={rolling && isActive ? preview.dieB : dieB} />
      </button>

      <span className="rounded-full border border-white/20 bg-black/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-[#dbf4ff]">
        {rolling && isActive ? 'Lanzando...' : isActive ? (canRoll ? 'Click para tirar' : 'Dados ya usados') : 'En espera'}
      </span>
    </div>
  )
}

function PlayerHudSlot({
  player,
  turnPlayerId,
  canRoll,
  rolling,
  dieA,
  dieB,
  preview,
  onRoll,
}: {
  player?: MatchPlayer
  turnPlayerId: string
  canRoll: boolean
  rolling: boolean
  dieA: null | number
  dieB: null | number
  preview: { dieA: DiceFaceValue; dieB: DiceFaceValue }
  onRoll: () => void
}) {
  if (!player) {
    return null
  }

  const isTurn = turnPlayerId === player.id

  return (
    <div className="pointer-events-none flex flex-col items-center">
      <PlayerHudCard isTurn={isTurn} player={player} />
      <TurnDiceLauncher
        canRoll={canRoll}
        dieA={dieA}
        dieB={dieB}
        isActive={isTurn}
        onRoll={onRoll}
        preview={preview}
        rolling={rolling}
      />
    </div>
  )
}

const tokenUiId = (owner: string, tokenId: number) => `${owner}-${tokenId}`

const trackEventToLog = (
  event: DojoTrackedEvent,
  addressLabel: (address: string) => string,
  colorBySeat: Record<number, PlayerColor>,
): MatchLogEvent => {
  if (event.type === 'DiceRolled') {
    return {
      id: nextId('event-roll'),
      type: 'roll',
      message: `Dice rolled: ${event.payload.dice_1} / ${event.payload.dice_2}`,
      createdAt: Date.now(),
    }
  }

  if (event.type === 'TokenMoved') {
    const fromUi = mapSquareRefToUiPosition(event.payload.from_square_ref, colorBySeat)
    const toUi = mapSquareRefToUiPosition(event.payload.to_square_ref, colorBySeat)

    return {
      id: nextId('event-move'),
      type: 'move',
      message: `${addressLabel(event.payload.player)} mueve ficha ${event.payload.token_id + 1} de ${fromUi || '-'} a ${toUi || '-'}.`,
      createdAt: Date.now(),
    }
  }

  if (event.type === 'TokenCaptured') {
    const squareUi = mapSquareRefToUiPosition(event.payload.square_ref, colorBySeat)

    return {
      id: nextId('event-capture'),
      type: 'capture',
      message: `${addressLabel(event.payload.attacker)} captura ficha ${event.payload.defender_token_id + 1} de ${addressLabel(event.payload.defender)} en ${squareUi || '-'}.`,
      createdAt: Date.now(),
    }
  }

  if (event.type === 'TokenReachedHome') {
    return {
      id: nextId('event-home'),
      type: 'home',
      message: `${addressLabel(event.payload.player)} lleva ficha ${event.payload.token_id + 1} a meta (+${event.payload.bonus_awarded}).`,
      createdAt: Date.now(),
    }
  }

  if (event.type === 'BridgeFormed' || event.type === 'BridgeBroken') {
    const squareUi = mapSquareRefToUiPosition(event.payload.square_ref, colorBySeat)

    return {
      id: nextId('event-bridge'),
      type: 'bridge',
      message: `${event.type === 'BridgeFormed' ? 'Puente formado' : 'Puente roto'} en ${squareUi || '-'} por ${addressLabel(event.payload.owner)}.`,
      createdAt: Date.now(),
    }
  }

  if (event.type === 'TurnEnded') {
    return {
      id: nextId('event-turn-end'),
      type: 'move',
      message: `Turno ${event.payload.turn_index} finalizado. Siguiente: ${addressLabel(event.payload.next_player)}.`,
      createdAt: Date.now(),
    }
  }

  return {
    id: nextId('event-win'),
    type: 'home',
    message: `Partida finalizada. Ganador: ${addressLabel(event.payload.winner)} (turno ${event.payload.turn_index}).`,
    createdAt: Date.now(),
  }
}

type UiLegalMove = LegalMoveApi & {
  id: string
  tokenUiId: string
  targetUiPosition: number
}

export function MatchOnchainView() {
  const [searchParams] = useSearchParams()
  const { account } = useAccount()
  const { address, username } = useControllerWallet()
  const selectedSkinId = useAppSettingsStore((state) => state.selectedSkinId)
  const selectedSkinSrc = getPlayerSkinSrc(selectedSkinId)

  const [gameIdInput, setGameIdInput] = useState(searchParams.get('gameId') || '')
  const [tokenIdInput, setTokenIdInput] = useState(searchParams.get('tokenId') || '')
  const [snapshot, setSnapshot] = useState<DojoGameSnapshot | null>(null)
  const [linkedTokenGameId, setLinkedTokenGameId] = useState<bigint | null>(null)
  const [, setLinkedTokenStatus] = useState<null | string>(null)
  const [, setIsResolvingTokenLink] = useState(false)
  const [, setIsLoadingSnapshot] = useState(false)
  const [, setSnapshotError] = useState<null | string>(null)
  const [legalMoves, setLegalMoves] = useState<LegalMoveApi[]>([])
  const [selectedTokenId, setSelectedTokenId] = useState<null | string>(null)
  const [isLogOpen, setIsLogOpen] = useState(false)
  const [logEvents, setLogEvents] = useState<MatchLogEvent[]>([])
  const [txPendingLabel, setTxPendingLabel] = useState<null | string>(null)
  const [, setTxHash] = useState<null | string>(null)
  const [, setActionError] = useState<null | string>(null)
  const [isAwaitingOnchainSync, setIsAwaitingOnchainSync] = useState(false)
  const [hudDiceRolling, setHudDiceRolling] = useState(false)
  const [hudDicePreview, setHudDicePreview] = useState<{ dieA: DiceFaceValue; dieB: DiceFaceValue }>({
    dieA: 1,
    dieB: 1,
  })

  const refreshDebounceRef = useRef<null | number>(null)
  const hudRollIntervalRef = useRef<null | number>(null)
  const hudRollTimeoutRef = useRef<null | number>(null)
  const playersByAddressRef = useRef<Record<string, string>>({})
  const colorBySeatRef = useRef<Record<number, PlayerColor>>(seatColorMap)

  useEffect(() => {
    setGameIdInput(searchParams.get('gameId') || '')
    setTokenIdInput(searchParams.get('tokenId') || '')
  }, [searchParams])

  const requestedGameId = useMemo(() => parseBigNumberish(gameIdInput), [gameIdInput])
  const activeTokenId = useMemo(() => parseBigNumberish(tokenIdInput), [tokenIdInput])
  const activeGameId = requestedGameId ?? linkedTokenGameId

  useEffect(() => {
    if (!isDojoConfigured || activeTokenId === null) {
      setLinkedTokenGameId(null)
      setLinkedTokenStatus(null)
      setIsResolvingTokenLink(false)
      return
    }

    let cancelled = false

    const loadTokenLink = async () => {
      setIsResolvingTokenLink(true)

      try {
        const link = await readEgsTokenGameLink(activeTokenId)

        if (cancelled) {
          return
        }

        if (!link) {
          setLinkedTokenGameId(null)
          setLinkedTokenStatus('Token sin partida vinculada todavia.')
          return
        }

        setLinkedTokenGameId(link.game_id)
        setLinkedTokenStatus(
          `Token vinculado a game_id ${link.game_id.toString()} · score ${link.score.toString()} · status ${link.lifecycle_status}`,
        )
      } catch (error) {
        if (!cancelled) {
          setLinkedTokenGameId(null)
          setLinkedTokenStatus(mapErrorToUserMessage(error))
        }
      } finally {
        if (!cancelled) {
          setIsResolvingTokenLink(false)
        }
      }
    }

    void loadTokenLink()

    return () => {
      cancelled = true
    }
  }, [activeTokenId])

  const refreshSnapshot = useCallback(async () => {
    if (!activeGameId || !isDojoConfigured) {
      setSnapshot(null)
      return
    }

    try {
      const nextSnapshot = await readDojoGameSnapshot(activeGameId)
      setSnapshot(nextSnapshot)
      setSnapshotError(null)
    } catch (error) {
      setSnapshotError(mapErrorToUserMessage(error))
    }
  }, [activeGameId])

  const scheduleSnapshotRefresh = useCallback(() => {
    if (refreshDebounceRef.current !== null) {
      window.clearTimeout(refreshDebounceRef.current)
    }

    refreshDebounceRef.current = window.setTimeout(() => {
      void refreshSnapshot()
    }, 160)
  }, [refreshSnapshot])

  const activePlayerAddress = snapshot?.turn_state?.active_player || snapshot?.game?.active_player || ''

  const normalizedWalletAddress = normalizeAddressForCompare(address)
  const normalizedActivePlayerAddress = normalizeAddressForCompare(activePlayerAddress)
  const isMyTurn = Boolean(address) && normalizedWalletAddress === normalizedActivePlayerAddress

  const players = useMemo<MatchPlayer[]>(() => {
    if (!snapshot) {
      return []
    }

    return snapshot.players.map((player) => {
      const color = seatColorMap[player.color] || seatColorMap[player.seat] || 'green'
      const normalizedPlayerAddress = normalizeAddressForCompare(player.player)
      const isSelf = normalizedPlayerAddress === normalizedWalletAddress
      const baseName = isSelf ? username || 'Tu jugador' : shortenAddress(player.player)

      return {
        id: player.player,
        name: baseName,
        color,
        avatar: isSelf && selectedSkinSrc ? selectedSkinSrc : color.slice(0, 2).toUpperCase(),
        tokensInBase: player.tokens_in_base,
        tokensInGoal: player.tokens_in_goal,
        isHost: player.is_host,
      }
    })
  }, [snapshot, normalizedWalletAddress, selectedSkinSrc, username])

  const playersByAddress = useMemo(() => {
    return players.reduce<Record<string, MatchPlayer>>((acc, player) => {
      acc[normalizeAddressForCompare(player.id)] = player
      return acc
    }, {})
  }, [players])

  const playersByColor = useMemo(() => {
    return players.reduce<Partial<Record<PlayerColor, MatchPlayer>>>((acc, player) => {
      acc[player.color] = player
      return acc
    }, {})
  }, [players])

  useEffect(() => {
    playersByAddressRef.current = Object.entries(playersByAddress).reduce<Record<string, string>>((acc, [key, value]) => {
      acc[key] = value.name
      return acc
    }, {})
  }, [playersByAddress])

  const colorBySeat = useMemo(() => {
    return snapshot?.players.reduce<Record<number, PlayerColor>>((acc, player) => {
      acc[player.seat] = seatColorMap[player.color] || seatColorMap[player.seat] || 'green'
      return acc
    }, {}) || seatColorMap
  }, [snapshot?.players])

  useEffect(() => {
    colorBySeatRef.current = colorBySeat
  }, [colorBySeat])

  const seatByAddress = useMemo(() => {
    return snapshot?.players.reduce<Record<string, number>>((acc, player) => {
      acc[normalizeAddressForCompare(player.player)] = player.seat
      return acc
    }, {}) || {}
  }, [snapshot?.players])

  const uiTokens = useMemo<MatchToken[]>(() => {
    if (!snapshot) {
      return []
    }

    return snapshot.tokens.map((token) => {
      const ownerKey = normalizeAddressForCompare(token.player)
      const seat = seatByAddress[ownerKey] ?? 0
      const color = colorBySeat[seat] || 'green'

      let position = 0

      if (token.token_state === 1) {
        position = mapTrackSquareRefToUi(token.track_pos + 1)
      } else if (token.token_state === 2) {
        position = laneBaseByColor[color] + token.home_lane_pos + 1
      } else if (token.token_state === 3) {
        position = laneBaseByColor[color] + 8
      }

      return {
        id: tokenUiId(token.player, token.token_id),
        label: `Ficha ${token.token_id + 1}`,
        ownerId: token.player,
        color,
        position,
      }
    })
  }, [snapshot, seatByAddress, colorBySeat])

  const blockedSquares = useMemo(() => {
    if (!snapshot) {
      return []
    }

    return snapshot.occupancies
      .filter((entry) => entry.has_blockade)
      .map((entry) => mapSquareRefToUiPosition(entry.square_ref, colorBySeat))
      .filter((square): square is number => square > 0)
      .filter((square, index, collection) => collection.indexOf(square) === index)
  }, [snapshot, colorBySeat])

  const safeSquares = useMemo(() => {
    const source = snapshot?.safe_track_square_refs.length
      ? snapshot.safe_track_square_refs
      : BOARD_DEFAULT_SAFE_TRACK_REFS

    return source.map((trackSquareRef) => mapTrackSquareRefToUi(trackSquareRef))
  }, [snapshot?.safe_track_square_refs])

  const playerLabelFromAddress = useCallback((playerAddress: string) => {
    if (!playerAddress) {
      return '-'
    }

    const key = normalizeAddressForCompare(playerAddress)
    return playersByAddressRef.current[key] || shortenAddress(playerAddress)
  }, [])

  const onTrackedEvent = useCallback(
    (event: DojoTrackedEvent) => {
      const nextLog = trackEventToLog(event, playerLabelFromAddress, colorBySeatRef.current)

      setLogEvents((current) => [nextLog, ...current].slice(0, 120))
    },
    [playerLabelFromAddress],
  )

  useEffect(() => {
    if (!activeGameId || !isDojoConfigured) {
      setSnapshot(null)
      setLegalMoves([])
      return
    }

    let cancelled = false
    let unsubscribe: () => void = () => {}

    const bootstrap = async () => {
      setIsLoadingSnapshot(true)
      setSnapshotError(null)

      try {
        const initialSnapshot = await readDojoGameSnapshot(activeGameId)

        if (cancelled) {
          return
        }

        setSnapshot(initialSnapshot)

        unsubscribe = await subscribeDojoGame({
          gameId: activeGameId,
          configId: initialSnapshot.game?.config_id,
          onStateMutation: scheduleSnapshotRefresh,
          onTrackedEvent,
        })
      } catch (error) {
        if (!cancelled) {
          setSnapshotError(mapErrorToUserMessage(error))
        }
      } finally {
        if (!cancelled) {
          setIsLoadingSnapshot(false)
        }
      }
    }

    void bootstrap()

    return () => {
      cancelled = true
      unsubscribe()

      if (refreshDebounceRef.current !== null) {
        window.clearTimeout(refreshDebounceRef.current)
        refreshDebounceRef.current = null
      }

      if (hudRollIntervalRef.current !== null) {
        window.clearInterval(hudRollIntervalRef.current)
        hudRollIntervalRef.current = null
      }

      if (hudRollTimeoutRef.current !== null) {
        window.clearTimeout(hudRollTimeoutRef.current)
        hudRollTimeoutRef.current = null
      }
    }
  }, [activeGameId, scheduleSnapshotRefresh, onTrackedEvent])

  useEffect(() => {
    if (!activeGameId || !snapshot || snapshot.turn_state?.phase !== 2) {
      setLegalMoves([])
      setSelectedTokenId(null)
      return
    }

    let cancelled = false

    const loadLegalMoves = async () => {
      try {
        const nextMoves = await computeLegalMoves(activeGameId)

        if (!cancelled) {
          setLegalMoves(nextMoves)
          setActionError(null)
        }
      } catch (error) {
        if (!cancelled) {
          setLegalMoves([])
          setActionError(mapErrorToUserMessage(error))
        }
      }
    }

    void loadLegalMoves()

    return () => {
      cancelled = true
    }
  }, [activeGameId, snapshot])

  const uiLegalMoves = useMemo<UiLegalMove[]>(() => {
    if (!activePlayerAddress) {
      return []
    }

    return legalMoves
      .map((move, index) => ({
        ...move,
        id: `${move.move_type}-${move.token_id}-${move.steps}-${index}`,
        tokenUiId: tokenUiId(activePlayerAddress, move.token_id),
        targetUiPosition: mapSquareRefToUiPosition(move.target_square_ref, colorBySeat),
      }))
      .filter((move) => move.targetUiPosition > 0)
  }, [legalMoves, activePlayerAddress, colorBySeat])

  const highlightedTokenIds = useMemo(
    () => Array.from(new Set(uiLegalMoves.map((move) => move.tokenUiId))),
    [uiLegalMoves],
  )

  const displayedMoves = useMemo(() => {
    if (!selectedTokenId) {
      return uiLegalMoves
    }

    return uiLegalMoves.filter((move) => move.tokenUiId === selectedTokenId)
  }, [selectedTokenId, uiLegalMoves])

  const highlightedSquares = useMemo(
    () => Array.from(new Set(displayedMoves.map((move) => move.targetUiPosition))),
    [displayedMoves],
  )

  const tokenHints = useMemo(() => {
    const byToken = uiLegalMoves.reduce<Record<string, string[]>>((acc, move) => {
      if (!acc[move.tokenUiId]) {
        acc[move.tokenUiId] = []
      }

      acc[move.tokenUiId].push(`${moveTypeLabel[move.move_type as MoveType]} -> ${move.targetUiPosition}`)
      return acc
    }, {})

    return Object.entries(byToken).reduce<Record<string, string>>((acc, [tokenId, entries]) => {
      acc[tokenId] = entries.join(' | ')
      return acc
    }, {})
  }, [uiLegalMoves])

  const movesByToken = useMemo(() => {
    return uiLegalMoves.reduce<Record<string, UiLegalMove[]>>((acc, move) => {
      if (!acc[move.tokenUiId]) {
        acc[move.tokenUiId] = []
      }

      acc[move.tokenUiId].push(move)
      return acc
    }, {})
  }, [uiLegalMoves])

  const runTransaction = useCallback(
    async (label: string, action: () => Promise<string>) => {
      if (!account || !activeGameId) {
        setActionError('Conecta Controller Wallet para ejecutar transacciones on-chain.')
        return
      }

      setActionError(null)
      setTxPendingLabel(label)
      setTxHash(null)
      setIsAwaitingOnchainSync(true)

      try {
        const submittedHash = await action()
        setTxHash(submittedHash)

        await account.waitForTransaction(submittedHash)
        await refreshSnapshot()

        if (activeTokenId !== null) {
          const link = await readEgsTokenGameLink(activeTokenId)
          setLinkedTokenGameId(link?.game_id ?? null)
          setLinkedTokenStatus(
            link
              ? `Token vinculado a game_id ${link.game_id.toString()} · score ${link.score.toString()} · status ${link.lifecycle_status}`
              : 'Token sin partida vinculada todavia.',
          )
        }
      } catch (error) {
        setActionError(mapErrorToUserMessage(error))
      } finally {
        setTxPendingLabel(null)
        setIsAwaitingOnchainSync(false)
      }
    },
    [account, activeGameId, activeTokenId, refreshSnapshot],
  )

  const onRoll = useCallback(() => {
    if (!account || !activeGameId) {
      return
    }

    void runTransaction('Roll + question (VRF)', () => rollTwoDiceAndDrawQuestion(account, activeGameId))
  }, [account, activeGameId, runTransaction])

  const canRoll = isMyTurn && snapshot?.turn_state?.phase === 0
  const canRollAction = canRoll && !hudDiceRolling && !txPendingLabel && !isAwaitingOnchainSync
  const triggerHudDiceRoll = useCallback(() => {
    if (!canRoll || hudDiceRolling) {
      return
    }

    setHudDiceRolling(true)

    if (hudRollIntervalRef.current !== null) {
      window.clearInterval(hudRollIntervalRef.current)
    }

    hudRollIntervalRef.current = window.setInterval(() => {
      setHudDicePreview({
        dieA: (Math.floor(Math.random() * 6) + 1) as DiceFaceValue,
        dieB: (Math.floor(Math.random() * 6) + 1) as DiceFaceValue,
      })
    }, 90)

    if (hudRollTimeoutRef.current !== null) {
      window.clearTimeout(hudRollTimeoutRef.current)
    }

    hudRollTimeoutRef.current = window.setTimeout(() => {
      if (hudRollIntervalRef.current !== null) {
        window.clearInterval(hudRollIntervalRef.current)
        hudRollIntervalRef.current = null
      }

      setHudDiceRolling(false)
      onRoll()
    }, 620)
  }, [canRoll, hudDiceRolling, onRoll])

  return (
    <section
      className="min-h-screen bg-cover bg-center bg-no-repeat px-3 py-4 sm:px-4 sm:py-6"
      style={{ backgroundImage: "url('/home-background.jpg')" }}
    >
      <div className="mx-auto w-full max-w-[1480px]">
        {activeGameId !== null ? (
          <article className="game-panel mx-auto bg-gradient-to-b from-[#efcd9a] via-[#e6bf86] to-[#d6a86d] p-3 xl:p-4">
            <div className="mb-3 flex items-center justify-between rounded-2xl border border-[#4e2f14] bg-gradient-to-r from-[#845223] via-[#9b632e] to-[#7b4b1e] px-3 py-2 shadow-wood">
              <p className="font-display text-xl uppercase tracking-[0.08em] text-[#fff0c7]">Board 3D on-chain</p>
              <span className="rounded-full border border-[#7a4e12] bg-gradient-to-b from-[#f8d772] to-[#e4b23a] px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#603d0b]">
                mismo HUD de /board-mock, estado real Dojo
              </span>
            </div>

            <div className="relative mx-auto max-w-[980px] pb-16 pt-16 lg:px-[150px] lg:pb-0 lg:pt-0">
              <Board3D
                blockedSquares={blockedSquares}
                highlightedSquares={highlightedSquares}
                movableTokenIds={highlightedTokenIds}
                onTokenClick={(tokenId) => {
                  if (!movesByToken[tokenId]) {
                    setSelectedTokenId(null)
                    return
                  }

                  setSelectedTokenId((current) => (current === tokenId ? null : tokenId))
                }}
                players={players}
                safeSquares={safeSquares}
                selectedTokenId={selectedTokenId}
                tokenHints={tokenHints}
                tokens={uiTokens}
              />

              <div className="pointer-events-none absolute inset-x-0 top-2 flex items-start justify-between px-2 lg:hidden">
                <PlayerHudSlot
                  canRoll={canRollAction}
                  dieA={snapshot?.dice_state?.die_a ?? null}
                  dieB={snapshot?.dice_state?.die_b ?? null}
                  onRoll={triggerHudDiceRoll}
                  player={playersByColor.green}
                  preview={hudDicePreview}
                  rolling={hudDiceRolling}
                  turnPlayerId={activePlayerAddress}
                />
                <PlayerHudSlot
                  canRoll={canRollAction}
                  dieA={snapshot?.dice_state?.die_a ?? null}
                  dieB={snapshot?.dice_state?.die_b ?? null}
                  onRoll={triggerHudDiceRoll}
                  player={playersByColor.red}
                  preview={hudDicePreview}
                  rolling={hudDiceRolling}
                  turnPlayerId={activePlayerAddress}
                />
              </div>

              <div className="pointer-events-none absolute inset-x-0 bottom-2 flex items-end justify-between px-2 lg:hidden">
                <PlayerHudSlot
                  canRoll={canRollAction}
                  dieA={snapshot?.dice_state?.die_a ?? null}
                  dieB={snapshot?.dice_state?.die_b ?? null}
                  onRoll={triggerHudDiceRoll}
                  player={playersByColor.yellow}
                  preview={hudDicePreview}
                  rolling={hudDiceRolling}
                  turnPlayerId={activePlayerAddress}
                />
                <PlayerHudSlot
                  canRoll={canRollAction}
                  dieA={snapshot?.dice_state?.die_a ?? null}
                  dieB={snapshot?.dice_state?.die_b ?? null}
                  onRoll={triggerHudDiceRoll}
                  player={playersByColor.blue}
                  preview={hudDicePreview}
                  rolling={hudDiceRolling}
                  turnPlayerId={activePlayerAddress}
                />
              </div>

              <div className="pointer-events-none absolute inset-0 hidden lg:block">
                <div className="absolute left-4 top-[17%] -translate-y-1/2">
                  <PlayerHudSlot
                    canRoll={canRollAction}
                    dieA={snapshot?.dice_state?.die_a ?? null}
                    dieB={snapshot?.dice_state?.die_b ?? null}
                    onRoll={triggerHudDiceRoll}
                    player={playersByColor.green}
                    preview={hudDicePreview}
                    rolling={hudDiceRolling}
                    turnPlayerId={activePlayerAddress}
                  />
                </div>

                <div className="absolute right-4 top-[17%] -translate-y-1/2">
                  <PlayerHudSlot
                    canRoll={canRollAction}
                    dieA={snapshot?.dice_state?.die_a ?? null}
                    dieB={snapshot?.dice_state?.die_b ?? null}
                    onRoll={triggerHudDiceRoll}
                    player={playersByColor.red}
                    preview={hudDicePreview}
                    rolling={hudDiceRolling}
                    turnPlayerId={activePlayerAddress}
                  />
                </div>

                <div className="absolute bottom-[17%] left-4 translate-y-1/2">
                  <PlayerHudSlot
                    canRoll={canRollAction}
                    dieA={snapshot?.dice_state?.die_a ?? null}
                    dieB={snapshot?.dice_state?.die_b ?? null}
                    onRoll={triggerHudDiceRoll}
                    player={playersByColor.yellow}
                    preview={hudDicePreview}
                    rolling={hudDiceRolling}
                    turnPlayerId={activePlayerAddress}
                  />
                </div>

                <div className="absolute bottom-[17%] right-4 translate-y-1/2">
                  <PlayerHudSlot
                    canRoll={canRollAction}
                    dieA={snapshot?.dice_state?.die_a ?? null}
                    dieB={snapshot?.dice_state?.die_b ?? null}
                    onRoll={triggerHudDiceRoll}
                    player={playersByColor.blue}
                    preview={hudDicePreview}
                    rolling={hudDiceRolling}
                    turnPlayerId={activePlayerAddress}
                  />
                </div>
              </div>
            </div>
          </article>
        ) : null}

        <LogDrawer events={logEvents} onClose={() => setIsLogOpen(false)} open={isLogOpen} />
      </div>
    </section>
  )
}
