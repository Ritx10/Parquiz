import { getPlayerVisualThemeByColor } from '../../lib/player-color-themes'
import type { TokenSkinId } from '../../lib/token-cosmetics'
import type { MatchToken, PlayerColor } from './match-types'
import { GameAvatar } from './game-avatar'
import { Tile } from './tile'
import { Token } from './token'

type Coord = {
  row: number
  col: number
}

type NumberCell = Coord & {
  number: number
}

const boardSize = 19
const fineGridSize = boardSize * 2

const trackCells: NumberCell[] = (() => {
  const cells: NumberCell[] = []

  for (let index = 0; index < 8; index += 1) {
    cells.push({ number: index + 1, row: 18 - index, col: 10 })
  }

  for (let index = 0; index < 8; index += 1) {
    cells.push({ number: 9 + index, row: 10, col: 11 + index })
  }

  cells.push({ number: 17, row: 9, col: 18 })

  for (let index = 0; index < 8; index += 1) {
    cells.push({ number: 18 + index, row: 8, col: 18 - index })
  }

  for (let index = 0; index < 8; index += 1) {
    cells.push({ number: 26 + index, row: 7 - index, col: 10 })
  }

  cells.push({ number: 34, row: 0, col: 9 })

  for (let index = 0; index < 8; index += 1) {
    cells.push({ number: 35 + index, row: index, col: 8 })
  }

  for (let index = 0; index < 8; index += 1) {
    cells.push({ number: 43 + index, row: 8, col: 7 - index })
  }

  cells.push({ number: 51, row: 9, col: 0 })

  for (let index = 0; index < 8; index += 1) {
    cells.push({ number: 52 + index, row: 10, col: index })
  }

  for (let index = 0; index < 8; index += 1) {
    cells.push({ number: 60 + index, row: 11 + index, col: 8 })
  }

  cells.push({ number: 68, row: 18, col: 9 })

  return cells
})()

const laneCells: Array<Coord & { color: PlayerColor }> = [
  ...Array.from({ length: 7 }, (_, index) => ({ row: 1 + index, col: 9, color: 'green' as const })),
  ...Array.from({ length: 7 }, (_, index) => ({ row: 9, col: 11 + index, color: 'red' as const })),
  ...Array.from({ length: 7 }, (_, index) => ({ row: 11 + index, col: 9, color: 'blue' as const })),
  ...Array.from({ length: 7 }, (_, index) => ({ row: 9, col: 1 + index, color: 'yellow' as const })),
]

const cornerHomes: Array<{ color: PlayerColor; rowStart: number; colStart: number }> = [
  { color: 'green', rowStart: 1, colStart: 1 },
  { color: 'red', rowStart: 1, colStart: 11 },
  { color: 'yellow', rowStart: 11, colStart: 1 },
  { color: 'blue', rowStart: 11, colStart: 11 },
]

const homeSlotCenterOffsets = [2.714, 4.286] as const

const buildHomeTokenSlots = (rowStart: number, colStart: number): Coord[] => {
  const top = rowStart + homeSlotCenterOffsets[0] - 0.5
  const bottom = rowStart + homeSlotCenterOffsets[1] - 0.5
  const left = colStart + homeSlotCenterOffsets[0] - 0.5
  const right = colStart + homeSlotCenterOffsets[1] - 0.5

  return [
    { row: top, col: left },
    { row: top, col: right },
    { row: bottom, col: left },
    { row: bottom, col: right },
  ]
}

const homeTokenSlots: Record<PlayerColor, Coord[]> = {
  green: buildHomeTokenSlots(1, 1),
  red: buildHomeTokenSlots(1, 11),
  yellow: buildHomeTokenSlots(11, 1),
  blue: buildHomeTokenSlots(11, 11),
}

const startSquares = new Map<number, PlayerColor>([
  [5, 'blue'],
  [22, 'red'],
  [39, 'green'],
  [56, 'yellow'],
])

const defaultSafeSquares = [12, 17, 29, 34, 46, 51, 63, 68]

