export type TokenSkinId = 'pink' | 'red' | 'blue' | 'green' | 'yellow' | 'fire' | 'ice' | 'jungle' | 'royal'

export type TokenSkinDefinition = {
  id: TokenSkinId
  name: string
  price: number
  previewToneClass: string
  shellClass: string
  innerClass: string
  rarityLabel: string
  symbol?: string
}

export const tokenSkinCatalog: TokenSkinDefinition[] = [
  {
    id: 'pink',
    name: 'Rosada',
    price: 300,
    previewToneClass: 'from-[#ffe6f1] to-[#f8bfd9]',
    shellClass: 'from-[#ffd3e9] via-[#f487b8] to-[#cf4b86] border-[#8c2958]',
    innerClass: 'bg-[#fff0f7] border-[#f6bdd8]',
    rarityLabel: 'Color',
  },
  {
    id: 'red',
    name: 'Roja',
    price: 300,
    previewToneClass: 'from-[#ffe4de] to-[#ffc5bc]',
    shellClass: 'from-[#ffb7a9] via-[#f34d47] to-[#bb1d1d] border-[#7b1717]',
    innerClass: 'bg-[#fff3ef] border-[#f0c1ba]',
    rarityLabel: 'Color',
  },
  {
    id: 'blue',
    name: 'Azul',
    price: 300,
    previewToneClass: 'from-[#e3f0ff] to-[#bcd9ff]',
    shellClass: 'from-[#afd7ff] via-[#3087ef] to-[#1555c8] border-[#173d89]',
    innerClass: 'bg-[#eef7ff] border-[#bfd7f3]',
    rarityLabel: 'Color',
  },
  {
    id: 'green',
    name: 'Verde',
    price: 300,
    previewToneClass: 'from-[#e5ffe8] to-[#bdecc8]',
    shellClass: 'from-[#c1f8a8] via-[#41c43d] to-[#16852a] border-[#1c5a1f]',
    innerClass: 'bg-[#f0fff0] border-[#cce8c9]',
    rarityLabel: 'Color',
  },
  {
    id: 'yellow',
    name: 'Amarilla',
    price: 300,
    previewToneClass: 'from-[#fff6d9] to-[#f6e09a]',
    shellClass: 'from-[#fff4a8] via-[#ffd43a] to-[#e2a200] border-[#9b6c00]',
    innerClass: 'bg-[#fffbea] border-[#f1e4b3]',
    rarityLabel: 'Color',
  },
  {
    id: 'fire',
    name: 'Fuego',
    price: 700,
    previewToneClass: 'from-[#ffe9d6] to-[#ffca9d]',
    shellClass: 'from-[#ffe17a] via-[#ff7b2d] to-[#d73b12] border-[#8a270d]',
    innerClass: 'bg-[#fff4df] border-[#ffc48d]',
    rarityLabel: 'Especial',
    symbol: 'F',
  },
  {
    id: 'ice',
    name: 'Hielo',
    price: 700,
    previewToneClass: 'from-[#edf7ff] to-[#cee7fb]',
    shellClass: 'from-[#f0fbff] via-[#8ddcff] to-[#4b8fff] border-[#2d5aa5]',
    innerClass: 'bg-[#f4fcff] border-[#c9e7fb]',
    rarityLabel: 'Especial',
    symbol: 'S',
  },
  {
    id: 'jungle',
    name: 'Jungla',
    price: 900,
    previewToneClass: 'from-[#ecffe6] to-[#c8efb8]',
    shellClass: 'from-[#dbffb7] via-[#67c84c] to-[#2b7d37] border-[#24582b]',
    innerClass: 'bg-[#f2fff0] border-[#cfe8c7]',
    rarityLabel: 'Especial',
    symbol: 'L',
  },
  {
    id: 'royal',
    name: 'Real',
    price: 1200,
    previewToneClass: 'from-[#fff4d7] to-[#f0d18f]',
    shellClass: 'from-[#fff0a0] via-[#d8b342] to-[#9d6a0c] border-[#694507]',
    innerClass: 'bg-[#fff8e7] border-[#edd8aa]',
    rarityLabel: 'Especial',
    symbol: 'C',
  },
]

export const tokenSkinIdOrder: TokenSkinId[] = tokenSkinCatalog.map((skin) => skin.id)

export const defaultOwnedTokenSkinIds: TokenSkinId[] = ['pink', 'red', 'blue', 'green', 'yellow']

const tokenSkinById = tokenSkinCatalog.reduce<Record<TokenSkinId, TokenSkinDefinition>>((acc, skin) => {
  acc[skin.id] = skin
  return acc
}, {} as Record<TokenSkinId, TokenSkinDefinition>)

const tokenSkinIdSet = new Set<TokenSkinId>(tokenSkinCatalog.map((skin) => skin.id))

export const isTokenSkinId = (value: unknown): value is TokenSkinId =>
  typeof value === 'string' && tokenSkinIdSet.has(value as TokenSkinId)

export const normalizeTokenSkinId = (value: unknown): TokenSkinId => {
  if (isTokenSkinId(value)) {
    return value
  }

  return 'blue'
}

export const normalizeOwnedTokenSkinIds = (value: unknown, selectedSkinId?: TokenSkinId): TokenSkinId[] => {
  const source = Array.isArray(value) ? value : defaultOwnedTokenSkinIds
  const normalized = source.filter(isTokenSkinId)
  const next = normalized.length > 0 ? normalized : [...defaultOwnedTokenSkinIds]

  if (selectedSkinId && !next.includes(selectedSkinId)) {
    next.push(selectedSkinId)
  }

  return Array.from(new Set(next))
}

export const getTokenSkinDefinition = (skinId: TokenSkinId) => tokenSkinById[skinId] || tokenSkinById.blue

export const tokenSkinIndexFromId = (skinId: TokenSkinId): number => {
  const index = tokenSkinIdOrder.indexOf(skinId)
  return index >= 0 ? index : tokenSkinIdOrder.indexOf('blue')
}

export const tokenSkinIdFromIndex = (index: number): TokenSkinId => {
  return tokenSkinIdOrder[index] || 'blue'
}
