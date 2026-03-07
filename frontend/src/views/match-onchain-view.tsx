import { useAccount } from '@starknet-react/core'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  applyMove,
  bindEgsToken,
  computeLegalMoves,
  endTurn,
  forceSkipTurn,
  rollTwoDiceAndDrawQuestion,
  skipShop,
  submitAnswer,
} from '../api'
import {
  readDojoGameSnapshot,
  readEgsTokenGameLink,
  readQuestionSet,
  subscribeDojoGame,
  type DojoGameSnapshot,
} from '../api/dojo-state'
import type { DojoTrackedEvent, LegalMoveApi, MoveType } from '../api/types'
import { Board3D } from '../components/game/board3d'
import { LogDrawer } from '../components/game/log-drawer'
import type { MatchLogEvent, MatchPlayer, MatchToken, PlayerColor } from '../components/game/match-types'
import { isDojoConfigured } from '../config/dojo'
import { appEnv } from '../config/env'
<<<<<<< HEAD
import { getPlayerSkinSrc } from '../lib/player-skins'
import {
  getHydratedQuestion,
  LOCAL_QUESTION_SET_COUNT,
  LOCAL_QUESTION_SET_ID,
  LOCAL_QUESTION_SET_ROOT,
} from '../lib/questions/local-question-bank'
import { shortenAddress, useControllerWallet } from '../lib/starknet/use-controller-wallet'
import { useAppSettingsStore } from '../store/app-settings-store'

const TRACK_SQUARE_UI_OFFSET = 4
const TRACK_LENGTH = 68
const BOARD_DEFAULT_SAFE_TRACK_REFS = [12, 17, 29, 34, 46, 51, 63, 68]

const seatColorMap: Record<number, PlayerColor> = {
  0: 'blue',
  1: 'red',
  2: 'green',
  3: 'yellow',
}

const laneBaseByColor: Record<PlayerColor, number> = {
  green: 100,
  red: 200,
  blue: 300,
  yellow: 400,
}

const phaseLabel: Record<number, string> = {
  0: 'ROLL_AND_QUESTION',
  1: 'ANSWER_PENDING',
  2: 'MOVE_PENDING',
  3: 'SHOP_PENDING',
  4: 'TURN_ENDED',
}