const cellPlacement = (row: number, col: number, rowSpan = 1, colSpan = 1) => ({
  gridRow: `${row * 2 + 1} / span ${rowSpan * 2}`,
  gridColumn: `${col * 2 + 1} / span ${colSpan * 2}`,
})

const laneNumberToCell = new Map<number, Coord>([
  [101, { row: 1, col: 9 }],
  [102, { row: 2, col: 9 }],
  [103, { row: 3, col: 9 }],
  [104, { row: 4, col: 9 }],
  [105, { row: 5, col: 9 }],
  [106, { row: 6, col: 9 }],
  [107, { row: 7, col: 9 }],
  [108, { row: 8.7, col: 8.7 }],
  [201, { row: 9, col: 17 }],
  [202, { row: 9, col: 16 }],
  [203, { row: 9, col: 15 }],
  [204, { row: 9, col: 14 }],
  [205, { row: 9, col: 13 }],
  [206, { row: 9, col: 12 }],
  [207, { row: 9, col: 11 }],
  [208, { row: 8.7, col: 9.3 }],
  [301, { row: 17, col: 9 }],
  [302, { row: 16, col: 9 }],
  [303, { row: 15, col: 9 }],
  [304, { row: 14, col: 9 }],
  [305, { row: 13, col: 9 }],
  [306, { row: 12, col: 9 }],
  [307, { row: 11, col: 9 }],
  [308, { row: 9.3, col: 9.3 }],
  [401, { row: 9, col: 1 }],
  [402, { row: 9, col: 2 }],
  [403, { row: 9, col: 3 }],
  [404, { row: 9, col: 4 }],
  [405, { row: 9, col: 5 }],
  [406, { row: 9, col: 6 }],
  [407, { row: 9, col: 7 }],
  [408, { row: 9.3, col: 8.7 }],
])

const numberToCell = new Map<number, Coord>(
  [
    ...trackCells.map((cell) => [cell.number, { row: cell.row, col: cell.col }] as const),
    ...Array.from(laneNumberToCell.entries()),
  ],
)

const getBlockedSquaresFromTokens = (tokens: MatchToken[]) => {
  const bySquare = tokens.reduce<Record<number, MatchToken[]>>((acc, token) => {
    if (!acc[token.position]) {
      acc[token.position] = []
    }

    acc[token.position].push(token)
    return acc
  }, {})

  return Object.entries(bySquare)
    .filter(([, grouped]) => grouped.length === 2 && grouped[0].color === grouped[1].color)
    .map(([position]) => Number(position))
}

type TokenOrientation = 'horizontal' | 'vertical' | 'diagonal'
type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right'

const tokenOffsets: Record<TokenOrientation, Array<{ x: number; y: number }>> = {
  horizontal: [
    { x: -10, y: 0 },
    { x: 10, y: 0 },
  ],
  vertical: [
    { x: 0, y: -10 },
    { x: 0, y: 10 },
  ],
  diagonal: [
    { x: -8, y: -8 },
    { x: 8, y: 8 },
  ],
}

const blockadePairOffsets = [
  { x: 0, y: -10 },
  { x: 0, y: 10 },
]

const blockadePairOffsetsByOrientation: Record<TokenOrientation, Array<{ x: number; y: number }>> = {
  horizontal: blockadePairOffsets,
  vertical: [
    { x: -10, y: 0 },
    { x: 10, y: 0 },
  ],
  diagonal: [
    { x: -8, y: 0 },
    { x: 8, y: 0 },
  ],
}

const getCellOrientation = ({ row, col }: Coord): TokenOrientation => {
  if (row === 9 || row === 8 || row === 10 || row <= 1 || row >= 17) {
    return 'horizontal'
  }

  if (col === 9 || col === 8 || col === 10 || col <= 1 || col >= 17) {
    return 'vertical'
  }

  return 'diagonal'
}

