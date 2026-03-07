type Seat = 0 | 1 | 2 | 3

export type Coordinate = {
  x: number
  y: number
}

export type BoardSquareGeometry = {
  squareIndex: number
  x: number
  y: number
  layer: number
}

export const boardGeometry = {
  mainTrack: [] as BoardSquareGeometry[],
  homeLane: {
    0: [] as BoardSquareGeometry[],
    1: [] as BoardSquareGeometry[],
    2: [] as BoardSquareGeometry[],
    3: [] as BoardSquareGeometry[],
  } satisfies Record<Seat, BoardSquareGeometry[]>,
  baseSlots: {
    0: [] as Coordinate[],
    1: [] as Coordinate[],
    2: [] as Coordinate[],
    3: [] as Coordinate[],
  } satisfies Record<Seat, Coordinate[]>,
}

export const boardGeometrySummary = {
  mainTrackSquares: boardGeometry.mainTrack.length,
  homeLaneSquares:
    boardGeometry.homeLane[0].length +
    boardGeometry.homeLane[1].length +
    boardGeometry.homeLane[2].length +
    boardGeometry.homeLane[3].length,
  baseSlots:
    boardGeometry.baseSlots[0].length +
    boardGeometry.baseSlots[1].length +
    boardGeometry.baseSlots[2].length +
    boardGeometry.baseSlots[3].length,
}
