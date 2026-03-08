export type TokenColor = 'red' | 'blue' | 'yellow' | 'green'

type Coord = {
  row: number
  col: number
}

export type BoardToken = {
  id: string
  color: TokenColor
  position: number
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

const laneCells: Array<Coord & { color: TokenColor }> = [
  ...Array.from({ length: 7 }, (_, index) => ({ row: 1 + index, col: 9, color: 'green' as const })),
  ...Array.from({ length: 7 }, (_, index) => ({ row: 9, col: 11 + index, color: 'red' as const })),
  ...Array.from({ length: 7 }, (_, index) => ({ row: 11 + index, col: 9, color: 'blue' as const })),
  ...Array.from({ length: 7 }, (_, index) => ({ row: 9, col: 1 + index, color: 'yellow' as const })),
]

const startSquares = new Map<number, TokenColor>([
  [5, 'blue'],
  [22, 'red'],
  [39, 'green'],
  [56, 'yellow'],
])

const safeNumbers = new Set([12, 17, 29, 34, 46, 51, 63, 68])

const demoTokens: BoardToken[] = [
  { id: 'token-red-1', color: 'red', position: 22 },
  { id: 'token-red-2', color: 'red', position: 22 },
  { id: 'token-blue-1', color: 'blue', position: 5 },
  { id: 'token-blue-2', color: 'blue', position: 5 },
  { id: 'token-yellow-1', color: 'yellow', position: 56 },
  { id: 'token-green-1', color: 'green', position: 39 },
]

const tokenClasses: Record<TokenColor, string> = {
  red: 'from-[#ff8a75] to-[#ce2f24] border-[#7f1e15]',
  blue: 'from-[#82c6ff] to-[#2f79ce] border-[#19457b]',
  yellow: 'from-[#ffe693] to-[#d2a018] border-[#8e6700]',
  green: 'from-[#a3ed74] to-[#4a9f28] border-[#2c6117]',
}

const laneClasses: Record<TokenColor, string> = {
  red: 'bg-[#de5549] text-[#3a120f] border-[#8d241e]',
  blue: 'bg-[#58aef2] text-[#0e2d4b] border-[#16508c]',
  yellow: 'bg-[#f4d34d] text-[#4f3806] border-[#9f7b10]',
  green: 'bg-[#61bc74] text-[#153d20] border-[#266c4f]',
}

const homePalette: Record<
  TokenColor,
  {
    ring: string
    inner: string
    slot: string
    slotBorder: string
  }
> = {
  red: {
    ring: 'bg-[#cf1f32] border-[#6f101c]',
    inner: 'bg-[#f2e9d2] border-[#83252f]',
    slot: 'bg-[#f8c8cf]',
    slotBorder: 'border-[#8a3e45]',
  },
  blue: {
    ring: 'bg-[#2f9ae8] border-[#16508b]',
    inner: 'bg-[#f2e9d2] border-[#2d6caa]',
    slot: 'bg-[#cde8fb]',
    slotBorder: 'border-[#4b7cae]',
  },
  yellow: {
    ring: 'bg-[#e9c42a] border-[#8c6f08]',
    inner: 'bg-[#f2e9d2] border-[#b18b10]',
    slot: 'bg-[#fbeeba]',
    slotBorder: 'border-[#a78320]',
  },
  green: {
    ring: 'bg-[#208a77] border-[#0f4b41]',
    inner: 'bg-[#f2e9d2] border-[#1d7667]',
    slot: 'bg-[#cceede]',
    slotBorder: 'border-[#4f8c7e]',
  },
}

const cornerHomes: Array<{ color: TokenColor; rowStart: number; colStart: number }> = [
  { color: 'green', rowStart: 1, colStart: 1 },
  { color: 'red', rowStart: 1, colStart: 11 },
  { color: 'yellow', rowStart: 11, colStart: 1 },
  { color: 'blue', rowStart: 11, colStart: 11 },
]

const cellPlacement = (row: number, col: number, rowSpan = 1, colSpan = 1) => ({
  gridRow: `${row * 2 + 1} / span ${rowSpan * 2}`,
  gridColumn: `${col * 2 + 1} / span ${colSpan * 2}`,
})

const numberToCell = new Map<number, Coord>(
  trackCells.map((cell) => [cell.number, { row: cell.row, col: cell.col }]),
)

const getBlockedSquaresFromTokens = (tokens: BoardToken[]) => {
  const bySquare = tokens.reduce<Record<number, TokenColor[]>>((acc, token) => {
    if (!acc[token.position]) {
      acc[token.position] = []
    }

    acc[token.position].push(token.color)
    return acc
  }, {})

  return Object.entries(bySquare)
    .filter(([, colors]) => colors.length === 2 && colors[0] === colors[1])
    .map(([position]) => Number(position))
}

type ParchisBoardProps = {
  tokens?: BoardToken[]
  blockedSquares?: number[]
}

function CornerBase({ color }: { color: TokenColor }) {
  const palette = homePalette[color]

  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <div
        className={`relative aspect-square w-[88%] rounded-full border-4 shadow-[inset_0_5px_10px_rgba(255,255,255,0.28)] ${palette.ring}`}
      >
        <div className={`absolute inset-[13%] rounded-full border-2 ${palette.inner}`} />

        <div className="absolute left-1/2 top-1/2 grid h-[44%] w-[44%] -translate-x-1/2 -translate-y-1/2 grid-cols-2 grid-rows-2 gap-[16%]">
          {Array.from({ length: 4 }).map((_, index) => (
            <span
              className={`rounded-full border shadow-[inset_0_2px_6px_rgba(0,0,0,0.18)] ${palette.slot} ${palette.slotBorder}`}
              key={`${color}-slot-${index}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function SafeMarker() {
  return (
    <span className="pointer-events-none absolute left-1/2 top-1/2 inline-flex h-[15px] w-[15px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[#5c3d16] bg-[#f6d068] p-[1px] shadow-[0_1px_0_rgba(0,0,0,0.25)]">
      <svg className="h-full w-full" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
        <path d="M1 5h10v6H1z" fill="#2b2217" />
        <path d="M1 4l1.2-2h7.6L11 4" fill="#2b2217" />
        <path d="M2.8 6.2h2.1v3.6H2.8z" fill="#f3e8c5" />
        <path d="M6.2 6.2h2.9v1.5H6.2z" fill="#f3e8c5" />
      </svg>
    </span>
  )
}

type TokenOrientation = 'horizontal' | 'vertical' | 'diagonal'

const tokenOffsets: Record<TokenOrientation, Array<{ x: number; y: number }>> = {
  horizontal: [
    { x: -16, y: 0 },
    { x: 16, y: 0 },
  ],
  vertical: [
    { x: 0, y: -16 },
    { x: 0, y: 16 },
  ],
  diagonal: [
    { x: -12, y: -12 },
    { x: 12, y: 12 },
  ],
}

const blockadePairOffsets = [
  { x: 0, y: -16 },
  { x: 0, y: 16 },
]

const oneTokenOffset = [{ x: 0, y: 0 }]

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
    return oneTokenOffset
  }

  const orientation = getCellOrientation(cell)
  const base = tokenOffsets[orientation]

  if (blockedSquare) {
    return blockadePairOffsets
  }

  if (tokenCount === 2) {
    return base
  }

  if (tokenCount === 3) {
    return [
      base[0],
      { x: 0, y: 0 },
      base[1],
    ]
  }

  return [
    { x: -14, y: -14 },
    { x: 14, y: -14 },
    { x: -14, y: 14 },
    { x: 14, y: 14 },
  ]
}

function BoardCenter() {
  return (
    <div
      className="relative z-30 overflow-hidden border-2 border-[#27170a]"
      style={cellPlacement(8, 8, 3, 3)}
    >
      <span
        className="absolute inset-0 bg-[#208a77]"
        style={{ clipPath: 'polygon(50% 50%, 0 0, 100% 0)' }}
      />
      <span
        className="absolute inset-0 bg-[#d74236]"
        style={{ clipPath: 'polygon(50% 50%, 100% 0, 100% 100%)' }}
      />
      <span
        className="absolute inset-0 bg-[#3d96e7]"
        style={{ clipPath: 'polygon(50% 50%, 100% 100%, 0 100%)' }}
      />
      <span
        className="absolute inset-0 bg-[#efc53a]"
        style={{ clipPath: 'polygon(50% 50%, 0 100%, 0 0)' }}
      />
    </div>
  )
}

export function ParchisBoard({ tokens = demoTokens, blockedSquares }: ParchisBoardProps) {
  const effectiveBlockedSquares = blockedSquares || getBlockedSquaresFromTokens(tokens)
  const blockedSet = new Set(effectiveBlockedSquares)

  const groupedTokens = Object.values(
    tokens.reduce<
      Record<string, { cell: Coord; position: number; colors: TokenColor[]; tokens: BoardToken[] }>
    >((acc, token) => {
      const cell = numberToCell.get(token.position)

      if (!cell) {
        return acc
      }

      const key = `${token.position}`

      if (!acc[key]) {
        acc[key] = {
          position: token.position,
          cell,
          colors: [],
          tokens: [],
        }
      }

      acc[key].colors.push(token.color)
      acc[key].tokens.push(token)
      return acc
    }, {}),
  )

  return (
    <div
      className="relative aspect-square overflow-hidden rounded-[22px] border-[7px] border-[#b98652] p-0.5 shadow-board"
      style={{
        backgroundImage:
          'repeating-linear-gradient(0deg, rgba(126,84,45,0.18) 0, rgba(126,84,45,0.18) 2px, rgba(229,194,146,0.2) 2px, rgba(229,194,146,0.2) 4px), linear-gradient(120deg, #e7c68f 0%, #d8af77 26%, #f2d8ac 56%, #cca06a 100%)',
      }}
    >
      <div
        className="relative grid h-full w-full overflow-hidden border-2 border-[#1f1309]"
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
          <div
            className="z-10"
            key={home.color}
            style={cellPlacement(home.rowStart, home.colStart, 7, 7)}
          >
            <CornerBase color={home.color} />
          </div>
        ))}

        {laneCells.map((cell) => (
          <div
            className={`z-[15] border border-[#20140d] ${laneClasses[cell.color]}`}
            key={`lane-${cell.color}-${cell.row}-${cell.col}`}
            style={cellPlacement(cell.row, cell.col)}
          />
        ))}

        <BoardCenter />

        {trackCells.map((cell) => {
          const startColor = startSquares.get(cell.number)
          const isSafe = safeNumbers.has(cell.number) && !startColor

          return (
            <div
              className={`relative z-20 flex items-center justify-center border border-[#1f140d] text-[9px] font-bold leading-none ${
                startColor
                  ? `${laneClasses[startColor]}`
                  : 'bg-[#fff8e6] text-[#2f1d12]'
              }`}
              key={`track-${cell.number}`}
              style={cellPlacement(cell.row, cell.col)}
              title={isSafe ? 'SAFE' : undefined}
            >
              <span className="relative z-10 text-[11px] font-semibold drop-shadow-[0_1px_0_rgba(255,255,255,0.55)]">
                {cell.number}
              </span>

              {isSafe ? <SafeMarker /> : null}
            </div>
          )
        })}

        {groupedTokens.map((group) => {
          const isBlockedSquare = blockedSet.has(group.position)
          const offsets = getTokenPlacementOffsets(group.cell, group.tokens.length, isBlockedSquare)

          return (
            <div
              className="relative z-40"
              key={`tokens-${group.cell.row}-${group.cell.col}`}
              style={cellPlacement(group.cell.row, group.cell.col)}
            >
              {group.tokens.map((token, index) => {
                const offset = offsets[index] || offsets[offsets.length - 1]

                return (
                  <button
                    aria-label={token.id}
                    className={`absolute left-1/2 top-1/2 h-[43%] w-[43%] -translate-x-1/2 -translate-y-1/2 rounded-full border-[2.5px] bg-gradient-to-b shadow-[0_4px_0_rgba(24,18,12,0.45)] ${tokenClasses[token.color]}`}
                    key={token.id}
                    style={{
                      marginLeft: `${offset.x}px`,
                      marginTop: `${offset.y}px`,
                      zIndex: index + 1,
                    }}
                    title={token.id}
                    type="button"
                  />
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