const gameStatusLabel: Record<number, string> = {
  0: 'WAITING',
  1: 'IN_PROGRESS',
  2: 'FINISHED',
  3: 'CANCELLED',
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

const buildBonusText = (bonus10: number, bonus20: number) => {
  const parts: string[] = []

  if (bonus10 > 0) {
    parts.push(`10 x ${bonus10}`)
  }

  if (bonus20 > 0) {
    parts.push(`20 x ${bonus20}`)
  }

  return parts.length > 0 ? parts.join(' + ') : 'sin bonus'
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
  const [searchParams, setSearchParams] = useSearchParams()
  const { account } = useAccount()
  const { address, isConnected, username } = useControllerWallet()
  const selectedSkinId = useAppSettingsStore((state) => state.selectedSkinId)
  const selectedSkinSrc = getPlayerSkinSrc(selectedSkinId)

  const [gameIdInput, setGameIdInput] = useState(searchParams.get('gameId') || '')
  const [tokenIdInput, setTokenIdInput] = useState(searchParams.get('tokenId') || '')
  const [snapshot, setSnapshot] = useState<DojoGameSnapshot | null>(null)
  const [linkedTokenGameId, setLinkedTokenGameId] = useState<bigint | null>(null)
  const [linkedTokenStatus, setLinkedTokenStatus] = useState<null | string>(null)
  const [isResolvingTokenLink, setIsResolvingTokenLink] = useState(false)
  const [isLoadingSnapshot, setIsLoadingSnapshot] = useState(false)
  const [snapshotError, setSnapshotError] = useState<null | string>(null)
  const [legalMoves, setLegalMoves] = useState<LegalMoveApi[]>([])
  const [selectedTokenId, setSelectedTokenId] = useState<null | string>(null)
  const [isLogOpen, setIsLogOpen] = useState(false)
  const [logEvents, setLogEvents] = useState<MatchLogEvent[]>([])
  const [txPendingLabel, setTxPendingLabel] = useState<null | string>(null)
  const [txHash, setTxHash] = useState<null | string>(null)
  const [actionError, setActionError] = useState<null | string>(null)
  const [isAwaitingOnchainSync, setIsAwaitingOnchainSync] = useState(false)
  const [hydratedQuestionError, setHydratedQuestionError] = useState<null | string>(null)
  const [selectedAnswerOption, setSelectedAnswerOption] = useState<null | number>(null)

  const refreshDebounceRef = useRef<null | number>(null)
  const playersByAddressRef = useRef<Record<string, string>>({})
  const colorBySeatRef = useRef<Record<number, PlayerColor>>(seatColorMap)

  useEffect(() => {
    setGameIdInput(searchParams.get('gameId') || '')
    setTokenIdInput(searchParams.get('tokenId') || '')
  }, [searchParams])

  const requestedGameId = useMemo(() => parseBigNumberish(gameIdInput), [gameIdInput])
  const activeTokenId = useMemo(() => parseBigNumberish(tokenIdInput), [tokenIdInput])
  const activeGameId = requestedGameId ?? linkedTokenGameId

  const applySearchParams = useCallback(
    (next: { gameId?: string; tokenId?: string }) => {
      const params = new URLSearchParams()

      if (next.gameId && next.gameId.trim().length > 0) {
        params.set('gameId', next.gameId.trim())
      }

      if (next.tokenId && next.tokenId.trim().length > 0) {
        params.set('tokenId', next.tokenId.trim())
      }

      setSearchParams(params)
    },
    [setSearchParams],
  )

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

  useEffect(() => {
    if (!snapshot?.pending_question) {
      setHydratedQuestionError(null)
      setSelectedAnswerOption(null)
      return
    }

    const pendingQuestion = snapshot.pending_question
    setSelectedAnswerOption(null)

    let cancelled = false

    const hydrateQuestion = async () => {
      try {
        const questionSet = await readQuestionSet(pendingQuestion.set_id)

        if (cancelled) {
          return
        }

        if (!questionSet || !questionSet.enabled) {
          setHydratedQuestionError('QuestionSet on-chain no disponible o deshabilitado.')
          return
        }

        if (questionSet.question_count !== LOCAL_QUESTION_SET_COUNT) {
          setHydratedQuestionError(
            `QuestionSet local desalineado. Esperado count ${LOCAL_QUESTION_SET_COUNT}, on-chain ${questionSet.question_count}.`,
          )
          return
        }

        if (normalizeAddressForCompare(questionSet.merkle_root) !== normalizeAddressForCompare(LOCAL_QUESTION_SET_ROOT)) {
          setHydratedQuestionError(
            `Merkle root local desalineado. Usa ${LOCAL_QUESTION_SET_ROOT} para el set_id ${LOCAL_QUESTION_SET_ID.toString()}.`,
          )
          return
        }

        const hydrated = getHydratedQuestion(
          pendingQuestion.question_index,
          pendingQuestion.category,
          pendingQuestion.difficulty,
        )

        if (!hydrated) {
          setHydratedQuestionError(
            `No existe pregunta local para index ${pendingQuestion.question_index}, categoria ${pendingQuestion.category}, dificultad ${pendingQuestion.difficulty}.`,
          )
          return
        }

        setHydratedQuestionError(null)
      } catch (error) {
        if (!cancelled) {
          setHydratedQuestionError(mapErrorToUserMessage(error))
        }
      }
    }

    void hydrateQuestion()

    return () => {
      cancelled = true
    }
  }, [snapshot?.pending_question])

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

  const activeBonusState = useMemo(() => {
    if (!snapshot || !activePlayerAddress) {
      return null
    }

    const activePlayerKey = normalizeAddressForCompare(activePlayerAddress)

    return (
      snapshot.bonus_states.find(
        (bonusState) => normalizeAddressForCompare(bonusState.player) === activePlayerKey,
      ) || null
    )
  }, [snapshot, activePlayerAddress])

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

  const hydratedQuestion = useMemo(() => {
    if (!snapshot?.pending_question || hydratedQuestionError) {
      return null
    }

    return getHydratedQuestion(
      snapshot.pending_question.question_index,
      snapshot.pending_question.category,
      snapshot.pending_question.difficulty,
    )
  }, [hydratedQuestionError, snapshot?.pending_question])

  const activePlayerLabel = playerLabelFromAddress(activePlayerAddress)
  const winnerLabel = playerLabelFromAddress(snapshot?.game?.winner || '')

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

  const onSubmitAnswer = useCallback(() => {
    if (!account || !activeGameId || !snapshot?.turn_state || !snapshot.pending_question) {
      setActionError('No hay pregunta pendiente on-chain para responder.')
      return
    }

    if (!hydratedQuestion) {
      setActionError(hydratedQuestionError || 'No se pudo hidratar la pregunta actual.')
      return
    }

    if (selectedAnswerOption === null) {
      setActionError('Selecciona una respuesta antes de enviar la transaccion.')
      return
    }

    const turnState = snapshot.turn_state
    const pendingQuestion = snapshot.pending_question

    void runTransaction('Submit answer', () =>
      submitAnswer(account, activeGameId, {
        questionId: turnState.question_id,
        questionIndex: pendingQuestion.question_index,
        category: pendingQuestion.category,
        difficulty: pendingQuestion.difficulty,
        correctOption: hydratedQuestion.correctOption,
        selectedOption: selectedAnswerOption,
        merkleProof: hydratedQuestion.merkleProof,
        merkleDirections: hydratedQuestion.merkleDirections,
      }),
    )
  }, [
    account,
    activeGameId,
    hydratedQuestion,
    hydratedQuestionError,
    snapshot,
    selectedAnswerOption,
    runTransaction,
  ])

  const onApplyMove = useCallback(
    (move: UiLegalMove) => {
      if (!account || !activeGameId) {
        return
      }

      void runTransaction(
        `Apply move ${moveTypeLabel[move.move_type as MoveType]} (${move.steps})`,
        () =>
          applyMove(account, activeGameId, {
            moveType: move.move_type,
            tokenId: move.token_id,
            steps: move.steps,
          }),
      )
    },
    [account, activeGameId, runTransaction],
  )

  const onEndTurn = useCallback(() => {
    if (!account || !activeGameId) {
      return
    }

    void runTransaction('End turn', () => endTurn(account, activeGameId))
  }, [account, activeGameId, runTransaction])

  const onSkipShop = useCallback(() => {
    if (!account || !activeGameId) {
      return
    }

    void runTransaction('Skip shop', () => skipShop(account, activeGameId))
  }, [account, activeGameId, runTransaction])

  const onForceSkipTurn = useCallback(() => {
    if (!account || !activeGameId) {
      return
    }

    void runTransaction('Force skip turn', () => forceSkipTurn(account, activeGameId))
  }, [account, activeGameId, runTransaction])

  const onBindToken = useCallback(() => {
    if (!account || !activeGameId || activeTokenId === null) {
      setActionError('Carga un token_id y un game_id validos para vincular la entrada EGS.')
      return
    }

    void runTransaction('Bind EGS token', () => bindEgsToken(account, activeGameId, activeTokenId))
  }, [account, activeGameId, activeTokenId, runTransaction])

  const nowSecs = Math.floor(Date.now() / 1000)
  const deadline = Number(snapshot?.turn_state?.deadline || 0n)
  const deadlineExpired = deadline > 0 && nowSecs > deadline

  const canRoll = isMyTurn && snapshot?.turn_state?.phase === 0
  const canSubmitAnswer = isMyTurn && snapshot?.turn_state?.phase === 1
  const canMove = isMyTurn && snapshot?.turn_state?.phase === 2
  const canEndTurn = isMyTurn && snapshot?.turn_state?.phase === 2
  const canSkipShop = isMyTurn && snapshot?.turn_state?.phase === 3

  return (
    <section
      className="min-h-screen bg-cover bg-center bg-no-repeat px-4 py-6"
      style={{ backgroundImage: "url('/home-background.jpg')" }}
    >
      <header className="hidden game-panel overflow-hidden bg-gradient-to-r from-[#11427e] via-[#1f68b5] to-[#2e7fd4] text-white">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#9cd8ff]">Partida</p>
            <h2 className="font-display text-3xl uppercase tracking-wide text-[#ffeb9f]">Modo On-chain</h2>
            <p className="text-sm font-semibold text-[#def2ff]">
              Estado en vivo por Dojo/Torii + transacciones Starknet.
            </p>
          </div>

          <div className="grid gap-1 text-xs font-black uppercase tracking-wide text-[#d9edff]">
            <p>Network: {appEnv.defaultNetwork}</p>
            <p>Wallet: {isConnected && address ? shortenAddress(address) : 'desconectada'}</p>
            <p>Dojo namespace: {appEnv.namespace}</p>
          </div>
        </div>
      </header>

      <article className="game-panel bg-gradient-to-b from-[#fff3ce] via-[#ffe7ae] to-[#ffd57d] text-board-night">
        <div className="game-wood px-4 py-2 text-center">
          <p className="font-display text-2xl uppercase tracking-wide">Sesion on-chain</p>
        </div>

        <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto_auto]">
          <input
            className="rounded-xl border border-[#c9a85a] bg-white px-3 py-2 text-sm font-bold text-board-night"
            onChange={(event) => setGameIdInput(event.target.value)}
            placeholder="game_id (decimal o 0x...)"
            value={gameIdInput}
          />

          <input
            className="rounded-xl border border-[#c9a85a] bg-white px-3 py-2 text-sm font-bold text-board-night"
            onChange={(event) => setTokenIdInput(event.target.value)}
            placeholder="token_id EGS (decimal o 0x...)"
            value={tokenIdInput}
          />

          <button
            className="action-button-primary max-w-[220px]"
            onClick={() => applySearchParams({ gameId: gameIdInput, tokenId: tokenIdInput })}
            type="button"
          >
            Cargar sesion
          </button>

          <Link className="action-button-secondary max-w-[200px]" to="/board-mock">
            Ir a /board-mock
          </Link>
        </div>

        <div className="mt-4">
          <Link className="action-button-secondary max-w-[220px]" to="/">
            Volver al inicio
          </Link>
        </div>

        {!isDojoConfigured ? (
          <p className="mt-3 rounded-xl border border-[#ad4b1d] bg-[#ffe6d9] px-3 py-2 text-sm font-bold text-[#7a2a08]">
            Faltan variables Dojo/Torii (world, torii URL o manifest) en `.env`.
          </p>
        ) : null}

        {requestedGameId === null && gameIdInput.trim().length > 0 ? (
          <p className="mt-3 rounded-xl border border-[#ad4b1d] bg-[#ffe6d9] px-3 py-2 text-sm font-bold text-[#7a2a08]">
            `game_id` invalido. Usa decimal o hexadecimal 0x.
          </p>
        ) : null}

        {activeTokenId === null && tokenIdInput.trim().length > 0 ? (
          <p className="mt-3 rounded-xl border border-[#ad4b1d] bg-[#ffe6d9] px-3 py-2 text-sm font-bold text-[#7a2a08]">
            `token_id` invalido. Usa decimal o hexadecimal 0x.
          </p>
        ) : null}

        {activeTokenId !== null ? (
          <p className="mt-3 rounded-xl border border-[#1c5da6] bg-[#e8f3ff] px-3 py-2 text-sm font-bold text-[#174b80]">
            {isResolvingTokenLink ? 'Buscando token EGS...' : linkedTokenStatus || 'Token EGS cargado.'}
          </p>
        ) : null}

        {activeTokenId !== null && activeGameId !== null && linkedTokenGameId === null ? (
          <button className="action-button-primary mt-3 max-w-[260px]" onClick={onBindToken} type="button">
            Vincular token a esta partida
          </button>
        ) : null}

        {snapshotError ? (
          <p className="mt-3 rounded-xl border border-[#ad4b1d] bg-[#ffe6d9] px-3 py-2 text-sm font-bold text-[#7a2a08]">
            {snapshotError}
          </p>
        ) : null}

        {actionError ? (
          <p className="mt-3 rounded-xl border border-[#ad4b1d] bg-[#ffe6d9] px-3 py-2 text-sm font-bold text-[#7a2a08]">
            {actionError}
          </p>
        ) : null}

        {txPendingLabel ? (
          <p className="mt-3 rounded-xl border border-[#1c5da6] bg-[#e8f3ff] px-3 py-2 text-sm font-bold text-[#174b80]">
            Tx pendiente: {txPendingLabel}
            {txHash ? ` - ${txHash}` : ''}
          </p>
        ) : null}

        {!txPendingLabel && isAwaitingOnchainSync ? (
          <p className="mt-3 rounded-xl border border-[#1c5da6] bg-[#e8f3ff] px-3 py-2 text-sm font-bold text-[#174b80]">
            Esperando sincronizacion de estado en Torii...
          </p>
        ) : null}
      </article>

      {activeGameId !== null ? (
        <>
          <article className="game-panel bg-gradient-to-r from-[#103962] via-[#145183] to-[#103962] text-[#def2ff]">
            {isLoadingSnapshot ? (
              <p className="text-sm font-black uppercase tracking-wide">Cargando estado on-chain...</p>
            ) : (
              <div className="grid gap-2 text-xs font-black uppercase tracking-wide md:grid-cols-2 xl:grid-cols-4">
                <p>Game ID: {snapshot?.game?.game_id.toString() || activeGameId.toString()}</p>
                <p>Estado: {gameStatusLabel[snapshot?.game?.status || 0] || 'UNKNOWN'}</p>
                <p>Fase: {phaseLabel[snapshot?.turn_state?.phase || 0] || 'UNKNOWN'}</p>
                <p>Turno: {snapshot?.game?.turn_index || 0}</p>
                <p>Jugador activo: {activePlayerLabel}</p>
                <p>Ganador: {snapshot?.game?.winner && snapshot.game.winner !== '0x0' ? winnerLabel : 'pendiente'}</p>
                <p>
                  Dados: {snapshot?.dice_state ? `${snapshot.dice_state.die_a} / ${snapshot.dice_state.die_b}` : '-'}
                </p>
                <p>
                  Bonus activo: {activeBonusState ? buildBonusText(activeBonusState.pending_bonus_10, activeBonusState.pending_bonus_20) : 'sin bonus'}
                </p>
              </div>
            )}
          </article>

          <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
            <article className="game-panel bg-gradient-to-b from-[#efcd9a] via-[#e6bf86] to-[#d6a86d] p-3 xl:p-4">
              <div className="mb-3 flex items-center justify-between rounded-2xl border border-[#4e2f14] bg-gradient-to-r from-[#845223] via-[#9b632e] to-[#7b4b1e] px-3 py-2 shadow-wood">
                <p className="font-display text-xl uppercase tracking-[0.08em] text-[#fff0c7]">Board 3D on-chain</p>
                <span className="rounded-full border border-[#7a4e12] bg-gradient-to-b from-[#f8d772] to-[#e4b23a] px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#603d0b]">
                  legalidad via compute_legal_moves
                </span>
              </div>

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
            </article>

            <aside className="space-y-4">
              <article className="game-panel bg-gradient-to-b from-[#ffefc8] via-[#ffe39d] to-[#ffd26b] text-board-night">
                <div className="game-wood px-4 py-2 text-center">
                  <p className="font-display text-2xl uppercase tracking-wide">Acciones on-chain</p>
                </div>

                <div className="mt-3 grid gap-2">
                  <button
                    className={`action-button-primary ${canRoll && !txPendingLabel ? '' : 'cursor-not-allowed opacity-60'}`}
                    disabled={!canRoll || Boolean(txPendingLabel)}
                    onClick={onRoll}
                    type="button"
                  >
                    Roll (VRF)
                  </button>

                  <button
                    className={`action-button-secondary ${canEndTurn && !txPendingLabel ? '' : 'cursor-not-allowed opacity-60'}`}
                    disabled={!canEndTurn || Boolean(txPendingLabel)}
                    onClick={onEndTurn}
                    type="button"
                  >
                    End turn
                  </button>

                  <button
                    className={`action-button-secondary ${canSkipShop && !txPendingLabel ? '' : 'cursor-not-allowed opacity-60'}`}
                    disabled={!canSkipShop || Boolean(txPendingLabel)}
                    onClick={onSkipShop}
                    type="button"
                  >
                    Skip shop
                  </button>

                  <button
                    className={`action-button-secondary ${deadlineExpired && !txPendingLabel ? '' : 'cursor-not-allowed opacity-60'}`}
                    disabled={!deadlineExpired || Boolean(txPendingLabel)}
                    onClick={onForceSkipTurn}
                    type="button"
                  >
                    Force skip turn
                  </button>

                  <button className="action-button-secondary" onClick={() => setIsLogOpen(true)} type="button">
                    Log eventos
                  </button>
                </div>

                <p className="mt-3 rounded-xl border border-[#d6af50] bg-[#fff6dd] px-3 py-2 text-xs font-black uppercase tracking-wide text-board-night">
                  Deadline: {deadline > 0 ? `${deadline} (${deadlineExpired ? 'expirado' : 'vigente'})` : 'sin deadline'}
                </p>
              </article>

              <article className="game-panel bg-gradient-to-b from-[#fff3ce] via-[#ffe7ae] to-[#ffd57d] text-board-night">
                <div className="game-wood px-4 py-2 text-center">
                  <p className="font-display text-2xl uppercase tracking-wide">Respuesta</p>
                </div>

                <div className="mt-3 space-y-2 text-sm font-bold">
                  <p>
                    Pregunta ID: {snapshot?.turn_state?.question_id ? snapshot.turn_state.question_id.toString() : '-'}
                  </p>
                  <p>
                    index / cat / diff:{' '}
                    {snapshot?.pending_question
                      ? `${snapshot.pending_question.question_index} / ${snapshot.pending_question.category} / ${snapshot.pending_question.difficulty}`
                      : '-'}
                  </p>

                  {hydratedQuestion ? (
                    <>
                      <div className="rounded-xl border border-[#c9a85a] bg-[#fff8e7] px-3 py-3">
                        <p className="text-xs font-black uppercase tracking-wide text-[#7a5b18]">
                          Fuente local verificada contra root on-chain
                        </p>
                        <p className="mt-2 text-base font-bold leading-snug text-board-night">
                          {hydratedQuestion.prompt}
                        </p>
                      </div>

                      <div className="grid gap-2">
                        {hydratedQuestion.options.map((option, index) => {
                          const isSelected = selectedAnswerOption === index

                          return (
                            <button
                              className={`rounded-xl border px-3 py-2 text-left text-sm font-bold transition ${
                                isSelected
                                  ? 'border-[#8d6a17] bg-[#ffe596] text-[#5e4300]'
                                  : 'border-[#c9a85a] bg-[#fff4d8] text-board-night hover:bg-[#fff0c2]'
                              }`}
                              key={`${hydratedQuestion.questionIndex}-${index}`}
                              onClick={() => setSelectedAnswerOption(index)}
                              type="button"
                            >
                              {index}. {option}
                            </button>
                          )
                        })}
                      </div>

                      <p className="rounded-xl border border-[#d6af50] bg-[#fff6dd] px-3 py-2 text-xs font-black uppercase tracking-wide text-board-night">
                        proof nodes: {hydratedQuestion.merkleProof.length} · root: {LOCAL_QUESTION_SET_ROOT}
                      </p>
                    </>
                  ) : (
                    <p className="rounded-xl border border-[#ad4b1d] bg-[#ffe6d9] px-3 py-2 text-sm font-bold text-[#7a2a08]">
                      {hydratedQuestionError || 'Esperando datos de la pregunta on-chain.'}
                    </p>
                  )}

                  <button
                    className={`action-button-primary ${canSubmitAnswer && !txPendingLabel ? '' : 'cursor-not-allowed opacity-60'}`}
                    disabled={!canSubmitAnswer || Boolean(txPendingLabel) || !hydratedQuestion || selectedAnswerOption === null}
                    onClick={onSubmitAnswer}
                    type="button"
                  >
                    Submit answer
                  </button>
                </div>
              </article>

              <article className="game-panel bg-gradient-to-b from-[#fff3ce] via-[#ffe7ae] to-[#ffd57d] text-board-night">
                <div className="game-wood px-4 py-2 text-center">
                  <p className="font-display text-2xl uppercase tracking-wide">Jugada legal</p>
                </div>

                <ul className="mt-3 max-h-[260px] space-y-2 overflow-y-auto text-sm font-bold">
                  {displayedMoves.length === 0 ? (
                    <li className="rounded-xl border border-[#c9a85a] bg-[#fff4d8] px-3 py-2">
                      {canMove ? 'Sin jugadas legales para el filtro actual.' : 'Fase de movimiento no activa.'}
                    </li>
                  ) : (
                    displayedMoves.map((move) => (
                      <li className="rounded-xl border border-[#c9a85a] bg-[#fff4d8] px-3 py-2" key={move.id}>
                        <p>
                          {moveTypeLabel[move.move_type as MoveType]} - ficha {move.token_id + 1} - pasos {move.steps}
                        </p>
                        <p>
                          square_ref {move.target_square_ref} {'->'} ui {move.targetUiPosition}
                        </p>
                        <button
                          className={`action-button-primary mt-2 ${canMove && !txPendingLabel ? '' : 'cursor-not-allowed opacity-60'}`}
                          disabled={!canMove || Boolean(txPendingLabel)}
                          onClick={() => onApplyMove(move)}
                          type="button"
                        >
                          Apply move
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              </article>
            </aside>
          </div>

          <article className="game-panel bg-gradient-to-b from-[#fff3ce] via-[#ffe7ae] to-[#ffd57d] text-board-night">
            <div className="game-wood px-4 py-2 text-center">
              <p className="font-display text-2xl uppercase tracking-wide">Jugadores</p>
            </div>

            <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {players.map((player) => (
                <li className="rounded-xl border border-[#c9a85a] bg-[#fff4d8] px-3 py-2" key={player.id}>
                  <p className="font-display text-lg leading-none">{player.name}</p>
                  <p className="mt-1 text-xs font-black uppercase tracking-wide">
                    color: {player.color} {player.isHost ? '- host' : ''}
                  </p>
                  <p className="text-xs font-bold">Casa: {player.tokensInBase}</p>
                  <p className="text-xs font-bold">Meta: {player.tokensInGoal}</p>
                </li>
              ))}
            </ul>
          </article>
        </>
      ) : null}

      <LogDrawer events={logEvents} onClose={() => setIsLogOpen(false)} open={isLogOpen} />
    </section>
  )
}
