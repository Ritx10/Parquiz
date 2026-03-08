import { useAccount } from '@starknet-react/core'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { applyMove, computeLegalMoves, endTurn, rollTwoDiceAndDrawQuestion, submitAnswer } from '../api'
import {
  readDojoGameSnapshot,
  readEgsTokenGameLink,
  subscribeDojoGame,
  type DojoGameSnapshot,
} from '../api/dojo-state'
import type { DojoTokenModel, DojoTrackedEvent, LegalMoveApi, MoveType } from '../api/types'
import { Board3D } from '../components/game/board3d'
import { GameAvatar } from '../components/game/game-avatar'
import { LogDrawer } from '../components/game/log-drawer'
import type { MatchLogEvent, MatchPlayer, MatchToken, PlayerColor } from '../components/game/match-types'
import { TriviaQuestionModal } from '../components/game/trivia-question-modal'
import { isDojoConfigured } from '../config/dojo'
import { getPlayerSkinSrc, playerSkinIdFromIndex } from '../lib/player-skins'
import { getHydratedQuestion } from '../lib/questions/local-question-bank'
import { useControllerUsernames } from '../lib/starknet/use-controller-usernames'
import { shortenAddress, useControllerWallet } from '../lib/starknet/use-controller-wallet'
import { useAppSettingsStore } from '../store/app-settings-store'
import { tokenSkinIdFromIndex } from '../lib/token-cosmetics'
import type { TriviaDifficulty } from '../lib/trivia-engine'

const TRACK_SQUARE_UI_OFFSET = 4
const TRACK_LENGTH = 68
const BOARD_DEFAULT_SAFE_TRACK_REFS = [8, 13, 25, 30, 42, 47, 59, 64]
const TOKEN_STEP_ANIMATION_MS = 105

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

const startSquareByColor: Record<PlayerColor, number> = {
  red: 22,
  blue: 5,
  yellow: 56,
  green: 39,
}

const entrySquareByColor: Record<PlayerColor, number> = {
  red: 17,
  blue: 68,
  yellow: 51,
  green: 34,
}

const finalLaneByColor: Record<PlayerColor, number[]> = {
  green: [101, 102, 103, 104, 105, 106, 107, 108],
  red: [201, 202, 203, 204, 205, 206, 207, 208],
  blue: [301, 302, 303, 304, 305, 306, 307, 308],
  yellow: [401, 402, 403, 404, 405, 406, 407, 408],
}

const stepsToLaneEntryByColor: Record<PlayerColor, number> = {
  red: (entrySquareByColor.red - startSquareByColor.red + TRACK_LENGTH) % TRACK_LENGTH,
  blue: (entrySquareByColor.blue - startSquareByColor.blue + TRACK_LENGTH) % TRACK_LENGTH,
  yellow: (entrySquareByColor.yellow - startSquareByColor.yellow + TRACK_LENGTH) % TRACK_LENGTH,
  green: (entrySquareByColor.green - startSquareByColor.green + TRACK_LENGTH) % TRACK_LENGTH,
}

const moveTypeLabel: Record<MoveType, string> = {
  0: 'DIE_A',
  1: 'DIE_B',
  2: 'SUM',
  3: 'BONUS_10',
  4: 'BONUS_20',
  5: 'EXIT_HOME',
}