const getTokenPlacementOffsets = (cell: Coord, tokenCount: number, blockedSquare: boolean) => {
  if (tokenCount <= 1) {
    return [{ x: 0, y: 0 }]
  }

  const orientation = getCellOrientation(cell)
  const base = tokenOffsets[orientation]

  if (blockedSquare) {
    return blockadePairOffsetsByOrientation[orientation]
  }

  if (tokenCount === 2) {
    return base
  }

  if (tokenCount === 3) {
    return [base[0], { x: 0, y: 0 }, base[1]]
  }

  return [
    { x: -9, y: -9 },
    { x: 9, y: -9 },
    { x: -9, y: 9 },
    { x: 9, y: 9 },
  ]
}

const getCellCenter = (cell: Coord) => ({
  left: `${((cell.col + 0.5) / boardSize) * 100}%`,
  top: `${((cell.row + 0.5) / boardSize) * 100}%`,
})

const getTooltipPlacement = (cell: Coord): TooltipPlacement => {
  const nearTop = cell.row <= 1.8
  const nearBottom = cell.row >= 17.2
  const nearLeft = cell.col <= 1.8
  const nearRight = cell.col >= 17.2

  if (!nearTop) {
    return 'top'
  }

  if (!nearBottom) {
    return 'bottom'
  }

  if (!nearRight) {
    return 'right'
  }

  if (!nearLeft) {
    return 'left'
  }

  return 'top'
}

const bubbleOffsetByPlacement: Record<TooltipPlacement, { x: number; y: number }> = {
  top: { x: 0, y: -15 },
  bottom: { x: 0, y: 15 },
  left: { x: -15, y: 0 },
  right: { x: 15, y: 0 },
}

const pickerOffsetByPlacement: Record<TooltipPlacement, { x: number; y: number }> = {
  top: { x: 0, y: -36 },
  bottom: { x: 0, y: 36 },
  left: { x: -40, y: 0 },
  right: { x: 40, y: 0 },
}

const arrowClassByPlacement: Record<TooltipPlacement, string> = {
  top: 'left-1/2 top-full -translate-x-1/2 -translate-y-[1px] border-b border-r',
  bottom: 'left-1/2 bottom-full -translate-x-1/2 translate-y-[1px] border-t border-l',
  left: 'left-full top-1/2 -translate-y-1/2 -translate-x-[1px] border-t border-r',
  right: 'right-full top-1/2 -translate-y-1/2 translate-x-[1px] border-b border-l',
}

