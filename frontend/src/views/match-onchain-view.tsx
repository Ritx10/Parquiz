import { useAccount } from '@starknet-react/core'
import { memo, type CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { applyMove, computeLegalMoves, endTurn, forceSkipTurn, rollTwoDiceAndDrawQuestion, submitAnswer } from '../api'
import {
  readDojoGameSnapshot,
  readEgsTokenGameLink,
  subscribeDojoGame,
  type DojoGameSnapshot,
} from '../api/dojo-state'
import type { DojoQuestionDrawnEvent, DojoTrackedEvent, LegalMoveApi, MoveType } from '../api/types'
import { Board3D } from '../components/game/board3d'
import FinalRankingScreen from '../components/game/FinalRankingScreen'
import { GameAvatar } from '../components/game/game-avatar'
import { GameDie } from '../components/game/game-die'
import { LogDrawer } from '../components/game/log-drawer'
import type { MatchLogEvent, MatchPlayer, MatchToken, PlayerColor } from '../components/game/match-types'
import { TriviaQuestionModal } from '../components/game/trivia-question-modal'
import { isDojoConfigured } from '../config/dojo'
import { playSoundEffect } from '../lib/audio'
import { getBoardThemeDefinition, getBoardThemeSurfacePalette } from '../lib/board-themes'
import { diceSkinIdFromIndex, getDefaultDiceSkinIdByColor, type DiceSkinId } from '../lib/dice-cosmetics'
import type { MatchRewardSummary, PodiumPlace } from '../lib/match-rewards'
import { getPlayerSkinSrc, playerSkinIdFromIndex } from '../lib/player-skins'
import { getPlayerVisualThemeByColor } from '../lib/player-color-themes'
import {
  getHydratedQuestion,
  localDifficultyToTriviaDifficulty,
  mapCanonicalOptionToDisplay,
  mapDisplayOptionToCanonical,
} from '../lib/questions/local-question-bank'
import { useControllerUsernames } from '../lib/starknet/use-controller-usernames'
import { shortenAddress, useControllerWallet } from '../lib/starknet/use-controller-wallet'
import { useAppSettingsStore } from '../store/app-settings-store'
import { tokenSkinIdFromIndex, type TokenSkinId } from '../lib/token-cosmetics'
import type { TriviaDifficulty } from '../lib/trivia-engine'

const TRACK_SQUARE_UI_OFFSET = 4
const TRACK_LENGTH = 68
const BOARD_DEFAULT_SAFE_TRACK_REFS = [8, 13, 25, 30, 42, 47, 59, 64]
const TOKEN_STEP_ANIMATION_MS = 105

type DiceFaceValue = 1 | 2 | 3 | 4 | 5 | 6

type FinalPlacement = {
  id: string
  avatar: string
  color: PlayerColor
  goalCount: number
  name: string
  place: PodiumPlace
  progressScore: number
  reward: number
  rewardSummary?: MatchRewardSummary
  tag: string
  visualSkinId?: TokenSkinId
}

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

const moveTypeLabel: Record<MoveType, string> = {
  0: 'DIE_A',
  1: 'DIE_B',
  2: 'SUM',
  3: 'BONUS_10',
  4: 'BONUS_20',
  5: 'EXIT_HOME',
}

const announcementGlassTintByThemeId = {
  'theme-classic': {
    border: 'rgba(255, 246, 226, 0.42)',
    highlight: 'rgba(255, 250, 241, 0.42)',
    shadow: 'rgba(60, 34, 14, 0.28)',
    tintA: 'rgba(235, 220, 190, 0.34)',
    tintB: 'rgba(190, 158, 122, 0.16)',
  },
  'theme-rainbow': {
    border: 'rgba(225, 243, 255, 0.42)',
    highlight: 'rgba(243, 250, 255, 0.42)',
    shadow: 'rgba(39, 74, 109, 0.24)',
    tintA: 'rgba(143, 193, 231, 0.34)',
    tintB: 'rgba(190, 225, 255, 0.16)',
  },
  'theme-castle': {
    border: 'rgba(236, 228, 255, 0.42)',
    highlight: 'rgba(248, 245, 255, 0.42)',
    shadow: 'rgba(65, 54, 108, 0.24)',
    tintA: 'rgba(168, 153, 221, 0.34)',
    tintB: 'rgba(213, 204, 246, 0.16)',
  },
  'theme-jungle': {
    border: 'rgba(231, 247, 223, 0.42)',
    highlight: 'rgba(246, 255, 241, 0.4)',
    shadow: 'rgba(28, 71, 37, 0.24)',
    tintA: 'rgba(120, 170, 140, 0.34)',
    tintB: 'rgba(187, 223, 178, 0.15)',
  },
  'theme-desert': {
    border: 'rgba(255, 236, 214, 0.42)',
    highlight: 'rgba(255, 248, 238, 0.4)',
    shadow: 'rgba(113, 68, 25, 0.24)',
    tintA: 'rgba(214, 167, 112, 0.34)',
    tintB: 'rgba(246, 214, 165, 0.16)',
  },
  'theme-night': {
    border: 'rgba(217, 228, 255, 0.42)',
    highlight: 'rgba(240, 245, 255, 0.42)',
    shadow: 'rgba(20, 32, 74, 0.28)',
    tintA: 'rgba(120, 150, 210, 0.34)',
    tintB: 'rgba(84, 111, 184, 0.18)',
  },
  'theme-volcano': {
    border: 'rgba(255, 223, 214, 0.42)',
    highlight: 'rgba(255, 242, 237, 0.42)',
    shadow: 'rgba(92, 31, 20, 0.28)',
    tintA: 'rgba(200, 110, 90, 0.34)',
    tintB: 'rgba(121, 39, 22, 0.18)',
  },
  'theme-legend': {
    border: 'rgba(255, 235, 210, 0.42)',
    highlight: 'rgba(255, 247, 235, 0.42)',
    shadow: 'rgba(92, 68, 26, 0.26)',
    tintA: 'rgba(208, 175, 114, 0.34)',
    tintB: 'rgba(140, 109, 62, 0.16)',
  },
} as const

const hexToRgb = (hex: string) => {
  const sanitized = hex.replace('#', '')
  const normalized = sanitized.length === 3 ? sanitized.split('').map((char) => `${char}${char}`).join('') : sanitized
  const value = Number.parseInt(normalized, 16)

  return {
    b: value & 255,
    g: (value >> 8) & 255,
    r: (value >> 16) & 255,
  }
}

const mixHexColors = (hex: string, targetHex: string, ratio: number) => {
  const source = hexToRgb(hex)
  const target = hexToRgb(targetHex)
  const mix = (from: number, to: number) => Math.round(from + (to - from) * ratio)

  return {
    r: mix(source.r, target.r),
    g: mix(source.g, target.g),
    b: mix(source.b, target.b),
  }
}

const rgbaFromHex = (hex: string, alpha: number) => {
  const { r, g, b } = hexToRgb(hex)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

const rgbaFromRgb = (rgb: { b: number; g: number; r: number }, alpha: number) => `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`

const buildBoardStageGlassTint = (baseColor: string) => ({
  border: rgbaFromRgb(mixHexColors(baseColor, '#ffffff', 0.74), 0.26),
  glow: rgbaFromHex(baseColor, 0.16),
  highlight: rgbaFromRgb(mixHexColors(baseColor, '#ffffff', 0.9), 0.22),
  panelTop: rgbaFromRgb(mixHexColors(baseColor, '#ffffff', 0.34), 0.2),
  panelMid: rgbaFromRgb(mixHexColors(baseColor, '#ffffff', 0.14), 0.12),
  panelBottom: rgbaFromRgb(mixHexColors(baseColor, '#0f172a', 0.18), 0.08),
  shadow: 'rgba(0,0,0,0.18)',
  tint: rgbaFromHex(baseColor, 0.16),
})

const onchainCopyByLanguage = {
  es: {
    awaitingTurn: 'En espera',
    boardTitle: 'Board 3D on-chain',
    clearResolver: 'Limpiar',
    congrats: 'Enhorabuena',
    clickToRoll: 'Click para tirar',
    diceAlreadyUsed: 'Dados ya usados',
    dojoBadge: 'estado real Dojo',
    dojoDisabledBody: 'Configura las variables de Dojo/Torii para consultar el estado on-chain y habilitar suscripciones en vivo.',
    dojoDisabledTitle: 'Dojo no esta configurado',
    emptyBoardBody:
      'Abre esta ruta con `?gameId=<id>` o `?tokenId=<id>` para resolver la partida vinculada y cargar el tablero on-chain.',
    emptyBoardTitle: 'No hay una partida on-chain activa',
    endingTurn: 'Terminando...',
    endTurn: 'Terminar turno',
    linkPending: 'Resolviendo partida vinculada del token...',
    loadBoard: 'Cargando estado on-chain del tablero...',
    logLabel: 'Historial',
    noMovesLeft: 'No quedan movimientos legales. Puedes terminar el turno.',
    syncingState: 'Sincronizando estado on-chain...',
    txConfirming: 'Transaccion enviada. Esperando confirmacion...',
    txPendingPrefix: 'Procesando',
    resolveByGameId: 'Cargar gameId',
    resolveByTokenId: 'Resolver tokenId',
    resolverGamePlaceholder: 'gameId',
    resolverHelp: 'Carga una partida por gameId o resuelvela desde un token vinculado.',
    resolverTokenPlaceholder: 'tokenId',
    placeAnnouncementLabel: {
      1: 'ES 1ER LUGAR',
      2: 'ES 2DO LUGAR',
      3: 'ES 3ER LUGAR',
    } as Record<1 | 2 | 3, string>,
    placeLabel: {
      1: '1er lugar',
      2: '2do lugar',
      3: '3er lugar',
      4: '4to lugar',
    } as Record<PodiumPlace, string>,
    questionCategory: 'Pregunta',
    rolling: 'Lanzando...',
    selectTokenToMove: 'Selecciona una ficha para moverla on-chain.',
    skip: 'Ver ranking',
    tokenLinkLabel: 'Token vinculado',
    turnWaiting: 'En espera',
    yourTurn: 'Tu turno',
  },
  en: {
    awaitingTurn: 'Waiting',
    boardTitle: 'On-chain Board 3D',
    clearResolver: 'Clear',
    congrats: 'Congratulations',
    clickToRoll: 'Click to roll',
    diceAlreadyUsed: 'Dice already used',
    dojoBadge: 'live Dojo state',
    dojoDisabledBody: 'Configure the Dojo/Torii environment variables to query the live board state and enable realtime subscriptions.',
    dojoDisabledTitle: 'Dojo is not configured',
    emptyBoardBody:
      'Open this route with `?gameId=<id>` or `?tokenId=<id>` so the client can resolve the linked match and load the on-chain board.',
    emptyBoardTitle: 'No active on-chain match selected',
    endingTurn: 'Ending...',
    endTurn: 'End turn',
    linkPending: 'Resolving linked token match...',
    loadBoard: 'Loading on-chain board state...',
    logLabel: 'History',
    noMovesLeft: 'No legal moves remain. You can end the turn.',
    syncingState: 'Syncing on-chain state...',
    txConfirming: 'Transaction submitted. Waiting for confirmation...',
    txPendingPrefix: 'Processing',
    resolveByGameId: 'Load gameId',
    resolveByTokenId: 'Resolve tokenId',
    resolverGamePlaceholder: 'gameId',
    resolverHelp: 'Load a live match by gameId or resolve it from a linked token.',
    resolverTokenPlaceholder: 'tokenId',
    placeAnnouncementLabel: {
      1: 'TAKES 1ST PLACE',
      2: 'TAKES 2ND PLACE',
      3: 'TAKES 3RD PLACE',
    } as Record<1 | 2 | 3, string>,
    placeLabel: {
      1: '1st place',
      2: '2nd place',
      3: '3rd place',
      4: '4th place',
    } as Record<PodiumPlace, string>,
    questionCategory: 'Question',
    rolling: 'Rolling...',
    selectTokenToMove: 'Select a token to move it on-chain.',
    skip: 'View ranking',
    tokenLinkLabel: 'Linked token',
    turnWaiting: 'Waiting',
    yourTurn: 'Your turn',
  },
} as const

type OnchainUiCopy = (typeof onchainCopyByLanguage)[keyof typeof onchainCopyByLanguage]

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

const formatPendingActionLabel = (
  label: string,
  phase: PendingTxPhase,
  language: 'en' | 'es',
) => {
  const actionKey =
    label === 'Applying move'
      ? 'move'
      : label === 'Roll + question (VRF)'
        ? 'roll-question'
      : label === 'Submitting answer'
          ? 'answer'
          : label === 'Force skip timeout'
            ? 'force-skip'
          : 'end-turn'

  const phrases = {
    en: {
      answer: {
        confirming: 'Confirming answer...',
        submitting: 'Submitting answer...',
        syncing: 'Syncing answer...',
      },
      'force-skip': {
        confirming: 'Confirming timeout skip...',
        submitting: 'Submitting timeout skip...',
        syncing: 'Syncing timeout skip...',
      },
      'end-turn': {
        confirming: 'Confirming end turn...',
        submitting: 'Submitting end turn...',
        syncing: 'Syncing end turn...',
      },
      move: {
        confirming: 'Confirming move...',
        submitting: 'Submitting move...',
        syncing: 'Syncing move...',
      },
      'roll-question': {
        confirming: 'Confirming roll and question...',
        submitting: 'Submitting roll and question...',
        syncing: 'Syncing roll and question...',
      },
    },
    es: {
      answer: {
        confirming: 'Confirmando respuesta...',
        submitting: 'Enviando respuesta...',
        syncing: 'Sincronizando respuesta...',
      },
      'force-skip': {
        confirming: 'Confirmando salto por tiempo...',
        submitting: 'Enviando salto por tiempo...',
        syncing: 'Sincronizando salto por tiempo...',
      },
      'end-turn': {
        confirming: 'Confirmando fin de turno...',
        submitting: 'Enviando fin de turno...',
        syncing: 'Sincronizando fin de turno...',
      },
      move: {
        confirming: 'Confirmando movimiento...',
        submitting: 'Enviando movimiento...',
        syncing: 'Sincronizando movimiento...',
      },
      'roll-question': {
        confirming: 'Confirmando tirada y pregunta...',
        submitting: 'Enviando tirada y pregunta...',
        syncing: 'Sincronizando tirada y pregunta...',
      },
    },
  } as const

  return phrases[language][actionKey][phase]
}

const HudDie = memo(function HudDie({ skinId, value, rolling }: { skinId: DiceSkinId; value: null | number; rolling: boolean }) {
  return <GameDie className="h-11 w-11" rolling={rolling} skinId={skinId} value={value} />
})
HudDie.displayName = 'OnchainHudDie'

const PlayerHudCard = memo(function PlayerHudCard({
  player,
  isTurn,
  surfacePalette,
  ui,
}: {
  player: MatchPlayer
  isTurn: boolean
  surfacePalette: ReturnType<typeof getBoardThemeSurfacePalette>
  ui: OnchainUiCopy
}) {
  const theme = getPlayerVisualThemeByColor(player.color, player.visualSkinId)

  return (
    <article
      className="w-[132px] rounded-2xl border px-3 py-2 text-center shadow-[0_8px_24px_rgba(0,0,0,0.35)] backdrop-blur-sm"
      style={{
        background: surfacePalette.hudCardBackground,
        borderColor: surfacePalette.hudCardBorder,
        color: surfacePalette.hudCardText,
      }}
    >
      <div className={`mx-auto mb-2 h-1.5 w-full rounded-full ${theme.stripClass}`} />
      <span
        className="mx-auto mb-2 inline-flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border-2 border-white/45 shadow-[0_4px_10px_rgba(0,0,0,0.2)]"
        style={{ background: surfacePalette.hudAvatarBackground }}
      >
        <GameAvatar
          alt={player.name}
          avatar={player.avatar}
          imageClassName="h-full w-full object-contain p-1"
          textClassName="text-sm font-black text-[#2c190d]"
        />
      </span>
      <p className="truncate font-display text-lg leading-none">{player.name}</p>

      <div
        className="mt-2 inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-black uppercase tracking-wide"
        style={{
          background: surfacePalette.hudPillBackground,
          borderColor: surfacePalette.hudPillBorder,
          color: surfacePalette.hudPillText,
        }}
      >
        <span className={`inline-flex h-4 w-4 items-center justify-center rounded-full ${theme.hudAccentClass}`}>
          D
        </span>
        {isTurn ? ui.yourTurn : ui.turnWaiting}
      </div>

      <div className="mt-2 flex items-center justify-center gap-1.5">
        {Array.from({ length: 4 }).map((_, index) => (
          <span
            className={`h-2.5 w-2.5 rounded-full border border-white/15 ${
              index < player.tokensInGoal ? theme.hudAccentClass : 'bg-white/20'
            }`}
            key={`${player.id}-progress-${index}`}
          />
        ))}
      </div>
    </article>
  )
})
PlayerHudCard.displayName = 'OnchainPlayerHudCard'

const TurnDiceLauncher = memo(function TurnDiceLauncher({
  isActive,
  canRoll,
  diceSkinId,
  rolling,
  dieA,
  dieB,
  preview,
  onRoll,
  surfacePalette,
  ui,
}: {
  isActive: boolean
  canRoll: boolean
  diceSkinId: DiceSkinId
  rolling: boolean
  dieA: null | number
  dieB: null | number
  preview: { dieA: DiceFaceValue; dieB: DiceFaceValue }
  onRoll: () => void
  surfacePalette: ReturnType<typeof getBoardThemeSurfacePalette>
  ui: OnchainUiCopy
}) {
  const isEnabled = isActive && canRoll && !rolling

  return (
    <div className="pointer-events-none mt-2 flex flex-col items-center gap-1.5">
      <button
        className={`pointer-events-auto flex items-center gap-2 rounded-2xl border px-2 py-2 transition-all ${
          isEnabled
            ? 'hover:-translate-y-0.5'
            : isActive
              ? 'cursor-not-allowed opacity-80'
              : 'cursor-not-allowed opacity-60'
        } ${rolling && isActive ? 'animate-pulse' : ''}`}
        disabled={!isEnabled}
        onClick={onRoll}
        style={{
          background: isEnabled ? surfacePalette.diceLauncherActiveBackground : surfacePalette.diceLauncherIdleBackground,
          borderColor: surfacePalette.diceLauncherBorder,
          boxShadow: isEnabled ? surfacePalette.diceLauncherRing : 'none',
        }}
        type="button"
      >
        <HudDie rolling={rolling && isActive} skinId={diceSkinId} value={rolling && isActive ? preview.dieA : dieA} />
        <HudDie rolling={rolling && isActive} skinId={diceSkinId} value={rolling && isActive ? preview.dieB : dieB} />
      </button>

      <span
        className="rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wide"
        style={{
          background: surfacePalette.hudPillBackground,
          borderColor: surfacePalette.hudPillBorder,
          color: surfacePalette.diceLauncherText,
        }}
      >
        {rolling && isActive ? ui.rolling : isActive ? (canRoll ? ui.clickToRoll : ui.diceAlreadyUsed) : ui.awaitingTurn}
      </span>
    </div>
  )
})
TurnDiceLauncher.displayName = 'OnchainTurnDiceLauncher'

const PlayerHudSlot = memo(function PlayerHudSlot({
  player,
  turnPlayerId,
  canRoll,
  diceSkinId,
  rolling,
  dieA,
  dieB,
  preview,
  onRoll,
  surfacePalette,
  ui,
}: {
  player?: MatchPlayer
  turnPlayerId: string
  canRoll: boolean
  diceSkinId: DiceSkinId
  rolling: boolean
  dieA: null | number
  dieB: null | number
  preview: { dieA: DiceFaceValue; dieB: DiceFaceValue }
  onRoll: () => void
  surfacePalette: ReturnType<typeof getBoardThemeSurfacePalette>
  ui: OnchainUiCopy
}) {
  if (!player) {
    return null
  }

  const isTurn = turnPlayerId === player.id

  return (
    <div className="pointer-events-none flex flex-col items-center">
      <PlayerHudCard isTurn={isTurn} player={player} surfacePalette={surfacePalette} ui={ui} />
      <TurnDiceLauncher
        canRoll={canRoll}
        diceSkinId={diceSkinId}
        dieA={dieA}
        dieB={dieB}
        isActive={isTurn}
        onRoll={onRoll}
        preview={preview}
        rolling={rolling}
        surfacePalette={surfacePalette}
        ui={ui}
      />
    </div>
  )
})
PlayerHudSlot.displayName = 'OnchainPlayerHudSlot'

const hudSlotColors: PlayerColor[] = ['green', 'red', 'yellow', 'blue']

const hudSlotPositionClassByColor: Record<PlayerColor, string> = {
  green: 'left-2 top-2 lg:left-4 lg:top-[17%] lg:-translate-y-1/2',
  red: 'right-2 top-2 lg:right-4 lg:top-[17%] lg:-translate-y-1/2',
  yellow: 'bottom-2 left-2 lg:bottom-[17%] lg:left-4 lg:translate-y-1/2',
  blue: 'bottom-2 right-2 lg:bottom-[17%] lg:right-4 lg:translate-y-1/2',
}

type OnchainBoardStageProps = {
  activePlayerAddress: string
  animatedTokenIds: string[]
  blockedSquares: number[]
  canRollAction: boolean
  diceSkinByPlayerId: Partial<Record<string, DiceSkinId>>
  dieA: null | number
  dieB: null | number
  expandedTokenId: null | string
  highlightedSquares: number[]
  highlightedTokenIds: string[]
  hudDicePreview: { dieA: DiceFaceValue; dieB: DiceFaceValue }
  hudDiceRolling: boolean
  onTokenClick: (tokenId: string) => void
  onTokenDiceChoiceHover: (tokenId: string, choiceId: null | string) => void
  onTokenDiceChoiceSelect: (_tokenId: string, choiceId: string) => void
  onTokenHover: (tokenId: string | null) => void
  players: MatchPlayer[]
  playersByColor: Partial<Record<PlayerColor, MatchPlayer>>
  safeSquares: number[]
  selectedDiceSkinId: DiceSkinId
  selectedTokenId: null | string
  surfacePalette: ReturnType<typeof getBoardThemeSurfacePalette>
  tokenDiceChoices: Record<string, Array<{ id: string; label: string; value: number }>>
  tokenHints: Record<string, string>
  tokens: MatchToken[]
  triggerHudDiceRoll: () => void
  ui: OnchainUiCopy
  visualSkinByColor: Partial<Record<PlayerColor, MatchPlayer['visualSkinId']>>
}

const OnchainBoardStage = memo(function OnchainBoardStage({
  activePlayerAddress,
  animatedTokenIds,
  blockedSquares,
  canRollAction,
  diceSkinByPlayerId,
  dieA,
  dieB,
  expandedTokenId,
  highlightedSquares,
  highlightedTokenIds,
  hudDicePreview,
  hudDiceRolling,
  onTokenClick,
  onTokenDiceChoiceHover,
  onTokenDiceChoiceSelect,
  onTokenHover,
  players,
  playersByColor,
  safeSquares,
  selectedDiceSkinId,
  selectedTokenId,
  surfacePalette,
  tokenDiceChoices,
  tokenHints,
  tokens,
  triggerHudDiceRoll,
  ui,
  visualSkinByColor,
}: OnchainBoardStageProps) {
  return (
    <div className="relative mx-auto max-w-[980px] pb-16 pt-16 lg:px-[150px] lg:pb-0 lg:pt-0">
      <Board3D
        animatingTokenIds={animatedTokenIds}
        blockedSquares={blockedSquares}
        expandedTokenId={expandedTokenId}
        highlightedSquares={highlightedSquares}
        movableTokenIds={highlightedTokenIds}
        onTokenClick={onTokenClick}
        onTokenDiceChoiceHover={onTokenDiceChoiceHover}
        onTokenHover={onTokenHover}
        onTokenDiceChoiceSelect={onTokenDiceChoiceSelect}
        players={players}
        safeSquares={safeSquares}
        selectedTokenId={selectedTokenId}
        surfacePalette={surfacePalette}
        tokenDiceChoices={tokenDiceChoices}
        tokenHints={tokenHints}
        tokens={tokens}
        visualSkinByColor={visualSkinByColor}
      />

      <div className="pointer-events-none absolute inset-0">
        {hudSlotColors.map((color) => {
          const player = playersByColor[color]

          return (
            <div className={`absolute ${hudSlotPositionClassByColor[color]}`} key={`hud-slot-${color}`}>
              <PlayerHudSlot
                canRoll={canRollAction}
                diceSkinId={player ? diceSkinByPlayerId[player.id] || selectedDiceSkinId : selectedDiceSkinId}
                dieA={dieA}
                dieB={dieB}
                onRoll={triggerHudDiceRoll}
                player={player}
                preview={hudDicePreview}
                rolling={hudDiceRolling}
                surfacePalette={surfacePalette}
                turnPlayerId={activePlayerAddress}
                ui={ui}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
})
OnchainBoardStage.displayName = 'OnchainBoardStage'

const tokenUiId = (owner: string, tokenId: number) => `${owner}-${tokenId}`

const trackEventToLog = (
  event: DojoTrackedEvent,
  addressLabel: (address: string) => string,
  colorBySeat: Record<number, PlayerColor>,
  language: 'en' | 'es',
): MatchLogEvent => {
  if (event.type === 'DiceRolled') {
    return {
      id: nextId('event-roll'),
      type: 'roll',
      message:
        language === 'es'
          ? `Dados lanzados: ${event.payload.dice_1} / ${event.payload.dice_2}`
          : `Dice rolled: ${event.payload.dice_1} / ${event.payload.dice_2}`,
      createdAt: Date.now(),
    }
  }

  if (event.type === 'QuestionDrawn') {
    return {
      id: nextId('event-question'),
      type: 'question',
      message:
        language === 'es'
          ? `Pregunta lista para ${event.payload.question_id.toString()}.`
          : `Question ready for ${event.payload.question_id.toString()}.`,
      createdAt: Date.now(),
    }
  }

  if (event.type === 'AnswerRevealed') {
    return {
      id: nextId('event-answer'),
      type: 'question',
      message:
        language === 'es'
          ? `${addressLabel(event.payload.player)} marco opcion ${event.payload.selected_option + 1} · ${event.payload.correct ? 'correcta' : 'incorrecta'}.`
          : `${addressLabel(event.payload.player)} picked option ${event.payload.selected_option + 1} · ${event.payload.correct ? 'correct' : 'incorrect'}.`,
      createdAt: Date.now(),
    }
  }

  if (event.type === 'AnswerResolved') {
    return {
      id: nextId('event-answer-status'),
      type: 'question',
      message:
        language === 'es'
          ? `${addressLabel(event.payload.player)} ${event.payload.correct ? 'respondio bien' : 'respondio mal'}.`
          : `${addressLabel(event.payload.player)} ${event.payload.correct ? 'answered correctly' : 'answered incorrectly'}.`,
      createdAt: Date.now(),
    }
  }

  if (event.type === 'TokenMoved') {
    const fromUi = mapSquareRefToUiPosition(event.payload.from_square_ref, colorBySeat)
    const toUi = mapSquareRefToUiPosition(event.payload.to_square_ref, colorBySeat)

    return {
      id: nextId('event-move'),
      type: 'move',
      message:
        language === 'es'
          ? `${addressLabel(event.payload.player)} mueve ficha ${event.payload.token_id + 1} de ${fromUi || '-'} a ${toUi || '-'}.`
          : `${addressLabel(event.payload.player)} moves token ${event.payload.token_id + 1} from ${fromUi || '-'} to ${toUi || '-'}.`,
      createdAt: Date.now(),
    }
  }

  if (event.type === 'TokenCaptured') {
    const squareUi = mapSquareRefToUiPosition(event.payload.square_ref, colorBySeat)

    return {
      id: nextId('event-capture'),
      type: 'capture',
      message:
        language === 'es'
          ? `${addressLabel(event.payload.attacker)} captura ficha ${event.payload.defender_token_id + 1} de ${addressLabel(event.payload.defender)} en ${squareUi || '-'}.`
          : `${addressLabel(event.payload.attacker)} captures token ${event.payload.defender_token_id + 1} from ${addressLabel(event.payload.defender)} on ${squareUi || '-'}.`,
      createdAt: Date.now(),
    }
  }

  if (event.type === 'TokenReachedHome') {
    return {
      id: nextId('event-home'),
      type: 'home',
      message:
        language === 'es'
          ? `${addressLabel(event.payload.player)} lleva ficha ${event.payload.token_id + 1} a meta (+${event.payload.bonus_awarded}).`
          : `${addressLabel(event.payload.player)} sends token ${event.payload.token_id + 1} home (+${event.payload.bonus_awarded}).`,
      createdAt: Date.now(),
    }
  }

  if (event.type === 'BridgeFormed' || event.type === 'BridgeBroken') {
    const squareUi = mapSquareRefToUiPosition(event.payload.square_ref, colorBySeat)

    return {
      id: nextId('event-bridge'),
      type: 'bridge',
      message:
        language === 'es'
          ? `${event.type === 'BridgeFormed' ? 'Puente formado' : 'Puente roto'} en ${squareUi || '-'} por ${addressLabel(event.payload.owner)}.`
          : `${event.type === 'BridgeFormed' ? 'Bridge formed' : 'Bridge broken'} on ${squareUi || '-'} by ${addressLabel(event.payload.owner)}.`,
      createdAt: Date.now(),
    }
  }

  if (event.type === 'TurnEnded') {
    return {
      id: nextId('event-turn-end'),
      type: 'move',
      message:
        language === 'es'
          ? `Turno ${event.payload.turn_index} finalizado. Siguiente: ${addressLabel(event.payload.next_player)}.`
          : `Turn ${event.payload.turn_index} ended. Next: ${addressLabel(event.payload.next_player)}.`,
      createdAt: Date.now(),
    }
  }

  return {
    id: nextId('event-win'),
    type: 'home',
    message:
      language === 'es'
        ? `Partida finalizada. Ganador: ${addressLabel(event.payload.winner)} (turno ${event.payload.turn_index}).`
        : `Match finished. Winner: ${addressLabel(event.payload.winner)} (turn ${event.payload.turn_index}).`,
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

type PendingTxPhase = 'confirming' | 'submitting' | 'syncing'

type OptimisticAnswerFeedback = {
  answerState: 'correct' | 'incorrect'
  selectedOption: number
}

type PendingQuestionPreview = Pick<DojoQuestionDrawnEvent, 'category' | 'deadline' | 'question_id' | 'question_index' | 'seed_nonce' | 'turn_index'>

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

  if (move.move_type === 5) {
    turnState.exited_home_this_turn = true
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
  nextSnapshot.turn_state.exited_home_this_turn = false
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

const applyQuestionDrawEventToSnapshot = (
  snapshot: DojoGameSnapshot,
  event: PendingQuestionPreview,
): DojoGameSnapshot => {
  const nextSnapshot = cloneSnapshot(snapshot)

  if (nextSnapshot.game && nextSnapshot.game.turn_index < event.turn_index) {
    nextSnapshot.game.turn_index = event.turn_index
  }

  if (nextSnapshot.turn_state) {
    nextSnapshot.turn_state.phase = 1
    nextSnapshot.turn_state.question_id = event.question_id
    nextSnapshot.turn_state.deadline = event.deadline
    nextSnapshot.turn_state.question_answered = false
    nextSnapshot.turn_state.question_correct = false
    nextSnapshot.turn_state.has_moved_token = false
    nextSnapshot.turn_state.exited_home_this_turn = false
    nextSnapshot.turn_state.first_moved_token_id = 0
  }

  nextSnapshot.pending_question = {
    game_id: nextSnapshot.game?.game_id ?? snapshot.game?.game_id ?? 0n,
    turn_index: event.turn_index,
    set_id: 1n,
    question_index: event.question_index,
    category: event.category,
    seed_nonce: event.seed_nonce,
  }

  return nextSnapshot
}

const stabilizeSnapshot = (
  nextSnapshot: DojoGameSnapshot,
  previousSnapshot: DojoGameSnapshot | null,
  latestQuestionDraw?: null | PendingQuestionPreview,
): DojoGameSnapshot => {
  if (!previousSnapshot) {
    return nextSnapshot
  }

  const mergedGame = nextSnapshot.game ?? previousSnapshot.game
  const mergedTurnState = nextSnapshot.turn_state ?? previousSnapshot.turn_state
  const previousTurnIndex = previousSnapshot.game?.turn_index ?? 0
  const previousQuestionId = previousSnapshot.turn_state?.question_id ?? 0n
  const keepPreviousPendingQuestion = (() => {
    if (nextSnapshot.pending_question) {
      return true
    }

    if (!previousSnapshot.pending_question || !mergedTurnState || mergedTurnState.phase !== 1) {
      return false
    }

    if ((mergedGame?.turn_index ?? 0) !== previousTurnIndex) {
      return false
    }

    if (mergedTurnState.question_id !== previousQuestionId) {
      return false
    }

    if (
      latestQuestionDraw &&
      (latestQuestionDraw.turn_index > (mergedGame?.turn_index ?? 0) ||
        latestQuestionDraw.question_id !== mergedTurnState.question_id)
    ) {
      return false
    }

    return true
  })()

  return {
    ...nextSnapshot,
    game: nextSnapshot.game ?? previousSnapshot.game,
    turn_state: nextSnapshot.turn_state ?? previousSnapshot.turn_state,
    dice_state: nextSnapshot.dice_state ?? previousSnapshot.dice_state,
    runtime_config: nextSnapshot.runtime_config ?? previousSnapshot.runtime_config,
    pending_question:
      nextSnapshot.pending_question ??
      (keepPreviousPendingQuestion ? previousSnapshot.pending_question : null),
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

const buildUiMovePath = (params: {
  color: PlayerColor
  currentUiPosition: number
  steps: number
  targetUiPosition: number
}): number[] => {
  if (params.currentUiPosition <= 0) {
    return params.targetUiPosition > 0 ? [params.targetUiPosition] : []
  }

  if (params.currentUiPosition >= 100) {
    const lane = finalLaneByColor[params.color]
    const laneIndex = lane.indexOf(params.currentUiPosition)

    if (laneIndex < 0) {
      return []
    }

    return lane.slice(laneIndex + 1, laneIndex + 1 + params.steps)
  }

  if (!isTrackPosition(params.currentUiPosition)) {
    return []
  }

  const path: number[] = []
  let current = params.currentUiPosition
  let remaining = params.steps
  const entersLane = params.targetUiPosition >= 100

  while (remaining > 0) {
    if (entersLane && current === entrySquareByColor[params.color]) {
      const lanePath = finalLaneByColor[params.color].slice(0, remaining)
      path.push(...lanePath)
      break
    }

    const next = wrapPosition(current + 1)
    path.push(next)
    current = next
    remaining -= 1
  }

  return path
}

const buildAuthoritativePlacements = (players: MatchPlayer[], snapshot: DojoGameSnapshot): FinalPlacement[] => {
  const playerByAddress = players.reduce<Record<string, MatchPlayer>>((acc, player) => {
    acc[normalizeAddressForCompare(player.id)] = player
    return acc
  }, {})

  const placements = snapshot.final_placements.reduce<FinalPlacement[]>((acc, placement) => {
      const player = playerByAddress[normalizeAddressForCompare(placement.player)]

      if (!player) {
        return acc
      }

      const rewardSummary: MatchRewardSummary = {
        baseCoins: placement.base_coins,
        baseXp: placement.base_xp,
        bonusCapturesXp: placement.bonus_captures_xp,
        bonusKnowledgeXp: placement.bonus_questions_xp,
        bonusParticipationXp: placement.bonus_participation_xp,
        captureCount: placement.bonus_captures_xp > 0 ? 1 : 0,
        correctAnswers: placement.bonus_questions_xp > 0 ? 1 : 0,
        place: placement.place as PodiumPlace,
        totalCoins: placement.total_coins,
        totalXp: placement.total_xp,
      }

      acc.push({
        id: player.id,
        avatar: player.avatar,
        color: player.color,
        goalCount: placement.goal_count,
        name: player.name,
        place: placement.place as PodiumPlace,
        progressScore: placement.progress_score,
        reward: placement.total_coins,
        rewardSummary,
        tag: player.name,
        visualSkinId: player.visualSkinId,
      })

      return acc
    }, [])

  return placements.sort((left, right) => left.place - right.place || left.progressScore - right.progressScore)
}

export function MatchOnchainView() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { account } = useAccount()
  const { address, username } = useControllerWallet()
  const language = useAppSettingsStore((state) => state.language)
  const selectedBoardThemeId = useAppSettingsStore((state) => state.selectedBoardThemeId)
  const selectedDiceSkinId = useAppSettingsStore((state) => state.selectedDiceSkinId)
  const selectedSkinId = useAppSettingsStore((state) => state.selectedSkinId)
  const selectedTokenSkinId = useAppSettingsStore((state) => state.selectedTokenSkinId)
  const selectedSkinSrc = getPlayerSkinSrc(selectedSkinId)
  const ui = onchainCopyByLanguage[language]
  const boardTheme = getBoardThemeDefinition(selectedBoardThemeId)
  const surfacePalette = getBoardThemeSurfacePalette(selectedBoardThemeId)
  const boardStageGlassTint = useMemo(() => buildBoardStageGlassTint(boardTheme.backgroundColor), [boardTheme.backgroundColor])

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
  const [expandedTokenId, setExpandedTokenId] = useState<null | string>(null)
  const [hoveredChoicePreview, setHoveredChoicePreview] = useState<null | { choiceId: string; tokenId: string }>(null)
  const [isLogOpen, setIsLogOpen] = useState(false)
  const [logEvents, setLogEvents] = useState<MatchLogEvent[]>([])
  const [txPendingLabel, setTxPendingLabel] = useState<null | string>(null)
  const [txPendingPhase, setTxPendingPhase] = useState<null | PendingTxPhase>(null)
  const [, setTxHash] = useState<null | string>(null)
  const [actionError, setActionError] = useState<null | string>(null)
  const [isAwaitingOnchainSync, setIsAwaitingOnchainSync] = useState(false)
  const [hudDiceRolling, setHudDiceRolling] = useState(false)
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<null | number>(null)
  const [questionSecondsLeft, setQuestionSecondsLeft] = useState(0)
  const [resolvedAnswerDisplay, setResolvedAnswerDisplay] = useState<null | ResolvedAnswerDisplay>(null)
  const [optimisticAnswerFeedback, setOptimisticAnswerFeedback] = useState<null | OptimisticAnswerFeedback>(null)
  const [rollNotice, setRollNotice] = useState<null | string>(null)
  const [animatedTokenIds, setAnimatingTokenIds] = useState<string[]>([])
  const [animatedTokenPositions, setAnimatedTokenPositions] = useState<Record<string, number>>({})
  const [hudDicePreview, setHudDicePreview] = useState<{ dieA: DiceFaceValue; dieB: DiceFaceValue }>({
    dieA: 1,
    dieB: 1,
  })
  const [finalPlacements, setFinalPlacements] = useState<FinalPlacement[]>([])
  const [activeAnnouncementPlacement, setActiveAnnouncementPlacement] = useState<FinalPlacement | null>(null)
  const [showFinalClassification, setShowFinalClassification] = useState(false)

  const refreshDebounceRef = useRef<null | number>(null)
  const hudRollIntervalRef = useRef<null | number>(null)
  const hudRollTimeoutRef = useRef<null | number>(null)
  const playersByAddressRef = useRef<Record<string, string>>({})
  const colorBySeatRef = useRef<Record<number, PlayerColor>>(seatColorMap)
  const lastResolvedQuestionRef = useRef<null | { difficulty: number; question: NonNullable<ReturnType<typeof getHydratedQuestion>> }>(null)
  const activePlayerCardRef = useRef<MatchPlayer | undefined>(undefined)
  const optimisticAnswerTimeoutRef = useRef<null | number>(null)
  const answerOverlayTimeoutRef = useRef<null | number>(null)
  const rollNoticeTimeoutRef = useRef<null | number>(null)
  const winnerAnnouncementTimeoutRef = useRef<null | number>(null)
  const lastAnnouncedWinnerRef = useRef<null | string>(null)
  const onTrackedEventRef = useRef<(event: DojoTrackedEvent) => void>(() => undefined)
  const winnerSoundPlayedRef = useRef(false)
  const podiumSoundPlayedRef = useRef(false)
  const latestQuestionDrawRef = useRef<null | PendingQuestionPreview>(null)
  const timeoutSkipKeyRef = useRef<string | null>(null)

  useEffect(() => {
    setGameIdInput(searchParams.get('gameId') || '')
    setTokenIdInput(searchParams.get('tokenId') || '')
  }, [searchParams])

  const applyBoardQuery = useCallback(
    (mode: 'game' | 'token') => {
      const nextSearchParams = new URLSearchParams(searchParams)
      const trimmedGameId = gameIdInput.trim()
      const trimmedTokenId = tokenIdInput.trim()

      if (mode === 'game') {
        if (trimmedGameId) {
          nextSearchParams.set('gameId', trimmedGameId)
        } else {
          nextSearchParams.delete('gameId')
        }

        nextSearchParams.delete('tokenId')
      } else {
        if (trimmedTokenId) {
          nextSearchParams.set('tokenId', trimmedTokenId)
        } else {
          nextSearchParams.delete('tokenId')
        }

        nextSearchParams.delete('gameId')
      }

      setSearchParams(nextSearchParams, { replace: true })
    },
    [gameIdInput, searchParams, setSearchParams, tokenIdInput],
  )

  const clearBoardQuery = useCallback(() => {
    setGameIdInput('')
    setTokenIdInput('')
    setSearchParams(new URLSearchParams(), { replace: true })
  }, [setSearchParams])

  const requestedGameId = useMemo(() => parseBigNumberish(gameIdInput), [gameIdInput])
  const activeTokenId = useMemo(() => parseBigNumberish(tokenIdInput), [tokenIdInput])
  const activeGameId = requestedGameId ?? linkedTokenGameId

  useEffect(() => {
    lastAnnouncedWinnerRef.current = null
    lastResolvedQuestionRef.current = null
    winnerSoundPlayedRef.current = false
    podiumSoundPlayedRef.current = false
    setActiveAnnouncementPlacement(null)
    setResolvedAnswerDisplay(null)
    setShowFinalClassification(false)
  }, [activeGameId])

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
          setLinkedTokenStatus(
            language === 'es' ? 'Token sin partida vinculada todavia.' : 'Token is not linked to a match yet.',
          )
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
  }, [activeTokenId, language])

  const refreshSnapshot = useCallback(async () => {
    if (!activeGameId || !isDojoConfigured) {
      setSnapshot(null)
      return
    }

    try {
      const nextSnapshot = await readDojoGameSnapshot(activeGameId, {
        includeBoardSquares: true,
        includePlayerCustomizations: true,
      })
      setSnapshot((current) => stabilizeSnapshot(nextSnapshot, current, latestQuestionDrawRef.current))
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
  const legalMovesRefreshKey = useMemo(() => {
    if (!snapshot?.turn_state || snapshot.turn_state.phase !== 2) {
      return 'idle'
    }

    const activeBonus = snapshot.bonus_states.find(
      (bonus) => normalizeAddressForCompare(bonus.player) === normalizeAddressForCompare(activePlayerAddress),
    )

    return [
      activePlayerAddress,
      snapshot.turn_state.phase,
      snapshot.turn_state.has_moved_token ? '1' : '0',
      snapshot.turn_state.first_moved_token_id,
      snapshot.dice_state?.die_a ?? '-',
      snapshot.dice_state?.die_b ?? '-',
      snapshot.dice_state?.die_a_used ? '1' : '0',
      snapshot.dice_state?.die_b_used ? '1' : '0',
      snapshot.dice_state?.sum_used ? '1' : '0',
      activeBonus?.pending_bonus_10 ?? 0,
      activeBonus?.pending_bonus_20 ?? 0,
      activeBonus?.bonus_consumed ? '1' : '0',
    ].join('|')
  }, [activePlayerAddress, snapshot])

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
      const avatarSrc = getPlayerSkinSrc(avatarSkinId)
      const visualSkinId = customization
        ? tokenSkinIdFromIndex(customization.token_skin_id)
        : isSelf
          ? selectedTokenSkinId
          : undefined

      return {
        id: player.player,
        name: baseName,
        color,
        avatar: avatarSrc || (isSelf && selectedSkinSrc ? selectedSkinSrc : color.slice(0, 2).toUpperCase()),
        visualSkinId,
        tokensInBase: player.tokens_in_base,
        tokensInGoal: player.tokens_in_goal,
        isHost: player.is_host,
      }
    })
  }, [getUsername, snapshot, normalizedWalletAddress, selectedSkinSrc, selectedTokenSkinId, username])

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

  const authoritativePlacements = useMemo(() => {
    if (!snapshot || players.length === 0 || snapshot.final_placements.length === 0) {
      return []
    }

    return buildAuthoritativePlacements(players, snapshot)
  }, [players, snapshot])

  const winnerAddress = useMemo(() => {
    const winner = snapshot?.game?.winner
    const normalizedWinner = normalizeAddressForCompare(winner)
    return normalizedWinner === '0x0' ? null : winner || null
  }, [snapshot?.game?.winner])

  useEffect(() => {
    setFinalPlacements(authoritativePlacements)
  }, [authoritativePlacements])

  useEffect(() => {
    if (winnerAnnouncementTimeoutRef.current !== null) {
      window.clearTimeout(winnerAnnouncementTimeoutRef.current)
      winnerAnnouncementTimeoutRef.current = null
    }

    if (!winnerAddress || authoritativePlacements.length === 0) {
      if (!snapshot) {
        setActiveAnnouncementPlacement(null)
        setShowFinalClassification(false)
        lastAnnouncedWinnerRef.current = null
      }
      return
    }

    const winnerKey = normalizeAddressForCompare(winnerAddress)
    const winnerPlacement = authoritativePlacements.find(
      (placement) => normalizeAddressForCompare(placement.id) === winnerKey,
    )

    if (!winnerPlacement) {
      return
    }

    if (lastAnnouncedWinnerRef.current === winnerKey) {
      return
    }

    if (!winnerSoundPlayedRef.current) {
      playSoundEffect('winner')
      winnerSoundPlayedRef.current = true
    }

    lastAnnouncedWinnerRef.current = winnerKey
    setActiveAnnouncementPlacement(winnerPlacement)
    setShowFinalClassification(false)
    winnerAnnouncementTimeoutRef.current = window.setTimeout(() => {
      setActiveAnnouncementPlacement(null)
      setShowFinalClassification(true)
      winnerAnnouncementTimeoutRef.current = null
    }, 3200)
  }, [authoritativePlacements, snapshot, winnerAddress])

  useEffect(() => {
    if (!showFinalClassification || finalPlacements.length === 0 || podiumSoundPlayedRef.current) {
      return
    }

    playSoundEffect('podium')
    podiumSoundPlayedRef.current = true
  }, [finalPlacements.length, showFinalClassification])

  const safeSquares = useMemo(() => {
    const source = snapshot?.safe_track_square_refs.length
      ? snapshot.safe_track_square_refs
      : BOARD_DEFAULT_SAFE_TRACK_REFS

    return source.map((trackSquareRef) => mapTrackSquareRefToUi(trackSquareRef))
  }, [snapshot?.safe_track_square_refs])

  const activePendingQuestion = useMemo(() => {
    if (!snapshot?.pending_question || !snapshot.turn_state || snapshot.turn_state.phase !== 1) {
      return null
    }

    const hydrated = getHydratedQuestion(
      snapshot.pending_question.question_index,
      snapshot.pending_question.category,
      language,
      {
        questionId: snapshot.turn_state.question_id,
        seedNonce: snapshot.pending_question.seed_nonce,
      },
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
    if (activePendingQuestion && snapshot?.pending_question) {
      lastResolvedQuestionRef.current = {
        difficulty: activePendingQuestion.difficulty,
        question: activePendingQuestion,
      }
    }
  }, [activePendingQuestion, snapshot?.pending_question])

  const modalQuestion = useMemo(() => {
    if (!activePendingQuestion) {
      return null
    }

    return {
      category: ui.questionCategory,
      correctIndex: activePendingQuestion.displayCorrectOption,
      difficulty: localDifficultyToTriviaDifficulty(activePendingQuestion.difficulty),
      icon: '❓',
      id: activePendingQuestion.id,
      options: activePendingQuestion.displayOptions,
      prompt: activePendingQuestion.displayPrompt,
      theme: 'blue' as const,
    }
  }, [activePendingQuestion, ui.questionCategory])

  const shouldShowQuestionModal = useMemo(() => {
    if (!modalQuestion || snapshot?.turn_state?.phase !== 1) {
      return false
    }

    if (optimisticAnswerFeedback) {
      return true
    }

    return questionSecondsLeft > 0
  }, [modalQuestion, optimisticAnswerFeedback, questionSecondsLeft, snapshot?.turn_state?.phase])

  useEffect(() => {
    if (!snapshot?.turn_state || snapshot.turn_state.phase !== 1) {
      timeoutSkipKeyRef.current = null
      setQuestionSecondsLeft(0)
      return
    }

    const syncSecondsLeft = () => {
      const deadlineSeconds = Number(snapshot.turn_state?.deadline ?? 0n)
      const nowSeconds = Math.floor(Date.now() / 1000)
      setQuestionSecondsLeft(Math.max(0, deadlineSeconds - nowSeconds))
    }

    syncSecondsLeft()
    const intervalId = window.setInterval(syncSecondsLeft, 1000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [snapshot?.turn_state])

  useEffect(() => {
    if (optimisticAnswerTimeoutRef.current !== null) {
      window.clearTimeout(optimisticAnswerTimeoutRef.current)
      optimisticAnswerTimeoutRef.current = null
    }
    setSelectedAnswerIndex(null)
    setOptimisticAnswerFeedback(null)
  }, [snapshot?.turn_state?.question_id, snapshot?.turn_state?.phase])

  useEffect(() => {
    setSelectedTokenId(null)
    setExpandedTokenId(null)
    setHoveredChoicePreview(null)
    setAnimatingTokenIds([])
    setAnimatedTokenPositions({})
  }, [snapshot?.turn_state?.phase, snapshot?.turn_state?.question_id, snapshot?.turn_state?.deadline])

  useEffect(() => {
    return () => {
      if (optimisticAnswerTimeoutRef.current !== null) {
        window.clearTimeout(optimisticAnswerTimeoutRef.current)
      }
      if (answerOverlayTimeoutRef.current !== null) {
        window.clearTimeout(answerOverlayTimeoutRef.current)
      }
      if (rollNoticeTimeoutRef.current !== null) {
        window.clearTimeout(rollNoticeTimeoutRef.current)
      }
      if (winnerAnnouncementTimeoutRef.current !== null) {
        window.clearTimeout(winnerAnnouncementTimeoutRef.current)
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
        setAnimatedTokenPositions({ [tokenId]: nextPosition })
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

  const onTrackedEvent = useCallback(
    (event: DojoTrackedEvent) => {
      const nextLog = trackEventToLog(event, playerLabelFromAddress, colorBySeatRef.current, language)

      if (event.type === 'DiceRolled') {
        const rollerName = activePlayerCardRef.current?.name || 'Jugador'
        setRollNotice(
          language === 'es'
            ? `${rollerName} tiro ${event.payload.dice_1} y ${event.payload.dice_2}.`
            : `${rollerName} rolled ${event.payload.dice_1} and ${event.payload.dice_2}.`,
        )

        if (rollNoticeTimeoutRef.current !== null) {
          window.clearTimeout(rollNoticeTimeoutRef.current)
        }

        rollNoticeTimeoutRef.current = window.setTimeout(() => {
          setRollNotice(null)
          rollNoticeTimeoutRef.current = null
        }, 2200)
      }

      if (event.type === 'QuestionDrawn') {
        latestQuestionDrawRef.current = event.payload
        setSnapshot((current) =>
          current ? applyQuestionDrawEventToSnapshot(current, event.payload) : current,
        )
        scheduleSnapshotRefresh()
        window.setTimeout(() => {
          if (
            latestQuestionDrawRef.current?.question_id === event.payload.question_id &&
            latestQuestionDrawRef.current?.turn_index === event.payload.turn_index
          ) {
            scheduleSnapshotRefresh()
          }
        }, 500)
      }

      if (event.type === 'AnswerRevealed' && lastResolvedQuestionRef.current) {
        if (
          normalizeAddressForCompare(event.payload.player) !== normalizedWalletAddress ||
          selectedAnswerIndex === null
        ) {
          const { difficulty, question } = lastResolvedQuestionRef.current
          const answerState = event.payload.correct ? 'correct' : 'incorrect'
          const player = playersByAddress[normalizeAddressForCompare(event.payload.player)] || activePlayerCardRef.current

          setResolvedAnswerDisplay({
            answerState,
            player,
            question: {
              category: ui.questionCategory,
              correctIndex: mapCanonicalOptionToDisplay(question, question.correctOption),
              difficulty: localDifficultyToTriviaDifficulty(difficulty as 0 | 1 | 2),
              icon: '❓',
              id: `resolved-${event.payload.question_id.toString()}`,
              options: question.displayOptions,
              prompt: question.displayPrompt,
              theme: 'blue',
            },
            selectedOption: mapCanonicalOptionToDisplay(question, event.payload.selected_option),
          })

          if (answerOverlayTimeoutRef.current !== null) {
            window.clearTimeout(answerOverlayTimeoutRef.current)
          }

          answerOverlayTimeoutRef.current = window.setTimeout(() => {
            setResolvedAnswerDisplay(null)
            answerOverlayTimeoutRef.current = null
          }, 1800)
        }
      }

      const normalizedAddress = normalizeAddressForCompare(address)

      if (normalizedAddress) {
        if (event.type === 'AnswerRevealed' && event.payload.correct) {
          const eventPlayer = normalizeAddressForCompare(event.payload.player)
          if (eventPlayer === normalizedAddress) {
            playSoundEffect('correct')
          }
        }

        if (event.type === 'AnswerRevealed' && !event.payload.correct) {
          const eventPlayer = normalizeAddressForCompare(event.payload.player)

          if (eventPlayer === normalizedAddress) {
            playSoundEffect('incorrect')
          }
        }

        if (event.type === 'TokenCaptured') {
          playSoundEffect('capture')
        }
      }

      if (event.type === 'TokenMoved') {
        const tokenId = tokenUiId(event.payload.player, event.payload.token_id)
        const fromUi = mapSquareRefToUiPosition(event.payload.from_square_ref, colorBySeatRef.current)
        const toUi = mapSquareRefToUiPosition(event.payload.to_square_ref, colorBySeatRef.current)
        const seat = seatByAddress[normalizeAddressForCompare(event.payload.player)] ?? 0
        const color = colorBySeatRef.current[seat] || 'green'

        if (fromUi > 0 && toUi > 0) {
          void (async () => {
            await animateTokenPath(
              tokenId,
              buildUiMovePath({
                color,
                currentUiPosition: fromUi,
                steps: event.payload.die_value,
                targetUiPosition: toUi,
              }),
            )
            setAnimatedTokenPositions((current) => {
              if (!(tokenId in current)) {
                return current
              }

              const next = { ...current }
              delete next[tokenId]
              return next
            })
          })()
        }
      }

      setLogEvents((current) => [nextLog, ...current].slice(0, 120))
    },
    [address, animateTokenPath, language, normalizedWalletAddress, playerLabelFromAddress, playersByAddress, scheduleSnapshotRefresh, seatByAddress, selectedAnswerIndex, ui.questionCategory],
  )

  useEffect(() => {
    onTrackedEventRef.current = onTrackedEvent
  }, [onTrackedEvent])

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
          includeBoardSquares: true,
          includePlayerCustomizations: true,
        })

        if (cancelled) {
          return
        }

        setSnapshot((current) => stabilizeSnapshot(initialSnapshot, current, latestQuestionDrawRef.current))

        unsubscribe = await subscribeDojoGame({
          gameId: activeGameId,
          configId: initialSnapshot.game?.config_id,
          onStateMutation: scheduleSnapshotRefresh,
          onTrackedEvent: (event) => onTrackedEventRef.current(event),
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
  }, [activeGameId, scheduleSnapshotRefresh])

  useEffect(() => {
    if (activeGameId === null || snapshot?.turn_state?.phase !== 2 || isAwaitingOnchainSync) {
      setLegalMoves([])
      setSelectedTokenId(null)
      return
    }

    const gameId = activeGameId

    let cancelled = false

    const loadLegalMoves = async () => {
      try {
        const nextMoves = await computeLegalMoves(gameId)

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
  }, [activeGameId, isAwaitingOnchainSync, legalMovesRefreshKey, snapshot?.turn_state?.phase])

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
    if (hoveredChoicePreview) {
      return uiLegalMoves.filter(
        (move) => move.tokenUiId === hoveredChoicePreview.tokenId && move.id === hoveredChoicePreview.choiceId,
      )
    }

    if (!selectedTokenId) {
      return uiLegalMoves
    }

    return uiLegalMoves.filter((move) => move.tokenUiId === selectedTokenId)
  }, [hoveredChoicePreview, selectedTokenId, uiLegalMoves])

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
        setActionError(
          language === 'es'
            ? 'Conecta Controller Wallet para ejecutar transacciones on-chain.'
            : 'Connect your Controller Wallet to run on-chain transactions.',
        )
        return
      }

      setActionError(null)
      setTxPendingLabel(label)
      setTxPendingPhase('submitting')
      setTxHash(null)
      setIsAwaitingOnchainSync(false)
      options?.onOptimistic?.()

      try {
        const submittedHash = await action()
        setTxHash(submittedHash)
        setTxPendingPhase('confirming')

        await account.waitForTransaction(submittedHash)
        setTxPendingPhase('syncing')
        setIsAwaitingOnchainSync(true)
        await Promise.all([Promise.resolve(options?.onConfirmed?.()), refreshSnapshot()])
        setTxPendingLabel(null)
        setTxPendingPhase(null)
        setIsAwaitingOnchainSync(false)

        if (activeTokenId !== null) {
          void readEgsTokenGameLink(activeTokenId)
            .then((link) => {
              setLinkedTokenGameId(link?.game_id ?? null)
              setLinkedTokenStatus(
                link
                  ? language === 'es'
                    ? `Token vinculado a game_id ${link.game_id.toString()} · score ${link.score.toString()} · status ${link.lifecycle_status}`
                    : `Token linked to game_id ${link.game_id.toString()} · score ${link.score.toString()} · status ${link.lifecycle_status}`
                  : language === 'es'
                    ? 'Token sin partida vinculada todavia.'
                    : 'Token is not linked to a match yet.',
              )
            })
            .catch(() => undefined)
        }
      } catch (error) {
        options?.onRollback?.()
        setActionError(mapErrorToUserMessage(error))
      } finally {
        setTxPendingLabel(null)
        setTxPendingPhase(null)
        setIsAwaitingOnchainSync(false)
      }
    },
    [account, activeGameId, activeTokenId, language, refreshSnapshot],
  )

  useEffect(() => {
    if (
      !account ||
      !activeGameId ||
      !isMyTurn ||
      snapshot?.turn_state?.phase !== 1 ||
      txPendingLabel ||
      questionSecondsLeft > 0
    ) {
      timeoutSkipKeyRef.current = null
      return
    }

    const turnKey = `${activeGameId.toString()}:${snapshot.turn_state.question_id.toString()}:${snapshot.turn_state.deadline.toString()}`
    if (timeoutSkipKeyRef.current === turnKey) {
      return
    }

    timeoutSkipKeyRef.current = turnKey
    const previousSnapshot = snapshot ? cloneSnapshot(snapshot) : null

    void runTransaction('Force skip timeout', () => forceSkipTurn(account, activeGameId), {
      onOptimistic: () => {
        setSnapshot((current) => (current ? applyOptimisticEndTurnToSnapshot(current) : current))
      },
      onRollback: () => {
        if (previousSnapshot) {
          setSnapshot(previousSnapshot)
        }
      },
    })
  }, [account, activeGameId, isMyTurn, questionSecondsLeft, runTransaction, snapshot, snapshot?.turn_state, txPendingLabel])

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
            setHoveredChoicePreview(null)
            setSelectedTokenId(move.tokenUiId)
            setLegalMoves([])
            setSnapshot((current) =>
              current ? applyOptimisticMoveToSnapshot(current, activePlayerAddress, move) : current,
            )

            void (async () => {
              if (movingToken) {
                const path = buildUiMovePath({
                  color: currentColor,
                  currentUiPosition,
                  steps: move.steps,
                  targetUiPosition: move.targetUiPosition,
                })
                await animateTokenPath(move.tokenUiId, path)
              }

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
    if (!account || !activeGameId || snapshot?.game?.turn_index === undefined) {
      return
    }

    void runTransaction('Roll + question (VRF)', () => rollTwoDiceAndDrawQuestion(account, activeGameId))
  }, [account, activeGameId, runTransaction, snapshot?.game?.turn_index])

  const onSelectAnswer = useCallback(
    (optionIndex: number) => {
      if (!account || !activeGameId || !snapshot?.pending_question || !snapshot?.turn_state || !activePendingQuestion) {
        return
      }

      const pendingQuestion = snapshot.pending_question
      const turnState = snapshot.turn_state
      const canonicalOption = mapDisplayOptionToCanonical(activePendingQuestion, optionIndex)
      const answerState = canonicalOption === activePendingQuestion.correctOption ? 'correct' : 'incorrect'

      if (optimisticAnswerTimeoutRef.current !== null) {
        window.clearTimeout(optimisticAnswerTimeoutRef.current)
      }

      setSelectedAnswerIndex(optionIndex)
      setOptimisticAnswerFeedback({ answerState, selectedOption: optionIndex })
      optimisticAnswerTimeoutRef.current = window.setTimeout(() => {
        setOptimisticAnswerFeedback(null)
        optimisticAnswerTimeoutRef.current = null
      }, answerState === 'correct' ? 450 : 350)

      void runTransaction(
        'Submitting answer',
        () =>
          submitAnswer(account, activeGameId, {
            questionId: turnState.question_id,
            questionIndex: pendingQuestion.question_index,
            category: pendingQuestion.category,
            correctOption: activePendingQuestion.correctOption,
            selectedOption: canonicalOption,
            merkleProof: activePendingQuestion.merkleProof,
            merkleDirections: activePendingQuestion.merkleDirections,
          }),
        {
          onOptimistic: () => {
            if (answerState === 'incorrect') {
              setSnapshot((current) => (current ? applyOptimisticEndTurnToSnapshot(current) : current))
            }
          },
          onRollback: () => {
            setOptimisticAnswerFeedback(null)
            setSelectedAnswerIndex(null)
          },
        },
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
      setHoveredChoicePreview(null)

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
        setHoveredChoicePreview(null)
        return
      }

      if ((tokenDiceChoices[tokenId] || []).length > 1) {
        setExpandedTokenId(tokenId)
        return
      }

      setHoveredChoicePreview(null)
    },
    [movementEnabled, tokenDiceChoices],
  )

  const onTokenDiceChoiceHover = useCallback(
    (tokenId: string, choiceId: null | string) => {
      if (!movementEnabled || !choiceId) {
        setHoveredChoicePreview(null)
        return
      }

      setHoveredChoicePreview({ tokenId, choiceId })
    },
    [movementEnabled],
  )

  const onTokenDiceChoiceSelect = useCallback(
    (_tokenId: string, choiceId: string) => {
      if (!movementEnabled) {
        return
      }

      setHoveredChoicePreview(null)
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
  const pendingStatusMessage = useMemo(() => {
    if (!txPendingLabel || !txPendingPhase) {
      return null
    }

    return formatPendingActionLabel(txPendingLabel, txPendingPhase, language)
  }, [language, txPendingLabel, txPendingPhase])
  const visualSkinByColor = useMemo(() => {
    return players.reduce<Partial<Record<PlayerColor, MatchPlayer['visualSkinId']>>>((acc, player) => {
      acc[player.color] = player.visualSkinId
      return acc
    }, {})
  }, [players])
  const diceSkinByPlayerId = useMemo(() => {
    const customizationByPlayer = new Map(
      snapshot?.player_customizations.map((customization) => [normalizeAddressForCompare(customization.player), customization]) || [],
    )

    return players.reduce<Partial<Record<string, DiceSkinId>>>((acc, player) => {
      const customization = customizationByPlayer.get(normalizeAddressForCompare(player.id))

      acc[player.id] = customization
        ? diceSkinIdFromIndex(customization.dice_skin_id)
        : normalizeAddressForCompare(player.id) === normalizedWalletAddress
          ? selectedDiceSkinId
          : getDefaultDiceSkinIdByColor(player.color)

      return acc
    }, {})
  }, [normalizedWalletAddress, players, selectedDiceSkinId, snapshot?.player_customizations])
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

  const activeAnnouncementTheme = activeAnnouncementPlacement
    ? getPlayerVisualThemeByColor(activeAnnouncementPlacement.color, activeAnnouncementPlacement.visualSkinId)
    : null
  const announcementGlassTint = announcementGlassTintByThemeId[selectedBoardThemeId]
  const announcementGlassPanelStyle = {
    backdropFilter: 'blur(28px) saturate(145%)',
    background: `linear-gradient(180deg, ${announcementGlassTint.highlight} 0%, rgba(255,255,255,0.1) 16%, rgba(255,255,255,0.03) 100%), linear-gradient(135deg, ${announcementGlassTint.tintA} 0%, ${announcementGlassTint.tintB} 100%)`,
    borderColor: announcementGlassTint.border,
    boxShadow: `inset 0 1px 0 rgba(255,255,255,0.32), inset 0 -18px 28px rgba(255,255,255,0.05), 0 26px 48px ${announcementGlassTint.shadow}`,
  } satisfies CSSProperties
  const announcementGlassInnerStyle = {
    backdropFilter: 'blur(22px) saturate(140%)',
    background: `linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.06) 24%, rgba(255,255,255,0.03) 100%), linear-gradient(135deg, ${announcementGlassTint.tintA} 0%, ${announcementGlassTint.tintB} 100%)`,
    borderColor: announcementGlassTint.border,
    boxShadow: `inset 0 1px 0 rgba(255,255,255,0.24), inset 0 -10px 22px rgba(255,255,255,0.04), 0 16px 28px ${announcementGlassTint.shadow}`,
  } satisfies CSSProperties
  const announcementGlassSheenStyle = {
    background:
      'linear-gradient(180deg, rgba(255,255,255,0.34) 0%, rgba(255,255,255,0.12) 38%, rgba(255,255,255,0.02) 100%)',
  } satisfies CSSProperties
  const announcementGlassButtonStyle = {
    backdropFilter: 'blur(22px) saturate(145%)',
    background: `linear-gradient(180deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.12) 20%, rgba(255,255,255,0.05) 100%), linear-gradient(135deg, ${announcementGlassTint.tintA} 0%, ${announcementGlassTint.tintB} 100%)`,
    borderColor: announcementGlassTint.border,
    boxShadow: `inset 0 1px 0 rgba(255,255,255,0.34), inset 0 -10px 18px rgba(255,255,255,0.05), 0 14px 24px ${announcementGlassTint.shadow}`,
  } satisfies CSSProperties
  const activeAnnouncementTitle = activeAnnouncementPlacement
    ? language === 'es'
      ? `¡${activeAnnouncementPlacement.name} ${ui.placeAnnouncementLabel[Math.min(activeAnnouncementPlacement.place, 3) as 1 | 2 | 3]}!`
      : `${activeAnnouncementPlacement.name} ${ui.placeAnnouncementLabel[Math.min(activeAnnouncementPlacement.place, 3) as 1 | 2 | 3]}!`
    : ''
  const activeAnnouncementPlaceNumber = activeAnnouncementPlacement ? Math.min(activeAnnouncementPlacement.place, 3) : null
  const activeAnnouncementSubtitle = activeAnnouncementPlacement ? `${ui.congrats}, ${activeAnnouncementPlacement.name}.` : ''

  return (
    <section
      className="min-h-screen bg-cover bg-center bg-no-repeat px-3 py-4 sm:px-4 sm:py-6"
      style={{ backgroundColor: boardTheme.backgroundColor, backgroundImage: boardTheme.backgroundImage }}
    >
      <div className="mx-auto w-full max-w-[1480px]">
        {!isDojoConfigured ? (
          <article
            className="game-panel mx-auto max-w-[900px] p-5 text-center xl:p-6"
            style={{ backgroundImage: surfacePalette.mainPanelBackground, borderColor: surfacePalette.mainPanelBorder }}
          >
            <div className="rounded-[28px] border p-6 shadow-wood" style={announcementGlassInnerStyle}>
              <p className="font-display text-3xl uppercase tracking-[0.08em]" style={{ color: surfacePalette.headerText }}>
                {ui.dojoDisabledTitle}
              </p>
              <p className="mx-auto mt-3 max-w-[620px] text-sm font-semibold leading-6" style={{ color: surfacePalette.hudCardText }}>
                {ui.dojoDisabledBody}
              </p>
            </div>
          </article>
        ) : activeGameId !== null ? (
          <article
            className="game-panel mx-auto p-3 xl:p-4"
            style={{
              backdropFilter: 'blur(26px) saturate(155%)',
              WebkitBackdropFilter: 'blur(26px) saturate(155%)',
              backgroundColor: boardStageGlassTint.tint,
              backgroundImage: `linear-gradient(180deg, ${boardStageGlassTint.panelTop} 0%, ${boardStageGlassTint.panelMid} 42%, ${boardStageGlassTint.panelBottom} 100%)`,
              borderColor: boardStageGlassTint.border,
              boxShadow: `inset 0 1px 0 ${boardStageGlassTint.highlight}, inset 0 -12px 22px rgba(255,255,255,0.04), 0 20px 50px ${boardStageGlassTint.shadow}, 0 0 26px ${boardStageGlassTint.glow}`,
            }}
          >
            <div
              className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-3 py-2 shadow-wood"
              style={{
                backgroundColor: rgbaFromHex(boardTheme.backgroundColor, 0.22),
                backgroundImage: `linear-gradient(180deg, ${rgbaFromRgb(mixHexColors(boardTheme.backgroundColor, '#ffffff', 0.28), 0.34)} 0%, ${rgbaFromRgb(mixHexColors(boardTheme.backgroundColor, '#ffffff', 0.1), 0.18)} 100%)`,
                backdropFilter: 'blur(18px) saturate(150%)',
                WebkitBackdropFilter: 'blur(18px) saturate(150%)',
                borderColor: rgbaFromRgb(mixHexColors(boardTheme.backgroundColor, '#ffffff', 0.72), 0.26),
                boxShadow: `inset 0 1px 0 ${rgbaFromRgb(mixHexColors(boardTheme.backgroundColor, '#ffffff', 0.92), 0.2)}, 0 10px 26px rgba(12,16,32,0.14)`,
              }}
            >
              <p className="font-display text-xl uppercase tracking-[0.08em]" style={{ color: surfacePalette.headerText }}>
                {ui.boardTitle}
              </p>
              <div className="flex items-center gap-2">
                <span
                  className="rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em]"
                  style={{
                    backgroundImage: surfacePalette.badgeBackground,
                    borderColor: surfacePalette.badgeBorder,
                    color: surfacePalette.badgeText,
                  }}
                >
                  {ui.dojoBadge}
                </span>
                <button
                  className="rounded-full border px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.14em] shadow-[inset_0_1px_0_rgba(255,255,255,0.32),0_4px_10px_rgba(0,0,0,0.12)] transition hover:-translate-y-0.5 hover:brightness-105"
                  onClick={() => setIsLogOpen(true)}
                  style={{
                    background: `linear-gradient(180deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.1) 100%), ${surfacePalette.hudPillBackground}`,
                    borderColor: surfacePalette.hudPillBorder,
                    color: surfacePalette.hudPillText,
                    textShadow: '0 1px 0 rgba(0,0,0,0.18)',
                  }}
                  type="button"
                >
                  🧾 {ui.logLabel}
                </button>
              </div>
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
                {ui.loadBoard}
              </div>
            ) : null}

            {isResolvingTokenLink || linkedTokenStatus ? (
              <div
                className="mb-3 rounded-2xl border px-4 py-3 text-sm font-bold shadow-[0_6px_18px_rgba(72,54,8,0.12)]"
                style={{
                  background: surfacePalette.accentPanelBackground,
                  borderColor: surfacePalette.mainPanelBorder,
                  color: surfacePalette.badgeText,
                }}
              >
                {isResolvingTokenLink ? ui.linkPending : `${ui.tokenLinkLabel}: ${linkedTokenStatus}`}
              </div>
            ) : null}

            {rollNotice ? (
              <div className="mb-3 rounded-2xl border border-[#7f5b24] bg-[#fff4d3] px-4 py-3 text-sm font-bold text-[#65431a] shadow-[0_6px_18px_rgba(72,54,8,0.12)]">
                {rollNotice}
              </div>
            ) : null}

            {pendingStatusMessage ? (
              <div className="mb-3 rounded-2xl border border-[#4a6f9f] bg-[#ecf5ff] px-4 py-3 text-sm font-bold text-[#19416b] shadow-[0_6px_18px_rgba(30,73,120,0.12)]">
                {pendingStatusMessage}
              </div>
            ) : null}

            {snapshot?.turn_state?.phase === 2 && isMyTurn ? (
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#7f5b24] bg-[#fff4d3] px-4 py-3 shadow-[0_6px_18px_rgba(72,54,8,0.12)]">
                <div className="text-sm font-bold text-[#65431a]">
                  {legalMoves.length > 0 ? ui.selectTokenToMove : ui.noMovesLeft}
                </div>
                <button
                  className="rounded-full border border-[#7b4e15] bg-gradient-to-b from-[#ffd670] to-[#e6aa1b] px-4 py-2 text-sm font-black uppercase tracking-[0.12em] text-[#5a3507] shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_4px_0_rgba(118,80,15,0.45)] disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={Boolean(txPendingLabel) || isAwaitingOnchainSync || legalMoves.length > 0}
                  onClick={onEndTurn}
                  type="button"
                >
                  {txPendingLabel === 'Ending turn' ? ui.endingTurn : ui.endTurn}
                </button>
              </div>
            ) : null}

            <OnchainBoardStage
              activePlayerAddress={activePlayerAddress}
              animatedTokenIds={animatedTokenIds}
              blockedSquares={blockedSquares}
              canRollAction={canRollAction}
              diceSkinByPlayerId={diceSkinByPlayerId}
              dieA={snapshot?.dice_state?.die_a ?? null}
              dieB={snapshot?.dice_state?.die_b ?? null}
              expandedTokenId={expandedTokenId}
              highlightedSquares={highlightedSquares}
              highlightedTokenIds={highlightedTokenIds}
              hudDicePreview={hudDicePreview}
              hudDiceRolling={hudDiceRolling}
              onTokenClick={onTokenClick}
              onTokenDiceChoiceHover={onTokenDiceChoiceHover}
              onTokenDiceChoiceSelect={onTokenDiceChoiceSelect}
              onTokenHover={onTokenHover}
              players={players}
              playersByColor={playersByColor}
              safeSquares={safeSquares}
              selectedDiceSkinId={selectedDiceSkinId}
              selectedTokenId={selectedTokenId}
              surfacePalette={surfacePalette}
              tokenDiceChoices={tokenDiceChoices}
              tokenHints={tokenHints}
              tokens={uiTokens}
              triggerHudDiceRoll={triggerHudDiceRoll}
              ui={ui}
              visualSkinByColor={visualSkinByColor}
            />
          </article>
        ) : (
          <article
            className="game-panel mx-auto max-w-[900px] p-5 text-center xl:p-6"
            style={{ backgroundImage: surfacePalette.mainPanelBackground, borderColor: surfacePalette.mainPanelBorder }}
          >
            <div className="rounded-[28px] border p-6 shadow-wood" style={announcementGlassInnerStyle}>
              <p className="font-display text-3xl uppercase tracking-[0.08em]" style={{ color: surfacePalette.headerText }}>
                {ui.emptyBoardTitle}
              </p>
              <p className="mx-auto mt-3 max-w-[620px] text-sm font-semibold leading-6" style={{ color: surfacePalette.hudCardText }}>
                {ui.emptyBoardBody}
              </p>

              <div className="mx-auto mt-6 max-w-[620px] rounded-[26px] border p-4 text-left shadow-wood" style={announcementGlassInnerStyle}>
                <p className="text-center text-[11px] font-black uppercase tracking-[0.14em]" style={{ color: surfacePalette.badgeText }}>
                  {ui.resolverHelp}
                </p>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em]" style={{ color: surfacePalette.hudCardText }}>
                      {ui.resolveByGameId}
                    </span>
                    <input
                      className="w-full rounded-2xl border px-4 py-3 text-sm font-bold outline-none transition focus:brightness-105"
                      onChange={(event) => setGameIdInput(event.target.value)}
                      placeholder={ui.resolverGamePlaceholder}
                      style={{
                        background: surfacePalette.hudPillBackground,
                        borderColor: surfacePalette.hudPillBorder,
                        color: surfacePalette.hudPillText,
                      }}
                      type="text"
                      value={gameIdInput}
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em]" style={{ color: surfacePalette.hudCardText }}>
                      {ui.resolveByTokenId}
                    </span>
                    <input
                      className="w-full rounded-2xl border px-4 py-3 text-sm font-bold outline-none transition focus:brightness-105"
                      onChange={(event) => setTokenIdInput(event.target.value)}
                      placeholder={ui.resolverTokenPlaceholder}
                      style={{
                        background: surfacePalette.hudPillBackground,
                        borderColor: surfacePalette.hudPillBorder,
                        color: surfacePalette.hudPillText,
                      }}
                      type="text"
                      value={tokenIdInput}
                    />
                  </label>
                </div>

                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <button
                    className="rounded-full border px-4 py-2 text-[11px] font-black uppercase tracking-[0.12em] transition hover:brightness-105"
                    onClick={() => applyBoardQuery('game')}
                    style={{
                      background: surfacePalette.hudPillBackground,
                      borderColor: surfacePalette.hudPillBorder,
                      color: surfacePalette.hudPillText,
                    }}
                    type="button"
                  >
                    {ui.resolveByGameId}
                  </button>
                  <button
                    className="rounded-full border px-4 py-2 text-[11px] font-black uppercase tracking-[0.12em] transition hover:brightness-105"
                    onClick={() => applyBoardQuery('token')}
                    style={{
                      background: surfacePalette.hudPillBackground,
                      borderColor: surfacePalette.hudPillBorder,
                      color: surfacePalette.hudPillText,
                    }}
                    type="button"
                  >
                    {ui.resolveByTokenId}
                  </button>
                  <button
                    className="rounded-full border px-4 py-2 text-[11px] font-black uppercase tracking-[0.12em] transition hover:brightness-105"
                    onClick={clearBoardQuery}
                    style={{
                      background: surfacePalette.badgeBackground,
                      borderColor: surfacePalette.badgeBorder,
                      color: surfacePalette.badgeText,
                    }}
                    type="button"
                  >
                    {ui.clearResolver}
                  </button>
                </div>
              </div>
            </div>
          </article>
        )}

        {shouldShowQuestionModal && modalQuestion ? (
          <TriviaQuestionModal
            answerState={optimisticAnswerFeedback?.answerState ?? 'idle'}
            difficulty={modalQuestion.difficulty}
            interactionLocked={!isMyTurn || txPendingLabel === 'Submitting answer'}
            isAiTurn={false}
            onSelectOption={onSelectAnswer}
            player={activePlayerCard}
            question={modalQuestion}
            secondsLeft={questionSecondsLeft}
            selectedOption={selectedAnswerIndex}
            statusText={pendingStatusMessage}
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
            statusText={null}
          />
        ) : null}

        {activeAnnouncementPlacement ? (
          <div className="fixed inset-0 z-[220] flex items-center justify-center px-3 py-6">
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(18,10,6,0.12),rgba(12,6,3,0.18))] backdrop-blur-[16px]" />

            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              {Array.from({ length: 20 }).map((_, index) => (
                <span
                  className="victory-confetti absolute h-3 w-2 rounded-[2px]"
                  key={`confetti-${index}`}
                  style={{
                    animationDelay: `${(index % 6) * 140}ms`,
                    animationDuration: `${2400 + (index % 5) * 260}ms`,
                    background:
                      index % 4 === 0
                        ? '#ffe188'
                        : index % 4 === 1
                          ? '#ff8f7b'
                          : index % 4 === 2
                            ? '#89dbff'
                            : '#9effb8',
                    left: `${4 + ((index * 11) % 92)}%`,
                    top: `${-14 - (index % 6) * 8}%`,
                  }}
                />
              ))}

              <span className="absolute left-[8%] top-[17%] text-6xl opacity-80 drop-shadow-[0_6px_12px_rgba(0,0,0,0.4)] sm:text-7xl">
                🎆
              </span>
              <span className="absolute right-[8%] top-[17%] text-6xl opacity-80 drop-shadow-[0_6px_12px_rgba(0,0,0,0.4)] sm:text-7xl">
                🎇
              </span>

              {Array.from({ length: 8 }).map((_, index) => (
                <span
                  className="victory-pulse absolute h-4 w-4 rounded-full"
                  key={`spark-${index}`}
                  style={{
                    animationDelay: `${index * 150}ms`,
                    background: index % 2 === 0 ? '#ffd760' : '#ff89be',
                    boxShadow: '0 0 24px rgba(255,215,96,0.7)',
                    left: `${14 + ((index * 10) % 70)}%`,
                    top: `${16 + ((index * 8) % 52)}%`,
                  }}
                />
              ))}
            </div>

            <div className="relative w-full max-w-[980px] text-center">
              <div
                className="victory-pop relative mx-auto overflow-hidden rounded-[42px] border-[1.5px] bg-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.48)]"
                style={announcementGlassPanelStyle}
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_28%,rgba(255,255,255,0.22),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))]" />
                <div className="absolute inset-x-[2%] top-[1.4%] h-[22%] rounded-[30px] opacity-80 blur-sm" style={announcementGlassSheenStyle} />
                <div className="absolute inset-0 opacity-[0.08] mix-blend-screen" style={{ backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.18) 0, rgba(255,255,255,0.18) 1px, transparent 1px, transparent 3px), repeating-linear-gradient(90deg, rgba(255,255,255,0.08) 0, rgba(255,255,255,0.08) 1px, transparent 1px, transparent 4px)' }} />

                <div className="pointer-events-none absolute inset-0">
                  <span className="absolute left-[7%] top-[18%] h-24 w-24 rounded-full bg-[#ffd36b]/20 blur-2xl" />
                  <span className="absolute right-[8%] top-[22%] h-20 w-20 rounded-full bg-[#ffefb0]/18 blur-2xl" />
                  <span className="absolute bottom-[18%] left-[14%] h-16 w-16 rounded-full bg-[#fff3ca]/18 blur-xl" />
                  <span className="absolute bottom-[12%] right-[12%] h-20 w-20 rounded-full bg-[#ffd985]/18 blur-2xl" />
                </div>

                <div className="relative px-5 pb-7 pt-24 sm:px-8 sm:pb-9 sm:pt-28">
                  <div className="absolute left-1/2 top-3 z-20 -translate-x-1/2 sm:top-4">
                    <div className="relative flex h-[164px] w-[164px] items-center justify-center sm:h-[184px] sm:w-[184px]">
                      <div className="absolute left-1/2 top-0 z-30 -translate-x-1/2 text-[#f8d777] drop-shadow-[0_5px_0_rgba(115,62,18,0.55)]">
                        <svg aria-hidden="true" className="h-16 w-16 sm:h-20 sm:w-20" fill="none" viewBox="0 0 64 64">
                          <path d="M12 46h40l-3.8 8H15.8L12 46Zm4-24 10 9 6-13 6 13 10-9-4 20H20l-4-20Z" fill="url(#crownFill)" stroke="#8a4e17" strokeLinejoin="round" strokeWidth="3" />
                          <circle cx="16" cy="22" r="4" fill="#ffeaa0" stroke="#8a4e17" strokeWidth="3" />
                          <circle cx="32" cy="16" r="4" fill="#ffeaa0" stroke="#8a4e17" strokeWidth="3" />
                          <circle cx="48" cy="22" r="4" fill="#ffeaa0" stroke="#8a4e17" strokeWidth="3" />
                          <defs>
                            <linearGradient id="crownFill" x1="32" x2="32" y1="16" y2="54" gradientUnits="userSpaceOnUse">
                              <stop stopColor="#fff0a8" />
                              <stop offset="0.58" stopColor="#f5c248" />
                              <stop offset="1" stopColor="#cb842b" />
                            </linearGradient>
                          </defs>
                        </svg>
                      </div>

                      <div className="absolute left-1/2 top-[34px] z-20 -translate-x-1/2 rounded-full border-[4px] border-[#874d26] bg-gradient-to-b from-[#fff1b6] via-[#edb546] to-[#b86b1e] px-4 py-1 text-[32px] font-display leading-none text-[#5a2d10] shadow-[0_8px_14px_rgba(0,0,0,0.34),inset_0_2px_0_rgba(255,247,203,0.85)] sm:top-[38px] sm:text-[38px]">
                        {activeAnnouncementPlaceNumber}
                      </div>

                      <div className="absolute bottom-0 left-1/2 z-20 flex h-[132px] w-[132px] -translate-x-1/2 items-center justify-center rounded-full border-[6px] border-[#7b4528] bg-gradient-to-b from-[#ffe7ab] via-[#f8bf56] to-[#cd8335] shadow-[0_26px_42px_rgba(0,0,0,0.44)] sm:h-[146px] sm:w-[146px]">
                        <span
                          className={`inline-flex h-[104px] w-[104px] items-center justify-center rounded-full border-[4px] border-[#7c3f21] bg-gradient-to-b text-3xl font-black text-[#2c190d] sm:h-[116px] sm:w-[116px] ${activeAnnouncementTheme?.avatarToneClass || ''}`}
                        >
                          <GameAvatar
                            alt={activeAnnouncementPlacement.name}
                            avatar={activeAnnouncementPlacement.avatar}
                            imageClassName="h-full w-full object-contain p-2"
                            textClassName="text-3xl font-black text-[#2c190d]"
                          />
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="relative mx-auto max-w-[760px] rounded-[34px] border bg-white/10 px-4 pb-5 pt-[104px] sm:px-8 sm:pb-7 sm:pt-[116px]" style={announcementGlassInnerStyle}>
                    <div className="absolute inset-x-5 top-4 h-[72px] rounded-[22px] border border-white/20 bg-white/10" />
                    <div className="absolute inset-x-[4%] top-[2%] h-[20%] rounded-[26px] opacity-90 blur-sm" style={announcementGlassSheenStyle} />
                    <div className="absolute inset-0 opacity-[0.06] mix-blend-screen" style={{ backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.16) 0, rgba(255,255,255,0.16) 1px, transparent 1px, transparent 3px), repeating-linear-gradient(90deg, rgba(255,255,255,0.08) 0, rgba(255,255,255,0.08) 1px, transparent 1px, transparent 4px)' }} />

                    <div
                      className="relative rounded-[28px] border px-4 py-5 sm:px-6 sm:py-6"
                      style={announcementGlassInnerStyle}
                    >
                      <p className="font-display text-[28px] uppercase leading-[1.05] tracking-[0.04em] text-[#ffe8be] drop-shadow-[0_3px_0_rgba(67,31,12,0.82)] sm:text-[46px]">
                        {activeAnnouncementTitle}
                      </p>
                      <p className="mt-3 text-sm font-black uppercase tracking-[0.14em] text-[#ffefc8] sm:text-lg">
                        {activeAnnouncementSubtitle}
                      </p>
                    </div>

                    <div className="mt-5 flex justify-center">
                      <button
                        className="rounded-[22px] border px-8 py-2.5 font-display text-[22px] uppercase tracking-[0.12em] text-[#fff4de] transition hover:brightness-105 active:translate-y-[2px]"
                        onClick={() => {
                          if (winnerAnnouncementTimeoutRef.current !== null) {
                            window.clearTimeout(winnerAnnouncementTimeoutRef.current)
                            winnerAnnouncementTimeoutRef.current = null
                          }
                          setActiveAnnouncementPlacement(null)
                          setShowFinalClassification(true)
                        }}
                        style={{
                          ...announcementGlassButtonStyle,
                          textShadow: '0 2px 8px rgba(52,31,16,0.34)',
                        }}
                        type="button"
                      >
                        {ui.skip}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {showFinalClassification && finalPlacements.length > 0 ? (
          <FinalRankingScreen currentPlayerId={address || undefined} placements={finalPlacements} />
        ) : null}

        <style>{`
          @keyframes victoryConfettiFall {
            0% { opacity: 0; transform: translate3d(0, -35px, 0) rotate(0deg); }
            15% { opacity: 1; }
            100% { opacity: 0; transform: translate3d(0, 115vh, 0) rotate(420deg); }
          }

          @keyframes victoryPop {
            0% { opacity: 0; transform: translate3d(0, 26px, 0) scale(0.85); }
            100% { opacity: 1; transform: translate3d(0, 0, 0) scale(1); }
          }

          @keyframes victoryPulse {
            0% { opacity: 0; transform: scale(0.2); }
            35% { opacity: 1; transform: scale(1); }
            100% { opacity: 0; transform: scale(1.8); }
          }

          .victory-confetti {
            animation-name: victoryConfettiFall;
            animation-timing-function: linear;
            animation-iteration-count: infinite;
          }

          .victory-pop {
            animation: victoryPop 360ms cubic-bezier(0.22, 1, 0.36, 1) both;
          }

          .victory-pulse {
            animation: victoryPulse 1800ms ease-out infinite;
          }
        `}</style>

        <LogDrawer events={logEvents} onClose={() => setIsLogOpen(false)} open={isLogOpen} />
      </div>
    </section>
  )
}