const questionDifficultyByLevel: Record<number, TriviaDifficulty> = {
  0: 'easy',
  1: 'medium',
  2: 'hard',
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

const isTrackPosition = (position: number) => position >= 1 && position <= TRACK_LENGTH

const wrapPosition = (position: number) => {
  const normalized = ((position - 1) % TRACK_LENGTH + TRACK_LENGTH) % TRACK_LENGTH
  return normalized + 1
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

  if (event.type === 'QuestionDrawn') {
    return {
      id: nextId('event-question'),
      type: 'question',
      message: `Pregunta lista para ${event.payload.question_id.toString()}.`,
      createdAt: Date.now(),
    }
  }

  if (event.type === 'AnswerRevealed') {
    return {
      id: nextId('event-answer'),
      type: 'question',
      message: `${addressLabel(event.payload.player)} marco opcion ${event.payload.selected_option + 1} · ${
        event.payload.correct ? 'correcta' : 'incorrecta'
      }.`,
      createdAt: Date.now(),
    }
  }

  if (event.type === 'AnswerResolved') {
    return {
      id: nextId('event-answer-status'),
      type: 'question',
      message: `${addressLabel(event.payload.player)} ${event.payload.correct ? 'respondio bien' : 'respondio mal'}.`,
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

type ResolvedAnswerDisplay = {
  answerState: 'correct' | 'incorrect'
  player?: MatchPlayer
  question: {
    category: string
    correctIndex: number
    difficulty: TriviaDifficulty
    icon: string
    id: string
    options: [string, string, string, string]
    prompt: string
    theme: 'blue'
  }
  selectedOption: number
}

const cloneSnapshot = (snapshot: DojoGameSnapshot): DojoGameSnapshot => ({
  ...snapshot,
  game: snapshot.game ? { ...snapshot.game } : null,
  turn_state: snapshot.turn_state ? { ...snapshot.turn_state } : null,
  dice_state: snapshot.dice_state ? { ...snapshot.dice_state } : null,
  runtime_config: snapshot.runtime_config ? { ...snapshot.runtime_config } : null,
  pending_question: snapshot.pending_question ? { ...snapshot.pending_question } : null,
  players: snapshot.players.map((player) => ({ ...player })),
  player_customizations: snapshot.player_customizations.map((customization) => ({ ...customization })),
  tokens: snapshot.tokens.map((token) => ({ ...token })),
  bonus_states: snapshot.bonus_states.map((bonus) => ({ ...bonus })),
  occupancies: snapshot.occupancies.map((occupancy) => ({ ...occupancy })),
  safe_track_square_refs: [...snapshot.safe_track_square_refs],
})

const applyOptimisticTargetSquare = (token: DojoGameSnapshot['tokens'][number], targetSquareRef: number) => {
  if (targetSquareRef >= 1 && targetSquareRef <= TRACK_LENGTH) {
    token.token_state = 1
    token.track_pos = targetSquareRef - 1
    token.home_lane_pos = 0
    return
  }

  if (targetSquareRef >= 1000 && targetSquareRef < 2000) {
    token.token_state = 2
    token.track_pos = 0
    token.home_lane_pos = (targetSquareRef - 1000) % 32
    return
  }

  if (targetSquareRef >= 9000 && targetSquareRef <= 9003) {
    token.token_state = 3
    token.track_pos = 0
    token.home_lane_pos = 0
  }
}

const consumeOptimisticDice = (
  diceState: NonNullable<DojoGameSnapshot['dice_state']>,
  turnState: NonNullable<DojoGameSnapshot['turn_state']>,
  move: { move_type: number; steps: number; token_id: number },
) => {
  if (move.move_type === 0) {
    diceState.die_a_used = true
  } else if (move.move_type === 1) {
    diceState.die_b_used = true
  } else if (move.move_type === 2) {
    diceState.sum_used = true
    diceState.die_a_used = true
    diceState.die_b_used = true
  } else if (move.move_type === 5) {
    if (!diceState.die_a_used && diceState.die_a === move.steps) {
      diceState.die_a_used = true
    } else if (!diceState.die_b_used && diceState.die_b === move.steps) {
      diceState.die_b_used = true
    } else if (!diceState.sum_used && !diceState.die_a_used && !diceState.die_b_used && diceState.die_a + diceState.die_b === move.steps) {
      diceState.sum_used = true
      diceState.die_a_used = true
      diceState.die_b_used = true
    }
  }

  turnState.dice_1 = diceState.die_a
  turnState.dice_2 = diceState.die_b
  turnState.die1_used = diceState.die_a_used
  turnState.die2_used = diceState.die_b_used
  if (!turnState.has_moved_token) {
    turnState.has_moved_token = true
    turnState.first_moved_token_id = move.token_id
  }
}

const applyOptimisticMoveToSnapshot = (
  snapshot: DojoGameSnapshot,
  activePlayerAddress: string,
  move: UiLegalMove,
): DojoGameSnapshot => {
  const nextSnapshot = cloneSnapshot(snapshot)
  const activePlayerKey = normalizeAddressForCompare(activePlayerAddress)
  const player = nextSnapshot.players.find(
    (entry) => normalizeAddressForCompare(entry.player) === activePlayerKey,
  )
  const token = nextSnapshot.tokens.find(
    (entry) => normalizeAddressForCompare(entry.player) === activePlayerKey && entry.token_id === move.token_id,
  )

  if (!player || !token) {
    return nextSnapshot
  }

  const wasInBase = token.token_state === 0
  const wasInCenter = token.token_state === 3
  applyOptimisticTargetSquare(token, move.target_square_ref)

  if (wasInBase && token.token_state !== 0) {
    player.tokens_in_base = Math.max(0, player.tokens_in_base - 1)
  }

  if (!wasInCenter && token.token_state === 3) {
    player.tokens_in_goal += 1
  }

  if (nextSnapshot.dice_state && nextSnapshot.turn_state) {
    consumeOptimisticDice(nextSnapshot.dice_state, nextSnapshot.turn_state, move)
  }

  return nextSnapshot
}

const applyOptimisticEndTurnToSnapshot = (snapshot: DojoGameSnapshot): DojoGameSnapshot => {
  const nextSnapshot = cloneSnapshot(snapshot)
  const activePlayers = nextSnapshot.players.filter((player) => player.is_active).sort((left, right) => left.seat - right.seat)

  if (!nextSnapshot.game || !nextSnapshot.turn_state || activePlayers.length === 0) {
    return nextSnapshot
  }

  const currentIndex = activePlayers.findIndex(
    (player) => normalizeAddressForCompare(player.player) === normalizeAddressForCompare(nextSnapshot.game?.active_player),
  )
  const nextPlayer = activePlayers[(currentIndex + 1 + activePlayers.length) % activePlayers.length]

  nextSnapshot.game.turn_index += 1
  nextSnapshot.game.active_player = nextPlayer.player
  nextSnapshot.turn_state.phase = 0
  nextSnapshot.turn_state.active_player = nextPlayer.player
  nextSnapshot.turn_state.dice_1 = 0
  nextSnapshot.turn_state.dice_2 = 0
  nextSnapshot.turn_state.die1_used = false
  nextSnapshot.turn_state.die2_used = false
  nextSnapshot.turn_state.question_id = 0n
  nextSnapshot.turn_state.question_answered = false
  nextSnapshot.turn_state.question_correct = false
  nextSnapshot.turn_state.has_moved_token = false
  nextSnapshot.turn_state.first_moved_token_id = 0
  nextSnapshot.pending_question = null

  if (nextSnapshot.dice_state) {
    nextSnapshot.dice_state.die_a = 0
    nextSnapshot.dice_state.die_b = 0
    nextSnapshot.dice_state.die_a_used = false
    nextSnapshot.dice_state.die_b_used = false
    nextSnapshot.dice_state.sum_used = false
  }

  return nextSnapshot
}

const stabilizeSnapshot = (
  nextSnapshot: DojoGameSnapshot,
  previousSnapshot: DojoGameSnapshot | null,
): DojoGameSnapshot => {
  if (!previousSnapshot) {
    return nextSnapshot
  }

  return {
    ...nextSnapshot,
    game: nextSnapshot.game ?? previousSnapshot.game,
    turn_state: nextSnapshot.turn_state ?? previousSnapshot.turn_state,
    dice_state: nextSnapshot.dice_state ?? previousSnapshot.dice_state,
    runtime_config: nextSnapshot.runtime_config ?? previousSnapshot.runtime_config,
    pending_question: nextSnapshot.pending_question ?? previousSnapshot.pending_question,
    players: nextSnapshot.players.length > 0 ? nextSnapshot.players : previousSnapshot.players,
    player_customizations:
      nextSnapshot.player_customizations.length > 0
        ? nextSnapshot.player_customizations
        : previousSnapshot.player_customizations,
    tokens: nextSnapshot.tokens.length > 0 ? nextSnapshot.tokens : previousSnapshot.tokens,
    bonus_states: nextSnapshot.bonus_states.length > 0 ? nextSnapshot.bonus_states : previousSnapshot.bonus_states,
    safe_track_square_refs:
      nextSnapshot.safe_track_square_refs.length > 0
        ? nextSnapshot.safe_track_square_refs
        : previousSnapshot.safe_track_square_refs,
  }
}

const buildOptimisticMovePath = (params: {
  color: PlayerColor
  currentUiPosition: number
  move: UiLegalMove
  token: DojoTokenModel
}): number[] => {
  if (params.token.token_state === 0) {
    return params.move.targetUiPosition > 0 ? [params.move.targetUiPosition] : []
  }

  if (params.token.token_state === 2) {
    const lane = finalLaneByColor[params.color]
    const laneIndex = lane.indexOf(params.currentUiPosition)

    if (laneIndex < 0) {
      return []
    }

    return lane.slice(laneIndex + 1, laneIndex + 1 + params.move.steps)
  }

  if (params.token.token_state !== 1 || !isTrackPosition(params.currentUiPosition)) {
    return []
  }

  const path: number[] = []
  let current = params.currentUiPosition
  let remaining = params.move.steps
  let trackStepsDelta = 0

  while (remaining > 0) {
    const canEnterLane =
      current === entrySquareByColor[params.color] &&
      params.token.steps_total + trackStepsDelta >= stepsToLaneEntryByColor[params.color]

    if (canEnterLane) {
      const lanePath = finalLaneByColor[params.color].slice(0, remaining)
      path.push(...lanePath)
      break
    }

    const next = wrapPosition(current + 1)
    path.push(next)
    current = next
    trackStepsDelta += 1
    remaining -= 1
  }

  return path
}

export function MatchOnchainView() {
  const [searchParams] = useSearchParams()
  const { account } = useAccount()
  const { address, username } = useControllerWallet()
  const language = useAppSettingsStore((state) => state.language)
  const selectedSkinId = useAppSettingsStore((state) => state.selectedSkinId)
  const selectedSkinSrc = getPlayerSkinSrc(selectedSkinId)

  const [gameIdInput, setGameIdInput] = useState(searchParams.get('gameId') || '')
  const [tokenIdInput, setTokenIdInput] = useState(searchParams.get('tokenId') || '')
  const [snapshot, setSnapshot] = useState<DojoGameSnapshot | null>(null)
  const [linkedTokenGameId, setLinkedTokenGameId] = useState<bigint | null>(null)
  const [, setLinkedTokenStatus] = useState<null | string>(null)
  const [, setIsResolvingTokenLink] = useState(false)
  const [isLoadingSnapshot, setIsLoadingSnapshot] = useState(false)
  const [snapshotError, setSnapshotError] = useState<null | string>(null)
  const [legalMoves, setLegalMoves] = useState<LegalMoveApi[]>([])
  const [selectedTokenId, setSelectedTokenId] = useState<null | string>(null)
  const [expandedTokenId, setExpandedTokenId] = useState<null | string>(null)
  const [isLogOpen, setIsLogOpen] = useState(false)
  const [logEvents, setLogEvents] = useState<MatchLogEvent[]>([])
  const [txPendingLabel, setTxPendingLabel] = useState<null | string>(null)
  const [, setTxHash] = useState<null | string>(null)
  const [actionError, setActionError] = useState<null | string>(null)
  const [isAwaitingOnchainSync, setIsAwaitingOnchainSync] = useState(false)
  const [hudDiceRolling, setHudDiceRolling] = useState(false)
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<null | number>(null)
  const [questionSecondsLeft, setQuestionSecondsLeft] = useState(0)
  const [resolvedAnswerDisplay, setResolvedAnswerDisplay] = useState<null | ResolvedAnswerDisplay>(null)
  const [rollNotice, setRollNotice] = useState<null | string>(null)
  const [animatedTokenIds, setAnimatingTokenIds] = useState<string[]>([])
  const [animatedTokenPositions, setAnimatedTokenPositions] = useState<Record<string, number>>({})
  const [hudDicePreview, setHudDicePreview] = useState<{ dieA: DiceFaceValue; dieB: DiceFaceValue }>({
    dieA: 1,
    dieB: 1,
  })

  const refreshDebounceRef = useRef<null | number>(null)
  const hudRollIntervalRef = useRef<null | number>(null)
  const hudRollTimeoutRef = useRef<null | number>(null)
  const playersByAddressRef = useRef<Record<string, string>>({})
  const colorBySeatRef = useRef<Record<number, PlayerColor>>(seatColorMap)
  const pendingQuestionRef = useRef<ReturnType<typeof getHydratedQuestion>>(null)
  const activePlayerCardRef = useRef<MatchPlayer | undefined>(undefined)
  const answerOverlayTimeoutRef = useRef<null | number>(null)
  const rollNoticeTimeoutRef = useRef<null | number>(null)

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
      const nextSnapshot = await readDojoGameSnapshot(activeGameId, {
        includePlayerCustomizations: true,
      })
      setSnapshot((current) => stabilizeSnapshot(nextSnapshot, current))
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

  const { getUsername } = useControllerUsernames({
    addresses: (snapshot?.players ?? []).map((player) => player.player),
    selfAddress: address,
    selfUsername: username,
  })

  const players = useMemo<MatchPlayer[]>(() => {
    if (!snapshot) {
      return []
    }

    const customizationByPlayer = new Map(
      snapshot.player_customizations.map((customization) => [
        normalizeAddressForCompare(customization.player),
        customization,
      ]),
    )

    return snapshot.players.map((player) => {
      const color = seatColorMap[player.color] || seatColorMap[player.seat] || 'green'
      const normalizedPlayerAddress = normalizeAddressForCompare(player.player)
      const isSelf = normalizedPlayerAddress === normalizedWalletAddress
      const resolvedName = getUsername(player.player)
      const baseName = resolvedName || (isSelf ? username || 'Tu jugador' : shortenAddress(player.player))
      const customization = customizationByPlayer.get(normalizedPlayerAddress)
      const avatarSkinId = customization ? playerSkinIdFromIndex(customization.avatar_skin_id) : null
      const visualSkinId = customization ? tokenSkinIdFromIndex(customization.token_skin_id) : undefined

      return {
        id: player.player,
        name: baseName,
        color,
        avatar:
          isSelf && selectedSkinSrc
            ? selectedSkinSrc
            : getPlayerSkinSrc(avatarSkinId) || color.slice(0, 2).toUpperCase(),
        visualSkinId,
        tokensInBase: player.tokens_in_base,
        tokensInGoal: player.tokens_in_goal,
        isHost: player.is_host,
      }
    })
  }, [getUsername, snapshot, normalizedWalletAddress, selectedSkinSrc, username])

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

  const activePlayerCard = useMemo(() => {
    if (!activePlayerAddress) {
      return undefined
    }

    return playersByAddress[normalizeAddressForCompare(activePlayerAddress)]
  }, [activePlayerAddress, playersByAddress])

  useEffect(() => {
    playersByAddressRef.current = Object.entries(playersByAddress).reduce<Record<string, string>>((acc, [key, value]) => {
      acc[key] = value.name
      return acc
    }, {})
  }, [playersByAddress])

  useEffect(() => {
    activePlayerCardRef.current = activePlayerCard
  }, [activePlayerCard])

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
      const owner = playersByAddress[ownerKey]

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
        cosmeticId: owner?.visualSkinId,
        position: animatedTokenPositions[tokenUiId(token.player, token.token_id)] ?? position,
      }
    })
  }, [animatedTokenPositions, snapshot, seatByAddress, colorBySeat, playersByAddress])

  const blockedSquares = useMemo(() => {
    const bySquare = uiTokens.reduce<Record<number, MatchToken[]>>((acc, token) => {
      if (token.position <= 0) {
        return acc
      }

      if (!acc[token.position]) {
        acc[token.position] = []
      }

      acc[token.position].push(token)
      return acc
    }, {})

    return Object.values(bySquare)
      .filter((group) => group.length === 2 && group[0].color === group[1].color)
      .map((group) => group[0].position)
  }, [uiTokens])

  const safeSquares = useMemo(() => {
    const source = snapshot?.safe_track_square_refs.length
      ? snapshot.safe_track_square_refs
      : BOARD_DEFAULT_SAFE_TRACK_REFS

    return source.map((trackSquareRef) => mapTrackSquareRefToUi(trackSquareRef))
  }, [snapshot?.safe_track_square_refs])

  const activePendingQuestion = useMemo(() => {
    if (!snapshot?.pending_question || snapshot.turn_state?.phase !== 1) {
      return null
    }

    const hydrated = getHydratedQuestion(
      snapshot.pending_question.question_index,
      snapshot.pending_question.category,
      snapshot.pending_question.difficulty,
      language,
    )

    if (!hydrated) {
      return null
    }

    return {
      ...hydrated,
      id: `q-${snapshot.turn_state?.question_id.toString() || snapshot.pending_question.question_index}`,
    }
  }, [language, snapshot?.pending_question, snapshot?.turn_state?.phase, snapshot?.turn_state?.question_id])

  useEffect(() => {
    pendingQuestionRef.current = activePendingQuestion
  }, [activePendingQuestion])

  const modalQuestion = useMemo(() => {
    if (!activePendingQuestion) {
      return null
    }

    return {
      category: language === 'es' ? 'Pregunta' : 'Question',
      correctIndex: activePendingQuestion.correctOption,
      difficulty: questionDifficultyByLevel[snapshot?.pending_question?.difficulty ?? 0] || 'easy',
      icon: '❓',
      id: activePendingQuestion.id,
      options: activePendingQuestion.displayOptions,
      prompt: activePendingQuestion.displayPrompt,
      theme: 'blue' as const,
    }
  }, [activePendingQuestion, language, snapshot?.pending_question?.difficulty])

  useEffect(() => {
    if (!snapshot?.turn_state || snapshot.turn_state.phase !== 1) {
      setQuestionSecondsLeft(0)
      return
    }

    const syncSecondsLeft = () => {
      const deadlineSeconds = Number(snapshot.turn_state?.deadline ?? 0n)
      const nowSeconds = Math.floor(Date.now() / 1000)
      setQuestionSecondsLeft(Math.max(0, deadlineSeconds - nowSeconds))
    }

    syncSecondsLeft()
    const intervalId = window.setInterval(syncSecondsLeft, 250)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [snapshot?.turn_state])

  useEffect(() => {
    setSelectedAnswerIndex(null)
  }, [snapshot?.turn_state?.question_id, snapshot?.turn_state?.phase])

  useEffect(() => {
    setSelectedTokenId(null)
    setExpandedTokenId(null)
    setAnimatingTokenIds([])
    setAnimatedTokenPositions({})
  }, [snapshot?.turn_state?.phase, snapshot?.turn_state?.question_id, snapshot?.turn_state?.deadline])

  useEffect(() => {
    return () => {
      if (answerOverlayTimeoutRef.current !== null) {
        window.clearTimeout(answerOverlayTimeoutRef.current)
      }
      if (rollNoticeTimeoutRef.current !== null) {
        window.clearTimeout(rollNoticeTimeoutRef.current)
      }
    }
  }, [])

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

      if (event.type === 'DiceRolled') {
        const rollerName = activePlayerCardRef.current?.name || 'Jugador'
        setRollNotice(`${rollerName} tiro ${event.payload.dice_1} y ${event.payload.dice_2}.`)

        if (rollNoticeTimeoutRef.current !== null) {
          window.clearTimeout(rollNoticeTimeoutRef.current)
        }

        rollNoticeTimeoutRef.current = window.setTimeout(() => {
          setRollNotice(null)
          rollNoticeTimeoutRef.current = null
        }, 2200)
      }

      if (event.type === 'AnswerRevealed' && pendingQuestionRef.current) {
        const question = pendingQuestionRef.current
        const answerState = event.payload.correct ? 'correct' : 'incorrect'
        const player = activePlayerCardRef.current

        setResolvedAnswerDisplay({
          answerState,
          player,
          question: {
            category: language === 'es' ? 'Pregunta' : 'Question',
            correctIndex: question.correctOption,
            difficulty: questionDifficultyByLevel[snapshot?.pending_question?.difficulty ?? 0] || 'easy',
            icon: '❓',
            id: `resolved-${event.payload.question_id.toString()}`,
            options: question.displayOptions,
            prompt: question.displayPrompt,
            theme: 'blue',
          },
          selectedOption: event.payload.selected_option,
        })

        if (answerOverlayTimeoutRef.current !== null) {
          window.clearTimeout(answerOverlayTimeoutRef.current)
        }

        answerOverlayTimeoutRef.current = window.setTimeout(() => {
          setResolvedAnswerDisplay(null)
          answerOverlayTimeoutRef.current = null
        }, 1800)
      }

      setLogEvents((current) => [nextLog, ...current].slice(0, 120))
    },
    [language, playerLabelFromAddress, snapshot?.pending_question?.difficulty],
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
        const initialSnapshot = await readDojoGameSnapshot(activeGameId, {
          includePlayerCustomizations: true,
        })

        if (cancelled) {
          return
        }

        setSnapshot((current) => stabilizeSnapshot(initialSnapshot, current))

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

  const tokenChoiceMap = useMemo(() => {
    return uiLegalMoves.reduce<Record<string, UiLegalMove>>((acc, move) => {
      acc[move.id] = move
      return acc
    }, {})
  }, [uiLegalMoves])

  const tokenDiceChoices = useMemo(() => {
    return Object.entries(movesByToken).reduce<Record<string, Array<{ id: string; label: string; value: number }>>>(
      (acc, [tokenId, moves]) => {
        acc[tokenId] = moves.map((move) => ({
          id: move.id,
          label: moveTypeLabel[move.move_type as MoveType] || 'MOVE',
          value: move.steps,
        }))
        return acc
      },
      {},
    )
  }, [movesByToken])

  const animateTokenPath = useCallback((tokenId: string, path: number[]) => {
    return new Promise<void>((resolve) => {
      if (path.length === 0) {
        resolve()
        return
      }

      setAnimatingTokenIds([tokenId])
      let index = 0

      const stepForward = () => {
        const nextPosition = path[index]
        setAnimatedTokenPositions((current) => ({ ...current, [tokenId]: nextPosition }))
        index += 1

        if (index >= path.length) {
          window.setTimeout(() => {
            setAnimatingTokenIds([])
            resolve()
          }, 140)
          return
        }

        window.setTimeout(stepForward, TOKEN_STEP_ANIMATION_MS)
      }

      stepForward()
    })
  }, [])

  const runTransaction = useCallback(
    async (
      label: string,
      action: () => Promise<string>,
      options?: {
        onConfirmed?: () => Promise<void> | void
        onOptimistic?: () => void
        onRollback?: () => void
      },
    ) => {
      if (!account || !activeGameId) {
        setActionError('Conecta Controller Wallet para ejecutar transacciones on-chain.')
        return
      }

      setActionError(null)
      setTxPendingLabel(label)
      setTxHash(null)
      setIsAwaitingOnchainSync(true)
      options?.onOptimistic?.()

      try {
        const submittedHash = await action()
        setTxHash(submittedHash)

        await account.waitForTransaction(submittedHash)
        await options?.onConfirmed?.()
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
        options?.onRollback?.()
        setActionError(mapErrorToUserMessage(error))
      } finally {
        setTxPendingLabel(null)
        setIsAwaitingOnchainSync(false)
      }
    },
    [account, activeGameId, activeTokenId, refreshSnapshot],
  )

  const onApplyMove = useCallback(
    (move: UiLegalMove) => {
      if (!account || !activeGameId || !snapshot) {
        return
      }

      const previousSnapshot = cloneSnapshot(snapshot)
      const previousLegalMoves = [...legalMoves]
      const movingToken = snapshot.tokens.find(
        (entry) =>
          normalizeAddressForCompare(entry.player) === normalizeAddressForCompare(activePlayerAddress) &&
          entry.token_id === move.token_id,
      )
      const currentUiToken = uiTokens.find((token) => token.id === move.tokenUiId)
      const currentUiPosition = currentUiToken?.position ?? 0
      const currentColor = currentUiToken?.color ?? 'green'

      void runTransaction(
        'Applying move',
        () =>
          applyMove(account, activeGameId, {
            moveType: move.move_type,
            tokenId: move.token_id,
            steps: move.steps,
          }),
        {
          onOptimistic: () => {
            setExpandedTokenId(null)
            setSelectedTokenId(move.tokenUiId)

            void (async () => {
              if (movingToken) {
                const path = buildOptimisticMovePath({
                  color: currentColor,
                  currentUiPosition,
                  move,
                  token: movingToken,
                })
                await animateTokenPath(move.tokenUiId, path)
              }

              setSnapshot((current) =>
                current ? applyOptimisticMoveToSnapshot(current, activePlayerAddress, move) : current,
              )
              setAnimatedTokenPositions((current) => {
                if (!(move.tokenUiId in current)) {
                  return current
                }

                const next = { ...current }
                delete next[move.tokenUiId]
                return next
              })
            })()
          },
          onConfirmed: async () => {
            const nextMoves = await computeLegalMoves(activeGameId)
            setLegalMoves(nextMoves)
            if (nextMoves.length === 0) {
              setSelectedTokenId(null)
            }
          },
          onRollback: () => {
            setSnapshot(previousSnapshot)
            setLegalMoves(previousLegalMoves)
            setSelectedTokenId(null)
            setExpandedTokenId(null)
            setAnimatingTokenIds([])
            setAnimatedTokenPositions({})
          },
        },
      )
    },
    [account, activeGameId, activePlayerAddress, animateTokenPath, legalMoves, runTransaction, snapshot, uiTokens],
  )

  const onRoll = useCallback(() => {
    if (!account || !activeGameId) {
      return
    }

    void runTransaction('Roll + question (VRF)', () => rollTwoDiceAndDrawQuestion(account, activeGameId))
  }, [account, activeGameId, runTransaction])

  const onSelectAnswer = useCallback(
    (optionIndex: number) => {
      if (!account || !activeGameId || !snapshot?.pending_question || !snapshot?.turn_state || !activePendingQuestion) {
        return
      }

      const pendingQuestion = snapshot.pending_question
      const turnState = snapshot.turn_state

      setSelectedAnswerIndex(optionIndex)

      void runTransaction('Submitting answer', () =>
        submitAnswer(account, activeGameId, {
          questionId: turnState.question_id,
          questionIndex: pendingQuestion.question_index,
          category: pendingQuestion.category,
          difficulty: pendingQuestion.difficulty,
          correctOption: activePendingQuestion.correctOption,
          selectedOption: optionIndex,
          merkleProof: activePendingQuestion.merkleProof,
          merkleDirections: activePendingQuestion.merkleDirections,
        }),
      )
    },
    [account, activeGameId, activePendingQuestion, runTransaction, snapshot?.pending_question, snapshot?.turn_state],
  )

  const movementEnabled = isMyTurn && snapshot?.turn_state?.phase === 2 && !txPendingLabel && !isAwaitingOnchainSync

  const onTokenClick = useCallback(
    (tokenId: string) => {
      if (!movementEnabled) {
        return
      }

      setSelectedTokenId(tokenId)

      const choices = tokenDiceChoices[tokenId] || []
      if (choices.length === 0) {
        setExpandedTokenId(null)
        return
      }

      if (choices.length === 1) {
        const selectedMove = tokenChoiceMap[choices[0].id]
        if (selectedMove) {
          onApplyMove(selectedMove)
        }
        return
      }

      setExpandedTokenId(tokenId)
    },
    [movementEnabled, onApplyMove, tokenChoiceMap, tokenDiceChoices],
  )

  const onTokenHover = useCallback(
    (tokenId: string | null) => {
      if (!movementEnabled || !tokenId) {
        setExpandedTokenId(null)
        return
      }

      if ((tokenDiceChoices[tokenId] || []).length > 1) {
        setExpandedTokenId(tokenId)
      }
    },
    [movementEnabled, tokenDiceChoices],
  )

  const onTokenDiceChoiceSelect = useCallback(
    (_tokenId: string, choiceId: string) => {
      if (!movementEnabled) {
        return
      }

      const selectedMove = tokenChoiceMap[choiceId]
      if (!selectedMove) {
        return
      }

      onApplyMove(selectedMove)
    },
    [movementEnabled, onApplyMove, tokenChoiceMap],
  )

  const onEndTurn = useCallback(() => {
    if (!account || !activeGameId || !movementEnabled || !snapshot) {
      return
    }

    const previousSnapshot = cloneSnapshot(snapshot)
    const previousLegalMoves = [...legalMoves]

    void runTransaction('Ending turn', () => endTurn(account, activeGameId), {
      onOptimistic: () => {
        setExpandedTokenId(null)
        setSelectedTokenId(null)
        setLegalMoves([])
        setSnapshot((current) => (current ? applyOptimisticEndTurnToSnapshot(current) : current))
      },
      onConfirmed: async () => {
        setLegalMoves([])
      },
      onRollback: () => {
        setSnapshot(previousSnapshot)
        setLegalMoves(previousLegalMoves)
      },
    })
  }, [account, activeGameId, legalMoves, movementEnabled, runTransaction, snapshot])

  const canRoll = isMyTurn && snapshot?.turn_state?.phase === 0
  const canRollAction = canRoll && !hudDiceRolling && !txPendingLabel && !isAwaitingOnchainSync
  const visualSkinByColor = useMemo(() => {
    return players.reduce<Partial<Record<PlayerColor, MatchPlayer['visualSkinId']>>>((acc, player) => {
      acc[player.color] = player.visualSkinId
      return acc
    }, {})
  }, [players])
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

            {snapshotError ? (
              <div className="mb-3 rounded-2xl border border-[#9e4f38] bg-[#fff1e8] px-4 py-3 text-sm font-bold text-[#6c2412] shadow-[0_6px_18px_rgba(72,24,8,0.14)]">
                {snapshotError}
              </div>
            ) : null}

            {actionError ? (
              <div className="mb-3 rounded-2xl border border-[#9e4f38] bg-[#fff1e8] px-4 py-3 text-sm font-bold text-[#6c2412] shadow-[0_6px_18px_rgba(72,24,8,0.14)]">
                {actionError}
              </div>
            ) : null}

            {isLoadingSnapshot && !snapshot ? (
              <div className="mb-3 rounded-2xl border border-[#8d6c38] bg-[#fff7df] px-4 py-3 text-sm font-bold text-[#6b4a15] shadow-[0_6px_18px_rgba(72,54,8,0.12)]">
                Cargando estado on-chain del tablero...
              </div>
            ) : null}

            {rollNotice ? (
              <div className="mb-3 rounded-2xl border border-[#7f5b24] bg-[#fff4d3] px-4 py-3 text-sm font-bold text-[#65431a] shadow-[0_6px_18px_rgba(72,54,8,0.12)]">
                {rollNotice}
              </div>
            ) : null}

            {snapshot?.turn_state?.phase === 2 && isMyTurn ? (
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#7f5b24] bg-[#fff4d3] px-4 py-3 shadow-[0_6px_18px_rgba(72,54,8,0.12)]">
                <div className="text-sm font-bold text-[#65431a]">
                  {legalMoves.length > 0
                    ? 'Selecciona una ficha para moverla on-chain.'
                    : 'No quedan movimientos legales. Puedes terminar el turno.'}
                </div>
                <button
                  className="rounded-full border border-[#7b4e15] bg-gradient-to-b from-[#ffd670] to-[#e6aa1b] px-4 py-2 text-sm font-black uppercase tracking-[0.12em] text-[#5a3507] shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_4px_0_rgba(118,80,15,0.45)] disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={Boolean(txPendingLabel) || isAwaitingOnchainSync || legalMoves.length > 0}
                  onClick={onEndTurn}
                  type="button"
                >
                  {txPendingLabel === 'Ending turn' ? 'Terminando...' : 'Terminar turno'}
                </button>
              </div>
            ) : null}

            <div className="relative mx-auto max-w-[980px] pb-16 pt-16 lg:px-[150px] lg:pb-0 lg:pt-0">
              <Board3D
                animatingTokenIds={animatedTokenIds}
                blockedSquares={blockedSquares}
                expandedTokenId={expandedTokenId}
                highlightedSquares={highlightedSquares}
                movableTokenIds={highlightedTokenIds}
                onTokenClick={onTokenClick}
                onTokenHover={onTokenHover}
                onTokenDiceChoiceSelect={onTokenDiceChoiceSelect}
                players={players}
                safeSquares={safeSquares}
                selectedTokenId={selectedTokenId}
                tokenDiceChoices={tokenDiceChoices}
                tokenHints={tokenHints}
                tokens={uiTokens}
                visualSkinByColor={visualSkinByColor}
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

        {modalQuestion && snapshot?.turn_state?.phase === 1 ? (
          <TriviaQuestionModal
            answerState="idle"
            difficulty={modalQuestion.difficulty}
            interactionLocked={!isMyTurn || txPendingLabel === 'Submitting answer'}
            isAiTurn={false}
            onSelectOption={onSelectAnswer}
            player={activePlayerCard}
            question={modalQuestion}
            secondsLeft={questionSecondsLeft}
            selectedOption={selectedAnswerIndex}
          />
        ) : resolvedAnswerDisplay ? (
          <TriviaQuestionModal
            answerState={resolvedAnswerDisplay.answerState}
            difficulty={resolvedAnswerDisplay.question.difficulty}
            interactionLocked
            isAiTurn={false}
            onSelectOption={() => undefined}
            player={resolvedAnswerDisplay.player}
            question={resolvedAnswerDisplay.question}
            secondsLeft={0}
            selectedOption={resolvedAnswerDisplay.selectedOption}
          />
        ) : null}

        <LogDrawer events={logEvents} onClose={() => setIsLogOpen(false)} open={isLogOpen} />
      </div>
    </section>
  )
}