function CornerBase({ color }: { color: PlayerColor }) {
  const palette = getPlayerVisualThemeByColor(color).homePalette

  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <div
        className={`relative aspect-square w-[88%] rounded-full border-4 shadow-[inset_0_5px_10px_rgba(255,255,255,0.28)] ${palette.ring}`}
      >
        <div className={`absolute inset-[13%] rounded-full border-2 ${palette.inner}`} />

        <div className="absolute left-1/2 top-1/2 grid h-[44%] w-[44%] -translate-x-1/2 -translate-y-1/2 grid-cols-2 grid-rows-2 gap-[16%]">
          {Array.from({ length: 4 }).map((_, index) => (
            <span
              className={`relative z-0 rounded-full border shadow-[inset_0_2px_6px_rgba(0,0,0,0.18)] ${palette.slot} ${palette.slotBorder}`}
              key={`${color}-slot-${index}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function BoardCenter() {
  const greenTheme = getPlayerVisualThemeByColor('green')
  const redTheme = getPlayerVisualThemeByColor('red')
  const blueTheme = getPlayerVisualThemeByColor('blue')
  const yellowTheme = getPlayerVisualThemeByColor('yellow')

  return (
    <div
      className="relative z-30 overflow-hidden border-2 border-[#27170a]"
      style={cellPlacement(8, 8, 3, 3)}
    >
      <span
        className="absolute inset-0"
        style={{ backgroundColor: greenTheme.boardCenterColor, clipPath: 'polygon(50% 50%, 0 0, 100% 0)' }}
      />
      <span
        className="absolute inset-0"
        style={{ backgroundColor: redTheme.boardCenterColor, clipPath: 'polygon(50% 50%, 100% 0, 100% 100%)' }}
      />
      <span
        className="absolute inset-0"
        style={{ backgroundColor: blueTheme.boardCenterColor, clipPath: 'polygon(50% 50%, 100% 100%, 0 100%)' }}
      />
      <span
        className="absolute inset-0"
        style={{ backgroundColor: yellowTheme.boardCenterColor, clipPath: 'polygon(50% 50%, 0 100%, 0 0)' }}
      />
    </div>
  )
}

type Board3DProps = {
  players?: Array<{ avatar: string; color: PlayerColor; id: string; name: string }>
  tokens: MatchToken[]
  blockedSquares?: number[]
  safeSquares?: number[]
  highlightedSquares?: number[]
  movableTokenIds?: string[]
  selectedTokenId?: null | string
  animatingTokenIds?: string[]
  tokenHints?: Record<string, string>
  tokenDiceChoices?: Record<
      string,
      Array<{
        id: string
        label: string
        value: number
      }>
    >
  expandedTokenId?: null | string
  onTokenHover?: (tokenId: string | null) => void
  onTokenDiceChoiceHover?: (tokenId: string, choiceId: null | string) => void
  onTokenDiceChoiceSelect?: (tokenId: string, choiceId: string) => void
  onTokenClick?: (tokenId: string) => void
  visualSkinByColor?: Partial<Record<PlayerColor, TokenSkinId>>
}

export function Board3D({
  players = [],
  tokens,
  blockedSquares,
  safeSquares = defaultSafeSquares,
  highlightedSquares = [],
  movableTokenIds = [],
  selectedTokenId = null,
  animatingTokenIds = [],
  tokenHints = {},
  tokenDiceChoices = {},
  expandedTokenId = null,
  onTokenHover,
  onTokenDiceChoiceHover,
  onTokenDiceChoiceSelect,
  onTokenClick,
}: Board3DProps) {
  const playersById = players.reduce<Record<string, { avatar: string; name: string }>>((acc, player) => {
    acc[player.id] = { avatar: player.avatar, name: player.name }
    return acc
  }, {})

  const blockedSet = new Set(blockedSquares || getBlockedSquaresFromTokens(tokens))
  const highlightedSet = new Set(highlightedSquares)
  const movableSet = new Set(movableTokenIds)
  const safeSet = new Set(safeSquares)
  const animatingSet = new Set(animatingTokenIds)
  const themeForColor = (color: PlayerColor) => getPlayerVisualThemeByColor(color)

  const groupedTokens = Object.values(
    tokens.reduce<Record<string, { cell: Coord; position: number; tokens: MatchToken[] }>>(
      (acc, token) => {
        const cell = numberToCell.get(token.position)

        if (!cell) {
          return acc
        }

        const key = `${token.position}`

        if (!acc[key]) {
          acc[key] = {
            position: token.position,
            cell,
            tokens: [],
          }
        }

        acc[key].tokens.push(token)
        return acc
      },
      {},
    ),
  )

  const homeTokenPlacements = (Object.keys(homeTokenSlots) as PlayerColor[]).flatMap((color) => {
    const slots = homeTokenSlots[color]
    const colorHomeTokens = tokens
      .filter((token) => token.color === color && token.position <= 0)
      .sort((left, right) => left.id.localeCompare(right.id))
      .slice(0, slots.length)

    return colorHomeTokens.map((token, index) => ({
      token,
      slot: slots[index],
    }))
  })

  const renderTokenControl = (
    token: MatchToken,
    cell: Coord,
    offset: { x: number; y: number },
    baseZIndex: number,
    options: {
      tokenOpacity?: number
      tokenZIndexBoost?: number
    } = {},
  ) => {
    const choices = tokenDiceChoices[token.id] || []
    const compactLabel = choices.map((choice) => `${choice.value}`).join(',')
    const showChoicePicker = expandedTokenId === token.id && choices.length > 1
    const placement = getTooltipPlacement(cell)
    const bubbleOffset = bubbleOffsetByPlacement[placement]
    const pickerOffset = pickerOffsetByPlacement[placement]

    return (
      <div key={token.id}>
        <Token
          avatar={playersById[token.ownerId]?.avatar}
          isAnimating={animatingSet.has(token.id)}
          isMovable={movableSet.has(token.id)}
          isSelected={selectedTokenId === token.id}
          onClick={(tokenId) => onTokenClick?.(tokenId)}
          onHoverStart={(tokenId) => onTokenHover?.(tokenId)}
          ownerName={playersById[token.ownerId]?.name}
          style={{
            left: '50%',
            top: '50%',
            marginLeft: `${offset.x}px`,
            marginTop: `${offset.y}px`,
            opacity: options.tokenOpacity,
            zIndex: baseZIndex + (options.tokenZIndexBoost || 0),
            transition:
              'left 280ms ease, top 280ms ease, margin-left 280ms ease, margin-top 280ms ease',
          }}
          token={token}
          tooltipText={tokenHints[token.id] || token.label}
        />

        {choices.length > 0 ? (
          <button
            className="pointer-events-auto absolute flex min-h-7 min-w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-md border border-[#7f5d14] bg-gradient-to-b from-[#ffe987] to-[#dea20c] px-2 text-[11px] font-black leading-none text-[#4a3005] shadow-[0_2px_0_rgba(62,40,8,0.45)]"
            onClick={() => {
              if (choices.length === 1) {
                onTokenDiceChoiceSelect?.(token.id, choices[0].id)
                return
              }

              onTokenHover?.(token.id)
            }}
            onFocus={() => onTokenHover?.(token.id)}
            onMouseEnter={() => onTokenHover?.(token.id)}
            style={{
              left: '50%',
              top: '50%',
              marginLeft: `${offset.x + bubbleOffset.x}px`,
              marginTop: `${offset.y + bubbleOffset.y}px`,
              zIndex: baseZIndex + 220,
            }}
            type="button"
          >
            {compactLabel}
            <span
              className={`absolute h-2 w-2 rotate-45 border-[#7f5d14] bg-[#e8bb34] ${arrowClassByPlacement[placement]}`}
            />
          </button>
        ) : null}

        {showChoicePicker ? (
          <div
            className="pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 rounded-lg border border-[#3f5267] bg-[#0f2d4f]/92 px-1.5 py-1"
            onMouseLeave={() => onTokenDiceChoiceHover?.(token.id, null)}
            style={{
              left: '50%',
              top: '50%',
              marginLeft: `${offset.x + pickerOffset.x}px`,
              marginTop: `${offset.y + pickerOffset.y}px`,
              zIndex: baseZIndex + 240,
            }}
          >
            <div className="flex items-center gap-1">
              {choices.map((choice) => (
                <button
                  className="inline-flex h-10 min-w-10 flex-col items-center justify-center rounded-md border border-[#7f5d14] bg-gradient-to-b from-[#ffe987] to-[#dea20c] px-1 text-[#4a3005] shadow-[0_2px_0_rgba(62,40,8,0.45)]"
                  key={`${token.id}-${choice.id}`}
                  onClick={() => onTokenDiceChoiceSelect?.(token.id, choice.id)}
                  onFocus={() => onTokenDiceChoiceHover?.(token.id, choice.id)}
                  onMouseEnter={() => onTokenDiceChoiceHover?.(token.id, choice.id)}
                  type="button"
                >
                  <span className="text-[11px] font-black leading-none">{choice.value}</span>
                  <span className="text-[8px] font-black uppercase leading-none">+{choice.value}</span>
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <div
      className="pointer-events-none relative aspect-square w-full overflow-visible rounded-[24px] border-[7px] border-[#b98652] p-1 shadow-board"
      style={{
        backgroundImage:
          'repeating-linear-gradient(0deg, rgba(126,84,45,0.18) 0, rgba(126,84,45,0.18) 2px, rgba(229,194,146,0.2) 2px, rgba(229,194,146,0.2) 4px), linear-gradient(120deg, #e7c68f 0%, #d8af77 26%, #f2d8ac 56%, #cca06a 100%)',
      }}
    >
      <div
        className="pointer-events-auto relative grid h-full w-full overflow-visible border border-[#1f1309]"
        style={{
          gridTemplateColumns: `repeat(${fineGridSize}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${fineGridSize}, minmax(0, 1fr))`,
          backgroundColor: '#f7e6c8',
          backgroundImage:
            'linear-gradient(to right, rgba(40, 25, 12, 0.42) 1px, transparent 1px), linear-gradient(to bottom, rgba(40, 25, 12, 0.42) 1px, transparent 1px), repeating-linear-gradient(0deg, rgba(128, 80, 45, 0.08) 0, rgba(128, 80, 45, 0.08) 2px, rgba(239, 208, 170, 0.08) 2px, rgba(239, 208, 170, 0.08) 4px)',
          backgroundSize:
            `calc(100% / ${fineGridSize}) calc(100% / ${fineGridSize}), calc(100% / ${fineGridSize}) calc(100% / ${fineGridSize}), auto`,
          backgroundPosition: '0 0, 0 0, 0 0',
        }}
      >
        {cornerHomes.map((home) => (
          <div className="z-10" key={home.color} style={cellPlacement(home.rowStart, home.colStart, 7, 7)}>
            <CornerBase color={home.color} />
          </div>
        ))}

        {laneCells.map((cell) => (
          <Tile
            className={themeForColor(cell.color).laneFillClass}
            key={`lane-${cell.color}-${cell.row}-${cell.col}`}
            style={cellPlacement(cell.row, cell.col)}
          />
        ))}

        <BoardCenter />

        {trackCells.map((cell) => {
          const startColor = startSquares.get(cell.number)

          return (
            <Tile
              className={startColor ? themeForColor(startColor).laneFillClass : 'bg-[#fff8e6]'}
              isHighlighted={highlightedSet.has(cell.number)}
              isSafe={safeSet.has(cell.number)}
              key={`track-${cell.number}`}
              number={cell.number}
              style={cellPlacement(cell.row, cell.col)}
            />
          )
        })}

        {homeTokenPlacements.map((placement, homeIndex) => {
          const center = getCellCenter(placement.slot)
          const owner = playersById[placement.token.ownerId]

          return (
            <div
              className="pointer-events-none absolute z-[65] -translate-x-1/2 -translate-y-1/2"
              key={`home-token-${placement.token.id}`}
              style={{
                left: center.left,
                top: center.top,
                width: '44px',
                height: '44px',
              }}
            >
              {owner?.avatar ? (
                <span className="pointer-events-none absolute inset-0 rounded-full opacity-[0.001]" aria-hidden="true">
                  <GameAvatar alt={owner.name} avatar={owner.avatar} imageClassName="h-full w-full object-contain" />
                </span>
              ) : null}
              {renderTokenControl(placement.token, placement.slot, { x: 0, y: 0 }, 220 + homeIndex, {
                tokenOpacity: 0.82,
                tokenZIndexBoost: 220,
              })}
            </div>
          )
        })}

        {groupedTokens.map((group) => {
          const isBlockedSquare = blockedSet.has(group.position)
          const offsets = getTokenPlacementOffsets(group.cell, group.tokens.length, isBlockedSquare)
          const center = getCellCenter(group.cell)

          return (
            <div
              className="pointer-events-none absolute z-40 -translate-x-1/2 -translate-y-1/2"
              key={`tokens-${group.position}`}
              style={{
                left: center.left,
                top: center.top,
                width: '54px',
                height: '54px',
              }}
            >
              {group.tokens.map((token, index) =>
                renderTokenControl(
                  token,
                  group.cell,
                  offsets[index] || offsets[offsets.length - 1],
                  index + 1,
                ),
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
